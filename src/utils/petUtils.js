const calculateWorkGains = (pet) => {
    if (!pet.isWorking || !pet.lastWorkUpdate) {
        return { coins: 0, xp: 0, timeWorked: 0, hungerLost: 0, hpLost: 0, isDead: false };
    }

    const now = Date.now();
    const msWorked = now - pet.lastWorkUpdate;
    const hoursWorked = msWorked / (1000 * 60 * 60);

    if (hoursWorked <= 0) return { coins: 0, xp: 0, timeWorked: 0, hungerLost: 0, hpLost: 0, isDead: false };

    // Formulas:
    // Coins = 10 + (Level * 5) per hour
    // XP = 2.5 per hour
    // Hunger Loss = 1 per hour
    // HP Loss (if Hunger <= 0) = 10 per hour

    const coinsEarned = Math.floor((10 + (pet.level * 5)) * hoursWorked);
    const xpEarned = 2.5 * hoursWorked;

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
    }

    // Check for death
    let isDead = false;
    if ((pet.hp - hpLost) <= 0) {
        isDead = true;
        // Cap HP loss to exact death amount for display, or just let it go negative internally then fix?
        // Let's just flag it. The caller will handle setting HP to 0.
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

const applyWorkGains = (pet) => {
    const gains = calculateWorkGains(pet);

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
            // If we stopped working, the caller handles nulling lastWorkUpdate
            // But applyWorkGains is called when checking status too.
            // So we update timestamp to "now" so we don't re-calculate the same decay next time.
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
        pet.maxHp += 10; // Always +10 MaxHP
        pet.hp = pet.maxHp; // Full heal

        // Alternating Stats:
        // Level 2 (Even): +3 Attack
        // Level 3 (Odd): +3 Defense
        // Level 4 (Even): +3 Attack
        // ...
        if (pet.level % 2 === 0) {
            pet.stats.attack += 3;
        } else {
            pet.stats.defense += 3;
        }

        leveledUp = true;
    }
    return leveledUp;
};

module.exports = { calculateWorkGains, applyWorkGains, checkLevelUp };
