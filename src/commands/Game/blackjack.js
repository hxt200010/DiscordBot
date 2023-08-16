const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

// Unicode characters for card suits
const suits = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️',
};

// Function to simulate drawing a card
function drawCard() {
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suitsArray = Object.values(suits);
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    const randomSuit = suitsArray[Math.floor(Math.random() * suitsArray.length)];
    return `${randomCard}${randomSuit}`;
}

// ... Other parts of the code ...

module.exports = {
    name: 'blackjack',
    description: 'Play a game of blackjack against the bot',
    options: [],
    callback: async (client, interaction) => {
        try {
            // Initial deal
            const playerHand = [drawCard(), drawCard()];
            const botHand = [drawCard()];

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('Blackjack')
                .setDescription(`Your hand: ${playerHand.join(', ')}`)
                .addFields(
                    {
                        name: "Bot's hand",
                        value: botHand.join('\n'),
                        inline: true,
                    },
                    {
                        name: 'Your score',
                        value: calculateScore(playerHand),
                        inline: true,
                    }
                )
                .setFooter('Type /hit to get another card or /stand to stay.');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while processing the blackjack command.');
        }
    },
};

// ... Other parts of the code ...


// Function to calculate the score of a blackjack hand
function calculateScore(hand) {
    let score = 0;
    let numAces = 0;

    for (const card of hand) {
        const rank = card.slice(0, -1);
        if (rank === 'A') {
            numAces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(rank)) {
            score += 10;
        } else {
            score += parseInt(rank);
        }
    }

    // Adjust score for aces
    while (score > 21 && numAces > 0) {
        score -= 10;
        numAces--;
    }

    return score;
}
