const fs = require('fs');
const path = require('path');
const db = require('../utils/Database');

const economyPath = path.join(__dirname, '../data/economy.json');
const petsPath = path.join(__dirname, '../data/pets.json');

function migrate() {
    console.log('Starting migration...');

    // Clear existing data to prevent duplicates on re-run
    db.exec('DELETE FROM inventory; DELETE FROM pets; DELETE FROM users;');

    // Migrate Economy
    if (fs.existsSync(economyPath)) {
        console.log('Migrating economy data...');
        const economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

        const insertUser = db.prepare(`
            INSERT OR REPLACE INTO users (id, balance, last_daily, daily_amount, is_shielded)
            VALUES (@id, @balance, @last_daily, @daily_amount, @is_shielded)
        `);

        const insertInventory = db.prepare(`
            INSERT INTO inventory (user_id, item_name, item_data)
            VALUES (@user_id, @item_name, @item_data)
        `);

        db.transaction(() => {
            for (const [userId, data] of Object.entries(economyData)) {
                let balance = 0;
                let dailyGive = { amount: 0, date: null };
                let isShielded = 0;
                let inventory = [];

                if (typeof data === 'number') {
                    balance = data;
                } else {
                    balance = data.balance || 0;
                    dailyGive = data.dailyGive || { amount: 0, date: null };
                    isShielded = data.isShielded ? 1 : 0;
                    inventory = data.inventory || [];
                }

                insertUser.run({
                    id: userId,
                    balance: balance,
                    last_daily: dailyGive.date,
                    daily_amount: dailyGive.amount,
                    is_shielded: isShielded
                });

                for (const item of inventory) {
                    insertInventory.run({
                        user_id: userId,
                        item_name: item.name,
                        item_data: JSON.stringify(item)
                    });
                }
            }
        })();
        console.log('Economy migration complete.');
    }

    // Migrate Pets
    if (fs.existsSync(petsPath)) {
        console.log('Migrating pets data...');
        const petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));

        const insertPet = db.prepare(`
            INSERT OR REPLACE INTO pets (id, user_id, pet_name, type, stats)
            VALUES (@id, @user_id, @pet_name, @type, @stats)
        `);

        const checkUser = db.prepare('SELECT id FROM users WHERE id = ?');
        const createUser = db.prepare('INSERT INTO users (id) VALUES (?)');

        db.transaction(() => {
            for (const [userId, pets] of Object.entries(petsData)) {
                // Ensure user exists
                if (!checkUser.get(userId)) {
                    console.log(`Creating missing user record for ${userId}`);
                    createUser.run(userId);
                }

                const userPets = Array.isArray(pets) ? pets : [pets];

                for (const pet of userPets) {
                    const petId = pet.id || Math.random().toString(36).substr(2, 9);
                    const { id, petName, type, ...stats } = pet;

                    insertPet.run({
                        id: petId,
                        user_id: userId,
                        pet_name: petName || 'Unknown',
                        type: type || 'Unknown',
                        stats: JSON.stringify(stats)
                    });
                }
            }
        })();
        console.log('Pets migration complete.');
    }

    // Rename files
    if (fs.existsSync(economyPath)) fs.renameSync(economyPath, economyPath + '.bak');
    if (fs.existsSync(petsPath)) fs.renameSync(petsPath, petsPath + '.bak');

    console.log('Migration finished successfully.');
}

migrate();
