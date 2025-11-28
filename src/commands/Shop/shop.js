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
            embed.addFields({
                name: `${item.name} — $${item.price}`,
                value: item.description,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
