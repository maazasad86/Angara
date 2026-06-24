const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { upload, uploadToCloudinary } = require('../middleware/cloudinary');

// Get all items (populated with category)
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().populate('category').sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('FETCH ITEMS ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add an item
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, variants } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Upload to cloudinary from memory
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        const imageUrl = result.secure_url;

        // Parse variants if sent as JSON string
        let parsedVariants = [];
        if (variants) {
            try { parsedVariants = JSON.parse(variants); } catch(e) {}
        }

        const newItem = new Item({ 
            name, category, 
            price: parsedVariants.length > 0 ? 0 : Number(price), 
            image: imageUrl,
            variants: parsedVariants
        });
        await newItem.save();

        const populatedItem = await Item.findById(newItem._id).populate('category');
        res.json(populatedItem);
    } catch (err) {
        console.error('ADD ITEM ERROR:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update an item
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
            updateData.image = result.secure_url;
        }

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('category');
        res.json(updatedItem);
    } catch (err) {
        console.error('UPDATE ITEM ERROR:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete an item
router.delete('/:id', async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
