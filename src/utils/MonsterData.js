/**
 * Monster Data for the Monster Hunt mini-game
 * Each monster has a tier, HP range, time limit, rewards, and flavor text
 */

const MONSTERS = {
    // ==================== COMMON TIER (40% spawn rate) ====================
    common: [
        {
            name: 'Motobug',
            emoji: '🐞',
            description: 'A simple ladybug-shaped Badnik. Easy prey!',
            hp: { min: 500, max: 750 },
            timeLimit: 20,
            rewards: { coins: { min: 50, max: 100 }, xp: 10 },
            art: '```\n  🐞\n /███\\\n```'
        },
        {
            name: 'Buzz Bomber',
            emoji: '🐝',
            description: 'A wasp-like robot that buzzes around annoyingly.',
            hp: { min: 600, max: 900 },
            timeLimit: 20,
            rewards: { coins: { min: 60, max: 120 }, xp: 12 },
            art: '```\n  🐝💨\n~~~===>\n```'
        },
        {
            name: 'Crabmeat',
            emoji: '🦀',
            description: 'A crab robot that pinches but isn\'t very tough.',
            hp: { min: 500, max: 800 },
            timeLimit: 20,
            rewards: { coins: { min: 55, max: 110 }, xp: 11 },
            art: '```\n 🦀🦀🦀\n(  ᐛ  )\n```'
        },
        {
            name: 'Chopper',
            emoji: '🐟',
            description: 'A piranha Badnik that leaps from the water!',
            hp: { min: 400, max: 700 },
            timeLimit: 20,
            rewards: { coins: { min: 45, max: 95 }, xp: 8 },
            art: '```\n  🐟💦\n ><(((º>\n```'
        }
    ],

    // ==================== UNCOMMON TIER (30% spawn rate) ====================
    uncommon: [
        {
            name: 'Badnik Swarm',
            emoji: '🤖',
            description: 'A group of Badniks attacking together! Watch out!',
            hp: { min: 1500, max: 2000 },
            timeLimit: 25,
            rewards: { coins: { min: 150, max: 250 }, xp: 30 },
            art: '```\n🤖🤖🤖🤖\n████████\n🤖🤖🤖🤖\n```'
        },
        {
            name: 'Egg Pawn',
            emoji: '🥚',
            description: 'Eggman\'s basic robot soldier. Tougher than Badniks!',
            hp: { min: 1750, max: 2250 },
            timeLimit: 25,
            rewards: { coins: { min: 180, max: 280 }, xp: 35 },
            art: '```\n  🥚\n [⚙️]\n / \\\n```'
        },
        {
            name: 'Spiny',
            emoji: '🦔',
            description: 'A spiked robot that\'s hard to approach!',
            hp: { min: 1400, max: 1900 },
            timeLimit: 25,
            rewards: { coins: { min: 140, max: 240 }, xp: 28 },
            art: '```\n⚡🦔⚡\n/\\▓▓/\\\n```'
        },
        {
            name: 'Caterkiller',
            emoji: '🐛',
            description: 'A segmented caterpillar robot. Each segment is armored!',
            hp: { min: 2000, max: 2500 },
            timeLimit: 25,
            rewards: { coins: { min: 200, max: 300 }, xp: 40 },
            art: '```\n🐛-🐛-🐛-🐛\n===========>\n```'
        }
    ],

    // ==================== RARE TIER (20% spawn rate) ====================
    rare: [
        {
            name: 'Egg Hammer',
            emoji: '🔨',
            description: 'A massive hammer-wielding Egg Pawn. Hits HARD!',
            hp: { min: 4000, max: 5000 },
            timeLimit: 30,
            rewards: { coins: { min: 400, max: 600 }, xp: 80 },
            art: '```\n   🔨\n  [🥚]\n  /██\\\n```'
        },
        {
            name: 'E-100 Alpha',
            emoji: '🤖',
            description: 'One of Eggman\'s elite E-Series robots!',
            hp: { min: 4500, max: 5500 },
            timeLimit: 30,
            rewards: { coins: { min: 500, max: 700 }, xp: 90 },
            art: '```\n ⚡🤖⚡\n[█████]\n  🦿🦿\n```'
        },
        {
            name: 'Chaos 0',
            emoji: '💧',
            description: 'A watery creature of pure chaos energy!',
            hp: { min: 5000, max: 6000 },
            timeLimit: 30,
            rewards: { coins: { min: 550, max: 750 }, xp: 100 },
            art: '```\n  💧💧\n 💧😈💧\n💧💧💧💧\n```'
        },
        {
            name: 'Shadow Android',
            emoji: '🦔',
            description: 'A robotic copy of the Ultimate Lifeform!',
            hp: { min: 4750, max: 5750 },
            timeLimit: 30,
            rewards: { coins: { min: 520, max: 720 }, xp: 95 },
            art: '```\n  ⬛🔴\n [🦔]\n ⚡⚡⚡\n```'
        }
    ],

    // ==================== LEGENDARY TIER (10% spawn rate) ====================
    legendary: [
        {
            name: 'Death Egg Robot',
            emoji: '🤖',
            description: 'Eggman\'s ultimate creation! A towering mechanical menace!',
            hp: { min: 10000, max: 12500 },
            timeLimit: 45,
            rewards: { coins: { min: 1000, max: 1500 }, xp: 200 },
            art: '```\n  🔴👁️🔴\n ███████\n[███🤖███]\n  🦿  🦿\n```'
        },
        {
            name: 'Perfect Chaos',
            emoji: '🌊',
            description: 'The god of destruction in its ultimate form!',
            hp: { min: 11000, max: 14000 },
            timeLimit: 45,
            rewards: { coins: { min: 1200, max: 1800 }, xp: 250 },
            art: '```\n🌊🌊😈🌊🌊\n💧💧💧💧💧\n```'
        },
        {
            name: 'Mephiles the Dark',
            emoji: '👁️',
            description: 'A being of pure darkness. Truly terrifying!',
            hp: { min: 12500, max: 15000 },
            timeLimit: 45,
            rewards: { coins: { min: 1500, max: 2000 }, xp: 300 },
            art: '```\n  🖤👁️🖤\n ⬛⬛⬛⬛\n💜💜💜💜💜\n```'
        },
        {
            name: 'Metal Overlord',
            emoji: '🦾',
            description: 'Metal Sonic\'s ultimate transformation! ALL LIVING THINGS KNEEL!',
            hp: { min: 14000, max: 17500 },
            timeLimit: 45,
            rewards: { coins: { min: 1800, max: 2500 }, xp: 350 },
            art: '```\n🔴⚡🦾⚡🔴\n[███████]\n 🔥🔥🔥🔥\n```'
        }
    ]
};

