module.exports = [
    {
        name: 'Sonic',
        value: 'sonic',
        emoji: '⚡️',
        description: "The fastest thing alive! He's energetic, confident, and loves chili dogs. Always ready to protect his family and friends with Blue Justice!",
        stats: { attack: 100, defense: 100, health: 1500 }
    },
    {
        name: 'Knuckles',
        value: 'knuckles',
        emoji: '🥊',
        description: "The last of the Echidna warriors. He's strong, serious, and takes his duty very seriously. He hits hard and never gives up.",
        stats: { attack: 130, defense: 85, health: 1350 }
    },
    {
        name: 'Tails',
        value: 'tails',
        emoji: '🦊',
        description: "A genius fox with two tails. He's the brains of the operation, using his gadgets and flying ability to support the team. Sonic's best friend.",
        stats: { attack: 70, defense: 60, health: 3000 }
    },
    {
        name: 'Shadow',
        value: 'shadow',
        emoji: '🌑',
        description: "The Ultimate Lifeform. Being brought down to earth in asteroid, he's brooding, powerful, and rivals Sonic in speed. He seeks his own path.",
        stats: { attack: 160, defense: 70, health: 1300 }
    },
    {
        name: 'Amy Rose',
        value: 'amy',
        emoji: '🌸',
        description: "A cheerful and determined hedgehog with a giant Piko Piko Hammer. She's the heart of the team and never backs down from a fight.",
        stats: { attack: 50, defense: 110, health: 2600 }
    },
    // ==================== EVOLUTION PETS (Not Adoptable) ====================
    {
        name: 'Super Sonic',
        value: 'supersonic',
        emoji: '⚡✨',
        description: "The legendary transformation! When Sonic absorbs the power of the Chaos Emeralds, he becomes Super Sonic - an invincible golden warrior!",
        stats: { attack: 200, defense: 200, health: 3000 },
        tier: 2,
        evolvesFrom: 'sonic',
        evolutionLevel: 20,
        innateSkill: 'Super Critical',
        isEvolution: true  // Flag to exclude from /adopt
    },
    {
        name: 'Super Shadow',
        value: 'supershadow',
        emoji: '🌑✨',
        description: "The Ultimate Lifeform unleashed! When Shadow harnesses the full power of the Chaos Emeralds, he becomes Super Shadow - unstoppable raw power!",
        stats: { attack: 320, defense: 140, health: 2600 },
        tier: 2,
        evolvesFrom: 'shadow',
        evolutionLevel: 20,
        innateSkill: 'Chaos Fury',
        isEvolution: true
    }
];
