const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const Deck = require('./Blackjack/Deck');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'highlow',
    description: 'Play a game of High-Low! Predict if the next card is higher or lower.',
    options: [
        {
            name: 'bet',
            description: 'Amount to bet',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 10,
        }
    ],

    callback: async (client, interaction) => {
        const bet = interaction.options.getInteger('bet');
        const userId = interaction.user.id;

        if (await economy.getBalance(userId) < bet) {
            return interaction.reply({ content: `You don't have enough money! Your balance is $${await economy.getBalance(userId)}.`, ephemeral: true });
        }

        await economy.removeBalance(userId, bet);

        const deck = new Deck();
        let currentCard = deck.draw();
        let streak = 0;
        let gameOver = false;

        // Multiplier tiers based on streak
        const getMultiplier = (streakCount) => {
            if (streakCount === 0) return 1;
            if (streakCount === 1) return 1.5;
            if (streakCount === 2) return 2;
            if (streakCount === 3) return 3;
            if (streakCount === 4) return 5;
            return 8; // 5+ streak
        };

        // Get card numeric value for comparison (Ace is high = 14)
        const getCompareValue = (card) => {
            if (card.rank === 'A') return 14;
            if (card.rank === 'K') return 13;
            if (card.rank === 'Q') return 12;
            if (card.rank === 'J') return 11;
            return parseInt(card.rank);
        };

        const formatCard = (card) => {
            const cardLines = card.getAscii();
            return `\`\`\`text\n${cardLines.join('\n')}\n\`\`\``;
        };

        const generateEmbed = async (result = '', nextCard = null, cashOut = false) => {
            const balance = await economy.getBalance(userId);
            const multiplier = getMultiplier(streak);
            const potentialWin = Math.floor(bet * multiplier);

            let color = 0x2F3136; // Dark for ongoing
            if (gameOver) {
                if (result.includes('Win') || result.includes('Cashed Out')) {
                    color = 0xFFD700; // Gold for win
                } else if (result.includes('Lose')) {
                    color = 0xFF0000; // Red for loss
                } else {
                    color = 0x3498DB; // Blue for push/tie
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🎴  High-Low  🎴')
                .setColor(color)
                .setThumbnail(client.user.displayAvatarURL());

            // Show both cards if next card exists (after a guess)
            if (nextCard && gameOver) {
                const currentLines = currentCard.getAscii();
                const nextLines = nextCard.getAscii();
                let combinedAscii = ['', '', '', '', ''];
                for (let i = 0; i < 5; i++) {
                    combinedAscii[i] = currentLines[i] + '  →  ' + nextLines[i];
                }
                embed.addFields(
                    { name: '🃏 Cards', value: `\`\`\`text\n${combinedAscii.join('\n')}\n\`\`\``, inline: false }
                );
            } else {
                embed.addFields(
                    { name: '🃏 Current Card', value: formatCard(currentCard), inline: false }
                );
            }

            embed.addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '🔥 Streak', value: `**${streak}**`, inline: true },
                { name: '📈 Multiplier', value: `**${multiplier}x**`, inline: true },
                { name: '💰 Potential Win', value: `**$${potentialWin}**`, inline: true }
            );

            // Show next multiplier preview
            if (!gameOver && streak < 5) {
                embed.addFields(
                    { name: '⬆️ Next Multiplier', value: `${getMultiplier(streak + 1)}x`, inline: true }
                );
            }

            embed.setFooter({ text: `Balance: $${balance.toLocaleString()} | Bet: $${bet}` });

            if (gameOver) {
                let description = `## ${result}`;
                if (cashOut || result.includes('Win')) {
                    const winAmount = Math.floor(bet * multiplier);
                    description += `\nYou won **$${winAmount}**!`;
                } else if (result.includes('Lose')) {
                    description += `\nYou lost your bet of **$${bet}**.`;
                }
                embed.setDescription(description);
            } else {
                embed.setDescription('Will the next card be **Higher** or **Lower**?\n\n*Equal cards count as a push (continue without penalty)*');
            }

            return embed;
        };

        const createButtons = () => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('higher')
                        .setLabel('Higher')
                        .setEmoji('⬆️')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('lower')
                        .setLabel('Lower')
                        .setEmoji('⬇️')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cashout')
                        .setLabel(`Cash Out ($${Math.floor(bet * getMultiplier(streak))})`)
                        .setEmoji('💰')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(streak === 0) // Can't cash out with 0 streak
                );
        };

        await interaction.deferReply();

        const reply = await interaction.editReply({
            embeds: [await generateEmbed()],
            components: [createButtons()],
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            if (i.customId === 'cashout') {
                gameOver = true;
                const winAmount = Math.floor(bet * getMultiplier(streak));
                await economy.addBalance(userId, winAmount);
                
                await i.update({
                    embeds: [await generateEmbed(`💰 Cashed Out!`, null, true)],
                    components: []
                });
                collector.stop('cashout');
                return;
            }

            const nextCard = deck.draw();
            
            if (!nextCard) {
                // Deck is empty - auto cash out
                gameOver = true;
                const winAmount = Math.floor(bet * getMultiplier(streak));
                await economy.addBalance(userId, winAmount);
                
                await i.update({
                    embeds: [await generateEmbed(`🎉 Deck Empty - Auto Cash Out!`, null, true)],
                    components: []
                });
                collector.stop('deck_empty');
                return;
            }

            const currentValue = getCompareValue(currentCard);
            const nextValue = getCompareValue(nextCard);

            let correct = false;
            let push = false;

            if (currentValue === nextValue) {
                // Push - equal cards, continue without penalty
                push = true;
            } else if (i.customId === 'higher') {
                correct = nextValue > currentValue;
            } else if (i.customId === 'lower') {
                correct = nextValue < currentValue;
            }

            if (push) {
                // Update current card and continue
                const oldCard = currentCard;
                currentCard = nextCard;
                
                // Show push message with both cards
                const oldLines = oldCard.getAscii();
                const nextLines = nextCard.getAscii();
                let combinedAscii = ['', '', '', '', ''];
                for (let j = 0; j < 5; j++) {
                    combinedAscii[j] = oldLines[j] + '  =  ' + nextLines[j];
                }

                const pushEmbed = new EmbedBuilder()
                    .setTitle('🎴  High-Low  🎴')
                    .setColor(0x3498DB)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setDescription('## 🔄 Push! Equal cards - Keep going!')
                    .addFields(
                        { name: '🃏 Cards', value: `\`\`\`text\n${combinedAscii.join('\n')}\n\`\`\``, inline: false },
                        { name: '\u200B', value: '\u200B' },
                        { name: '🔥 Streak', value: `**${streak}**`, inline: true },
                        { name: '📈 Multiplier', value: `**${getMultiplier(streak)}x**`, inline: true },
                        { name: '💰 Potential Win', value: `**$${Math.floor(bet * getMultiplier(streak))}**`, inline: true }
                    )
                    .setFooter({ text: `Balance: $${(await economy.getBalance(userId)).toLocaleString()} | Bet: $${bet}` });

                await i.update({
                    embeds: [pushEmbed],
                    components: [createButtons()]
                });
            } else if (correct) {
                streak++;
                currentCard = nextCard;

                await i.update({
                    embeds: [await generateEmbed()],
                    components: [createButtons()]
                });
            } else {
                // Wrong guess - game over
                gameOver = true;
                
                await i.update({
                    embeds: [await generateEmbed('❌ Wrong! You Lose!', nextCard)],
                    components: []
                });
                collector.stop('lose');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                // Timeout - auto cash out if they have a streak, otherwise lose
                if (streak > 0) {
                    const winAmount = Math.floor(bet * getMultiplier(streak));
                    await economy.addBalance(userId, winAmount);
                    
                    interaction.editReply({
                        content: `⏰ Time's up! Auto cashed out for **$${winAmount}**!`,
                        components: []
                    });
                } else {
                    interaction.editReply({
                        content: '⏰ Game timed out. You lost your bet.',
                        components: []
                    });
                }
            }
        });
    }
};
