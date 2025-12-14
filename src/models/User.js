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
    hasSuperForm: { type: Boolean, default: false },
    // Speed Shoes boost tracking (applies to ALL pets)
    speedShoesBoost: {
        active: { type: Boolean, default: false },
        expiresAt: { type: Number, default: null }
    },
    // Monster Hunt stats
    monsterStats: {
        totalKills: { type: Number, default: 0 },
        totalDamage: { type: Number, default: 0 },
        highestDamage: { type: Number, default: 0 }
    },
    // Tower Defense streak tracking
    towerStreak: { type: Number, default: 0 },
    lastTowerGame: { type: Number, default: null },
    // Pet chat conversation memory (last 5 messages per pet)
    petChatHistory: { type: Map, of: Array, default: new Map() }
});

module.exports = mongoose.model('User', userSchema);
