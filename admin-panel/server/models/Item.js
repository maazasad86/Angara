const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategory: {
        type: String
    },
    priceType: {
        type: String,
        enum: ['single', 'variants'],
        default: 'single'
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    variants: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true }
        }
    ],
    spiceLevel: {
        type: Boolean,
        default: false
    },
    addons: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true }
        }
    ],
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Item', ItemSchema);
