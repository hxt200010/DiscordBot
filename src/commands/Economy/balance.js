const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    options: [
        {
            name: 'user',
            description: 'The user to check the balance of',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const balance = economy.getBalance(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor(0xFFD700) // Gold
            .setTitle(`${targetUser.username}'s Balance`)
            .setDescription(`**$${balance.toLocaleString()}**`)
            .setTimestamp();

        interaction.editReply({ embeds: [embed] });
    },
};
