const mongoose = require('mongoose');

const ShiftReportSchema = new mongoose.Schema({
    openedAt: {
        type: Date,
        required: true
    },
    closedAt: {
        type: Date,
        default: Date.now
    },
    systemCash: {
        type: Number,
        required: true
    },
    drawerCash: {
        type: Number,
        required: true
    },
    difference: {
        type: Number,
        required: true
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('ShiftReport', ShiftReportSchema);
