
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ELEMENTS
    // =====================================

    const searchInventory = document.getElementById("searchInventory");

    // SUMMARY CARDS
    const outOfStock = document.getElementById("outOfStock");
    const lowStock = document.getElementById("lowStock");
    const normalStock = document.getElementById("normalStock");

    // INVENTORY GROUPS
    const outOfStockItems = document.getElementById("outOfStockItems");
    const lowStockItems = document.getElementById("lowStockItems");
    const normalStockItems = document.getElementById("normalStockItems");

    // GROUP COUNTS
    const outOfStockCount = document.getElementById("outOfStockCount");
    const lowStockCount = document.getElementById("lowStockCount");
    const normalStockCount = document.getElementById("normalStockCount");

    // BUTTONS
    const addItemButton = document.getElementById("addItemButton");
    const stockInButton = document.getElementById("stockInButton");
    const stockUsageButton = document.getElementById("stockUsageButton");

    // ADD / EDIT MODAL
    const inventoryModal = document.getElementById("inventoryModal");
    const closeInventoryModal = document.getElementById("closeInventoryModal");
    const cancelInventory = document.getElementById("cancelInventory");
    const inventoryForm = document.getElementById("inventoryForm");

    const itemName = document.getElementById("itemName");
    const itemCategory = document.getElementById("itemCategory");
    const itemQuantity = document.getElementById("itemQuantity");
    const itemUnit = document.getElementById("itemUnit");
    const itemMinimumStock = document.getElementById("itemMinimumStock");

    const modalTitle = inventoryModal.querySelector(".modal-header h2");
    const modalDescription = inventoryModal.querySelector(".modal-header p");
    const saveButton = inventoryForm.querySelector('button[type="submit"]');

    // STOCK-IN MODAL
    const stockInModal = document.getElementById("stockInModal");
    const closeStockInModal = document.getElementById("closeStockInModal");
    const cancelStockIn = document.getElementById("cancelStockIn");
    const stockInForm = document.getElementById("stockInForm");

    const stockInItem = document.getElementById("stockInItem");
    const stockInCurrentStock = document.getElementById("stockInCurrentStock");
    const stockInQuantity = document.getElementById("stockInQuantity");

    // STOCK USAGE MODAL
    const stockUsageModal = document.getElementById("stockUsageModal");
    const closeStockUsageModal = document.getElementById("closeStockUsageModal");
    const cancelStockUsage = document.getElementById("cancelStockUsage");
    const stockUsageForm = document.getElementById("stockUsageForm");

    const usageItem = document.getElementById("usageItem");
    const usageCurrentStock = document.getElementById("usageCurrentStock");
    const usageQuantity = document.getElementById("usageQuantity");
    const usageReason = document.getElementById("usageReason");

    // =====================================
    // VARIABLES
    // =====================================

    let inventoryItems = [];
    let editingItemId = null;
    let toastTimer;

    const API_URL = "http://localhost:3000/api/inventory";

    // =====================================
    // DATABASE FORMAT
    // =====================================

    function formatInventoryItem(item) {
        return {
            id: Number(item.item_id),
            name: item.item_name,
            category: item.category,
            quantity: Number(item.quantity),
            unit: item.unit,
            minimumStock: Number(item.minimum_stock)
        };
    }

    // =====================================
    // ESCAPE HTML
    // =====================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return replacements[character];
        });
    }

    // =====================================
    // NOTIFICATION SYSTEM
    // =====================================

    function showToast(message, type = "success") {
        let toast = document.getElementById("inventoryToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "inventoryToast";
            document.body.appendChild(toast);
        }

        clearTimeout(toastTimer);

        toast.textContent = message;
        toast.className = `inventory-toast ${type}`;

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // =====================================
    // GET INVENTORY STATUS
    // =====================================

    function getInventoryStatus(item) {
        if (item.quantity <= 0) {
            return {
                label: "Out of Stock",
                className: "status-out",
                group: "out"
            };
        }

        if (item.quantity <= item.minimumStock) {
            return {
                label: "Low Stock",
                className: "status-low",
                group: "low"
            };
        }

        return {
            label: "Normal",
            className: "status-normal",
            group: "normal"
        };
    }

    // =====================================
    // CREATE INVENTORY CARD
    // =====================================

    function createInventoryCard(item) {
        const status = getInventoryStatus(item);

        const card = document.createElement("div");
        card.className = `inventory-item-card ${status.group}-item`;

        card.innerHTML = `
            <div class="inventory-item-card-header">
                <div>
                    <h4>${escapeHTML(item.name)}</h4>
                    <p>${escapeHTML(item.category)}</p>
                </div>

                <span class="status ${status.className}">
                    ${status.label}
                </span>
            </div>

            <div class="inventory-item-details">

                <div class="inventory-detail">
                    <span>Quantity</span>
                    <strong>
                        ${item.quantity} ${escapeHTML(item.unit)}
                    </strong>
                </div>

                <div class="inventory-detail">
                    <span>Minimum Stock</span>
                    <strong>
                        ${item.minimumStock} ${escapeHTML(item.unit)}
                    </strong>
                </div>

            </div>

            <div class="inventory-item-actions">
                <button
                    type="button"
                    class="btn btn-secondary edit-button"
                    data-id="${item.id}"
                >
                    Edit Item
                </button>
            </div>
        `;

        return card;
    }

    // =====================================
    // DISPLAY INVENTORY GROUPS
    // =====================================

    function displayInventoryGroups(items) {

        outOfStockItems.innerHTML = "";
        lowStockItems.innerHTML = "";
        normalStockItems.innerHTML = "";

        const groups = {
            out: [],
            low: [],
            normal: []
        };

        items.forEach(item => {
            const status = getInventoryStatus(item);
            groups[status.group].push(item);
        });

        // OUT OF STOCK
        if (groups.out.length === 0) {
            outOfStockItems.innerHTML = `
                <div class="empty-state">
                    No out-of-stock items.
                </div>
            `;
        } else {
            groups.out.forEach(item => {
                outOfStockItems.appendChild(createInventoryCard(item));
            });
        }

        // LOW STOCK
        if (groups.low.length === 0) {
            lowStockItems.innerHTML = `
                <div class="empty-state">
                    No low-stock items.
                </div>
            `;
        } else {
            groups.low.forEach(item => {
                lowStockItems.appendChild(createInventoryCard(item));
            });
        }

        // NORMAL STOCK
        if (groups.normal.length === 0) {
            normalStockItems.innerHTML = `
                <div class="empty-state">
                    No normal-stock items.
                </div>
            `;
        } else {
            groups.normal.forEach(item => {
                normalStockItems.appendChild(createInventoryCard(item));
            });
        }

        // SUMMARY CARDS
        outOfStock.textContent = groups.out.length;
        lowStock.textContent = groups.low.length;
        normalStock.textContent = groups.normal.length;

        // GROUP COUNTS
        outOfStockCount.textContent =
            `${groups.out.length} ${groups.out.length === 1 ? "Item" : "Items"}`;

        lowStockCount.textContent =
            `${groups.low.length} ${groups.low.length === 1 ? "Item" : "Items"}`;

        normalStockCount.textContent =
            `${groups.normal.length} ${groups.normal.length === 1 ? "Item" : "Items"}`;
    }

    // =====================================
    // LOAD INVENTORY FROM DATABASE
    // =====================================

    async function loadInventoryFromDatabase() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch inventory.");
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Unexpected inventory response format.");
            }

            inventoryItems = data.map(formatInventoryItem);

            refreshInventory();

        } catch (error) {
            console.error("Inventory loading error:", error);
            showToast(
                "Unable to load inventory from database.",
                "error"
            );
        }
    }

    // =====================================
    // REFRESH INVENTORY
    // =====================================

    function refreshInventory() {
        const searchValue = searchInventory.value
            .toLowerCase()
            .trim();

        const filteredItems = inventoryItems.filter(item =>
            item.name.toLowerCase().includes(searchValue) ||
            item.category.toLowerCase().includes(searchValue)
        );

        displayInventoryGroups(filteredItems);
    }

    // =====================================
    // OPEN ADD MODAL
    // =====================================

    function openAddModal() {
        editingItemId = null;
        inventoryForm.reset();

        modalTitle.textContent = "Add Inventory Item";
        modalDescription.textContent =
            "Enter the details of your inventory item.";

        saveButton.textContent = "Save Item";

        inventoryModal.classList.add("active");
        itemName.focus();
    }

    // =====================================
    // OPEN EDIT MODAL
    // =====================================

    function openEditModal(item) {
        editingItemId = item.id;

        itemName.value = item.name;
        itemCategory.value = item.category;
        itemQuantity.value = item.quantity;
        itemUnit.value = item.unit;
        itemMinimumStock.value = item.minimumStock;

        modalTitle.textContent = "Edit Inventory Item";
        modalDescription.textContent =
            "Update the details of your inventory item.";

        saveButton.textContent = "Save Changes";

        inventoryModal.classList.add("active");
        itemName.focus();
    }

    // =====================================
    // CLOSE ADD / EDIT MODAL
    // =====================================

    function closeModal() {
        inventoryModal.classList.remove("active");
        inventoryForm.reset();

        editingItemId = null;

        modalTitle.textContent = "Add Inventory Item";
        modalDescription.textContent =
            "Enter the details of your inventory item.";

        saveButton.textContent = "Save Item";
    }

    // =====================================
    // POPULATE STOCK-IN DROPDOWN
    // =====================================

    function populateStockInItems() {
        stockInItem.innerHTML = `
            <option value="">Choose an item</option>
        `;

        inventoryItems.forEach(item => {
            const option = document.createElement("option");

            option.value = item.id;
            option.textContent =
                `${item.name} (${item.quantity} ${item.unit})`;

            stockInItem.appendChild(option);
        });
    }

    // =====================================
    // OPEN STOCK-IN MODAL
    // =====================================

    function openStockInModal() {
        if (inventoryItems.length === 0) {
            showToast(
                "Please add an inventory item first.",
                "error"
            );
            return;
        }

        stockInForm.reset();
        populateStockInItems();

        stockInCurrentStock.value = "";
        stockInModal.classList.add("active");

        stockInItem.focus();
    }

    // =====================================
    // CLOSE STOCK-IN MODAL
    // =====================================

    function closeStockInModalFunction() {
        stockInModal.classList.remove("active");
        stockInForm.reset();
        stockInCurrentStock.value = "";
    }

    // =====================================
    // SHOW CURRENT STOCK - STOCK IN
    // =====================================

    stockInItem.addEventListener("change", () => {
        const selectedId = Number(stockInItem.value);

        const selectedItem = inventoryItems.find(
            item => item.id === selectedId
        );

        stockInCurrentStock.value = selectedItem
            ? `${selectedItem.quantity} ${selectedItem.unit}`
            : "";
    });

    // =====================================
    // POPULATE STOCK USAGE DROPDOWN
    // =====================================

    function populateUsageItems() {
        usageItem.innerHTML = `
            <option value="">Choose an inventory item</option>
        `;

        inventoryItems.forEach(item => {
            const option = document.createElement("option");

            option.value = item.id;
            option.textContent =
                `${item.name} (${item.quantity} ${item.unit})`;

            usageItem.appendChild(option);
        });
    }

    // =====================================
    // OPEN STOCK USAGE MODAL
    // =====================================

    function openStockUsageModal() {
        if (inventoryItems.length === 0) {
            showToast(
                "Please add an inventory item first.",
                "error"
            );
            return;
        }

        stockUsageForm.reset();
        populateUsageItems();

        usageCurrentStock.value = "";
        stockUsageModal.classList.add("active");

        usageItem.focus();
    }

    // =====================================
    // CLOSE STOCK USAGE MODAL
    // =====================================

    function closeStockUsageModalFunction() {
        stockUsageModal.classList.remove("active");
        stockUsageForm.reset();
        usageCurrentStock.value = "";
    }

    // =====================================
    // SHOW CURRENT STOCK - USAGE
    // =====================================

    usageItem.addEventListener("change", () => {
        const selectedId = Number(usageItem.value);

        const selectedItem = inventoryItems.find(
            item => item.id === selectedId
        );

        usageCurrentStock.value = selectedItem
            ? `${selectedItem.quantity} ${selectedItem.unit}`
            : "";
    });

    // =====================================
    // CONFIRM STOCK USAGE
    // =====================================

    stockUsageForm.addEventListener("submit", async event => {
        event.preventDefault();

        const selectedId = Number(usageItem.value);
        const quantityUsed = Number(usageQuantity.value);

        if (!usageItem.value) {
            showToast(
                "Please select an inventory item.",
                "error"
            );
            return;
        }

        if (
            usageQuantity.value === "" ||
            !Number.isFinite(quantityUsed) ||
            quantityUsed <= 0
        ) {
            showToast(
                "Please enter a valid quantity used.",
                "error"
            );
            return;
        }

        const selectedItem = inventoryItems.find(
            item => item.id === selectedId
        );

        if (!selectedItem) {
            showToast(
                "Inventory item not found.",
                "error"
            );
            return;
        }

        if (quantityUsed > selectedItem.quantity) {
            showToast(
                "Insufficient stock. Cannot deduct more than available quantity.",
                "error"
            );
            return;
        }

        const newQuantity =
            selectedItem.quantity - quantityUsed;

        const reason = usageReason.value.trim();

        try {
            const response = await fetch(`${API_URL}/${selectedId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_name: selectedItem.name,
                    category: selectedItem.category,
                    quantity: newQuantity,
                    unit: selectedItem.unit,
                    minimum_stock: selectedItem.minimumStock
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Stock Usage failed."
                );
            }

            closeStockUsageModalFunction();

            await loadInventoryFromDatabase();

            showToast(
                `Stock Usage recorded! -${quantityUsed} ${selectedItem.unit}` +
                (reason ? ` | Reason: ${reason}` : "")
            );

        } catch (error) {
            console.error("Stock Usage error:", error);

            showToast(
                error.message || "Failed to deduct stock.",
                "error"
            );
        }
    });

    // =====================================
    // BUTTON EVENTS
    // =====================================

    addItemButton.addEventListener("click", openAddModal);
    stockInButton.addEventListener("click", openStockInModal);
    stockUsageButton.addEventListener("click", openStockUsageModal);

    // CLOSE ADD / EDIT MODAL
    closeInventoryModal.addEventListener("click", closeModal);
    cancelInventory.addEventListener("click", closeModal);

    // CLOSE STOCK-IN MODAL
    closeStockInModal.addEventListener(
        "click",
        closeStockInModalFunction
    );

    cancelStockIn.addEventListener(
        "click",
        closeStockInModalFunction
    );

    // CLOSE STOCK USAGE MODAL
    closeStockUsageModal.addEventListener(
        "click",
        closeStockUsageModalFunction
    );

    cancelStockUsage.addEventListener(
        "click",
        closeStockUsageModalFunction
    );

    // =====================================
    // EDIT BUTTON EVENTS
    // =====================================

    document.addEventListener("click", event => {
        const editButton = event.target.closest(".edit-button");

        if (!editButton) return;

        const itemId = Number(editButton.dataset.id);

        const selectedItem = inventoryItems.find(
            item => item.id === itemId
        );

        if (selectedItem) {
            openEditModal(selectedItem);
        }
    });

    // =====================================
    // CLOSE MODALS WHEN CLICKING OUTSIDE
    // =====================================

    inventoryModal.addEventListener("click", event => {
        if (event.target === inventoryModal) {
            closeModal();
        }
    });

    stockInModal.addEventListener("click", event => {
        if (event.target === stockInModal) {
            closeStockInModalFunction();
        }
    });

    stockUsageModal.addEventListener("click", event => {
        if (event.target === stockUsageModal) {
            closeStockUsageModalFunction();
        }
    });

    // =====================================
    // CLOSE MODALS USING ESCAPE
    // =====================================

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (inventoryModal.classList.contains("active")) {
                closeModal();
            }

            if (stockInModal.classList.contains("active")) {
                closeStockInModalFunction();
            }

            if (stockUsageModal.classList.contains("active")) {
                closeStockUsageModalFunction();
            }
        }
    });

    // =====================================
    // SAVE ITEM (ADD OR EDIT)
    // =====================================

    inventoryForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = itemName.value.trim();
        const category = itemCategory.value.trim();
        const quantity = Number(itemQuantity.value);
        const unit = itemUnit.value.trim();
        const minimumStock = Number(itemMinimumStock.value);

        if (
            name === "" ||
            category === "" ||
            unit === "" ||
            itemQuantity.value === "" ||
            itemMinimumStock.value === ""
        ) {
            showToast(
                "Please complete all fields.",
                "error"
            );
            return;
        }

        if (
            !Number.isFinite(quantity) ||
            quantity < 0 ||
            !Number.isFinite(minimumStock) ||
            minimumStock < 0
        ) {
            showToast(
                "Please enter valid quantity values.",
                "error"
            );
            return;
        }

        const duplicateItem = inventoryItems.some(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item.id !== editingItemId
        );

        if (duplicateItem) {
            showToast(
                "Item already exists in the inventory.",
                "error"
            );

            itemName.focus();
            return;
        }

        const wasEditing = editingItemId !== null;

        const itemData = {
            item_name: name,
            category,
            quantity,
            unit,
            minimum_stock: minimumStock
        };

        try {
            let response;

            if (wasEditing) {
                response = await fetch(
                    `${API_URL}/${editingItemId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(itemData)
                    }
                );
            } else {
                response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(itemData)
                });
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Inventory save failed."
                );
            }

            closeModal();

            await loadInventoryFromDatabase();

            showToast(
                wasEditing
                    ? "Inventory item updated successfully!"
                    : "Inventory item added successfully!"
            );

        } catch (error) {
            console.error("Save inventory error:", error);

            showToast(
                error.message || "Failed to save inventory item.",
                "error"
            );
        }
    });

    // =====================================
    // CONFIRM STOCK-IN
    // =====================================

    stockInForm.addEventListener("submit", async event => {
        event.preventDefault();

        const selectedId = Number(stockInItem.value);
        const receivedQuantity = Number(stockInQuantity.value);

        if (!stockInItem.value) {
            showToast(
                "Please select an inventory item.",
                "error"
            );
            return;
        }

        if (
            stockInQuantity.value === "" ||
            !Number.isFinite(receivedQuantity) ||
            receivedQuantity <= 0
        ) {
            showToast(
                "Please enter a valid stock-in quantity.",
                "error"
            );
            return;
        }

        const selectedItem = inventoryItems.find(
            item => item.id === selectedId
        );

        if (!selectedItem) {
            showToast(
                "Inventory item not found.",
                "error"
            );
            return;
        }

        const newQuantity =
            selectedItem.quantity + receivedQuantity;

        try {
            const response = await fetch(`${API_URL}/${selectedId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_name: selectedItem.name,
                    category: selectedItem.category,
                    quantity: newQuantity,
                    unit: selectedItem.unit,
                    minimum_stock: selectedItem.minimumStock
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Stock-In failed."
                );
            }

            closeStockInModalFunction();

            await loadInventoryFromDatabase();

            showToast(
                `Stock-In successful! +${receivedQuantity} ${selectedItem.unit}`
            );

        } catch (error) {
            console.error("Stock-In error:", error);

            showToast(
                error.message || "Failed to update stock.",
                "error"
            );
        }
    });

    // =====================================
    // SEARCH INVENTORY
    // =====================================

    searchInventory.addEventListener("input", refreshInventory);

    // =====================================
    // INITIAL LOAD
    // =====================================

    loadInventoryFromDatabase();

    console.log("Inventory module loaded successfully.");

});
