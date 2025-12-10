const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');
const shopItems = require('../../utils/ShopItems');

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
            .setColor('#3498db')
            .setDescription('Here are your items and how to use them:');

        const counts = {};
        inventory.forEach(item => {
            if (!counts[item.name]) counts[item.name] = [];
            counts[item.name].push(item);
        });

        for (const [name, items] of Object.entries(counts)) {
            const count = items.length;
            let details = '';

            // Get usage info from ShopItems
            const shopItem = shopItems.find(si => si.name === name);
            const usageText = shopItem?.usage || '';

            if (items[0].durability !== undefined) {
                const durabilities = items.map(i => `${i.durability}`).join(', ');
                details = `\n⚙️ Durability: ${durabilities}`;
            }

            embed.addFields({
                name: `${name} (x${count})`,
                value: `${items[0].description}${details}${usageText ? `\n${usageText}` : ''}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
