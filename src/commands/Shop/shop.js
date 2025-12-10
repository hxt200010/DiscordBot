const { Client, Interaction, EmbedBuilder } = require('discord.js');
const shopItems = require('../../utils/ShopItems');

module.exports = {
    name: 'shop',
    description: 'View available items in the shop',
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('🛒 The General Store')
            .setDescription('Use `/buy <item>` to purchase.')
            .setColor('#FFA500');

        shopItems.forEach(item => {
            const usageText = item.usage ? `\n${item.usage}` : '';
            embed.addFields({
                name: `${item.name} — $${item.price.toLocaleString()}`,
                value: `${item.description}${usageText}`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
