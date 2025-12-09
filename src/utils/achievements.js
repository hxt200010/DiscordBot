// Achievement Definitions
// Track user progress and unlock rewards

const ACHIEVEMENTS = {
    // ==================== COMBAT ====================
    'First Blood': {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Win your first pet battle',
        requirement: { type: 'battles_won', count: 1 },
        reward: { coins: 500 }
    },
    'Warrior': {
        id: 'warrior',
        name: 'Warrior',
        description: 'Win 10 pet battles',
        requirement: { type: 'battles_won', count: 10 },
        reward: { coins: 2000 }
    },
    'Champion': {
        id: 'champion',
        name: 'Champion',
        description: 'Win 50 pet battles',
        requirement: { type: 'battles_won', count: 50 },
        reward: { coins: 10000 }
    },

    // ==================== PETS ====================
    'Pet Owner': {
        id: 'pet_owner',
        name: 'Pet Owner',
        description: 'Adopt your first pet',
        requirement: { type: 'pets_adopted', count: 1 },
        reward: { coins: 100 }
    },
    'Collector': {
        id: 'collector',
        name: 'Collector',
        description: 'Own 5 different pets',
        requirement: { type: 'pets_owned', count: 5 },
        reward: { coins: 3000 }
    },
    'Master Trainer': {
        id: 'master_trainer',
        name: 'Master Trainer',
        description: 'Level up a pet to level 10',
        requirement: { type: 'pet_level', count: 10 },
        reward: { coins: 5000 }
    },
    'Legend Trainer': {
        id: 'legend_trainer',
        name: 'Legend Trainer',
        description: 'Level up a pet to level 25',
        requirement: { type: 'pet_level', count: 25 },
        reward: { coins: 15000 }
    },

    // ==================== ECONOMY ====================
    'First Paycheck': {
        id: 'first_paycheck',
        name: 'First Paycheck',
        description: 'Earn your first coins from grinding',
        requirement: { type: 'coins_earned', count: 1 },
        reward: { coins: 50 }
    },
    'Worker': {
        id: 'worker',
        name: 'Worker',
        description: 'Earn 10,000 coins from grinding',
        requirement: { type: 'coins_earned', count: 10000 },
        reward: { coins: 1000 }
    },
    'Tycoon': {
        id: 'tycoon',
        name: 'Tycoon',
        description: 'Have 100,000 coins at once',
        requirement: { type: 'balance', count: 100000 },
        reward: { coins: 5000 }
    },

    // ==================== SKILLS ====================
    'Scholar': {
        id: 'scholar',
        name: 'Scholar',
        description: 'Teach your pet their first skill',
        requirement: { type: 'skills_learned', count: 1 },
        reward: { coins: 500 }
    },
    'Master of All': {
        id: 'master_of_all',
        name: 'Master of All',
        description: 'Teach a pet all 9 skills',
        requirement: { type: 'skills_learned', count: 9 },
        reward: { coins: 25000 }
    },

    // ==================== GAMBLING ====================
    'Lucky Spinner': {
        id: 'lucky_spinner',
        name: 'Lucky Spinner',
        description: 'Use the daily wheel 7 days in a row',
        requirement: { type: 'wheel_streak', count: 7 },
        reward: { coins: 2000 }
    },
    'Jackpot': {
        id: 'jackpot',
        name: 'Jackpot!',
        description: 'Hit a jackpot from the daily wheel',
        requirement: { type: 'jackpots_hit', count: 1 },
        reward: { coins: 1000 }
    },
    'Mystery Hunter': {
        id: 'mystery_hunter',
        name: 'Mystery Hunter',
        description: 'Open 10 Mystery Boxes',
        requirement: { type: 'boxes_opened', count: 10 },
        reward: { coins: 2500 }
    },

    // ==================== SPECIAL ====================
    'Fashionista': {
        id: 'fashionista',
        name: 'Fashionista',
        description: 'Equip an accessory on your pet',
        requirement: { type: 'accessories_equipped', count: 1 },
        reward: { coins: 500 }
    },
    'Chaos Collector': {
        id: 'chaos_collector',
        name: 'Chaos Collector',
        description: 'Collect 7 Chaos Emerald Shards',
        requirement: { type: 'chaos_shards', count: 7 },
        reward: { coins: 50000 }
    }
};

function getAchievement(id) {
    return ACHIEVEMENTS[id] || Object.values(ACHIEVEMENTS).find(a => a.id === id);
}

function getAllAchievements() {
    return Object.values(ACHIEVEMENTS);
}

// Check if user qualifies for any new achievements and unlock them
async function checkAndUnlockAchievements(userId, User, EconomySystem = null) {
    const user = await User.findOne({ userId });
    if (!user) return [];

    const unlockedIds = user.achievements || [];
    const userStats = user.stats || {};
    const newUnlocks = [];

    for (const achievement of Object.values(ACHIEVEMENTS)) {
        // Skip if already unlocked
        if (unlockedIds.includes(achievement.id)) continue;

        const req = achievement.requirement;
        let current = 0;

        switch (req.type) {
            case 'battles_won':
                current = userStats.battlesWon || 0;
                break;
            case 'pets_adopted':
                current = userStats.petsAdopted || 0;
                break;
            case 'pets_owned':
                // This needs pet count - handled separately
                continue;
            case 'pet_level':
                // This needs max pet level - handled separately
                continue;
            case 'coins_earned':
                current = userStats.coinsEarned || 0;
                break;
            case 'skills_learned':
                current = userStats.skillsLearned || 0;
                break;
            case 'boxes_opened':
                current = userStats.boxesOpened || 0;
                break;
            case 'accessories_equipped':
                current = userStats.accessoriesEquipped || 0;
                break;
            case 'jackpots_hit':
                current = userStats.jackpotsHit || 0;
                break;
            case 'wheel_streak':
                current = userStats.wheelStreak || 0;
                break;
            case 'balance':
                current = user.balance || 0;
                break;
            case 'chaos_shards':
                // Check inventory for chaos shards
                continue;
            default:
                continue;
        }

        // Check if requirement met
        if (current >= req.count) {
            newUnlocks.push(achievement);
            unlockedIds.push(achievement.id);

            // Award coins
            if (achievement.reward.coins && EconomySystem) {
                await EconomySystem.addBalance(userId, achievement.reward.coins);
            }
        }
    }

    // Save unlocked achievements
    if (newUnlocks.length > 0) {
        await User.findOneAndUpdate({ userId }, { achievements: unlockedIds });
    }

    return newUnlocks;
}

// Update a specific user stat and check for achievements
async function updateUserStat(userId, statName, increment, User) {
    const updateObj = {};
    updateObj[`stats.${statName}`] = increment;

    await User.findOneAndUpdate(
        { userId },
        { $inc: updateObj },
        { upsert: true }
    );
}

module.exports = {
    ACHIEVEMENTS,
    getAchievement,
    getAllAchievements,
    checkAndUnlockAchievements,
    updateUserStat
};