// Spawn weights for each tier
const TIER_WEIGHTS = {
    common: 40,
    uncommon: 30,
    rare: 20,
    legendary: 10
};

/**
 * Get a random monster based on tier weights
 * @param {boolean} guaranteeRare - If true, only spawn rare or legendary (for Monster Lure item)
 * @returns {Object} Monster object with all properties
 */
function getRandomMonster(guaranteeRare = false) {
    let tierWeights = { ...TIER_WEIGHTS };
    
    if (guaranteeRare) {
        // Monster Lure: Only rare (60%) or legendary (40%)
        tierWeights = { common: 0, uncommon: 0, rare: 60, legendary: 40 };
    }
    
    // Calculate total weight
    const totalWeight = Object.values(tierWeights).reduce((a, b) => a + b, 0);
    
    // Roll for tier
    let roll = Math.random() * totalWeight;
    let selectedTier = 'common';
    
    for (const [tier, weight] of Object.entries(tierWeights)) {
        roll -= weight;
        if (roll <= 0) {
            selectedTier = tier;
            break;
        }
    }
    
    // Get random monster from selected tier
    const tierMonsters = MONSTERS[selectedTier];
    const monster = tierMonsters[Math.floor(Math.random() * tierMonsters.length)];
    
    // Generate actual HP and rewards within range
    return {
        ...monster,
        tier: selectedTier,
        maxHp: Math.floor(Math.random() * (monster.hp.max - monster.hp.min + 1)) + monster.hp.min,
        coinReward: Math.floor(Math.random() * (monster.rewards.coins.max - monster.rewards.coins.min + 1)) + monster.rewards.coins.min,
        xpReward: monster.rewards.xp
    };
}

/**
 * Generate an HP bar visual
 * @param {number} current - Current HP
 * @param {number} max - Maximum HP
 * @param {number} length - Bar length in characters
 * @returns {string} HP bar string
 */
function generateHPBar(current, max, length = 20) {
    const percentage = Math.max(0, current / max);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    
    // Color coding based on percentage
    let color = '🟩'; // Green > 50%
    if (percentage <= 0.25) color = '🟥'; // Red <= 25%
    else if (percentage <= 0.50) color = '🟧'; // Orange <= 50%
    else if (percentage <= 0.75) color = '🟨'; // Yellow <= 75%
    
    const bar = color.repeat(filled) + '⬛'.repeat(empty);
    return `[${bar}] ${current}/${max}`;
}

/**
 * Get tier color for embeds
 */
function getTierColor(tier) {
    const colors = {
        common: 0x808080,    // Gray
        uncommon: 0x00FF00,  // Green
        rare: 0x0099FF,      // Blue
        legendary: 0xFFD700  // Gold
    };
    return colors[tier] || 0x808080;
}

/**
 * Get tier display name with emoji
 */
function getTierDisplay(tier) {
    const displays = {
        common: '⚪ Common',
        uncommon: '🟢 Uncommon',
        rare: '🔵 Rare',
        legendary: '🌟 LEGENDARY'
    };
    return displays[tier] || '⚪ Common';
}

module.exports = {
    MONSTERS,
    TIER_WEIGHTS,
    getRandomMonster,
    generateHPBar,
    getTierColor,
    getTierDisplay
};
