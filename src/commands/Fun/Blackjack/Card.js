class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }

    getValue() {
        return this.value;
    }
    getAscii() {
        const rank = this.rank.padEnd(2, ' ');
        const suit = this.suit;
        return [
            '┌─────┐',
            `│ ${rank}  │`,
            `│  ${suit}  │`,
            `│   ${rank}│`,
            '└─────┘'
        ];
    }
}

module.exports = Card;
