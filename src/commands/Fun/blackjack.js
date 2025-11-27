const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Deck = require('./Blackjack/Deck');

module.exports = {
    name: 'blackjack',
    description: 'Play a game of Blackjack!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options: Object[],
    // deleted: Boolean,

    callback: async (client, interaction) => {
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
                return `${hand[0].toString()}, 🂠`;
            }
            return hand.map(card => card.toString()).join(', ');
        };

        const generateEmbed = (gameOver = false, result = '') => {
            const embed = new EmbedBuilder()
                .setTitle('Blackjack')
                .setColor(gameOver ? (result.includes('Win') ? 0x00FF00 : 0xFF0000) : 0x0099FF)
                .addFields(
                    { name: 'Your Hand', value: `${formatHand(playerHand)} (Score: ${calculateScore(playerHand)})`, inline: true },
                    { name: 'Dealer Hand', value: `${formatHand(dealerHand, !gameOver)} ${gameOver ? `(Score: ${calculateScore(dealerHand)})` : ''}`, inline: true }
                );

            if (gameOver) {
                embed.setDescription(`**${result}**`);
            }

            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Hit')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Stand')
                    .setStyle(ButtonStyle.Secondary)
            );

        const reply = await interaction.reply({
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
                        embeds: [generateEmbed(true, 'Bust! You lose.')],
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

                if (dealerScore > 21) {
                    result = 'Dealer Busts! You Win!';
                } else if (dealerScore > playerScore) {
                    result = 'Dealer Wins!';
                } else if (playerScore > dealerScore) {
                    result = 'You Win!';
                } else {
                    result = 'Push (Tie)!';
                }

                await i.update({
                    embeds: [generateEmbed(true, result)],
                    components: []
                });
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.editReply({
                    content: 'Game timed out.',
                    components: []
                });
            }
        });
    }
};
