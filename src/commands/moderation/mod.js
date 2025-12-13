const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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

async function checkPermissions(interaction, targetUser, action) {
    if (!targetUser) {
        await interaction.editReply("That user doesn't exist in this server.");
        return false;
    }
    if (targetUser.id === interaction.guild.ownerId) {
        await interaction.editReply(`You can't ${action} the server owner.`);
        return false;
    }
    const targetRolePos = targetUser.roles.highest.position;
    const requestRolePos = interaction.member.roles.highest.position;
    const botRolePos = interaction.guild.members.me.roles.highest.position;
    if (targetRolePos >= requestRolePos) {
        await interaction.editReply(`You can't ${action} that user because they have the same/higher role than you.`);
        return false;
    }
    if (targetRolePos >= botRolePos) {
        await interaction.editReply(`I can't ${action} that user because they have the same/higher role than me.`);
        return false;
    }
    return true;
}

// Check if bot has the required permission in the server
async function checkBotPermission(interaction, permission, permissionName) {
    const botMember = interaction.guild.members.me;
    if (!botMember.permissions.has(permission)) {
        await interaction.editReply(`❌ I don't have the **${permissionName}** permission in this server. Please grant me this permission to use this command.`);
        return false;
    }
    return true;
}

module.exports = {
    name: 'mod',
    description: 'Moderation commands',
    permissionsRequired: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageMessages],
    options: [
        {
            name: 'ban',
            description: 'Ban a user from the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to ban', type: ApplicationCommandOptionType.User, required: true },
                { name: 'reason', description: 'Reason for ban', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'unban',
            description: 'Unban a user from the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user-id', description: 'User ID to unban', type: ApplicationCommandOptionType.String, required: true },
                { name: 'reason', description: 'Reason for unban', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'kick',
            description: 'Kick a user from the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to kick', type: ApplicationCommandOptionType.User, required: true },
                { name: 'reason', description: 'Reason for kick', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'timeout',
            description: 'Timeout a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to timeout', type: ApplicationCommandOptionType.User, required: true },
                { name: 'duration', description: 'Duration (e.g., 60s, 5m, 1h, 1d)', type: ApplicationCommandOptionType.String, required: true },
                { name: 'reason', description: 'Reason for timeout', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'untimeout',
            description: 'Remove timeout from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to untimeout', type: ApplicationCommandOptionType.User, required: true },
                { name: 'reason', description: 'Reason for untimeout', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'purge',
            description: 'Delete multiple messages',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'amount', description: 'Number of messages (1-100)', type: ApplicationCommandOptionType.Integer, required: true, minValue: 1, maxValue: 100 }
            ]
        }
    ],
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: subcommand === 'purge' });

        try {
            switch (subcommand) {
                case 'ban': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.BanMembers, 'Ban Members')) return;
                    
                    const user = interaction.options.getUser('user');
                    const reason = interaction.options.getString('reason') || 'No reason provided';
                    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                    
                    if (!await checkPermissions(interaction, member, 'ban')) return;
                    
                    await member.ban({ reason });
                    await interaction.editReply(`🔨 **Banned** ${user.tag}\n**Reason:** ${reason}`);
                    break;
                }
                case 'unban': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.BanMembers, 'Ban Members')) return;
                    
                    const userId = interaction.options.getString('user-id');
                    const reason = interaction.options.getString('reason') || 'No reason provided';
                    
                    await interaction.guild.members.unban(userId, reason);
                    await interaction.editReply(`✅ **Unbanned** user ID: ${userId}\n**Reason:** ${reason}`);
                    break;
                }
                case 'kick': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.KickMembers, 'Kick Members')) return;
                    
                    const user = interaction.options.getUser('user');
                    const reason = interaction.options.getString('reason') || 'No reason provided';
                    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                    
                    if (!await checkPermissions(interaction, member, 'kick')) return;
                    
                    await member.kick(reason);
                    await interaction.editReply(`👢 **Kicked** ${user.tag}\n**Reason:** ${reason}`);
                    break;
                }
                case 'timeout': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.ModerateMembers, 'Moderate Members')) return;
                    
                    const user = interaction.options.getUser('user');
                    const durationStr = interaction.options.getString('duration');
                    const reason = interaction.options.getString('reason') || 'No reason provided';
                    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                    
                    if (!await checkPermissions(interaction, member, 'timeout')) return;
                    
                    const ms = parseDuration(durationStr);
                    if (!ms) {
                        await interaction.editReply("❌ Invalid duration. Use s/m/h/d (e.g., 10m, 1h)");
                        return;
                    }
                    if (ms > 28 * 24 * 60 * 60 * 1000) {
                        await interaction.editReply("❌ Duration cannot exceed 28 days");
                        return;
                    }
                    
                    await member.timeout(ms, reason);
                    await interaction.editReply(`⏱️ **Timed out** ${user.tag} for ${durationStr}\n**Reason:** ${reason}`);
                    break;
                }
                case 'untimeout': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.ModerateMembers, 'Moderate Members')) return;
                    
                    const user = interaction.options.getUser('user');
                    const reason = interaction.options.getString('reason') || 'No reason provided';
                    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                    
                    if (!await checkPermissions(interaction, member, 'untimeout')) return;
                    
                    await member.timeout(null, reason);
                    await interaction.editReply(`✅ **Timeout removed** for ${user.tag}\n**Reason:** ${reason}`);
                    break;
                }
                case 'purge': {
                    if (!await checkBotPermission(interaction, PermissionFlagsBits.ManageMessages, 'Manage Messages')) return;
                    
                    const amount = interaction.options.getInteger('amount');
                    const deleted = await interaction.channel.bulkDelete(amount, true);
                    await interaction.editReply(`🗑️ Deleted **${deleted.size}** messages`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in /mod ${subcommand}:`, error);
            await interaction.editReply(`❌ Failed to ${subcommand}. Error: ${error.message}`);
        }
    }
};
