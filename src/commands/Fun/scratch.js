const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'scratch',
    description: 'Buy and scratch a scratch card for prizes!',
    options: [
        {
            name: 'tier',
            description: 'Scratch card tier',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: '🥉 Bronze ($25) - Max: $250', value: 'bronze' },
                { name: '🥈 Silver ($100) - Max: $1,500', value: 'silver' },
                { name: '🥇 Gold ($500) - Max: $10,000', value: 'gold' },
            ]
        }
    ],

    callback: async (client, interaction) => {
        const tier = interaction.options.getString('tier');
        const userId = interaction.user.id;

        // Tier configurations
        const tiers = {
            bronze: {
                cost: 25,
                emoji: '🥉',
                name: 'Bronze',
                color: 0xCD7F32,
                prizes: [
                    { symbol: '🍀', name: 'Clover', amount: 10, weight: 35 },
                    { symbol: '⭐', name: 'Star', amount: 25, weight: 25 },
                    { symbol: '💫', name: 'Sparkle', amount: 50, weight: 20 },
                    { symbol: '🌟', name: 'Glow Star', amount: 100, weight: 12 },
                    { symbol: '💎', name: 'Diamond', amount: 250, weight: 5 },
                    { symbol: '❌', name: 'Nothing', amount: 0, weight: 3 },
                ]
            },
            silver: {
                cost: 100,
                emoji: '🥈',
                name: 'Silver',
                color: 0xC0C0C0,
                prizes: [
                    { symbol: '🍀', name: 'Clover', amount: 50, weight: 30 },
                    { symbol: '⭐', name: 'Star', amount: 100, weight: 25 },
                    { symbol: '💫', name: 'Sparkle', amount: 250, weight: 20 },
                    { symbol: '🌟', name: 'Glow Star', amount: 500, weight: 15 },
                    { symbol: '💎', name: 'Diamond', amount: 1500, weight: 7 },
                    { symbol: '❌', name: 'Nothing', amount: 0, weight: 3 },
                ]
            },
            gold: {
                cost: 500,
                emoji: '🥇',
                name: 'Gold',
                color: 0xFFD700,
                prizes: [
                    { symbol: '🍀', name: 'Clover', amount: 250, weight: 25 },
                    { symbol: '⭐', name: 'Star', amount: 500, weight: 25 },
                    { symbol: '💫', name: 'Sparkle', amount: 1000, weight: 20 },
                    { symbol: '🌟', name: 'Glow Star', amount: 2500, weight: 17 },
                    { symbol: '💎', name: 'Diamond', amount: 5000, weight: 8 },
                    { symbol: '👑', name: 'Crown', amount: 10000, weight: 3 },
                    { symbol: '❌', name: 'Nothing', amount: 0, weight: 2 },
                ]
            }
        };

        const tierConfig = tiers[tier];
        const balance = await economy.getBalance(userId);

        if (balance < tierConfig.cost) {
            return interaction.reply({ 
                content: `You need $${tierConfig.cost} for a ${tierConfig.name} scratch card! Your balance is $${balance}.`, 
                ephemeral: true 
            });
        }

        await economy.removeBalance(userId, tierConfig.cost);
        await interaction.deferReply();

        // Generate 9 spots (3x3 grid)
        const selectPrize = () => {
            const totalWeight = tierConfig.prizes.reduce((sum, p) => sum + p.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const prize of tierConfig.prizes) {
                random -= prize.weight;
                if (random <= 0) return prize;
            }
            return tierConfig.prizes[0];
        };

        const grid = Array(9).fill(null).map(() => selectPrize());
        const revealed = Array(9).fill(false);
        let scratched = 0;
        let totalWinnings = 0;

        const createEmbed = (finished = false) => {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = [];
                for (let j = 0; j < 3; j++) {
                    const idx = i * 3 + j;
                    if (revealed[idx]) {
                        row.push(grid[idx].symbol);
                    } else {
                        row.push('⬜');
                    }
                }
                rows.push(row.join(' │ '));
            }

            const gridDisplay = rows.join('\n─────────\n');

            const embed = new EmbedBuilder()
                .setTitle(`${tierConfig.emoji}  ${tierConfig.name} Scratch Card  ${tierConfig.emoji}`)
                .setColor(tierConfig.color)
                .addFields({
                    name: 'Scratch Area',
                    value: `\`\`\`\n${gridDisplay}\n\`\`\``,
                    inline: false
                });

            if (finished) {
                embed.setDescription(totalWinnings > 0 
                    ? `🎉 **You won $${totalWinnings}!**` 
                    : '😔 **No winning matches this time!**');
                
                const net = totalWinnings - tierConfig.cost;
                embed.addFields(
                    { name: '💰 Total Won', value: `$${totalWinnings}`, inline: true },
                    { name: '📊 Net', value: `${net >= 0 ? '+' : ''}$${net}`, inline: true }
                );
            } else {
                embed.setDescription(`Scratch ${3 - scratched} more spots! Click the buttons below.`);
                embed.addFields({ 
                    name: '💵 Card Cost', 
                    value: `$${tierConfig.cost}`, 
                    inline: true 
                });
            }

            return embed;
        };

        const createButtons = () => {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 3; j++) {
                    const idx = i * 3 + j;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`scratch_${idx}`)
                            .setLabel(revealed[idx] ? grid[idx].symbol : `${idx + 1}`)
                            .setStyle(revealed[idx] ? ButtonStyle.Secondary : ButtonStyle.Primary)
                            .setDisabled(revealed[idx])
                    );
                }
                rows.push(row);
            }
            return rows;
        };

        const reply = await interaction.editReply({
            embeds: [createEmbed()],
            components: createButtons(),
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your scratch card!", ephemeral: true });
            }

            const idx = parseInt(i.customId.split('_')[1]);
            
            if (revealed[idx]) {
                return i.reply({ content: "Already scratched!", ephemeral: true });
            }

            revealed[idx] = true;
            scratched++;

            // Check if scratched 3
            if (scratched >= 3) {
                // Calculate winnings - check for matches
                const revealedPrizes = grid.filter((_, i) => revealed[i]);
                
                // Count matching symbols
                const symbolCounts = {};
                for (const prize of revealedPrizes) {
                    symbolCounts[prize.symbol] = (symbolCounts[prize.symbol] || 0) + 1;
                }

                // 3 matching = full prize, 2 matching = half prize
                for (const prize of revealedPrizes) {
                    if (symbolCounts[prize.symbol] === 3) {
                        totalWinnings = prize.amount * 3;
                        break;
                    } else if (symbolCounts[prize.symbol] === 2 && prize.amount > 0) {
                        totalWinnings = Math.max(totalWinnings, Math.floor(prize.amount * 1.5));
                    }
                }

                if (totalWinnings > 0) {
                    await economy.addBalance(userId, totalWinnings);
                }

                // Reveal all
                for (let j = 0; j < 9; j++) {
                    revealed[j] = true;
                }

                const finalButtons = createButtons().map(row => {
                    row.components.forEach(btn => btn.setDisabled(true));
                    return row;
                });

                await i.update({
                    embeds: [createEmbed(true)],
                    components: finalButtons
                });

                collector.stop('finished');
            } else {
                await i.update({
                    embeds: [createEmbed()],
                    components: createButtons()
                });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({
                    content: '⏰ Scratch card expired!',
                    components: []
                });
            }
        });
    }
};
