
const API_URL = 'http://localhost:3000/api';

const menuGrid = document.getElementById('menuGrid');
const menuSearch = document.getElementById('menuSearch');
const categoryFilter = document.getElementById('categoryFilter');
const cartItemsContainer = document.getElementById('cartItems');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('checkoutBtn');

const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModal = document.getElementById('closeCheckoutModal');
const cancelCheckout = document.getElementById('cancelCheckout');
const confirmCheckout = document.getElementById('confirmCheckout');
const checkoutTotal = document.getElementById('checkoutTotal');
const cashReceivedInput = document.getElementById('cashReceived');
const changeAmountElement = document.getElementById('changeAmount');

const dineInBtn = document.getElementById('dineInBtn');
const takeOutBtn = document.getElementById('takeOutBtn');

let menuItems = [];
let cart = [];
let selectedOrderType = '';
let isProcessingOrder = false;
let pendingIdempotencyKey = null;

const DRINK_CATEGORIES = new Set(['coffee', 'non-coffee']);

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function isDrink(item) {
    return DRINK_CATEGORIES.has(
        String(item.category || '').trim().toLowerCase()
    );
}

function createRequestKey() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `kb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function invalidatePendingRequest() {
    pendingIdempotencyKey = null;
}

// =============================
// TOAST NOTIFICATION
// =============================

function showToast(message, type = 'success') {
    let toast = document.getElementById('posToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'posToast';
        document.body.appendChild(toast);
    }

    toast.className = `pos-toast ${type}`;
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast.hideTimeout);

    toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// =============================
// BRANDED INSUFFICIENT CASH MODAL
// =============================

function showCashAlert(message) {
    let modal = document.getElementById('cashAlertModal');

    if (!modal) {
        if (!document.getElementById('cashAlertStyles')) {
            const style = document.createElement('style');
            style.id = 'cashAlertStyles';

            style.textContent = `
                .cash-alert-overlay {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(35, 23, 16, 0.62);
                    backdrop-filter: blur(4px);
                    z-index: 100000;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.22s ease,
                                visibility 0.22s ease;
                }

                .cash-alert-overlay.show {
                    opacity: 1;
                    visibility: visible;
                }

                .cash-alert-box {
                    width: 100%;
                    max-width: 420px;
                    padding: 34px 30px 30px;
                    border-radius: 20px;
                    background: #F7F0E7;
                    text-align: center;
                    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
                    transform: translateY(14px) scale(0.98);
                    transition: transform 0.22s ease;
                }

                .cash-alert-overlay.show .cash-alert-box {
                    transform: translateY(0) scale(1);
                }

                .cash-alert-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 72px;
                    height: 72px;
                    margin: 0 auto 18px;
                    border-radius: 50%;
                    background: #F0DFD0;
                    color: #75452D;
                    font-size: 34px;
                    font-weight: 700;
                }

                .cash-alert-box h2 {
                    margin: 0 0 12px;
                    color: #452B1D;
                    font-size: 25px;
                    font-weight: 700;
                }

                .cash-alert-box p {
                    margin: 0 0 20px;
                    color: #76685F;
                    font-size: 15px;
                    line-height: 1.6;
                }

                .cash-alert-note {
                    margin-bottom: 22px;
                    padding: 13px;
                    border-radius: 10px;
                    background: #EFE3D6;
                    color: #65432F;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .cash-alert-button {
                    width: 100%;
                    padding: 14px 18px;
                    border: 0;
                    border-radius: 10px;
                    background: #5B3825;
                    color: #FFFFFF;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease,
                                transform 0.2s ease;
                }

                .cash-alert-button:hover {
                    background: #754B32;
                    transform: translateY(-1px);
                }

                .cash-alert-button:focus-visible {
                    outline: 3px solid #C99A70;
                    outline-offset: 3px;
                }

                @media (max-width: 480px) {
                    .cash-alert-box {
                        padding: 28px 22px 24px;
                    }

                    .cash-alert-box h2 {
                        font-size: 22px;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        modal = document.createElement('div');
        modal.id = 'cashAlertModal';
        modal.className = 'cash-alert-overlay';
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="cash-alert-box"
                 role="alertdialog"
                 aria-modal="true"
                 aria-labelledby="cashAlertTitle"
                 aria-describedby="cashAlertMessage">

                <div class="cash-alert-icon" aria-hidden="true">₱</div>

                <h2 id="cashAlertTitle">Insufficient Cash</h2>

                <p id="cashAlertMessage"></p>

                <div class="cash-alert-note">
                    Please enter an amount equal to or greater
                    than the total amount.
                </div>

                <button type="button" class="cash-alert-button">
                    Okay, Got It
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.cash-alert-button')
            .addEventListener('click', closeCashAlert);

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeCashAlert();
            }
        });
    }

    document.getElementById('cashAlertMessage').textContent = message;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    modal.querySelector('.cash-alert-button').focus();
}

