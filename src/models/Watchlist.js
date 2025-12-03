const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    symbols: [{
        type: String,
        uppercase: true,
    }],
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
