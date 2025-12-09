const { EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const { getAllAchievements } = require('../../utils/achievements');

module.exports = {
    name: 'achievements',
    description: 'View your achievements and progress',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;

        // Get or create user
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        const allAchievements = getAllAchievements();
        const unlockedIds = user.achievements || [];
        const userStats = user.stats || {};

        // Separate unlocked and locked
        const unlocked = allAchievements.filter(a => unlockedIds.includes(a.id));
        const locked = allAchievements.filter(a => !unlockedIds.includes(a.id));

        // Calculate progress for locked achievements
        const getProgress = (achievement) => {
            const req = achievement.requirement;
            let current = 0;

            switch (req.type) {
                case 'battles_won':
                    current = userStats.battlesWon || 0;
                    break;
                case 'pets_adopted':
                    current = userStats.petsAdopted || 0;
                    break;
                case 'coins_earned':
                    current = userStats.coinsEarned || 0;
                    break;
                case 'skills_learned':
                    current = userStats.skillsLearned || 0;
                    break;
                case 'boxes_opened':
                    current = userStats.boxesOpened || 0;
                    break;
                case 'accessories_equipped':
                    current = userStats.accessoriesEquipped || 0;
                    break;
                case 'jackpots_hit':
                    current = userStats.jackpotsHit || 0;
                    break;
                case 'wheel_streak':
                    current = userStats.wheelStreak || 0;
                    break;
                case 'balance':
                    current = user.balance || 0;
                    break;
                default:
                    current = 0;
            }

            return { current, target: req.count, percentage: Math.min(100, Math.floor((current / req.count) * 100)) };
        };

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`Achievements - ${interaction.user.username}`)
            .setColor('Gold')
            .setDescription(`**${unlocked.length}/${allAchievements.length}** Achievements Unlocked`);

        // Show unlocked achievements
        if (unlocked.length > 0) {
            const unlockedText = unlocked.slice(0, 10).map(a =>
                `**${a.name}** - ${a.description}`
            ).join('\n');
            embed.addFields({ name: 'Unlocked', value: unlockedText, inline: false });
        }

        // Show progress on locked achievements (only top 5 closest to completion)
        if (locked.length > 0) {
            const withProgress = locked.map(a => ({
                ...a,
                progress: getProgress(a)
            })).sort((a, b) => b.progress.percentage - a.progress.percentage);

            const progressText = withProgress.slice(0, 5).map(a => {
                const bar = createProgressBar(a.progress.percentage);
                return `**${a.name}** (${a.progress.current}/${a.progress.target})\n${bar} ${a.progress.percentage}%`;
            }).join('\n\n');

            embed.addFields({ name: 'In Progress', value: progressText || 'None', inline: false });
        }

        // Add stats summary
        embed.addFields({
            name: 'Your Stats',
            value:
                `Battles Won: ${userStats.battlesWon || 0}\n` +
                `Pets Adopted: ${userStats.petsAdopted || 0}\n` +
                `Coins Earned: ${(userStats.coinsEarned || 0).toLocaleString()}\n` +
                `Boxes Opened: ${userStats.boxesOpened || 0}`,
            inline: false
        });

        await interaction.editReply({ embeds: [embed] });
    }
};

function createProgressBar(percentage) {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
}
