const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const User = require('../../models/User');
const PetSystem = require('../../utils/PetSystem');
const EconomySystem = require('../../utils/EconomySystem');

// Daily bounties that rotate
const BOUNTIES = [
    {
        id: 'battle_3',
        name: 'Warrior Training',
        description: 'Win 3 pet battles today',
        requirement: { type: 'battles', count: 3 },
        reward: { coins: 1500 }
    },
    {
        id: 'grind_30min',
        name: 'Hard Worker',
        description: 'Grind for at least 30 minutes',
        requirement: { type: 'grind_time', count: 30 },
        reward: { coins: 1000 }
    },
    {
        id: 'spin_wheel',
        name: 'Lucky Day',
        description: 'Use the daily wheel',
        requirement: { type: 'wheel_spin', count: 1 },
        reward: { coins: 500 }
    },
    {
        id: 'feed_pet_5',
        name: 'Pet Caretaker',
        description: 'Feed your pets 5 times',
        requirement: { type: 'feed', count: 5 },
        reward: { coins: 750 }
    },
    {
        id: 'open_box',
        name: 'Mystery Seeker',
        description: 'Open a Mystery Box',
        requirement: { type: 'boxes', count: 1 },
        reward: { coins: 1000 }
    },
    {
        id: 'earn_coins',
        name: 'Money Maker',
        description: 'Earn 500 coins from any source',
        requirement: { type: 'coins_earned', count: 500 },
        reward: { coins: 1000 }
    }
];

// Get daily bounties (3 random ones based on date)
function getDailyBounties() {
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);

    // Shuffle based on date seed
    const shuffled = [...BOUNTIES].sort((a, b) => {
        const hashA = (seed * a.id.charCodeAt(0)) % 100;
        const hashB = (seed * b.id.charCodeAt(0)) % 100;
        return hashA - hashB;
    });

    return shuffled.slice(0, 3);
}

module.exports = {
    name: 'bounty',
    description: 'View daily bounties and claim rewards!',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;

        // Get or create user
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        const today = new Date().toISOString().split('T')[0];
        const dailyBounties = getDailyBounties();

        // Initialize bounty progress if needed
        if (!user.bountyDate || user.bountyDate !== today) {
            user.bountyDate = today;
            user.bountyProgress = {};
            user.bountiesClaimed = [];
            await user.save();
        }

        const progress = user.bountyProgress || {};
        const claimed = user.bountiesClaimed || [];

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle('Daily Bounties')
            .setColor('Gold')
            .setDescription('Complete challenges to earn bonus coins!\nBounties reset daily at midnight.')
            .setTimestamp();

        let hasClaimable = false;

        for (const bounty of dailyBounties) {
            const current = progress[bounty.requirement.type] || 0;
            const target = bounty.requirement.count;
            const isComplete = current >= target;
            const isClaimed = claimed.includes(bounty.id);

            let status;
            if (isClaimed) {
                status = 'CLAIMED';
            } else if (isComplete) {
                status = 'COMPLETE - Click to claim!';
                hasClaimable = true;
            } else {
                status = `${current}/${target}`;
            }

            const emoji = isClaimed ? '✅' : (isComplete ? '🎁' : '⏳');

            embed.addFields({
                name: `${emoji} ${bounty.name}`,
                value: `${bounty.description}\n**Progress:** ${status}\n**Reward:** ${bounty.reward.coins} coins`,
                inline: false
            });
        }

        // Add claim button if there's something to claim
        const components = [];
        if (hasClaimable) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_bounties')
                    .setLabel('Claim All Rewards')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎁')
            );
            components.push(row);
        }

        const response = await interaction.editReply({ embeds: [embed], components });

        if (!hasClaimable) return;

        // Handle claim button
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
            filter: i => i.user.id === userId
        });

        collector.on('collect', async i => {
            await i.deferUpdate();

            let totalReward = 0;
            const newClaimed = [...claimed];

            for (const bounty of dailyBounties) {
                const current = progress[bounty.requirement.type] || 0;
                const isComplete = current >= bounty.requirement.count;
                const isClaimed = claimed.includes(bounty.id);

                if (isComplete && !isClaimed) {
                    totalReward += bounty.reward.coins;
                    newClaimed.push(bounty.id);
                }
            }

            // Award coins
            await EconomySystem.addBalance(userId, totalReward);

            // Update user
            await User.findOneAndUpdate(
                { userId },
                { bountiesClaimed: newClaimed }
            );

            const claimEmbed = new EmbedBuilder()
                .setTitle('Bounties Claimed!')
                .setColor('Green')
                .setDescription(`You earned **${totalReward.toLocaleString()} coins** from bounties!`)
                .setTimestamp();

            await i.editReply({ embeds: [claimEmbed], components: [] });
            collector.stop();
        });
    }
};
