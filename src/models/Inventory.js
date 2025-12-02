const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemData: { type: Object, default: {} } // Stores durability, etc.
});

module.exports = mongoose.model('Inventory', inventorySchema);
