const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
    },
    targetPrice: {
        type: Number,
        required: true,
    },
    condition: {
        type: String,
        enum: ['above', 'below'],
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('StockAlert', stockAlertSchema);
