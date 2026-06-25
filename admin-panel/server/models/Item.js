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
    price: {
        type: Number,
        default: 0  // 0 means item has variants
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Item', ItemSchema);
