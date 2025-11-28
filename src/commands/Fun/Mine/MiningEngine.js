class MiningEngine {
    constructor() {
        this.drops = [
            { name: 'Diamond', emoji: '💎', minValue: 500, maxValue: 1000, chance: 0.05 },
            { name: 'Rare Fossil', emoji: '🦖', minValue: 200, maxValue: 400, chance: 0.15 },
            { name: 'Gold Nugget', emoji: '🥇', minValue: 100, maxValue: 200, chance: 0.20 },
            { name: 'Iron Ore', emoji: '🪨', minValue: 20, maxValue: 50, chance: 0.25 },
            { name: 'Garbage', emoji: '🗑️', minValue: 0, maxValue: 5, chance: 0.35 }
        ];
    }

    mine() {
        const rand = Math.random();
        let cumulativeChance = 0;

        for (const drop of this.drops) {
            cumulativeChance += drop.chance;
            if (rand < cumulativeChance) {
                const value = Math.floor(Math.random() * (drop.maxValue - drop.minValue + 1)) + drop.minValue;
                return {
                    ...drop,
                    value
                };
            }
        }
        
        // Fallback to garbage if something goes wrong with rounding
        const garbage = this.drops[this.drops.length - 1];
        return {
            ...garbage,
            value: Math.floor(Math.random() * (garbage.maxValue - garbage.minValue + 1)) + garbage.minValue
        };
    }
}

module.exports = MiningEngine;
