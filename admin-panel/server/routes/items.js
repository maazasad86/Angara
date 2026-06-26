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
        const { name, category, subCategory, price, variants } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Upload to cloudinary from memory
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        const imageUrl = result.secure_url;

        // Parse variants if sent as JSON string
        let parsedVariants = [];
        if (variants) {
            if (typeof variants === 'string') {
                try { parsedVariants = JSON.parse(variants); } catch(e) {}
            } else if (Array.isArray(variants)) {
                parsedVariants = variants;
            }
        }

        const newItem = new Item({ 
            name, category, subCategory,
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

        if (updateData.variants) {
            if (typeof updateData.variants === 'string') {
                try { 
                    updateData.variants = JSON.parse(updateData.variants); 
                } catch(e) {
                    console.error("JSON PARSE ERROR IN PUT:", e);
                }
            }
        } else {
            updateData.variants = [];
        }

        if (updateData.variants.length > 0) {
            updateData.price = 0;
        } else if (updateData.price) {
            updateData.price = Number(updateData.price);
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
        console.log(`DELETE /api/items/${req.params.id} request received`);
        const deleted = await Item.findByIdAndDelete(req.params.id);
        console.log('Deleted item document:', deleted);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error('DELETE ITEM ROUTE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
