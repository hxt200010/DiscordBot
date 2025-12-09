// Pet Skills Configuration
// Each skill has: name, description, type (passive/active), effect

const SKILLS = {
    // ==================== ATTACK SKILLS ====================
    'Spin Dash': {
        name: 'Spin Dash',
        emoji: '🌀',
        description: '50% chance to deal double damage on attack.',
        type: 'active',
        effect: 'doubleDamageChance',
        value: 0.5
    },
    'Chaos Spear': {
        name: 'Chaos Spear',
        emoji: '⚡',
        description: 'Deals bonus damage equal to 20% of your Attack.',
        type: 'active',
        effect: 'bonusDamagePercent',
        value: 0.2
    },
    'Hammer Strike': {
        name: 'Hammer Strike',
        emoji: '🔨',
        description: '25% chance to stun opponent (skip their next attack).',
        type: 'active',
        effect: 'stunChance',
        value: 0.25
    },

    // ==================== DEFENSE SKILLS ====================
    'Chaos Control': {
        name: 'Chaos Control',
        emoji: '⏱️',
        description: '20% chance to completely dodge an incoming attack.',
        type: 'passive',
        effect: 'dodgeChance',
        value: 0.2
    },
    'Iron Wall': {
        name: 'Iron Wall',
        emoji: '🛡️',
        description: 'Reduce all incoming damage by 15%.',
        type: 'passive',
        effect: 'damageReduction',
        value: 0.15
    },

    // ==================== UTILITY SKILLS ====================
    'Healing Factor': {
        name: 'Healing Factor',
        emoji: '💚',
        description: 'Regenerate 5 HP every hour passively.',
        type: 'passive',
        effect: 'hpRegen',
        value: 5
    },
    'Iron Will': {
        name: 'Iron Will',
        emoji: '💪',
        description: 'Reduce energy drain by 25% during combat.',
        type: 'passive',
        effect: 'energySave',
        value: 0.25
    },
    'Ring Collector': {
        name: 'Ring Collector',
        emoji: '💰',
        description: '+20% coins from grinding.',
        type: 'passive',
        effect: 'grindBonus',
        value: 0.2
    },
    'Quick Learner': {
        name: 'Quick Learner',
        emoji: '📚',
        description: '+25% XP from all sources.',
        type: 'passive',
        effect: 'xpBonus',
        value: 0.25
    }
};

// Get a random skill (for Skill Scrolls)
function getRandomSkill() {
    const skillNames = Object.keys(SKILLS);
    return skillNames[Math.floor(Math.random() * skillNames.length)];
}

// Get skill data by name
function getSkill(name) {
    return SKILLS[name] || null;
}

// Get all skills
function getAllSkills() {
    return Object.values(SKILLS);
}

module.exports = {
    SKILLS,
    getRandomSkill,
    getSkill,
    getAllSkills
};
