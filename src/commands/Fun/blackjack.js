const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const Deck = require('./Blackjack/Deck');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'blackjack',
    description: 'Play a game of Blackjack!',
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

        if (economy.getBalance(userId) < bet) {
            return interaction.reply({ content: `You don't have enough money! Your balance is $${economy.getBalance(userId)}.`, ephemeral: true });
        }

        economy.removeBalance(userId, bet);

        const deck = new Deck();
        const playerHand = [deck.draw(), deck.draw()];
        const dealerHand = [deck.draw(), deck.draw()];

        const calculateScore = (hand) => {
            let score = 0;
            let aces = 0;
            for (const card of hand) {
                score += card.getValue();
                if (card.rank === 'A') aces++;
            }
            while (score > 21 && aces > 0) {
                score -= 10;
                aces--;
            }
            return score;
        };

        const formatHand = (hand, hideSecond = false) => {
            if (hideSecond) {
                return `${hand[0].toString()}  🂠`;
            }
            return hand.map(card => card.toString()).join('  ');
        };

        const generateEmbed = (gameOver = false, result = '', winAmount = 0) => {
            const embed = new EmbedBuilder()
                .setTitle('🎰  High-Stakes Blackjack  🎰')
                .setColor(gameOver ? (result.includes('Win') ? 0xFFD700 : 0xFF0000) : 0x2F3136) // Gold for win, Red for loss, Dark for ongoing
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '👤 Your Hand', value: `\`${formatHand(playerHand)}\`\nScore: **${calculateScore(playerHand)}**`, inline: true },
                    { name: '🤖 Dealer Hand', value: `\`${formatHand(dealerHand, !gameOver)}\`\nScore: **${gameOver ? calculateScore(dealerHand) : '?'}**`, inline: true },
                    { name: '\u200B', value: '\u200B' }, // Spacer
                    { name: '💰 Bet', value: `$${bet}`, inline: true },
                    { name: '💵 Potential Win', value: `$${bet * 2}`, inline: true }
                )
                .setFooter({ text: `Balance: $${economy.getBalance(userId).toLocaleString()}` });

            if (gameOver) {
                embed.setDescription(`## ${result}\n${winAmount > 0 ? `You won **$${winAmount}**!` : 'Better luck next time!'}`);
            } else {
                embed.setDescription('Hit or Stand?');
            }

            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Hit')
                    .setEmoji('🃏')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Stand')
                    .setEmoji('🛑')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.deferReply();

        // Check for natural Blackjack
        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);
        
        if (playerScore === 21) {
            let result = '';
            let winAmount = 0;
            
            if (dealerScore === 21) {
                result = 'Push (Both have Blackjack)!';
                winAmount = bet;
            } else {
                result = 'Blackjack! You Win!';
                winAmount = Math.ceil(bet * 2.5); // 3:2 payout usually, but 2.5x total return (1.5x profit)
            }
            
            economy.addBalance(userId, winAmount);
            
            const embed = generateEmbed(true, result, winAmount);
            return interaction.editReply({ embeds: [embed], components: [] });
        }

        const reply = await interaction.editReply({
            embeds: [generateEmbed()],
            components: [row],
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

            if (i.customId === 'hit') {
                playerHand.push(deck.draw());
                const score = calculateScore(playerHand);

                if (score > 21) {
                    await i.update({
                        embeds: [generateEmbed(true, 'BUST! You Lose.', 0)],
                        components: []
                    });
                    collector.stop();
                } else {
                    await i.update({
                        embeds: [generateEmbed()],
                        components: [row]
                    });
                }
            } else if (i.customId === 'stand') {
                let dealerScore = calculateScore(dealerHand);
                while (dealerScore < 17) {
                    dealerHand.push(deck.draw());
                    dealerScore = calculateScore(dealerHand);
                }

                const playerScore = calculateScore(playerHand);
                let result = '';
                let winAmount = 0;

                if (dealerScore > 21) {
                    result = 'Dealer Busts! You Win!';
                    winAmount = bet * 2;
                } else if (dealerScore > playerScore) {
                    result = 'Dealer Wins!';
                } else if (playerScore > dealerScore) {
                    result = 'You Win!';
                    winAmount = bet * 2;
                } else {
                    result = 'Push (Tie)!';
                    winAmount = bet;
                }

                if (winAmount > 0) {
                    economy.addBalance(userId, winAmount);
                }

                await i.update({
                    embeds: [generateEmbed(true, result, winAmount)],
                    components: []
                });
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({
                    content: 'Game timed out. You lost your bet.',
                    components: []
                });
            }
        });
    }
};
