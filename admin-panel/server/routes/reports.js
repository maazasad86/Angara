const express = require('express');
const router = express.Router();
const ShiftReport = require('../models/ShiftReport');
const Sale = require('../models/Sale');

// Get current shift info (sales since last shift close)
router.get('/current-shift', async (req, res) => {
    try {
        // Find the most recent shift report to know when the current shift started
        const lastReport = await ShiftReport.findOne().sort({ closedAt: -1 });
        
        let query = {};
        let shiftStartedAt = null;
        
        if (lastReport) {
            shiftStartedAt = lastReport.closedAt;
            query = { createdAt: { $gt: lastReport.closedAt } };
        } else {
            // If no previous shift report exists, find the first sale ever made
            const firstSale = await Sale.findOne().sort({ createdAt: 1 });
            shiftStartedAt = firstSale ? firstSale.createdAt : new Date();
        }

        const shiftSales = await Sale.find(query);
        const totalOrders = shiftSales.length;
        const systemCash = shiftSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        res.json({
            openedAt: shiftStartedAt,
            systemCash,
            totalOrders,
            salesData: shiftSales
        });
    } catch (err) {
        console.error('Error fetching current shift:', err);
        res.status(500).json({ message: err.message });
    }
});

// Close shift and create Z-Report
router.post('/close-shift', async (req, res) => {
    try {
        const { drawerCash, notes } = req.body;

        if (drawerCash === undefined) {
            return res.status(400).json({ message: 'Drawer cash amount is required' });
        }

        // Re-calculate to ensure accuracy
        const lastReport = await ShiftReport.findOne().sort({ closedAt: -1 });
        let query = {};
        let shiftStartedAt = new Date();
        
        if (lastReport) {
            shiftStartedAt = lastReport.closedAt;
            query = { createdAt: { $gt: lastReport.closedAt } };
        } else {
            const firstSale = await Sale.findOne().sort({ createdAt: 1 });
            shiftStartedAt = firstSale ? firstSale.createdAt : new Date();
        }

        const shiftSales = await Sale.find(query);
        const systemCash = shiftSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalOrders = shiftSales.length;
        const difference = Number(drawerCash) - systemCash;

        const newReport = new ShiftReport({
            openedAt: shiftStartedAt,
            closedAt: new Date(),
            systemCash,
            drawerCash: Number(drawerCash),
            difference,
            totalOrders,
            notes: notes || ''
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error('Error closing shift:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
