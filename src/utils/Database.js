const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        last_daily TEXT,
        daily_amount INTEGER DEFAULT 0,
        is_shielded INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        item_name TEXT,
        item_data TEXT, -- JSON string for extra data like durability
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY, -- Using UUID or generated ID
        user_id TEXT,
        pet_name TEXT,
        type TEXT,
        stats TEXT, -- JSON string for health, hunger, etc.
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

module.exports = db;