function closeCashAlert() {
    const modal = document.getElementById('cashAlertModal');

    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');

    if (cashReceivedInput) {
        cashReceivedInput.focus();
    }
}

// =============================
// BRANDED INVENTORY ERROR MODAL
// =============================

function showOrderError(errorMessage) {
    const modal = document.getElementById('orderErrorModal');
    const title = document.getElementById('orderErrorTitle');
    const message = document.getElementById('orderErrorMessage');
    const stockDetails = document.getElementById('orderErrorStockDetails');
    const retained = document.getElementById('orderErrorRetained');

    const text = String(
        errorMessage || 'An unexpected error occurred.'
    );

    const stockMatch = text.match(
        /Insufficient\s+(.+?)\.\s*Required:\s*([\d.]+)\s*(\w+);\s*Available:\s*([\d.]+)\s*(\w+)/i
    );

    const isStockError = Boolean(stockMatch);

    title.textContent = isStockError
        ? 'Insufficient Inventory'
        : 'Unable to Complete Order';

    message.textContent = isStockError
        ? 'There are not enough supplies available to complete this order.'
        : text;

    stockDetails.hidden = !isStockError;
    retained.hidden = false;

    if (isStockError) {
        const required = Number(stockMatch[2]);
        const available = Number(stockMatch[4]);
        const shortage = Math.max(0, required - available);

        document.getElementById('orderErrorItem').textContent =
            stockMatch[1];

        document.getElementById('orderErrorRequired').textContent =
            `${required.toFixed(2)} ${stockMatch[3]}`;

        document.getElementById('orderErrorAvailable').textContent =
            `${available.toFixed(2)} ${stockMatch[5]}`;

        document.getElementById('orderErrorShortage').textContent =
            `${shortage.toFixed(2)} ${stockMatch[3]}`;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    document.getElementById('closeOrderError').focus();
}

function closeOrderError() {
    const modal = document.getElementById('orderErrorModal');

    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

document.getElementById('closeOrderError')
    ?.addEventListener('click', closeOrderError);

document.getElementById('orderErrorOkay')
    ?.addEventListener('click', closeOrderError);

document.getElementById('orderErrorModal')
    ?.addEventListener('click', event => {
        if (event.target.id === 'orderErrorModal') {
            closeOrderError();
        }
    });

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeOrderError();
    }
});

// =============================
// ORDER TYPE
// =============================

function selectOrderType(orderType) {
    if (isProcessingOrder) return;

    if (selectedOrderType !== orderType) {
        invalidatePendingRequest();
    }

    selectedOrderType = orderType;

    dineInBtn.classList.toggle(
        'active',
        orderType === 'Dine In'
    );

    takeOutBtn.classList.toggle(
        'active',
        orderType === 'Take Out'
    );

    dineInBtn.setAttribute(
        'aria-pressed',
        String(orderType === 'Dine In')
    );

    takeOutBtn.setAttribute(
        'aria-pressed',
        String(orderType === 'Take Out')
    );

    updateCartSummary();
}

dineInBtn.addEventListener('click', () => {
    selectOrderType('Dine In');
});

takeOutBtn.addEventListener('click', () => {
    selectOrderType('Take Out');
});

function resetOrderType() {
    selectedOrderType = '';

    dineInBtn.classList.remove('active');
    takeOutBtn.classList.remove('active');

    dineInBtn.setAttribute('aria-pressed', 'false');
    takeOutBtn.setAttribute('aria-pressed', 'false');

    updateCartSummary();
}

// =============================
// LOAD MENU ITEMS
// =============================

async function loadMenuItems() {
    try {
        const response = await fetch(`${API_URL}/menu-items`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'Failed to load menu.'
            );
        }

        menuItems = (result.data || []).filter(
            item => item.availability === 'Available'
        );

        renderCategories();
        renderMenuItems();

    } catch (error) {
        console.error('Error loading menu:', error);

        menuGrid.innerHTML = `
            <div class="menu-empty-state">
                <h3>Unable to load menu</h3>
                <p>Please check your backend server and database connection.</p>
            </div>
        `;
    }
}

// =============================
// CATEGORY FILTER
// =============================

function renderCategories() {
    const categories = [
        'All',
        ...new Set(menuItems.map(item => item.category))
    ];

    categoryFilter.innerHTML = '';

    categories.forEach((category, index) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = `category-btn${index === 0 ? ' active' : ''}`;
        button.textContent = category;
        button.dataset.category = category;

        button.addEventListener('click', () => {
            categoryFilter
                .querySelectorAll('.category-btn')
                .forEach(btn => btn.classList.remove('active'));

            button.classList.add('active');
            renderMenuItems();
        });

        categoryFilter.appendChild(button);
    });
}

