const express = require('express');
const router = express.Router();
const Deal = require('../models/Deal');

// Get all deals
router.get('/', async (req, res) => {
    try {
        const deals = await Deal.find().populate('items.item');
        res.json(deals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a deal
router.post('/', async (req, res) => {
    const deal = new Deal({
        name: req.body.name,
        items: req.body.items,
        price: req.body.price,
        image: req.body.image
    });

    try {
        const newDeal = await deal.save();
        const populatedDeal = await Deal.findById(newDeal._id).populate('items.item');
        res.status(201).json(populatedDeal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a deal
router.put('/:id', async (req, res) => {
    try {
        const updatedDeal = await Deal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('items.item');
        res.json(updatedDeal);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a deal
router.delete('/:id', async (req, res) => {
    try {
        await Deal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deal deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
