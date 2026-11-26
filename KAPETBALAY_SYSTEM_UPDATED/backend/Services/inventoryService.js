
import * as inventoryModel from '../Models/inventoryModel.js';

// GET ALL INVENTORY
export const getInventoryList = async () => {
    return await inventoryModel.getAllInventory();
};

// GET INVENTORY BY ID
export const getInventoryDetails = async (id) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    return item;
};

// CREATE INVENTORY
export const addInventoryItem = async (data) => {
    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        quantity === undefined ||
        quantity === '' ||
        !unit?.trim() ||
        minimum_stock === undefined ||
        minimum_stock === ''
    ) {
        throw new Error('Please complete all inventory fields.');
    }

    if (
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) < 0 ||
        !Number.isFinite(Number(minimum_stock)) ||
        Number(minimum_stock) < 0
    ) {
        throw new Error('Quantity and minimum stock must be valid non-negative numbers.');
    }

    return await inventoryModel.createInventory({
        item_name: item_name.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        minimum_stock: Number(minimum_stock)
    });
};

// UPDATE INVENTORY
export const editInventoryItem = async (id, data) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        quantity === undefined ||
        quantity === '' ||
        !unit?.trim() ||
        minimum_stock === undefined ||
        minimum_stock === ''
    ) {
        throw new Error('Please complete all inventory fields.');
    }

    if (
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) < 0 ||
        !Number.isFinite(Number(minimum_stock)) ||
        Number(minimum_stock) < 0
    ) {
        throw new Error('Quantity and minimum stock must be valid non-negative numbers.');
    }

    return await inventoryModel.updateInventory(id, {
        item_name: item_name.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        minimum_stock: Number(minimum_stock)
    });
};

// DELETE INVENTORY
export const removeInventoryItem = async (id) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    return await inventoryModel.deleteInventory(id);
};

