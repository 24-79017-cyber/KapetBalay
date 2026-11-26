
import express from 'express';

import {
    getInventory,
    addInventory,
    updateInventory,
    deleteInventory
} from '../Controllers/inventoryController.js';

const router = express.Router();

router.get('/inventory', getInventory);
router.post('/inventory', addInventory);
router.put('/inventory/:id', updateInventory);
router.delete('/inventory/:id', deleteInventory);

export default router;
