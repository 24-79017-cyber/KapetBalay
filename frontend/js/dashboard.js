
document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/api";

    const cards = document.querySelectorAll(
        ".dashboard-card .card-value"
    );

    const ordersTable = document.querySelectorAll(
        ".dashboard-section tbody"
    )[0];

    const inventoryTable = document.querySelectorAll(
        ".dashboard-section tbody"
    )[1];

    // =============================
    // CUSTOM LOGOUT MODAL
    // =============================
    const logoutButton = document.querySelector(".logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();
            showLogoutModal();
        });
    }

    function showLogoutModal() {
        if (document.getElementById("logoutModal")) return;

        const modal = document.createElement("div");
        modal.id = "logoutModal";
        modal.className = "logout-modal-overlay";

        modal.innerHTML = `
            <div class="logout-modal">

                <div class="logout-icon-wrapper">
                    <div class="logout-icon">↪</div>
                </div>

                <h2>Logout Confirmation</h2>
                <p>Are you sure you want to logout?</p>

                <div class="logout-modal-actions">
                    <button type="button" class="logout-cancel-btn" id="cancelLogout">
                        Cancel
                    </button>

                    <button type="button" class="logout-confirm-btn" id="confirmLogout">
                        OK
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("cancelLogout").addEventListener("click", () => {
            modal.remove();
        });

        document.getElementById("confirmLogout").addEventListener("click", () => {
            window.location.href = "login.html";
        });

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    // =============================
    // LOAD DASHBOARD DATA
    // =============================
    async function loadDashboard() {
        try {
            const [
                ordersResponse,
                inventoryResponse,
                salesResponse
            ] = await Promise.all([
                fetch(`${API_URL}/orders`),
                fetch(`${API_URL}/inventory`),
                fetch(`${API_URL}/orders/today-sales`)
            ]);

            if (!ordersResponse.ok) {
                throw new Error("Failed to load orders.");
            }

            if (!inventoryResponse.ok) {
                throw new Error("Failed to load inventory.");
            }

            if (!salesResponse.ok) {
                throw new Error("Failed to load today's sales.");
            }

            const ordersResult = await ordersResponse.json();
            const inventoryResult = await inventoryResponse.json();
            const salesResult = await salesResponse.json();

            const orders = Array.isArray(ordersResult)
                ? ordersResult
                : ordersResult.data || [];

            const inventory = Array.isArray(inventoryResult)
                ? inventoryResult
                : inventoryResult.data || [];

            const sales = salesResult.data || {};

            updateDashboard(orders, inventory, sales);

        } catch (error) {
            console.error("Dashboard loading error:", error);
        }
    }

    // =============================
    // UPDATE DASHBOARD CARDS
    // =============================
    function updateDashboard(orders, inventory, sales) {
        const today = new Date().toLocaleDateString();

        // ALL ORDERS RECORDED TODAY
        const todaysOrders = orders.filter(order => {
            if (!order.order_date) return false;

            return new Date(order.order_date).toLocaleDateString() === today;
        });

        // TODAY'S COMPLETED SALES FROM API
        const todaysSales = Number(sales.today_sales || 0);

        // INVENTORY CALCULATIONS
        const lowStockItems = inventory.filter(item => {
            const quantity = Number(
                item.quantity ?? item.stock_quantity ?? 0
            );

            return quantity > 0 && quantity <= 10;
        });

        const outOfStockItems = inventory.filter(item => {
            const quantity = Number(
                item.quantity ?? item.stock_quantity ?? 0
            );

            return quantity <= 0;
        });

        // UPDATE DASHBOARD CARDS
        if (cards.length >= 4) {
            cards[0].textContent = `₱${todaysSales.toFixed(2)}`;
            cards[1].textContent = todaysOrders.length;
            cards[2].textContent = lowStockItems.length;
            cards[3].textContent = outOfStockItems.length;
        }

        // UPDATE TABLES
        renderRecentOrders(todaysOrders);
        renderInventory(inventory);
    }

    // =============================
    // RECENT ORDERS
    // =============================
    function renderRecentOrders(orders) {
        if (!ordersTable) return;

        const recentOrders = [...orders]
            .sort((a, b) => {
                return new Date(b.order_date) - new Date(a.order_date);
            })
            .slice(0, 5);

        if (recentOrders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            No orders recorded yet.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        ordersTable.innerHTML = recentOrders.map(order => {
            const items = (order.items || [])
                .map(item => `${item.quantity}x ${item.item_name}`)
                .join(", ");

            // Display daily order number instead of database ID
            const displayOrderNumber =
                order.daily_order_number ?? order.order_id;

            return `
                <tr>
                    <td>#${displayOrderNumber}</td>
                    <td>${items || "No items"}</td>
                    <td>₱${Number(order.total_amount || 0).toFixed(2)}</td>
                    <td>${order.status || "Pending"}</td>
                </tr>
            `;
        }).join("");
    }

    // =============================
    // INVENTORY OVERVIEW
    // =============================
    function renderInventory(inventory) {
        if (!inventoryTable) return;

        if (inventory.length === 0) {
            inventoryTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            No inventory items recorded yet.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        inventoryTable.innerHTML = inventory.slice(0, 10).map(item => {
            const name = item.item_name || item.name || "Unnamed Item";
            const category = item.category || "Uncategorized";

            const quantity = Number(
                item.quantity ?? item.stock_quantity ?? 0
            );

            let status = "In Stock";

            if (quantity <= 0) {
                status = "Out of Stock";
            } else if (quantity <= 10) {
                status = "Low Stock";
            }

            return `
                <tr>
                    <td>${name}</td>
                    <td>${category}</td>
                    <td>${quantity}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join("");
    }

    // =============================
    // INITIAL LOAD
    // =============================
    loadDashboard();

    // REFRESH EVERY 5 SECONDS
    setInterval(loadDashboard, 5000);
});
