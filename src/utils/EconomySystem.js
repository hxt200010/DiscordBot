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
                const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                // Migration logic: Convert old number format to object format
                for (const [userId, value] of Object.entries(rawData)) {
                    if (typeof value === 'number') {
                        this.data[userId] = {
                            balance: value,
                            inventory: [],
                            dailyGive: { amount: 0, date: null }
                        };
                    } else {
                        this.data[userId] = value;
                    }
                }
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

    getUser(userId) {
        if (!this.data[userId]) {
            this.data[userId] = {
                balance: 0,
                inventory: [],
                dailyGive: { amount: 0, date: null },
                isShielded: false
            };
        }
        return this.data[userId];
    }

    setShield(userId, status) {
        const user = this.getUser(userId);
        user.isShielded = status;
        this.save();
    }

    getShield(userId) {
        return this.getUser(userId).isShielded || false;
    }

    getBalance(userId) {
        return this.getUser(userId).balance;
    }

    addBalance(userId, amount) {
        const user = this.getUser(userId);
        user.balance += amount;
        this.save();
        return user.balance;
    }

    removeBalance(userId, amount) {
        const user = this.getUser(userId);
        if (user.balance < amount) return false;
        user.balance -= amount;
        this.save();
        return true;
    }

    // Inventory Methods
    getInventory(userId) {
        return this.getUser(userId).inventory || [];
    }

    addItem(userId, item) {
        const user = this.getUser(userId);
        if (!user.inventory) user.inventory = [];
        
        // Check if item already exists (for stackable logic if needed, but for now just push)
        // Or if we want unique items with quantity? The prompt implies durability, so maybe unique instances or grouped?
        // "Gun has durability... Gun breaks". This implies unique instances or tracked durability.
        // Let's store as objects: { name: "Gun", price: 150, durability: 5, ... }
        
        user.inventory.push(item);
        this.save();
    }

    removeItem(userId, itemName) {
        const user = this.getUser(userId);
        if (!user.inventory) return false;
        
        const index = user.inventory.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (index > -1) {
            user.inventory.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    updateItem(userId, itemName, updateFn) {
        const user = this.getUser(userId);
        if (!user.inventory) return false;

        const item = user.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (item) {
            updateFn(item);
            // If durability is 0, remove it
            if (item.durability !== undefined && item.durability <= 0) {
                this.removeItem(userId, itemName);
                return 'broken';
            }
            this.save();
            return true;
        }
        return false;
    }

    // Daily Give Limits
    canGive(userId, amount) {
        const user = this.getUser(userId);
        const today = new Date().toDateString();
        
        if (user.dailyGive?.date !== today) {
            // Reset if new day
            user.dailyGive = { amount: 0, date: today };
        }

        return (user.dailyGive.amount + amount) <= 500;
    }

    recordGive(userId, amount) {
        const user = this.getUser(userId);
        const today = new Date().toDateString();
        
        if (user.dailyGive?.date !== today) {
            user.dailyGive = { amount: 0, date: today };
        }
        
        user.dailyGive.amount += amount;
        this.save();
    }
}

module.exports = new EconomySystem();
