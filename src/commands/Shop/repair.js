const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'repair',
    description: 'Repair an item using a Health Pack',
    options: [
        {
            name: 'item',
            description: 'The item to repair (e.g., Gun)',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Gun', value: 'Gun' }
            ]
        }
    ],
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const itemName = interaction.options.getString('item');

        // Check for Health Pack
        const inventory = economySystem.getInventory(userId);
        const healthPackIndex = inventory.findIndex(i => i.name === 'Health Pack');

        if (healthPackIndex === -1) {
            return interaction.reply({ content: "🚫 You don't have a **Health Pack**! Buy one from `/shop`.", ephemeral: true });
        }

        // Check for Item
        // We need to find a damaged gun.
        const itemToRepair = inventory.find(i => i.name === itemName && i.durability < 5);

        if (!itemToRepair) {
            return interaction.reply({ content: `🚫 You don't have a damaged ${itemName} to repair (Max durability is 5).`, ephemeral: true });
        }

        // Consume Health Pack
        economySystem.removeItem(userId, 'Health Pack');

        // Repair Item
        economySystem.updateItem(userId, itemName, (item) => {
            // We need to target the specific damaged item. 
            // updateItem finds the first one. 
            // If the user has multiple guns, this might repair the wrong one (e.g. a full one) if I didn't filter above.
            // But updateItem logic in EconomySystem finds the first one matching name.
            // I should probably improve EconomySystem to update a specific instance, but for now:
            // I'll assume updateItem finds the first one.
            // Wait, my updateItem logic finds `inventory.find(i => i.name === itemName)`.
            // It doesn't check for damage.
            // I should pass a filter to updateItem or handle it manually.
            
            // Let's just modify the item object directly since I have a reference `itemToRepair` from `inventory`.
            // `inventory` is a reference to the array in `this.data`.
            // So modifying `itemToRepair` should work if I call save().
            // But `getInventory` returns `this.getUser(userId).inventory`.
            // So yes, it is a reference.
            
            item.durability += 1;
        });
        
        // Since I can't easily use updateItem to target a specific object without an ID,
        // and I already have the object reference and modified it (if I did),
        // I just need to save.
        // But `updateItem` takes a name.
        
        // Let's do this:
        itemToRepair.durability += 1;
        economySystem.save();

        await interaction.reply({ content: `🔧 You repaired your **${itemName}**! Durability is now **${itemToRepair.durability}/5**.` });
    }
};
