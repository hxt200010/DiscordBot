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
}

module.exports = Card;
