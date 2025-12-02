const { EmbedBuilder } = require('discord.js');
const economy = require('../../utils/EconomySystem');

const dailyAmount = 1000;
const cooldowns = new Set();

module.exports = {
    name: 'daily',
    description: 'Collect your daily reward',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        if (cooldowns.has(interaction.user.id)) {
            return interaction.editReply({ content: 'You have already collected your daily reward today. Come back tomorrow!' });
        }

        const newBalance = await economy.addBalance(interaction.user.id, dailyAmount);

        // Simple daily cooldown (reset on bot restart for now, ideally use DB or timestamp)
        cooldowns.add(interaction.user.id);
        setTimeout(() => cooldowns.delete(interaction.user.id), 24 * 60 * 60 * 1000);

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('Daily Reward')
            .setDescription(`You collected **$${dailyAmount}**!`)
            .addFields({ name: 'New Balance', value: `$${newBalance.toLocaleString()}` });

        interaction.editReply({ embeds: [embed] });
    },
};
