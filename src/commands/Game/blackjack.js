const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

// Function to calculate the score of a blackjack hand
function calculateScore(hand) {
    let score = 0;
    let numAces = 0;

    for (const card of hand) {
        const rank = card.slice(0, -1); // Remove the suit symbol
        if (rank === 'A') {
            numAces++;
            score += 11; // Aces are worth 11 initially
        } else if (['K', 'Q', 'J'].includes(rank)) {
            score += 10; // Face cards are worth 10
        } else {
            score += parseInt(rank); // Number cards are worth their face value
        }
    }

    // Adjust score if aces push the score above 21
    while (score > 21 && numAces > 0) {
        score -= 10; // Change an Ace from 11 to 1
        numAces--;
    }

    return score;
}

// Function to create buttons (Hit, Stand)
function createBlackjackButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('hit')
            .setLabel('Hit')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('stand')
            .setLabel('Stand')
            .setStyle(ButtonStyle.Secondary)
    );
}

// Export the necessary functions to be used in other files
module.exports = {
    drawCard,
    calculateScore,
    createBlackjackButtons,
};
