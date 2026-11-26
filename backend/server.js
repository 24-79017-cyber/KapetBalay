console.log('ACTIVE SERVER FILE:', import.meta.url);
import express from 'express';
import cors from 'cors';
import db from './config/db.js';

import loginRoutes from './Routes/login.js';
import inventoryRoutes from './Routes/inventoryRoutes.js';
import menuRoutes from './Routes/menuRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';

const app = express();
const PORT = 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// API ROUTES
app.use('/api', loginRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);

app.get('/api/test-today-sales', (req, res) => {
    res.json({
        success: true,
        message: 'TEST ROUTE IS WORKING'
    });
});

// MAIN ROUTE
app.get('/', (req, res) => {
    res.send("Kape't Balay Management System API is running!");
});

// DATABASE TEST
app.get('/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1 AS test');

        res.status(200).json({
            success: true,
            message: 'Database connection successful!',
            result
        });

    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed.',
            error: error.message
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
