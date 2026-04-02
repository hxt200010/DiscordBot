const { EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const EconomySystem = require('../../utils/EconomySystem');

// Wheel rewards with weights (higher weight = more common)
const WHEEL_REWARDS = [
    { name: '💰 Small Coins', weight: 40, type: 'coins', min: 50, max: 200 },
    { name: '💵 Medium Coins', weight: 25, type: 'coins', min: 300, max: 600 },
    { name: '💎 Large Coins', weight: 15, type: 'coins', min: 800, max: 1500 },
    { name: '🍖 Pet Food', weight: 10, type: 'item', item: 'Pet Food' },
    { name: '⚡ Energy Drink', weight: 7, type: 'item', item: 'Energy Drink' },
    { name: '🎰 JACKPOT!', weight: 3, type: 'coins', min: 5000, max: 5000 }
];

// Calculate total weight for probability
const TOTAL_WEIGHT = WHEEL_REWARDS.reduce((sum, r) => sum + r.weight, 0);

// 24 hours in milliseconds
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
    name: 'spin',
    description: 'Spin the daily wheel for a chance to win coins and items!',

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;

        // Get or create user
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        // Check cooldown
        if (user.lastWheelSpin) {
            const timeSinceSpin = Date.now() - new Date(user.lastWheelSpin).getTime();
            if (timeSinceSpin < COOLDOWN_MS) {
                const remainingMs = COOLDOWN_MS - timeSinceSpin;
                const hours = Math.floor(remainingMs / (60 * 60 * 1000));
                const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🎡 Daily Wheel')
                    .setDescription(`You've already spun the wheel today!\n\n⏰ **Come back in:** ${hours}h ${minutes}m`)
                    .setFooter({ text: 'The wheel resets every 24 hours' });

                return interaction.editReply({ embeds: [embed] });
            }
        }

        // Spin the wheel - weighted random selection
        const roll = Math.random() * TOTAL_WEIGHT;
        let cumulative = 0;
        let selectedReward = WHEEL_REWARDS[0];

        for (const reward of WHEEL_REWARDS) {
            cumulative += reward.weight;
            if (roll <= cumulative) {
                selectedReward = reward;
                break;
            }
        }

        // Process reward
        let rewardText = '';
        let rewardAmount = 0;

        if (selectedReward.type === 'coins') {
            rewardAmount = Math.floor(Math.random() * (selectedReward.max - selectedReward.min + 1)) + selectedReward.min;
            await EconomySystem.addBalance(userId, rewardAmount);
            rewardText = `**${rewardAmount.toLocaleString()} coins**`;
        } else if (selectedReward.type === 'item') {
            const shopItems = require('../../utils/ShopItems');
            const itemData = shopItems.find(i => i.name === selectedReward.item);
            if (itemData) {
                await EconomySystem.addItem(userId, { ...itemData });
                rewardText = `**1x ${selectedReward.item}**`;
            }
        }

        // Update last spin time
        await User.findOneAndUpdate(
            { userId },
            { lastWheelSpin: new Date() }
        );

        // Create visual wheel effect
        const wheelEmojis = ['🎰', '💰', '💎', '⚡', '🍖', '✨'];
        const spinAnimation = wheelEmojis[Math.floor(Math.random() * wheelEmojis.length)];

        // Determine embed color based on reward
        let embedColor = 'Green';
        if (selectedReward.name.includes('JACKPOT')) {
            embedColor = 'Gold';
        } else if (selectedReward.name.includes('Large')) {
            embedColor = 'Blue';
        }

        const newBalance = await EconomySystem.getBalance(userId);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`🎡 Daily Wheel ${spinAnimation}`)
            .setDescription(
                `**${interaction.user.username}** spins the wheel...\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `${selectedReward.name}\n` +
                `━━━━━━━━━━━━━━━━━\n\n` +
                `🎁 **You won:** ${rewardText}`
            )
            .addFields(
                { name: '💳 New Balance', value: `$${newBalance.toLocaleString()}`, inline: true }
            )
            .setFooter({ text: 'Come back in 24 hours for another spin!' })
            .setTimestamp();

        // Add special message for jackpot
        if (selectedReward.name.includes('JACKPOT')) {
            embed.setDescription(
                `🎊🎊🎊 **JACKPOT!!!** 🎊🎊🎊\n\n` +
                `**${interaction.user.username}** hit the JACKPOT!\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `🎰 JACKPOT! 🎰\n` +
                `━━━━━━━━━━━━━━━━━\n\n` +
                `🎁 **You won:** ${rewardText}`
            );
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
