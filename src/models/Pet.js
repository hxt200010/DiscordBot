const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    petName: { type: String, required: true },
    type: { type: String, required: true },
    stats: {
        health: { type: Number, default: 100 },
        hunger: { type: Number, default: 100 },
        energy: { type: Number, default: 50 },
        happiness: { type: Number, default: 50 },
        affection: { type: Number, default: 50 },
        cleanliness: { type: Number, default: 50 },
        attack: { type: Number, default: 10 },
        defense: { type: Number, default: 10 }
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    isWorking: { type: Boolean, default: false },
    lastWorkUpdate: { type: Number, default: null },
    currentWorkCoins: { type: Number, default: 0 },
    isDead: { type: Boolean, default: false },
    maxHp: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', petSchema);
