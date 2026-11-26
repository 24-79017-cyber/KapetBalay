import express from 'express';
import { loginStaff } from '../Controllers/staffController.js';

const router = express.Router();

// STAFF LOGIN
router.post('/login', loginStaff);

export default router;