const Card = require('./Card');

class Deck {
    constructor() {
        this.cards = [];
        this.suits = ['♥', '♦', '♣', '♠'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (const suit of this.suits) {
            for (const rank of this.ranks) {
                let value = parseInt(rank);
                if (['J', 'Q', 'K'].includes(rank)) value = 10;
                if (rank === 'A') value = 11;
                this.cards.push(new Card(suit, rank, value));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}

module.exports = Deck;
