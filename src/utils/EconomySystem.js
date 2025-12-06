const User = require('../models/User');
const Inventory = require('../models/Inventory');

class EconomySystem {
    async getUser(userId) {
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        return {
            id: user.userId,
            balance: user.balance,
            dailyGive: {
                amount: user.dailyAmount,
                date: user.lastDaily
            },
            lastDailyReward: user.lastDailyReward,
            isShielded: user.isShielded
        };
    }

    async setShield(userId, status) {
        await User.findOneAndUpdate({ userId }, { isShielded: status });
    }

    async getShield(userId) {
        const user = await this.getUser(userId);
        return user.isShielded;
    }

    async getBalance(userId) {
        const user = await this.getUser(userId);
        return user.balance;
    }

    async addBalance(userId, amount) {
        const user = await User.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        return user.balance;
    }

    async removeBalance(userId, amount) {
        const user = await this.getUser(userId);
        if (user.balance < amount) return false;

        await User.findOneAndUpdate(
            { userId },
            { $inc: { balance: -amount } }
        );
        return true;
    }

    // Inventory Methods
    async getInventory(userId) {
        const items = await Inventory.find({ userId });
        return items.map(item => ({
            name: item.itemName,
            ...item.itemData,
            db_id: item._id.toString() // Use Mongoose ID
        }));
    }

    async addItem(userId, item) {
        // Ensure user exists (optional, but good practice)
        await this.getUser(userId);

        const { name, ...data } = item;
        await Inventory.create({
            userId,
            itemName: name || item.name, // Handle both cases if item structure varies
            itemData: data
        });
    }

    async removeItem(userId, itemName) {
        // Case-insensitive search for deletion
        const item = await Inventory.findOne({
            userId,
            itemName: { $regex: new RegExp(`^${itemName}$`, 'i') }
        });

        if (item) {
            await Inventory.findByIdAndDelete(item._id);
            return true;
        }
        return false;
    }

    async updateItem(userId, itemName, updateFn) {
        const items = await this.getInventory(userId);
        const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (item) {
            // Create a copy to modify
            const itemCopy = { ...item };
            updateFn(itemCopy);

            // If durability is 0, remove it
            if (itemCopy.durability !== undefined && itemCopy.durability <= 0) {
                await Inventory.findByIdAndDelete(item.db_id);
                return 'broken';
            }

            // Update the item in DB
            // We need to separate the flat structure back into itemName and itemData
            const { db_id, name, ...dataToSave } = itemCopy;

            await Inventory.findByIdAndUpdate(db_id, {
                itemData: dataToSave
            });
            return true;
        }
        return false;
    }

    // Daily Give Limits
    async canGive(userId, amount) {
        const user = await this.getUser(userId);
        const today = new Date().toDateString();

        if (user.dailyGive.date !== today) {
            return amount <= 500;
        }

        return (user.dailyGive.amount + amount) <= 500;
    }

    async recordGive(userId, amount) {
        const user = await this.getUser(userId);
        const today = new Date().toDateString();

        let newAmount = amount;
        if (user.dailyGive.date === today) {
            newAmount += user.dailyGive.amount;
        }

        await User.findOneAndUpdate(
            { userId },
            {
                lastDaily: today,
                dailyAmount: newAmount
            }
        );
    }

    async claimDaily(userId, amount) {
        const user = await this.getUser(userId);
        const today = new Date().toDateString();

        if (user.lastDailyReward === today) {
            return false;
        }

        await User.findOneAndUpdate(
            { userId },
            {
                $inc: { balance: amount },
                lastDailyReward: today
            },
            { upsert: true }
        );
        return true;
    }
}

module.exports = new EconomySystem();
