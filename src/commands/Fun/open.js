const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const EconomySystem = require('../../utils/EconomySystem');
const shopItems = require('../../utils/ShopItems');

// Mystery Box reward tiers with weights
const MYSTERY_REWARDS = [
    // Common (50% total)
    { name: '💰 Small Coins', weight: 25, type: 'coins', min: 500, max: 1500 },
    { name: '💵 Medium Coins', weight: 15, type: 'coins', min: 2000, max: 4000 },
    { name: '🍖 Pet Food x3', weight: 10, type: 'item', item: 'Pet Food', quantity: 3 },

    // Uncommon (30% total)
    { name: '⚡ Energy Drink x2', weight: 10, type: 'item', item: 'Energy Drink', quantity: 2 },
    { name: '🌭 Chili Dog x2', weight: 8, type: 'item', item: 'Chili Dog', quantity: 2 },
    { name: '💎 Big Coins', weight: 7, type: 'coins', min: 5000, max: 8000 },
    { name: '🛡️ Pet Shield', weight: 5, type: 'item', item: 'Pet Shield', quantity: 1 },

    // Rare (15% total)
    { name: '💪 Training Weights', weight: 5, type: 'item', item: 'Training Weights', quantity: 1 },
    { name: '👟 Speed Shoes', weight: 4, type: 'item', item: 'Speed Shoes', quantity: 1 },
    { name: '😎 Sunglasses', weight: 3, type: 'item', item: 'Sunglasses', quantity: 1 },
    { name: '🏥 Health Kit', weight: 3, type: 'item', item: 'Health Kit', quantity: 1 },

    // Epic (4% total)
    { name: '🥊 Golden Gloves', weight: 2, type: 'item', item: 'Golden Gloves', quantity: 1 },
    { name: '💰 Massive Coins', weight: 2, type: 'coins', min: 10000, max: 15000 },

    // Legendary (1% total)
    { name: '🎰 JACKPOT!!!', weight: 0.5, type: 'coins', min: 25000, max: 25000 },
    { name: '👑 Royal Cape', weight: 0.3, type: 'item', item: 'Royal Cape', quantity: 1 },
    { name: '💎 Chaos Emerald Shard', weight: 0.2, type: 'item', item: 'Chaos Emerald Shard', quantity: 1 }
];

const TOTAL_WEIGHT = MYSTERY_REWARDS.reduce((sum, r) => sum + r.weight, 0);

// Rarity colors and labels
function getRarity(reward) {
    const weight = reward.weight;
    if (weight >= 10) return { color: 'Grey', label: 'Common' };
    if (weight >= 5) return { color: 'Green', label: 'Uncommon' };
    if (weight >= 2) return { color: 'Blue', label: 'Rare' };
    if (weight >= 1) return { color: 'Purple', label: 'Epic' };
    return { color: 'Gold', label: '✨ LEGENDARY ✨' };
}

module.exports = {
    name: 'open',
    description: 'Open a Mystery Box from your inventory!',
    options: [
        {
            name: 'quantity',
            description: 'How many boxes to open (default: 1)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 10
        }
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const quantity = interaction.options.getInteger('quantity') || 1;

        // Check inventory for Mystery Boxes
        const inventory = await EconomySystem.getInventory(userId);
        const mysteryBoxes = inventory.filter(item => item.name === 'Mystery Box');

        if (mysteryBoxes.length < quantity) {
            return interaction.editReply({
                content: `❌ You only have **${mysteryBoxes.length}** Mystery Box(es)! Buy more from \`/shop\`.`
            });
        }

        // Remove the boxes from inventory
        for (let i = 0; i < quantity; i++) {
            await EconomySystem.removeItem(userId, 'Mystery Box');
        }

        // Open boxes and collect rewards
        const results = [];
        let totalCoins = 0;
        const itemsWon = {};

        for (let i = 0; i < quantity; i++) {
            // Weighted random selection
            const roll = Math.random() * TOTAL_WEIGHT;
            let cumulative = 0;
            let selectedReward = MYSTERY_REWARDS[0];

            for (const reward of MYSTERY_REWARDS) {
                cumulative += reward.weight;
                if (roll <= cumulative) {
                    selectedReward = reward;
                    break;
                }
            }

            // Process reward
            if (selectedReward.type === 'coins') {
                const amount = Math.floor(Math.random() * (selectedReward.max - selectedReward.min + 1)) + selectedReward.min;
                totalCoins += amount;
                results.push({ ...selectedReward, amount });
            } else if (selectedReward.type === 'item') {
                const itemData = shopItems.find(si => si.name === selectedReward.item);
                if (itemData) {
                    for (let q = 0; q < selectedReward.quantity; q++) {
                        await EconomySystem.addItem(userId, { ...itemData });
                    }
                    const key = selectedReward.item;
                    itemsWon[key] = (itemsWon[key] || 0) + selectedReward.quantity;
                }
                results.push(selectedReward);
            }
        }

        // Add total coins
        if (totalCoins > 0) {
            await EconomySystem.addBalance(userId, totalCoins);
        }

        // Build response
        const newBalance = await EconomySystem.getBalance(userId);

        // Check for legendary rewards
        const hasLegendary = results.some(r => r.weight < 1);
        const hasMassive = results.some(r => r.name.includes('JACKPOT'));

        let description = '';

        if (quantity === 1) {
            const reward = results[0];
            const rarity = getRarity(reward);
            description = `🎁 You opened a **Mystery Box**!\n\n`;
            description += `━━━━━━━━━━━━━━━━━\n`;
            description += `${reward.name}\n`;
            description += `**[${rarity.label}]**\n`;
            description += `━━━━━━━━━━━━━━━━━\n\n`;

            if (reward.type === 'coins') {
                description += `💰 **Won:** ${reward.amount.toLocaleString()} coins`;
            } else {
                description += `🎁 **Won:** ${reward.quantity}x ${reward.item}`;
            }
        } else {
            description = `🎁 You opened **${quantity} Mystery Boxes**!\n\n`;

            // Summarize rewards
            if (totalCoins > 0) {
                description += `💰 **Total Coins:** ${totalCoins.toLocaleString()}\n`;
            }

            if (Object.keys(itemsWon).length > 0) {
                description += `📦 **Items Won:**\n`;
                for (const [item, qty] of Object.entries(itemsWon)) {
                    description += `• ${qty}x ${item}\n`;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(hasMassive ? '🎰🎰🎰 JACKPOT!!! 🎰🎰🎰' : '🎁 Mystery Box Opened!')
            .setColor(hasLegendary ? '#FFD700' : (hasMassive ? '#FFD700' : '#800080'))
            .setDescription(description)
            .addFields({ name: '💳 New Balance', value: `$${newBalance.toLocaleString()}`, inline: true })
            .setFooter({ text: 'Buy more Mystery Boxes from /shop!' })
            .setTimestamp();

        if (hasMassive) {
            embed.setDescription(
                `🎊🎊🎊 **JACKPOT!!!** 🎊🎊🎊\n\n` +
                `**${interaction.user.username}** hit the JACKPOT!\n\n` +
                description
            );
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
