module.exports = [
    // ==================== CHEAP TIER ($50 - $500) ====================
    {
        name: 'Pet Food',
        price: 50,
        description: 'Restores 20 Hunger for your pet.',
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Energy Drink',
        price: 100,
        description: 'Instantly restores 25 Energy to your pet. Perfect for battles!',
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Chili Dog',
        price: 150,
        description: "Sonic's favorite! Restores 30 Hunger AND +5 Affection.",
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Health Pack',
        price: 500,
        description: 'Restores 50 HP for your pet (or repairs Gun +1).',
        type: 'consumable',
        tier: 'cheap'
    },

    // ==================== MEDIUM TIER ($800 - $3,000) ====================
    {
        name: 'Lucky Charm',
        price: 800,
        description: '+10% success chance for stealing or shooting. Passive effect.',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Pet Shield',
        price: 1000,
        description: 'Absorbs 50% damage from pet attacks. Durability: 10.',
        durability: 10,
        type: 'defense',
        tier: 'medium'
    },
    {
        name: 'Shield',
        price: 1200,
        description: 'Protect yourself from one steal or shoot attempt. Disappears after use.',
        durability: 1,
        type: 'defense',
        tier: 'medium'
    },
    {
        name: 'Gun',
        price: 1500,
        description: 'Shoot other users to steal money. Durability: 5 uses.',
        durability: 5,
        type: 'weapon',
        tier: 'medium'
    },
    {
        name: 'Pet Armor',
        price: 1500,
        description: 'Reduces HP loss from starvation by 50%. (Passive)',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Pet Weapon',
        price: 1500,
        description: 'Increases coins earned from grinding by 10%. (Passive)',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Speed Shoes',
        price: 2000,
        description: '+10% coin grinding speed for 24 hours. Stack up to 3x!',
        type: 'consumable',
        duration: 86400000, // 24 hours in ms
        tier: 'medium'
    },
    {
        name: 'Training Weights',
        price: 2500,
        description: 'Permanently grants +5 Defense to one pet. Use wisely!',
        type: 'consumable',
        tier: 'medium'
    },
    {
        name: 'Health Kit',
        price: 3000,
        description: 'Revives a dead pet with 50% HP. Emergency use only!',
        type: 'consumable',
        tier: 'medium'
    },

    // ==================== EXPENSIVE TIER ($5,000+) ====================
    {
        name: 'Mystery Box',
        price: 5000,
        description: 'Random reward! Could contain coins, rare items, or... a JACKPOT!',
        type: 'consumable',
        tier: 'expensive'
    },
    {
        name: 'Golden Ring',
        price: 10000,
        description: '+50% coin generation for your pet. Shows a golden badge on your profile!',
        type: 'passive',
        tier: 'expensive'
    },
    {
        name: 'Chaos Emerald Shard',
        price: 15000,
        description: 'Collect 7 to unlock the Super Form event! (1/7)',
        type: 'collectible',
        tier: 'expensive'
    },
    {
        name: 'Ultimate Serum',
        price: 50000,
        description: 'Permanently boosts one pets base stats by 25%. The ultimate upgrade!',
        type: 'consumable',
        tier: 'legendary'
    },

    // ==================== ACCESSORIES ($2,000 - $25,000) ====================
    {
        name: 'Sunglasses',
        price: 2000,
        description: 'Cool shades for your pet. Pure style, no stats.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: null
    },
    {
        name: 'Golden Gloves',
        price: 5000,
        description: 'Shiny golden gloves. +2 Attack when equipped.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { attack: 2 }
    },
    {
        name: 'Royal Cape',
        price: 10000,
        description: 'A majestic cape fit for royalty. +5 Defense when equipped.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { defense: 5 }
    },
    {
        name: 'Chaos Aura',
        price: 25000,
        description: 'An intimidating aura of chaos energy. +3 Attack, +3 Defense.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { attack: 3, defense: 3 }
    },

    // ==================== SKILL SCROLLS ====================
    {
        name: 'Pet Skill Scroll',
        price: 7500,
        description: 'Teaches your pet a random skill! Skills enhance combat abilities.',
        type: 'skill',
        tier: 'medium'
    },
    {
        name: 'Legendary Skill Scroll',
        price: 20000,
        description: 'Choose ANY skill to teach your pet! Ultimate customization.',
        type: 'skill_choice',
        tier: 'expensive'
    }
];
