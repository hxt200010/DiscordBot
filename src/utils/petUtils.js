const calculateWorkGains = (pet) => {
    if (!pet.isWorking || !pet.lastWorkUpdate) {
        return { coins: 0, xp: 0, timeWorked: 0 };
    }

    const now = Date.now();
    const msWorked = now - pet.lastWorkUpdate;
    const hoursWorked = msWorked / (1000 * 60 * 60);

    if (hoursWorked <= 0) return { coins: 0, xp: 0, timeWorked: 0 };

    // Formulas:
    // Coins = Level * Hours
    // XP = 0.5 * Hours

    const coinsEarned = Math.floor(pet.level * hoursWorked);
    const xpEarned = 0.5 * hoursWorked;

    return {
        coins: coinsEarned,
        xp: xpEarned,
        timeWorked: msWorked
    };
};

const applyWorkGains = (pet) => {
    const gains = calculateWorkGains(pet);

    if (gains.timeWorked > 0) {
        pet.xp += gains.xp;
        // Coins are usually stored in user's economy, not on the pet object directly, 
        // but the prompt says "increase coins as it level up" and "work = 1 coins per hour".
        // I'll return the coin amount so the caller can add it to the user's balance.

        // Update lastWorkUpdate to now so we don't double count if we call this multiple times
        pet.lastWorkUpdate = Date.now();
    }

    return gains;
};

module.exports = { calculateWorkGains, applyWorkGains };
