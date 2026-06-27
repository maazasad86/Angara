const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

// Get "Today's Business" Summary
router.get('/today', async (req, res) => {
    try {
        // Start of today (midnight)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch today's sales
        const todaySales = await Sale.find({ createdAt: { $gte: startOfDay } });
        const totalSales = todaySales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);

        // Fetch today's expenses
        const todayExpenses = await Expense.find({ createdAt: { $gte: startOfDay } });
        const totalExpenses = todayExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

        const netCash = totalSales - totalExpenses;

        res.json({
            totalSales,
            totalExpenses,
            netCash
        });
    } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
