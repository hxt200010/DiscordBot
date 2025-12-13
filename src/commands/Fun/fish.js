const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

// Cooldown tracker
const cooldowns = new Map();
const COOLDOWN_SECONDS = 30;

module.exports = {
    name: 'fish',
    description: 'Go fishing and catch fish to sell for coins!',
    options: [
        {
            name: 'bait',
            description: 'Type of bait to use',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: '🪱 Worm ($10) - Common fish', value: 'worm' },
                { name: '🦐 Shrimp ($50) - Uncommon chance', value: 'shrimp' },
                { name: '🐟 Premium ($200) - Rare chance', value: 'premium' },
                { name: '🦑 Legendary ($500) - Legendary chance', value: 'legendary' }
            ]
        }
    ],

    callback: async (client, interaction) => {
        const baitType = interaction.options.getString('bait');
        const userId = interaction.user.id;

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = cooldowns.get(userId);
        if (cooldownEnd && now < cooldownEnd) {
            const remaining = Math.ceil((cooldownEnd - now) / 1000);
            return interaction.reply({
                content: `🎣 Your fishing rod is still wet! Try again in **${remaining}** seconds.`,
                ephemeral: true
            });
        }

        // Bait configurations
        const baits = {
            worm: {
                cost: 10,
                emoji: '🪱',
                name: 'Worm',
                weights: { common: 80, uncommon: 18, rare: 2, legendary: 0 }
            },
            shrimp: {
                cost: 50,
                emoji: '🦐',
                name: 'Shrimp',
                weights: { common: 50, uncommon: 40, rare: 9, legendary: 1 }
            },
            premium: {
                cost: 200,
                emoji: '🐟',
                name: 'Premium',
                weights: { common: 25, uncommon: 45, rare: 25, legendary: 5 }
            },
            legendary: {
                cost: 500,
                emoji: '🦑',
                name: 'Legendary',
                weights: { common: 10, uncommon: 30, rare: 40, legendary: 20 }
            }
        };

        // All fish types - expanded list with more variety!
        const fishTypes = {
            common: [
                { name: 'Sardine', emoji: '🐟', value: 5 },
                { name: 'Anchovy', emoji: '🐟', value: 6 },
                { name: 'Minnow', emoji: '🐟', value: 7 },
                { name: 'Mackerel', emoji: '🐟', value: 8 },
                { name: 'Herring', emoji: '🐟', value: 9 },
                { name: 'Carp', emoji: '🐟', value: 10 },
                { name: 'Perch', emoji: '🐟', value: 11 },
                { name: 'Cod', emoji: '🐟', value: 12 },
                { name: 'Tilapia', emoji: '🐟', value: 13 },
                { name: 'Catfish', emoji: '🐟', value: 15 }
            ],
            uncommon: [
                { name: 'Bass', emoji: '🐠', value: 25 },
                { name: 'Trout', emoji: '🐠', value: 30 },
                { name: 'Flounder', emoji: '🐠', value: 35 },
                { name: 'Snapper', emoji: '🐠', value: 40 },
                { name: 'Salmon', emoji: '🐠', value: 45 },
                { name: 'Sea Bream', emoji: '🐠', value: 50 },
                { name: 'Halibut', emoji: '🐠', value: 55 },
                { name: 'Pike', emoji: '🐠', value: 60 },
                { name: 'Walleye', emoji: '🐠', value: 65 },
                { name: 'Grouper', emoji: '🐠', value: 70 }
            ],
            rare: [
                { name: 'Pufferfish', emoji: '🐡', value: 100 },
                { name: 'Tuna', emoji: '🐡', value: 125 },
                { name: 'Swordfish', emoji: '🐡', value: 150 },
                { name: 'Marlin', emoji: '🐡', value: 175 },
                { name: 'Barracuda', emoji: '🐡', value: 200 },
                { name: 'Electric Eel', emoji: '⚡', value: 225 },
                { name: 'Anglerfish', emoji: '🔦', value: 250 },
                { name: 'Lionfish', emoji: '🦁', value: 275 },
                { name: 'Moray Eel', emoji: '🐍', value: 300 },
                { name: 'Giant Squid', emoji: '🦑', value: 350 }
            ],
            legendary: [
                { name: 'Great White Shark', emoji: '🦈', value: 500 },
                { name: 'Hammerhead Shark', emoji: '🦈', value: 600 },
                { name: 'Manta Ray', emoji: '🦅', value: 700 },
                { name: 'Blue Whale', emoji: '🐋', value: 800 },
                { name: 'Orca', emoji: '🐬', value: 850 },
                { name: 'Megalodon Fossil', emoji: '🦴', value: 900 },
                { name: 'Sea Dragon', emoji: '🐉', value: 950 },
                { name: 'Golden Koi', emoji: '✨', value: 1000 },
                { name: 'Crystal Jellyfish', emoji: '💎', value: 1100 },
                { name: 'Rainbow Fish', emoji: '🌈', value: 1250 },
                { name: 'Phoenix Salmon', emoji: '🔥', value: 1500 },
                { name: 'Neptune\'s Treasure', emoji: '👑', value: 2000 }
            ]
        };

        // Junk items (small chance)
        const junkItems = [
            { name: 'Old Boot', emoji: '🥾', value: 1 },
            { name: 'Seaweed', emoji: '🌿', value: 2 },
            { name: 'Tin Can', emoji: '🥫', value: 1 },
            { name: 'Plastic Bag', emoji: '🛍️', value: 0 },
            { name: 'Nothing', emoji: '💨', value: 0 }
        ];

        const bait = baits[baitType];
        const balance = await economy.getBalance(userId);

        if (balance < bait.cost) {
            return interaction.reply({
                content: `You need $${bait.cost} for ${bait.name} bait! Your balance is $${balance.toLocaleString()}.`,
                ephemeral: true
            });
        }

        await economy.removeBalance(userId, bait.cost);
        await interaction.deferReply();

        // Set cooldown
        cooldowns.set(userId, now + (COOLDOWN_SECONDS * 1000));

        // Fishing animation - Phase 1: Casting
        const castEmbed = new EmbedBuilder()
            .setTitle('🎣  Fishing  🎣')
            .setColor(0x3498DB)
            .setDescription(`**Casting your line...**\n\n🎣 ~~~~~~~~~~~~🪝`)
            .addFields({ name: 'Bait', value: `${bait.emoji} ${bait.name}`, inline: true })
            .setFooter({ text: `${interaction.user.username} is fishing` });

        await interaction.editReply({ embeds: [castEmbed] });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Phase 2: Waiting
        const waitEmbed = new EmbedBuilder()
            .setTitle('🎣  Fishing  🎣')
            .setColor(0x3498DB)
            .setDescription(`**Waiting for a bite...**\n\n🎣 ~~🌊~~🌊~~🌊~~🪝\n\n*The water ripples...*`)
            .addFields({ name: 'Bait', value: `${bait.emoji} ${bait.name}`, inline: true });

        await interaction.editReply({ embeds: [waitEmbed] });
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Phase 3: Bite!
        const biteEmbed = new EmbedBuilder()
            .setTitle('🎣  Fishing  🎣')
            .setColor(0xFFAA00)
            .setDescription(`**🔔 SOMETHING'S BITING! 🔔**\n\n🎣 ~~💥~~💥~~💥~~🪝\n\n*Reeling in...*`);

        await interaction.editReply({ embeds: [biteEmbed] });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Determine catch
        let caught;
        let rarity;
        const roll = Math.random() * 100;

        // 5% chance for junk
        if (roll < 5) {
            caught = junkItems[Math.floor(Math.random() * junkItems.length)];
            rarity = 'junk';
        } else {
            // Determine rarity based on bait weights
            const adjustedRoll = Math.random() * 100;
            let cumulative = 0;

            if (adjustedRoll < (cumulative += bait.weights.legendary)) {
                rarity = 'legendary';
            } else if (adjustedRoll < (cumulative += bait.weights.rare)) {
                rarity = 'rare';
            } else if (adjustedRoll < (cumulative += bait.weights.uncommon)) {
                rarity = 'uncommon';
            } else {
                rarity = 'common';
            }

            const pool = fishTypes[rarity];
            caught = pool[Math.floor(Math.random() * pool.length)];
        }

        // Add money
        if (caught.value > 0) {
            await economy.addBalance(userId, caught.value);
        }

        const newBalance = await economy.getBalance(userId);
        const netGain = caught.value - bait.cost;

        // Determine color and message based on rarity
        let color, rarityText;
        switch (rarity) {
            case 'legendary':
                color = 0xFFD700;
                rarityText = '👑 **LEGENDARY CATCH!**';
                break;
            case 'rare':
                color = 0x9B59B6;
                rarityText = '💎 **Rare Catch!**';
                break;
            case 'uncommon':
                color = 0x3498DB;
                rarityText = '✨ Nice Catch!';
                break;
            case 'junk':
                color = 0x808080;
                rarityText = '🗑️ Junk...';
                break;
            default:
                color = 0x2ECC71;
                rarityText = '🐟 Common Catch';
        }

        const finalEmbed = new EmbedBuilder()
            .setTitle('🎣  Fishing Results  🎣')
            .setColor(color)
            .setDescription(`${rarityText}\n\nYou caught a **${caught.emoji} ${caught.name}**!`)
            .addFields(
                { name: '💰 Sold For', value: `$${caught.value}`, inline: true },
                { name: '🎣 Bait Cost', value: `$${bait.cost}`, inline: true },
                { name: '📊 Net', value: `${netGain >= 0 ? '+' : ''}$${netGain}`, inline: true }
            )
            .setFooter({ text: `Balance: $${newBalance.toLocaleString()} • Fish again in ${COOLDOWN_SECONDS}s` })
            .setTimestamp();

        // Add fish rarity guide on bad catches
        if (rarity === 'junk' || rarity === 'common') {
            finalEmbed.addFields({
                name: '💡 Tip',
                value: 'Use better bait for rarer fish! 🦐 Shrimp or 🐟 Premium recommended.',
                inline: false
            });
        }

        await interaction.editReply({ embeds: [finalEmbed] });
    }
};
