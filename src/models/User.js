const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    lastDaily: { type: String, default: null },
    lastDailyReward: { type: String, default: null },
    dailyAmount: { type: Number, default: 0 },
    isShielded: { type: Boolean, default: false },
    lastWheelSpin: { type: Date, default: null },
    // Achievement tracking
    achievements: [{ type: String }],  // Unlocked achievement IDs
    stats: {
        battlesWon: { type: Number, default: 0 },
        petsAdopted: { type: Number, default: 0 },
        coinsEarned: { type: Number, default: 0 },
        skillsLearned: { type: Number, default: 0 },
        boxesOpened: { type: Number, default: 0 },
        accessoriesEquipped: { type: Number, default: 0 },
        jackpotsHit: { type: Number, default: 0 },
        wheelStreak: { type: Number, default: 0 },
        lastWheelDate: { type: String, default: null }
    },
    // Bounty tracking
    bountyDate: { type: String, default: null },
    bountyProgress: { type: Object, default: {} },
    bountiesClaimed: [{ type: String }],
    // Chaos Emeralds
    chaosEmeralds: { type: Number, default: 0 },
    hasSuperForm: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