// =============================
// RENDER MENU
// =============================

function renderMenuItems() {
    const searchValue = menuSearch.value.toLowerCase().trim();

    const activeCategory =
        categoryFilter.querySelector('.category-btn.active')
            ?.dataset.category || 'All';

    const filteredItems = menuItems.filter(item =>
        String(item.item_name)
            .toLowerCase()
            .includes(searchValue) &&
        (
            activeCategory === 'All' ||
            item.category === activeCategory
        )
    );

    menuGrid.innerHTML = '';

    if (!filteredItems.length) {
        menuGrid.innerHTML = `
            <div class="menu-empty-state">
                <h3>No menu items found</h3>
                <p>Try another search or category.</p>
            </div>
        `;
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('article');
        card.className = 'pos-menu-card';

        const drink = isDrink(item);

        card.innerHTML = `
            <div>
                <span class="menu-category">
                    ${escapeHTML(item.category)}
                </span>

                <h3>${escapeHTML(item.item_name)}</h3>

                <p class="menu-price">
                    ₱${Number(item.price).toFixed(2)}
                </p>
            </div>

            ${
                drink
                    ? `
                        <div class="drink-size-picker">
                            <span class="drink-size-label">
                                Choose drink size
                            </span>

                            <div class="drink-size-options">
                                <button
                                    type="button"
                                    class="drink-size-btn"
                                    data-size="22oz"
                                >
                                    22oz
                                </button>

                                <button
                                    type="button"
                                    class="drink-size-btn"
                                    data-size="24oz"
                                >
                                    24oz
                                </button>
                            </div>
                        </div>
                    `
                    : `
                        <button
                            type="button"
                            class="add-to-cart-btn"
                        >
                            + Add to Order
                        </button>
                    `
            }
        `;

        if (drink) {
            card.querySelectorAll('.drink-size-btn')
                .forEach(button => {
                    button.addEventListener('click', () => {
                        addToCart(item, button.dataset.size);
                    });
                });

        } else {
            card.querySelector('.add-to-cart-btn')
                .addEventListener('click', () => {
                    addToCart(item, null);
                });
        }

        menuGrid.appendChild(card);
    });
}

// =============================
// CART
// =============================

function cartKey(menuId, drinkSize) {
    return `${menuId}:${drinkSize || 'none'}`;
}

function addToCart(item, drinkSize) {
    if (
        isDrink(item) &&
        !['22oz', '24oz'].includes(drinkSize)
    ) {
        alert('Please select 22oz or 24oz.');
        return;
    }

    invalidatePendingRequest();

    const key = cartKey(item.menu_id, drinkSize);

    const existing = cart.find(
        cartItem => cartItem.key === key
    );

    if (existing) {
        existing.quantity += 1;

    } else {
        cart.push({
            key,
            menu_id: Number(item.menu_id),
            item_name: item.item_name,
            category: item.category,
            price: Number(item.price),
            quantity: 1,
            drink_size: drinkSize
        });
    }

    renderCart();
}

// =============================
// RENDER CART
// =============================

