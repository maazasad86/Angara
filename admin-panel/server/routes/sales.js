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

// Delete all sales records
router.delete('/', async (req, res) => {
    try {
        const result = await Sale.deleteMany({});
        res.json({ message: 'All sales records deleted successfully', deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a single sale record
router.delete('/:id', async (req, res) => {
    try {
        const sale = await Sale.findByIdAndDelete(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale record not found' });
        }
        res.json({ message: 'Sale record deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Move today's sales records to yesterday (30 Jun)
router.post('/move-today-to-yesterday', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    // Decrement createdAt by 1 day (24 hours in ms)
    const result = await Sale.updateMany({ createdAt: { $gte: start, $lt: end } }, { $inc: { createdAt: -86400000 } });
    res.json({ message: "Moved today's sales records to yesterday", modifiedCount: result.nModified || result.modifiedCount });
  } catch (err) {
    console.error('POST /api/sales/move-today-to-yesterday error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

