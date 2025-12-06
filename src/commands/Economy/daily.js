const { EmbedBuilder } = require('discord.js');
const economy = require('../../utils/EconomySystem');

const dailyAmount = 1000;

module.exports = {
    name: 'daily',
    description: 'Collect your daily reward',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const success = await economy.claimDaily(interaction.user.id, dailyAmount);

        if (!success) {
            return interaction.editReply({ content: 'You have already collected your daily reward today. Come back tomorrow!' });
        }

        const newBalance = await economy.getBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('Daily Reward')
            .setDescription(`You collected **$${dailyAmount}**!`)
            .addFields({ name: 'New Balance', value: `$${newBalance.toLocaleString()}` });

        interaction.editReply({ embeds: [embed] });
    },
};
