const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    deleted: true, // Consolidated into /mod command
    name: 'purge',
    description: 'Deletes a specified number of messages.',
    options: [
        {
            name: 'amount',
            description: 'The number of messages to delete (1-100).',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 100,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const amount = interaction.options.get('amount').value;

        await interaction.deferReply({ ephemeral: true });

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.editReply(`Successfully deleted ${deleted.size} messages.`);
        } catch (error) {
            console.log(`There was an error when purging: ${error}`);
            await interaction.editReply(`Failed to delete messages. Error: ${error.message}`);
        }
    },
};
