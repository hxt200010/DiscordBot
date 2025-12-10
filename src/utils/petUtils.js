/**
 * Calculate work gains for a pet, including passive item effects
 * @param {Object} pet - The pet object
 * @param {Array} userInventory - Optional: User's inventory items for passive bonuses
 * @param {Object} userBoosts - Optional: User's active boosts (e.g., speedShoesBoost)
 */
const calculateWorkGains = (pet, userInventory = [], userBoosts = {}) => {
    if (!pet.isWorking || !pet.lastWorkUpdate) {
        return { coins: 0, xp: 0, timeWorked: 0, hungerLost: 0, hpLost: 0, isDead: false };
    }

    const now = Date.now();
    const msWorked = now - pet.lastWorkUpdate;
    const hoursWorked = msWorked / (1000 * 60 * 60);

    if (hoursWorked <= 0) return { coins: 0, xp: 0, timeWorked: 0, hungerLost: 0, hpLost: 0, isDead: false };

    // Get pet skills for passive bonuses
    const skills = pet.skills || [];

    // Helper to check if user has item in inventory
    const hasItem = (itemName) => userInventory.some(i => i.name === itemName);

    // Formulas:
    // Coins = 10 + (Level * 5) per hour
    // XP = 2.5 per hour
    // Hunger Loss = 1 per hour
    // HP Loss (if Hunger <= 0) = 10 per hour

    let coinsEarned = Math.floor((10 + (pet.level * 5)) * hoursWorked);
    let xpEarned = 2.5 * hoursWorked;

    // Apply Ring Collector skill: +20% coins
    if (skills.includes('Ring Collector')) {
        coinsEarned = Math.floor(coinsEarned * 1.2);
    }

    // Apply PASSIVE ITEM BONUSES

    // Pet Weapon: +10% coins from grinding
    if (hasItem('Pet Weapon')) {
        coinsEarned = Math.floor(coinsEarned * 1.1);
    }

    // Golden Ring: +50% all coin generation
    if (hasItem('Golden Ring')) {
        coinsEarned = Math.floor(coinsEarned * 1.5);
    }

    // Speed Shoes boost: +10% per stack (max 30%)
    if (userBoosts.speedShoesBoost && 
        userBoosts.speedShoesBoost.stacks > 0 && 
        userBoosts.speedShoesBoost.expiresAt > now) {
        const speedBonus = 1 + (userBoosts.speedShoesBoost.stacks * 0.1);
        coinsEarned = Math.floor(coinsEarned * speedBonus);
    }

    // Apply Quick Learner skill: +25% XP
    if (skills.includes('Quick Learner')) {
        xpEarned = xpEarned * 1.25;
    }

    const hungerLost = 1 * hoursWorked;
    let hpLost = 0;

    // Check if hunger will drop to 0
    // We need to calculate how much time was spent at 0 hunger
    // Initial Hunger: pet.stats.hunger
    // Time until 0 hunger: pet.stats.hunger / 1 (hours)

    const timeToStarve = pet.stats.hunger / 1;

    if (hoursWorked > timeToStarve) {
        // Time spent starving
        const starvingHours = hoursWorked - timeToStarve;
        hpLost = 10 * starvingHours;

        // Pet Armor: -50% starvation HP loss
        if (hasItem('Pet Armor')) {
            hpLost = Math.floor(hpLost * 0.5);
        }
    }

    // Apply Healing Factor skill: +5 HP/hour (counters HP loss)
    if (skills.includes('Healing Factor')) {
        const hpHealed = 5 * hoursWorked;
        hpLost = Math.max(0, hpLost - hpHealed);
    }

    // Check for death
    let isDead = false;
    if ((pet.hp - hpLost) <= 0) {
        isDead = true;
    }

    // Check for level up
    checkLevelUp(pet);

    return {
        coins: coinsEarned,
        xp: xpEarned,
        timeWorked: msWorked,
        hungerLost: hungerLost,
        hpLost: hpLost,
        isDead: isDead
    };
};

/**
 * Apply work gains to a pet and update its state
 * @param {Object} pet - The pet object
 * @param {Array} userInventory - Optional: User's inventory items for passive bonuses
 * @param {Object} userBoosts - Optional: User's active boosts
 */
const applyWorkGains = (pet, userInventory = [], userBoosts = {}) => {
    const gains = calculateWorkGains(pet, userInventory, userBoosts);

    if (gains.timeWorked > 0) {
        pet.xp += gains.xp;

        // Apply Hunger Loss
        pet.stats.hunger = Math.max(0, pet.stats.hunger - gains.hungerLost);

        // Apply HP Loss
        if (gains.hpLost > 0) {
            pet.hp = Math.max(0, pet.hp - gains.hpLost);
        }

        // Apply Death
        if (pet.hp <= 0) {
            pet.isDead = true;
            pet.isWorking = false; // Stop working if dead
            pet.lastWorkUpdate = null;
        } else {
            // Only update timestamp if still alive and working
            pet.lastWorkUpdate = Date.now();
        }

        // Check for level up after applying gains
        checkLevelUp(pet);
    }

    return gains;
};

const checkLevelUp = (pet) => {
    let leveledUp = false;
    // XP needed for next level: level * 20
    while (pet.xp >= pet.level * 20) {
        pet.xp -= pet.level * 20;
        pet.level += 1;

        // Increase stats on level up
        pet.maxHp = (pet.maxHp || 100) + 10; // Always +10 MaxHP
        pet.hp = pet.maxHp; // Full heal

        // Sync top-level HP if it exists (though usually we use pet.hp)
        if (pet.stats) {
            pet.stats.health = pet.maxHp;
        }

        // Alternating Stats:
        // Level 2 (Even): +3 Attack
        // Level 3 (Odd): +3 Defense
        // Level 4 (Even): +3 Attack
        // ...
        if (pet.level % 2 === 0) {
            pet.stats.attack += 3;
            // Sync top-level attack if it exists
            if (pet.attack !== undefined) pet.attack = pet.stats.attack;
        } else {
            pet.stats.defense += 3;
            // Sync top-level defense if it exists
            if (pet.defense !== undefined) pet.defense = pet.stats.defense;
        }

        leveledUp = true;
    }
    return leveledUp;
};

module.exports = { calculateWorkGains, applyWorkGains, checkLevelUp };

