module.exports = [
    // ==================== CHEAP TIER ($50 - $500) ====================
    {
        name: 'Pet Food',
        price: 50,
        description: 'Restores 20 Hunger for your pet.',
        usage: '📋 Use: `/pet-action action:feed` to feed your pet.',
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Energy Drink',
        price: 100,
        description: 'Instantly restores 25 Energy to your pet. Perfect for battles!',
        usage: '📋 Use: `/pet-action action:energize` to give your pet an energy drink.',
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Chili Dog',
        price: 150,
        description: "Sonic's favorite! Restores 30 Hunger AND +5 Affection.",
        usage: '📋 Use: `/pet-action action:treat` to give your pet a chili dog.',
        type: 'consumable',
        tier: 'cheap'
    },
    {
        name: 'Health Pack',
        price: 500,
        description: 'Restores 50 HP for your pet (or repairs Gun +1).',
        usage: '📋 Use: `/pet-action action:heal` to heal pet, or `/repair` to fix gun durability.',
        type: 'consumable',
        tier: 'cheap'
    },

    // ==================== MEDIUM TIER ($800 - $3,000) ====================
    {
        name: 'Lucky Charm',
        price: 800,
        description: '+10% success chance for stealing or shooting. Passive effect.',
        usage: '📋 Passive: Automatically active when in your inventory. No action needed!',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Pet Shield',
        price: 1000,
        description: 'Absorbs 50% damage from pet attacks. Durability: 10.',
        usage: '📋 Use: `/pet-action action:equip` to equip on your pet. Auto-activates in combat.',
        durability: 10,
        type: 'defense',
        tier: 'medium'
    },
    {
        name: 'Shield',
        price: 1200,
        description: 'Protect yourself from one steal or shoot attempt. Disappears after use.',
        usage: '📋 Use: `/shield` to activate protection. Blocks the next /steal or /shoot against you.',
        durability: 1,
        type: 'defense',
        tier: 'medium'
    },
    {
        name: 'Gun',
        price: 1500,
        description: 'Shoot other users to steal money. Durability: 5 uses.',
        usage: '📋 Use: `/shoot @user` to attempt stealing coins from another user.',
        durability: 5,
        type: 'weapon',
        tier: 'medium'
    },
    {
        name: 'Pet Armor',
        price: 1500,
        description: 'Reduces HP loss from starvation by 50%. (Passive)',
        usage: '📋 Passive: Automatically protects your pet when in inventory. No action needed!',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Pet Weapon',
        price: 1500,
        description: 'Increases coins earned from grinding by 10%. (Passive)',
        usage: '📋 Passive: Automatically boosts coins during `/pet-action action:grind`. No action needed!',
        type: 'passive',
        tier: 'medium'
    },
    {
        name: 'Speed Shoes',
        price: 2000,
        description: '+10% coin grinding speed for 24 hours. Stack up to 3x!',
        usage: '📋 Use: `/use-item item:Speed Shoes` to activate. Lasts 24 hours, stacks up to 3x (+30%).',
        type: 'consumable',
        duration: 86400000, // 24 hours in ms
        tier: 'medium'
    },
    {
        name: 'Training Weights',
        price: 2500,
        description: 'Permanently grants +5 Defense to one pet. Use wisely!',
        usage: '📋 Use: `/use-item item:Training Weights pet:<pet_name>` to permanently boost defense.',
        type: 'consumable',
        tier: 'medium'
    },
    {
        name: 'Health Kit',
        price: 3000,
        description: 'Revives a dead pet with 50% HP. Emergency use only!',
        usage: '📋 Use: `/pet-action action:revive` to bring back a fainted pet.',
        type: 'consumable',
        tier: 'medium'
    },

    // ==================== EXPENSIVE TIER ($5,000+) ====================
    {
        name: 'Mystery Box',
        price: 5000,
        description: 'Random reward! Could contain coins, rare items, or... a JACKPOT!',
        usage: '📋 Use: `/open [quantity]` to open one or more mystery boxes.',
        type: 'consumable',
        tier: 'expensive'
    },
    {
        name: 'Golden Ring',
        price: 10000,
        description: '+50% coin generation for your pet. Shows a golden badge on your profile!',
        usage: '📋 Passive: Automatically active when in inventory. Boosts all coin earnings!',
        type: 'passive',
        tier: 'expensive'
    },
    {
        name: 'Chaos Emerald Shard',
        price: 15000,
        description: 'Collect 7 to unlock the Super Form event! (1/7)',
        usage: '📋 Collectible: Check progress with `/chaos-emeralds`. Collect all 7 for Super Form!',
        type: 'collectible',
        tier: 'expensive'
    },
    {
        name: 'Ultimate Serum',
        price: 50000,
        description: 'Permanently boosts one pets base stats by 25%. The ultimate upgrade!',
        usage: '📋 Use: `/use-item item:Ultimate Serum pet:<pet_name>` to permanently boost all stats.',
        type: 'consumable',
        tier: 'legendary'
    },

    // ==================== ACCESSORIES ($2,000 - $25,000) ====================
    {
        name: 'Sunglasses',
        price: 2000,
        description: 'Cool shades for your pet. Pure style, no stats.',
        usage: '📋 Use: `/equip accessory:Sunglasses pet:<pet_name>` to equip.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: null
    },
    {
        name: 'Golden Gloves',
        price: 5000,
        description: 'Shiny golden gloves. +2 Attack when equipped.',
        usage: '📋 Use: `/equip accessory:Golden Gloves pet:<pet_name>` to equip.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { attack: 2 }
    },
    {
        name: 'Royal Cape',
        price: 10000,
        description: 'A majestic cape fit for royalty. +5 Defense when equipped.',
        usage: '📋 Use: `/equip accessory:Royal Cape pet:<pet_name>` to equip.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { defense: 5 }
    },
    {
        name: 'Chaos Aura',
        price: 25000,
        description: 'An intimidating aura of chaos energy. +3 Attack, +3 Defense.',
        usage: '📋 Use: `/equip accessory:Chaos Aura pet:<pet_name>` to equip.',
        type: 'accessory',
        tier: 'accessory',
        statBonus: { attack: 3, defense: 3 }
    },

    // ==================== SKILL SCROLLS ====================
    {
        name: 'Pet Skill Scroll',
        price: 7500,
        description: 'Teaches your pet a random skill! Skills enhance combat abilities.',
        usage: '📋 Use: `/teach pet:<pet_name>` to teach a random skill.',
        type: 'skill',
        tier: 'medium'
    },
    {
        name: 'Legendary Skill Scroll',
        price: 20000,
        description: 'Choose ANY skill to teach your pet! Ultimate customization.',
        usage: '📋 Use: `/teach pet:<pet_name> scroll:legendary` to choose any skill.',
        type: 'skill_choice',
        tier: 'expensive'
    }
];
