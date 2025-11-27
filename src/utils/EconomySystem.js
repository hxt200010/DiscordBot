const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'economy.json');

class EconomySystem {
    constructor() {
        this.data = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(dataPath)) {
                this.data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            } else {
                // Ensure directory exists
                const dir = path.dirname(dataPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                this.save();
            }
        } catch (error) {
            console.error('Error loading economy data:', error);
            this.data = {};
        }
    }

    save() {
        try {
            fs.writeFileSync(dataPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving economy data:', error);
        }
    }

    getBalance(userId) {
        return this.data[userId] || 0;
    }

    addBalance(userId, amount) {
        if (!this.data[userId]) this.data[userId] = 0;
        this.data[userId] += amount;
        this.save();
        return this.data[userId];
    }

    removeBalance(userId, amount) {
        if (!this.data[userId]) this.data[userId] = 0;
        if (this.data[userId] < amount) return false;
        this.data[userId] -= amount;
        this.save();
        return true;
    }
}

module.exports = new EconomySystem();
