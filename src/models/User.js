const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastDaily: { type: String, default: null },
    lastDailyReward: { type: String, default: null },
    dailyAmount: { type: Number, default: 0 },
    isShielded: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
