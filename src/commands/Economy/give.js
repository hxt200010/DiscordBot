const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'give',
    description: 'Give money to another user',
    options: [
        {
            name: 'target',
            description: 'The user to give money to',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'amount',
            description: 'The amount to give',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
        },
    ],
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const giverId = interaction.user.id;
        const targetId = targetUser.id;

        if (giverId === targetId) {
            return interaction.reply({ content: "🚫 You can't give money to yourself!", ephemeral: true });
        }

        const giverBalance = await economySystem.getBalance(giverId);

        if (giverBalance < amount) {
            return interaction.reply({ content: `🚫 You don't have enough money! You have **$${giverBalance}**.`, ephemeral: true });
        }

        if (!await economySystem.canGive(giverId, amount)) {
            return interaction.reply({ content: "🚫 You have reached your daily donation limit of **$500**.", ephemeral: true });
        }

        // Perform transfer
        await economySystem.removeBalance(giverId, amount);
        await economySystem.addBalance(targetId, amount);
        await economySystem.recordGive(giverId, amount);

        const embed = new EmbedBuilder()
            .setTitle('💸 Money Transfer')
            .setColor('#00FF00')
            .setDescription(`You gave **$${amount}** to <@${targetId}>!`)
            .addFields(
                { name: 'Your Balance', value: `$${await economySystem.getBalance(giverId)}`, inline: true },
                { name: 'Their Balance', value: `$${await economySystem.getBalance(targetId)}`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
