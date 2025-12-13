const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    deleted: true, // Consolidated into /mod command
    name: 'unban',
    description: 'Unbans a user from this server.',
    options: [
        {
            name: 'target-user-id',
            description: 'The ID of the user you want to unban.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for unbanning.',
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const targetUserId = interaction.options.get('target-user-id').value;
        const reason = interaction.options.get('reason')?.value || 'No reason provided';

        await interaction.deferReply();

        try {
            await interaction.guild.members.unban(targetUserId, reason);
            await interaction.editReply(`User with ID ${targetUserId} was unbanned\nReason: ${reason}`);
        } catch (error) {
            console.log(`There was an error when unbanning: ${error}`);
            await interaction.editReply(`Failed to unban the user. Ensure the ID is correct and they are actually banned. Error: ${error.message}`);
        }
    },
};
