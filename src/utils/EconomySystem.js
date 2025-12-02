const db = require('./Database');

class EconomySystem {
    getUser(userId) {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        let user = stmt.get(userId);

        if (!user) {
            const insert = db.prepare('INSERT INTO users (id) VALUES (?)');
            insert.run(userId);
            user = stmt.get(userId);
        }

        // Normalize to match old structure for compatibility
        return {
            id: user.id,
            balance: user.balance,
            dailyGive: {
                amount: user.daily_amount,
                date: user.last_daily
            },
            isShielded: !!user.is_shielded
        };
    }

    setShield(userId, status) {
        const stmt = db.prepare('UPDATE users SET is_shielded = ? WHERE id = ?');
        stmt.run(status ? 1 : 0, userId);
    }

    getShield(userId) {
        const user = this.getUser(userId);
        return user.isShielded;
    }

    getBalance(userId) {
        const user = this.getUser(userId);
        return user.balance;
    }

    addBalance(userId, amount) {
        // Ensure user exists
        this.getUser(userId);
        const stmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
        stmt.run(amount, userId);
        return this.getBalance(userId);
    }

    removeBalance(userId, amount) {
        const user = this.getUser(userId);
        if (user.balance < amount) return false;

        const stmt = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
        stmt.run(amount, userId);
        return true;
    }

    // Inventory Methods
    getInventory(userId) {
        const stmt = db.prepare('SELECT * FROM inventory WHERE user_id = ?');
        const items = stmt.all(userId);

        return items.map(item => {
            const data = JSON.parse(item.item_data);
            return {
                ...data,
                db_id: item.id // Keep track of DB ID for specific item removal if needed
            };
        });
    }

    addItem(userId, item) {
        this.getUser(userId); // Ensure user exists
        const stmt = db.prepare('INSERT INTO inventory (user_id, item_name, item_data) VALUES (?, ?, ?)');
        stmt.run(userId, item.name, JSON.stringify(item));
    }

    removeItem(userId, itemName) {
        // Remove one instance of the item
        // We need to find one ID to delete
        const stmt = db.prepare('SELECT id FROM inventory WHERE user_id = ? AND item_name = ? LIMIT 1');
        const item = stmt.get(userId, itemName); // Note: case sensitivity depends on DB collation, usually case-sensitive by default in SQLite unless configured otherwise.
        // However, the original code used toLowerCase(). We might need to handle that.
        // For now, let's try exact match or use LIKE if needed.
        // Original: i.name.toLowerCase() === itemName.toLowerCase()

        // Let's use a more robust query for case-insensitive match if needed, but for now let's try to stick to exact or handle it in JS if we want to be safe.
        // Actually, let's do it in SQL:
        const findStmt = db.prepare('SELECT id FROM inventory WHERE user_id = ? AND lower(item_name) = lower(?) LIMIT 1');
        const target = findStmt.get(userId, itemName);

        if (target) {
            const delStmt = db.prepare('DELETE FROM inventory WHERE id = ?');
            delStmt.run(target.id);
            return true;
        }
        return false;
    }

    updateItem(userId, itemName, updateFn) {
        const items = this.getInventory(userId);
        const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (item) {
            updateFn(item);

            // If durability is 0, remove it
            if (item.durability !== undefined && item.durability <= 0) {
                // We need to remove this specific item. 
                // Since we have db_id from getInventory, we can use it.
                const delStmt = db.prepare('DELETE FROM inventory WHERE id = ?');
                delStmt.run(item.db_id);
                return 'broken';
            }

            // Update the item in DB
            const { db_id, ...dataToSave } = item;
            const updateStmt = db.prepare('UPDATE inventory SET item_data = ? WHERE id = ?');
            updateStmt.run(JSON.stringify(dataToSave), db_id);
            return true;
        }
        return false;
    }

    // Daily Give Limits
    canGive(userId, amount) {
        const user = this.getUser(userId);
        const today = new Date().toDateString();

        if (user.dailyGive.date !== today) {
            // It's a new day, so yes they can give (reset happens on recordGive or lazily here?)
            // We should probably reset it here conceptually, but we only write on recordGive usually.
            // But to be safe, if dates don't match, amount is effectively 0.
            return amount <= 500;
        }

        return (user.dailyGive.amount + amount) <= 500;
    }

    recordGive(userId, amount) {
        const user = this.getUser(userId);
        const today = new Date().toDateString();

        let newAmount = amount;
        if (user.dailyGive.date === today) {
            newAmount += user.dailyGive.amount;
        }

        const stmt = db.prepare('UPDATE users SET last_daily = ?, daily_amount = ? WHERE id = ?');
        stmt.run(today, newAmount, userId);
    }
}

module.exports = new EconomySystem();
