const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

function parseDuration(durationStr) {
    const regex = /^(\d+)([smhd])$/;
    const match = durationStr.match(regex);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = {
    name: 'timeout',
    description: 'Timeouts a member.',
    options: [
        {
            name: 'target-user',
            description: 'The user you want to timeout.',
            type: ApplicationCommandOptionType.Mentionable,
            required: true,
        },
        {
            name: 'duration',
            description: 'Duration (e.g., 60s, 5m, 1h, 1d).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for the timeout.',
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const targetUserId = interaction.options.get('target-user').value;
        const durationStr = interaction.options.get('duration').value;
        const reason = interaction.options.get('reason')?.value || 'No reason provided';

        await interaction.deferReply();

        const targetUser = await interaction.guild.members.fetch(targetUserId).catch(() => null);

        if (!targetUser) {
            await interaction.editReply("That user doesn't exist in this server.");
            return;
        }

        if (targetUser.id === interaction.guild.ownerId) {
            await interaction.editReply("You can't timeout the server owner.");
            return;
        }

        const ms = parseDuration(durationStr);
        if (!ms) {
            await interaction.editReply("Invalid duration format. Use s, m, h, or d (e.g., 10m, 1h).");
            return;
        }
        
        if (ms > 28 * 24 * 60 * 60 * 1000) { // Discord limit is 28 days
             await interaction.editReply("Duration cannot exceed 28 days.");
             return;
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.editReply("You can't timeout that user because they have the same/higher role than you.");
            return;
        }

        if (targetUserRolePosition >= botRolePosition) {
            await interaction.editReply("I can't timeout that user because they have the same/higher role than me.");
            return;
        }

        try {
            await targetUser.timeout(ms, reason);
            await interaction.editReply(`User ${targetUser} was timed out for ${durationStr}\nReason: ${reason}`);
        } catch (error) {
            console.log(`There was an error when timing out: ${error}`);
            await interaction.editReply(`Failed to timeout the user. Error: ${error.message}`);
        }
    },
};
