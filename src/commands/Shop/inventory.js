const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'inventory',
    description: 'View your items',
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const inventory = await economySystem.getInventory(userId);

        if (inventory.length === 0) {
            return interaction.reply({ content: "🎒 Your inventory is empty! Go buy something with `/shop`.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎒 Your Inventory')
            .setColor('#3498db');

        // Group items by name or list individually?
        // Since guns have durability, listing individually might be better if they have different states.
        // But for cleaner UI, maybe group?
        // "Inventory shows... durability, quantities".
        // Let's list them. If too many, we might hit embed limits, but for now it's fine.

        const counts = {};
        inventory.forEach(item => {
            if (!counts[item.name]) counts[item.name] = [];
            counts[item.name].push(item);
        });

        for (const [name, items] of Object.entries(counts)) {
            const count = items.length;
            let details = '';

            if (items[0].durability !== undefined) {
                // Show durability for each instance or average?
                // "Gun (x2) - Durability: 5/5, 2/5"
                const durabilities = items.map(i => `${i.durability}`).join(', ');
                details = `\nDurability: ${durabilities}`;
            }

            embed.addFields({
                name: `${name} (x${count})`,
                value: `${items[0].description}${details}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
