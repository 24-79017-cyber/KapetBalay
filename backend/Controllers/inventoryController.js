
import * as inventoryService from '../Services/inventoryService.js';

// GET ALL INVENTORY
export const getInventory = async (req, res) => {
    try {
        const items = await inventoryService.getInventoryList();

        return res.status(200).json(items);
    } catch (error) {
        console.error('Fetch inventory error:', error);

        return res.status(500).json({
            message: 'Failed to fetch inventory items'
        });
    }
};

// ADD INVENTORY ITEM
export const addInventory = async (req, res) => {
    try {
        const itemId = await inventoryService.addInventoryItem(req.body);

        return res.status(201).json({
            message: 'Inventory item added successfully',
            item_id: itemId
        });
    } catch (error) {
        console.error('Add inventory error:', error);

        return res.status(400).json({
            message: error.message
        });
    }
};

// UPDATE INVENTORY ITEM
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;

        await inventoryService.editInventoryItem(id, req.body);

        return res.status(200).json({
            message: 'Inventory item updated successfully'
        });
    } catch (error) {
        console.error('Update inventory error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 400;

        return res.status(statusCode).json({
            message: error.message
        });
    }
};

// DELETE INVENTORY ITEM
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;

        await inventoryService.removeInventoryItem(id);

        return res.status(200).json({
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 500;

        return res.status(statusCode).json({
            message: error.message
        });
    }
};
