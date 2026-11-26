const API_URL = 'http://localhost:3000/api';

const pendingOrdersContainer = document.getElementById('pendingOrders');
const preparingOrdersContainer = document.getElementById('preparingOrders');
const readyOrdersContainer = document.getElementById('readyOrders');
const completedOrdersContainer = document.getElementById('completedOrders');

const pendingCount = document.getElementById('pendingCount');
const preparingCount = document.getElementById('preparingCount');
const readyCount = document.getElementById('readyCount');
const completedCount = document.getElementById('completedCount');

const pendingBadge = document.getElementById('pendingBadge');
const preparingBadge = document.getElementById('preparingBadge');
const readyBadge = document.getElementById('readyBadge');
const completedBadge = document.getElementById('completedBadge');

let orders = [];
let isLoadingOrders = false;

let removedCompletedOrders = [];
try {
    const stored = JSON.parse(localStorage.getItem('removedCompletedOrders') || '[]');
    removedCompletedOrders = Array.isArray(stored) ? stored.map(Number) : [];
} catch {
    removedCompletedOrders = [];
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

async function loadOrders() {
    if (isLoadingOrders) return;
    isLoadingOrders = true;

    try {
        const response = await fetch(`${API_URL}/orders`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load orders.');
        }
        orders = result.data || [];
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        pendingOrdersContainer.innerHTML = `
            <div class="empty-orders"><p>Unable to load orders. Check the server connection.</p></div>`;
    } finally {
        isLoadingOrders = false;
    }
}

function sortOrdersOldestFirst(orderList) {
    return [...orderList].sort((a, b) => {
        const dateA = new Date(a.order_date).getTime();
        const dateB = new Date(b.order_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return Number(a.daily_order_number ?? a.order_id) -
            Number(b.daily_order_number ?? b.order_id);
    });
}

function renderOrders() {
    const sorted = sortOrdersOldestFirst(orders);
    const pending = sorted.filter(order => order.status === 'Pending');
    const preparing = sorted.filter(order => order.status === 'Preparing');
    const ready = sorted.filter(order => order.status === 'Ready');
    const completed = sorted.filter(order =>
        order.status === 'Completed' &&
        !removedCompletedOrders.includes(Number(order.order_id))
    );

    updateCounts(pending.length, preparing.length, ready.length, completed.length);
    renderOrderColumn(pending, pendingOrdersContainer, 'pending');
    renderOrderColumn(preparing, preparingOrdersContainer, 'preparing');
    renderOrderColumn(ready, readyOrdersContainer, 'ready');
    renderOrderColumn(completed, completedOrdersContainer, 'completed');
}

function updateCounts(pending, preparing, ready, completed) {
    pendingCount.textContent = pending;
    preparingCount.textContent = preparing;
    readyCount.textContent = ready;
    completedCount.textContent = completed;
    pendingBadge.textContent = pending;
    preparingBadge.textContent = preparing;
    readyBadge.textContent = ready;
    completedBadge.textContent = completed;
}

function renderOrderColumn(orderList, container, type) {
    container.innerHTML = '';
    if (!orderList.length) {
        const messages = {
            pending: 'No pending orders',
            preparing: 'No orders being prepared',
            ready: 'No ready orders',
            completed: 'No completed orders'
        };
        container.innerHTML = `<div class="empty-orders"><p>${messages[type]}</p></div>`;
        return;
    }

    orderList.forEach(order => {
        const card = document.createElement('article');
        card.className = 'kitchen-order-card';

        const displayNumber = order.daily_order_number ?? order.order_id;
        const orderType = order.order_type || '';
        const typeClass = orderType === 'Take Out' ? 'take-out' : 'dine-in';

        const itemsHTML = Array.isArray(order.items) && order.items.length
            ? order.items.map(item => `
                <div class="kitchen-item-row">
                    <div class="kitchen-item-description">
                        <span class="kitchen-item-name">${Number(item.quantity)}× ${escapeHTML(item.item_name)}</span>
                        ${item.drink_size ? `<span class="kitchen-drink-size">${escapeHTML(item.drink_size)}</span>` : ''}
                    </div>
                </div>
            `).join('')
            : '<p>No items found.</p>';

        let buttonHTML = '';
        if (order.status === 'Pending') {
            buttonHTML = `<button class="kitchen-action-btn start-btn" onclick="updateOrderStatus(${Number(order.order_id)}, 'Preparing')">Start Preparing</button>`;
        } else if (order.status === 'Preparing') {
            buttonHTML = `<button class="kitchen-action-btn ready-btn" onclick="updateOrderStatus(${Number(order.order_id)}, 'Ready')">Mark as Ready</button>`;
        } else if (order.status === 'Ready') {
            buttonHTML = `<button class="kitchen-action-btn complete-btn" onclick="updateOrderStatus(${Number(order.order_id)}, 'Completed')">Complete Order</button>`;
        } else if (order.status === 'Completed') {
            buttonHTML = `<button class="kitchen-action-btn remove-btn" onclick="removeCompletedOrder(${Number(order.order_id)})">Remove</button>`;
        }

        card.innerHTML = `
            <div class="kitchen-order-header">
                <div class="kitchen-order-title">
                    <h3>Order #${escapeHTML(displayNumber)}</h3>
                    ${orderType ? `<span class="kitchen-order-type ${typeClass}">${escapeHTML(orderType.toUpperCase())}</span>` : ''}
                </div>
                <span class="order-status ${type}">${escapeHTML(order.status)}</span>
            </div>
            <div class="kitchen-order-items">${itemsHTML}</div>
            <div class="kitchen-order-footer">
                <span>Total</span>
                <strong>₱${Number(order.total_amount).toFixed(2)}</strong>
            </div>
            ${buttonHTML}`;

        container.appendChild(card);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to update order.');
        }
        await loadOrders();
    } catch (error) {
        console.error('Error updating order:', error);
        alert(error.message || 'Failed to update order status.');
    }
}

function removeCompletedOrder(orderId) {
    const id = Number(orderId);
    if (!removedCompletedOrders.includes(id)) removedCompletedOrders.push(id);
    localStorage.setItem('removedCompletedOrders', JSON.stringify(removedCompletedOrders));
    renderOrders();
}

window.updateOrderStatus = updateOrderStatus;
window.removeCompletedOrder = removeCompletedOrder;

loadOrders();
setInterval(loadOrders, 5000);
