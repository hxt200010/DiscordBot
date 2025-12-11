const { EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
    name: 'monster-stats',
    description: 'View your monster hunting statistics and leaderboard position!',

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;

        // Get user stats
        const user = await User.findOne({ userId });
        const stats = user?.monsterStats || { totalKills: 0, totalDamage: 0, highestDamage: 0 };

        // Get top 10 hunters by total kills
        const topHunters = await User.find({
            'monsterStats.totalKills': { $gt: 0 }
        })
            .sort({ 'monsterStats.totalKills': -1 })
            .limit(10)
            .select('userId monsterStats');

        // Find user's rank
        const allHunters = await User.find({
            'monsterStats.totalKills': { $gt: 0 }
        })
            .sort({ 'monsterStats.totalKills': -1 })
            .select('userId');
        
        const userRank = allHunters.findIndex(h => h.userId === userId) + 1;

        // Build leaderboard
        let leaderboard = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < topHunters.length; i++) {
            const hunter = topHunters[i];
            const medal = medals[i] || `${i + 1}.`;
            const isUser = hunter.userId === userId;
            leaderboard += `${medal} <@${hunter.userId}>: **${hunter.monsterStats.totalKills}** kills ${isUser ? '← You!' : ''}\n`;
        }

        if (!leaderboard) {
            leaderboard = '*No hunters yet! Be the first with `/monster-hunt`*';
        }

        // Calculate hunter rank title
        const title = getHunterTitle(stats.totalKills);

        const embed = new EmbedBuilder()
            .setTitle('🐉 Monster Hunt Statistics')
            .setColor(0xFF6600)
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                {
                    name: '📊 Your Stats',
                    value: 
                        `🐉 **Monsters Slain:** ${stats.totalKills}\n` +
                        `⚔️ **Total Damage:** ${stats.totalDamage.toLocaleString()}\n` +
                        `💥 **Best Hit:** ${stats.highestDamage.toLocaleString()}\n` +
                        `🏆 **Rank:** ${userRank > 0 ? `#${userRank}` : 'Unranked'}\n` +
                        `📛 **Title:** ${title}`,
                    inline: true
                },
                {
                    name: '🏆 Top Hunters',
                    value: leaderboard,
                    inline: false
                }
            )
            .setFooter({ text: 'Use /monster-hunt to start hunting!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

/**
 * Get hunter title based on kill count
 */
function getHunterTitle(kills) {
    if (kills >= 100) return '🌟 Legendary Hunter';
    if (kills >= 50) return '👑 Master Hunter';
    if (kills >= 25) return '⚔️ Elite Hunter';
    if (kills >= 10) return '🗡️ Seasoned Hunter';
    if (kills >= 5) return '🔪 Apprentice Hunter';
    if (kills >= 1) return '🐣 Novice Hunter';
    return '❓ No Title Yet';
}