function renderCart() {
    cartItemsContainer.innerHTML = '';

    if (!cart.length) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <p>No items added yet</p>
            </div>
        `;

        updateCartSummary();
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        row.innerHTML = `
            <div class="cart-item-top">
                <div>
                    <div class="cart-item-name">
                        ${escapeHTML(item.item_name)}
                    </div>

                    ${
                        item.drink_size
                            ? `
                                <span class="cart-drink-size">
                                    ${escapeHTML(item.drink_size)}
                                </span>
                            `
                            : ''
                    }
                </div>

                <span class="cart-item-price">
                    ₱${item.price.toFixed(2)}
                </span>
            </div>

            <div class="cart-item-bottom">
                <div class="cart-quantity-controls">
                    <button
                        type="button"
                        class="quantity-btn decrease-btn"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span class="cart-item-quantity">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-btn increase-btn"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>

                <strong class="cart-item-subtotal">
                    ₱${(item.price * item.quantity).toFixed(2)}
                </strong>

                <button
                    type="button"
                    class="remove-cart-item"
                >
                    Remove
                </button>
            </div>
        `;

        row.querySelector('.decrease-btn')
            .addEventListener('click', () => {
                changeQuantity(item.key, -1);
            });

        row.querySelector('.increase-btn')
            .addEventListener('click', () => {
                changeQuantity(item.key, 1);
            });

        row.querySelector('.remove-cart-item')
            .addEventListener('click', () => {
                removeFromCart(item.key);
            });

        cartItemsContainer.appendChild(row);
    });

    updateCartSummary();
}

// =============================
// CHANGE QUANTITY
// =============================

function changeQuantity(key, change) {
    const item = cart.find(
        cartItem => cartItem.key === key
    );

    if (!item) return;

    invalidatePendingRequest();

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(
            cartItem => cartItem.key !== key
        );
    }

    renderCart();
}

// =============================
// REMOVE ITEM
// =============================

function removeFromCart(key) {
    invalidatePendingRequest();

    cart = cart.filter(
        item => item.key !== key
    );

    renderCart();
}

// =============================
// TOTAL COMPUTATION
// =============================

function calculateTotal() {
    return cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
}

function updateCartSummary() {
    const total = calculateTotal();

    subtotalElement.textContent =
        `₱${total.toFixed(2)}`;

    totalElement.textContent =
        `₱${total.toFixed(2)}`;

    checkoutBtn.disabled =
        !cart.length ||
        !selectedOrderType ||
        isProcessingOrder;
}

// =============================
// CLEAR CART
// =============================

clearCartBtn.addEventListener('click', () => {
    if (!cart.length || isProcessingOrder) return;

    cart = [];

    invalidatePendingRequest();
    resetOrderType();
    renderCart();
});

// =============================
// SEARCH
// =============================

menuSearch.addEventListener('input', renderMenuItems);

// =============================
// OPEN CHECKOUT
// =============================

checkoutBtn.addEventListener('click', () => {
    if (!cart.length || isProcessingOrder) return;

    if (!selectedOrderType) {
        alert('Please select Dine In or Take Out.');
        return;
    }

    checkoutTotal.textContent =
        `₱${calculateTotal().toFixed(2)}`;

    cashReceivedInput.value = '';
    changeAmountElement.textContent = '₱0.00';

    checkoutModal.classList.add('active');
});

// =============================
// CASH AND CHANGE
// =============================

cashReceivedInput.addEventListener('input', () => {
    const change = Math.max(
        Number(cashReceivedInput.value) - calculateTotal(),
        0
    );

    changeAmountElement.textContent =
        `₱${change.toFixed(2)}`;
});

// =============================
// CLOSE CHECKOUT
// =============================

function closeModal() {
    if (!isProcessingOrder) {
        checkoutModal.classList.remove('active');
    }
}

closeCheckoutModal.addEventListener('click', closeModal);
cancelCheckout.addEventListener('click', closeModal);

checkoutModal.addEventListener('click', event => {
    if (event.target === checkoutModal) {
        closeModal();
    }
});

// =============================
// CONFIRM CHECKOUT
// =============================

confirmCheckout.addEventListener('click', async () => {
    if (isProcessingOrder || !cart.length) return;

    if (!selectedOrderType) {
        alert('Please select Dine In or Take Out.');
        return;
    }

    const total = calculateTotal();
    const cashValue = cashReceivedInput.value;
    const cashReceived = Number(cashValue);

    if (
        cashValue === '' ||
        !Number.isFinite(cashReceived) ||
        cashReceived <= 0
    ) {
        alert('Please enter the cash received.');
        return;
    }

    if (cashReceived < total) {
        showCashAlert(
            'The cash received is not enough to complete this transaction.'
        );
        return;
    }

    const orderItems = cart.map(item => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
        drink_size: item.drink_size
    }));

    const orderType = selectedOrderType;

    if (!pendingIdempotencyKey) {
        pendingIdempotencyKey = createRequestKey();
    }

    try {
        isProcessingOrder = true;

        confirmCheckout.disabled = true;
        confirmCheckout.textContent = 'Processing Order...';

        updateCartSummary();

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                items: orderItems,
                order_type: orderType,
                idempotency_key: pendingIdempotencyKey
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error ||
                result.message ||
                'Failed to save order.'
            );
        }

        const dailyNumber =
            result.data?.daily_order_number;

        if (
            dailyNumber === undefined ||
            dailyNumber === null
        ) {
            throw new Error(
                'Order was saved but the daily order number was not returned.'
            );
        }

        showToast(
            `Order #${dailyNumber} (${orderType}) saved successfully!`
        );

        cart = [];

        invalidatePendingRequest();
        resetOrderType();
        renderCart();

        checkoutModal.classList.remove('active');

    } catch (error) {
        console.error('Checkout error:', error);

        showOrderError(error.message);

    } finally {
        isProcessingOrder = false;

        confirmCheckout.disabled = false;
        confirmCheckout.textContent = 'Confirm Order';

        updateCartSummary();
    }
});

// =============================
// INITIAL LOAD
// =============================

loadMenuItems();
renderCart();
resetOrderType();
