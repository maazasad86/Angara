const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// Get all sales records
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.find().sort({ createdAt: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a sale record
router.post('/', async (req, res) => {
    try {
        const { items, totalAmount, orderType, customerName, customerPhone } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        const sale = new Sale({
            items,
            totalAmount: Number(totalAmount),
            orderType: orderType || 'Takeaway',
            customerName: customerName || '',
            customerPhone: customerPhone || ''
        });

        const newSale = await sale.save();
        res.status(201).json(newSale);
    } catch (err) {
        console.error('POST /api/sales error:', err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
