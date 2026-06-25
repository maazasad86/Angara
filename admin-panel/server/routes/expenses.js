const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ createdAt: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new expense
router.post('/', async (req, res) => {
    try {
        const { amount, description } = req.body;
        
        if (!amount || !description) {
            return res.status(400).json({ message: 'Amount and description are required' });
        }

        const expense = new Expense({
            amount: Number(amount),
            description
        });

        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
