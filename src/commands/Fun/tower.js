const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const economy = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');
const User = require('../../models/User');
const { checkLevelUp, checkEvolution, applyCriticalDamage } = require('../../utils/petUtils');

const activeGames = new Map();

// Energy cost per attack
const ENERGY_PER_ATTACK = 10;

// XP rewards per enemy type
const ENEMY_XP = {
    rat: 2,
    wolf: 5,
    bear: 10,
    dragon: 25,
    hydra: 40,
    titan: 60,
    demon: 100
};

// Enemy types with stats
// Rebalanced enemy stats (1.5x HP, ~1.4x damage) to account for combined pet defense
const ENEMIES = {
    rat: { emoji: '🐀', name: 'Rat', health: 30, damage: 8, speed: 'Fast', points: 10 },
    wolf: { emoji: '🐺', name: 'Wolf', health: 60, damage: 22, speed: 'Medium', points: 25 },
    bear: { emoji: '🐻', name: 'Bear', health: 120, damage: 35, speed: 'Slow', points: 50 },
    dragon: { emoji: '🐉', name: 'Dragon', health: 225, damage: 70, speed: 'Boss', points: 150 },
    // Endless mode enemies
    hydra: { emoji: '🐲', name: 'Hydra', health: 300, damage: 85, speed: 'Boss', points: 200 },
    titan: { emoji: '👹', name: 'Titan', health: 450, damage: 110, speed: 'Boss', points: 350 },
    demon: { emoji: '😈', name: 'Demon Lord', health: 750, damage: 140, speed: 'Boss', points: 500 }
};

// Wave configurations (first 5 waves are standard, beyond that is endless)
const WAVES = [
    { enemies: ['rat', 'rat', 'rat'], name: 'Wave 1: Rat Swarm' },
    { enemies: ['rat', 'wolf', 'rat', 'wolf'], name: 'Wave 2: Wolf Pack' },
    { enemies: ['wolf', 'wolf', 'bear'], name: 'Wave 3: Forest Assault' },
    { enemies: ['bear', 'wolf', 'bear', 'wolf'], name: 'Wave 4: Beast Onslaught' },
    { enemies: ['dragon'], name: 'Wave 5: DRAGON BOSS' }
];

// Generate endless wave enemies (waves 6+)
function generateEndlessWave(waveNum) {
    const waveIndex = waveNum - 5;
    const enemies = [];
    
    if (waveNum <= 7) {
        enemies.push('dragon');
        for (let i = 0; i < waveIndex; i++) enemies.push('bear');
    } else if (waveNum <= 10) {
        enemies.push('hydra');
        for (let i = 0; i < waveIndex - 2; i++) enemies.push('dragon');
    } else if (waveNum <= 15) {
        enemies.push('titan');
        for (let i = 0; i < Math.min(waveIndex - 5, 3); i++) enemies.push('hydra');
    } else {
        enemies.push('demon');
        for (let i = 0; i < Math.min(waveIndex - 10, 2); i++) enemies.push('titan');
    }
    
    return {
        enemies,
        name: `Wave ${waveNum}: ${getWaveName(waveNum)}`
    };
}

function getWaveName(waveNum) {
    if (waveNum <= 7) return '⚡ Dragon\'s Wrath';
    if (waveNum <= 10) return '🌊 Hydra Onslaught';
    if (waveNum <= 15) return '💀 Titan Siege';
    return '🔥 DEMON INVASION';
}

// Rewards based on waves survived (with streak multiplier) - 30% boost
function getReward(wavesSurvived, towerHp, streak = 0) {
    let reward = 0;
    
    if (wavesSurvived <= 5) {
        // Base rewards: +30% from original
        const baseRewards = { 5: 1060, 4: 530, 3: 265, 2: 132, 1: 67, 0: 0 };
        reward = baseRewards[wavesSurvived] || 0;
    } else {
        // Endless mode: +30% scaling
        reward = 1060 + (wavesSurvived - 5) * 265 + Math.pow(wavesSurvived - 5, 2) * 67;
    }
    
    // Tower HP bonus: +30% (5→6.5)
    if (wavesSurvived >= 5 && towerHp > 0) {
        reward += Math.floor(towerHp * 6.5);
    }
    
    const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;
    reward = Math.floor(reward * streakMultiplier);
    
    return { reward, streakMultiplier };
}

// Create health bar visualization
function createHealthBar(current, max, length = 10) {
    const filled = Math.max(0, Math.round((current / max) * length));
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${current}/${max}`;
}

// Create energy bar
function createEnergyBar(energy) {
    const filled = Math.max(0, Math.round(energy / 10));
    const empty = 10 - filled;
    return `${'⚡'.repeat(Math.min(filled, 3))}${'█'.repeat(Math.max(0, filled - 3))}${'░'.repeat(empty)} ${energy}/100`;
}

// Create game embed with pet queue display
function createGameEmbed(game, message = '') {
    const embed = new EmbedBuilder()
        .setTitle(`🏰 TOWER DEFENSE 🏰`)
        .setColor(game.towerHp > 50 ? 0x00FF00 : game.towerHp > 25 ? 0xFFAA00 : 0xFF0000);

    // Tower status with combined defense
    const { effectiveDefense, petCount } = calculateCombinedDefense(game);
    let description = `**🏰 Tower Health:** ${createHealthBar(game.towerHp, game.maxTowerHp, 15)}\n`;
    description += `**🛡️ Tower Defense:** ${effectiveDefense} (from ${petCount} pets)\n\n`;
    
    // Current attacking pet with energy
    const activePet = game.petQueue[game.activePetIndex];
    description += `**⚔️ ACTIVE PET:**\n`;
    description += `🐾 **${activePet.petName}** (${activePet.type})\n`;
    description += `   ATK: ${activePet.stats.attack} | DEF: ${activePet.stats.defense} | LVL: ${activePet.level}\n`;
    description += `   ⚡ Energy: ${createEnergyBar(activePet.stats.energy)}\n`;
    description += `   📊 XP: ${Math.floor(activePet.xp)}/${activePet.level * 20}\n\n`;
    
    // Pet queue (next pets sorted by ATK)
    if (game.petQueue.length > 1) {
        description += `**🔄 PET QUEUE** (sorted by ATK):\n`;
        game.petQueue.forEach((pet, idx) => {
            if (idx === game.activePetIndex) return; // Skip active pet
            const energyStatus = pet.stats.energy >= ENERGY_PER_ATTACK ? '✅' : '❌';
            description += `${energyStatus} ${pet.petName} (ATK:${pet.stats.attack} | ⚡${pet.stats.energy})\n`;
        });
        description += '\n';
    }
    
    // Energy drinks and streak
    if (game.energyDrinks > 0) {
        description += `**🧃 Energy Drinks:** ${game.energyDrinks}\n`;
    }
    if (game.streak > 0) {
        description += `**🔥 Streak:** ${game.streak}x (+${Math.min(game.streak, 10) * 10}% coins)\n`;
    }
    description += '\n';
    
    // Current wave
    const waveName = game.currentWave < 5 ? WAVES[game.currentWave].name : generateEndlessWave(game.currentWave + 1).name;
    description += `**📢 ${waveName}**\n\n`;
    
    // Enemies
    description += `**🎯 Enemies:**\n`;
    game.currentEnemies.forEach((enemy) => {
        if (enemy.alive) {
            description += `${enemy.emoji} **${enemy.name}** - ${createHealthBar(enemy.hp, enemy.maxHp, 8)}\n`;
        } else {
            description += `~~${enemy.emoji} ${enemy.name}~~ 💀\n`;
        }
    });
    
    // Score and wave info
    description += `\n**🏆 Score:** ${game.score} | **Wave:** ${game.currentWave + 1}${game.currentWave >= 5 ? ' (ENDLESS!)' : '/5'}`;
    
    // Message
    if (message) {
        description += `\n\n${message}`;
    }

    embed.setDescription(description);
    embed.setFooter({ text: `Entry: $${game.entryFee} | ${ENERGY_PER_ATTACK} energy per attack` });
    embed.setTimestamp();
    
    return embed;
}

// Create attack buttons + utility row
function createAttackButtons(game, disabled = false) {
    const rows = [];
    const aliveEnemies = game.currentEnemies.filter(e => e.alive);
    const activePet = game.petQueue[game.activePetIndex];
    const hasEnergy = activePet.stats.energy >= ENERGY_PER_ATTACK;
    
    if (aliveEnemies.length === 0 || disabled) {
        return [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('disabled')
                .setLabel('No Targets')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        )];
    }

    // Attack buttons - disabled if no energy
    const attackButtons = aliveEnemies.slice(0, 4).map((enemy) => 
        new ButtonBuilder()
            .setCustomId(`attack_${game.currentEnemies.indexOf(enemy)}`)
            .setLabel(`⚔️ ${enemy.emoji} ${enemy.name}`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled || !hasEnergy)
    );
    rows.push(new ActionRowBuilder().addComponents(attackButtons));
    
    // Utility row: Energy Drink buttons
    const utilityButtons = [];
    
    // Energy Drink button
    utilityButtons.push(
        new ButtonBuilder()
            .setCustomId('use_energy_drink')
            .setLabel(`⚡ Use Drink (${game.energyDrinks || 0})`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled || game.energyDrinks <= 0)
    );
    
    // Buy Energy Drink button
    utilityButtons.push(
        new ButtonBuilder()
            .setCustomId('buy_energy_drink')
            .setLabel(`💰 Buy Drink ($100)`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
    
    rows.push(new ActionRowBuilder().addComponents(utilityButtons));
    
    // Pet selection dropdown (if multiple pets)
    if (game.petQueue.length > 1) {
        const petOptions = game.petQueue.map((pet, idx) => ({
            label: pet.petName,
            description: `ATK: ${pet.stats.attack} | DEF: ${pet.stats.defense} | ⚡ ${pet.stats.energy}`,
            value: `pet_${idx}`,
            emoji: pet.stats.energy >= ENERGY_PER_ATTACK ? '✅' : '❌',
            default: idx === game.activePetIndex
        }));
        
        const petSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_pet')
            .setPlaceholder('🔄 Select a pet to switch to...')
            .addOptions(petOptions);
        
        rows.push(new ActionRowBuilder().addComponents(petSelectMenu));
    }
    
    return rows;
}

// Spawn enemies for a wave
function spawnWave(waveIndex) {
    let waveConfig;
    
    if (waveIndex < 5) {
        waveConfig = WAVES[waveIndex];
    } else {
        waveConfig = generateEndlessWave(waveIndex + 1);
    }
    
    return waveConfig.enemies.map((type, index) => {
        const baseEnemy = ENEMIES[type];
        const enemy = { ...baseEnemy };
        
        if (waveIndex >= 5) {
            const scaling = 1 + (waveIndex - 5) * 0.10; // Reduced from 0.15 to 0.10
            enemy.hp = Math.floor(enemy.health * scaling);
            enemy.maxHp = enemy.hp;
            enemy.damage = Math.floor(enemy.damage * scaling);
            enemy.points = Math.floor(enemy.points * scaling);
        } else {
            enemy.hp = enemy.health;
            enemy.maxHp = enemy.health;
        }
        
        enemy.alive = true;
        enemy.id = index;
        return enemy;
    });
}

// Calculate combined defense from ALL user's pets (with diminishing returns)
function calculateCombinedDefense(game) {
    const totalDefense = game.allUserPets.reduce((sum, pet) => sum + (pet.stats?.defense || pet.defense || 0), 0);
    // Diminishing returns: sqrt scaling so stacking many pets isn't OP
    const effectiveDefense = Math.floor(Math.sqrt(totalDefense) * 5);
    return { totalDefense, effectiveDefense, petCount: game.allUserPets.length };
}

// Process enemy attacks on tower (uses COMBINED defense from all pets)
function enemyAttackPhase(game) {
    let totalDamage = 0;
    const attackMessages = [];
    const { effectiveDefense } = calculateCombinedDefense(game);
    
    game.currentEnemies.forEach(enemy => {
        if (enemy.alive) {
            const reducedDamage = Math.max(1, enemy.damage - Math.floor(effectiveDefense * 0.5)); // Improved from 0.4 to 0.5
            totalDamage += reducedDamage;
            attackMessages.push(`${enemy.emoji} dealt **${reducedDamage}** damage!`);
        }
    });
    
    game.towerHp = Math.max(0, game.towerHp - totalDamage);
    
    return { totalDamage, attackMessages, effectiveDefense };
}

// Save all pet states to database
async function saveAllPetStates(game) {
    for (const pet of game.petQueue) {
        await PetSystem.updatePet(pet.id, (p) => {
            p.xp = pet.xp;
            p.level = pet.level;
            p.maxHp = pet.maxHp;
            p.stats.health = pet.maxHp;
            p.stats.attack = pet.stats.attack;
            p.stats.defense = pet.stats.defense;
            p.stats.energy = pet.stats.energy;
        });
    }
}

// Get or create user's tower streak data
async function getTowerStreak(userId) {
    try {
        const user = await User.findOne({ userId });
        if (user && user.towerStreak !== undefined) {
            const lastGame = user.lastTowerGame || 0;
            const hoursSince = (Date.now() - lastGame) / (1000 * 60 * 60);
            if (hoursSince > 24) {
                return 0;
            }
            return user.towerStreak || 0;
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

// Update user's tower streak
async function updateTowerStreak(userId, won, currentStreak) {
    try {
        let newStreak = won ? currentStreak + 1 : 0;
        await User.findOneAndUpdate(
            { userId },
            { 
                towerStreak: newStreak,
                lastTowerGame: Date.now()
            },
            { upsert: true }
        );
        return newStreak;
    } catch (e) {
        console.error('Failed to update tower streak:', e);
        return currentStreak;
    }
}

module.exports = {
    name: 'tower',
    description: 'Defend your tower using your pets! Battle endless waves for huge rewards!',

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const entryFee = 50;

        // Check if already in a game
        if (activeGames.has(userId)) {
            return interaction.reply({ 
                content: "❌ You already have an active tower defense game! Finish it first.", 
                ephemeral: true 
            });
        }

        // Check balance
        const balance = await economy.getBalance(userId);
        if (balance < entryFee) {
            return interaction.reply({ 
                content: `You need $${entryFee} to play! Your balance is $${balance}.`, 
                ephemeral: true 
            });
        }

        // Get user's pets - SORTED BY ATTACK (highest first)
        const userPets = await PetSystem.getUserPets(userId);
        if (!userPets || userPets.length === 0) {
            return interaction.reply({ 
                content: "❌ You need a pet to play Tower Defense! Use `/adopt` to get one.", 
                ephemeral: true 
            });
        }

        // Filter alive pets and sort by attack (highest first)
        const alivePets = userPets
            .filter(p => !p.isDead && !p.isSleeping)
            .sort((a, b) => b.stats.attack - a.stats.attack);
            
        if (alivePets.length === 0) {
            return interaction.reply({ 
                content: "❌ All your pets are either fainted or sleeping!", 
                ephemeral: true 
            });
        }

        // Check if at least one pet has energy
        const petsWithEnergy = alivePets.filter(p => p.stats.energy >= ENERGY_PER_ATTACK);
        if (petsWithEnergy.length === 0) {
            return interaction.reply({ 
                content: `❌ All your pets are exhausted! They need at least ${ENERGY_PER_ATTACK} energy to fight.\nUse \`/pet-action action:energize\` or wait for them to recover.`, 
                ephemeral: true 
            });
        }

        // Get current streak
        const streak = await getTowerStreak(userId);

        // Deduct entry fee
        await economy.removeBalance(userId, entryFee);

        // Get user inventory to count energy drinks
        const inventory = await economy.getInventory(userId);
        const energyDrinkCount = inventory.filter(i => i.name === 'Energy Drink').length;

        // Initialize game state with pet queue
        const game = {
            towerHp: 150,
            maxTowerHp: 150,
            petQueue: alivePets, // Alive pets that can attack, sorted by ATK
            allUserPets: userPets, // ALL user's pets (for combined defense calculation)
            activePetIndex: 0, // Start with highest ATK pet
            currentWave: 0,
            currentEnemies: spawnWave(0),
            score: 0,
            entryFee: entryFee,
            wavesSurvived: 0,
            turnsTaken: 0,
            streak: streak,
            energyDrinks: energyDrinkCount,
            totalXpGained: 0,
            levelsGained: 0
        };

        activeGames.set(userId, game);

        // Send initial game state
        const activePet = game.petQueue[game.activePetIndex];
        const startMessage = streak > 0 
            ? `🎮 **Battle Start!** 🔥 **${streak}x Streak!** ${activePet.petName} leads the attack!`
            : `🎮 **Battle Start!** ${activePet.petName} (ATK: ${activePet.stats.attack}) leads the attack!`;
            
        await interaction.reply({
            embeds: [createGameEmbed(game, startMessage)],
            components: createAttackButtons(game)
        });

        const reply = await interaction.fetchReply();

        // Component collector for buttons AND select menus (10 minutes timeout)
        const collector = reply.createMessageComponentCollector({
            time: 600000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            const game = activeGames.get(userId);
            if (!game) {
                return i.reply({ content: "Game not found!", ephemeral: true });
            }

            const activePet = game.petQueue[game.activePetIndex];

            // Handle Pet Selection from dropdown
            if (i.customId === 'select_pet') {
                const selectedValue = i.values[0]; // e.g., "pet_2"
                const newIndex = parseInt(selectedValue.split('_')[1]);
                
                if (newIndex === game.activePetIndex) {
                    return i.reply({ content: "That pet is already active!", ephemeral: true });
                }
                
                const newPet = game.petQueue[newIndex];
                if (!newPet) {
                    return i.reply({ content: "❌ Pet not found!", ephemeral: true });
                }
                
                // Save current pet's energy to DB immediately
                await PetSystem.updatePet(activePet.id, (p) => {
                    p.stats.energy = activePet.stats.energy;
                });
                
                // Switch to selected pet (no energy requirement - user chooses freely)
                game.activePetIndex = newIndex;
                
                const switchMessage = `🔄 **Switched to ${newPet.petName}!**\nATK: ${newPet.stats.attack} | DEF: ${newPet.stats.defense} | ⚡ Energy: ${newPet.stats.energy}`;
                
                await i.update({
                    embeds: [createGameEmbed(game, switchMessage)],
                    components: createAttackButtons(game)
                });
                return;
            }

            // Handle Energy Drink use
            if (i.customId === 'use_energy_drink') {
                if (game.energyDrinks <= 0) {
                    return i.reply({ content: "❌ You don't have any Energy Drinks!", ephemeral: true });
                }
                
                // Use energy drink from inventory
                await economy.removeItem(userId, 'Energy Drink');
                game.energyDrinks--;
                
                // Restore active pet's energy (+25) and save to DB
                activePet.stats.energy = Math.min(100, (activePet.stats.energy || 0) + 25);
                await PetSystem.updatePet(activePet.id, (p) => {
                    p.stats.energy = activePet.stats.energy;
                });
                
                // Heal tower slightly (+15 HP)
                const towerHeal = Math.min(15, game.maxTowerHp - game.towerHp);
                game.towerHp += towerHeal;
                
                const energyMessage = `⚡ **Energy Drink used on ${activePet.petName}!**\n+25 Energy (now ${activePet.stats.energy}) | +${towerHeal} Tower HP\n*${game.energyDrinks} drinks remaining*`;
                
                await i.update({
                    embeds: [createGameEmbed(game, energyMessage)],
                    components: createAttackButtons(game)
                });
                return;
            }

            // Handle Buy Energy Drink
            if (i.customId === 'buy_energy_drink') {
                const DRINK_PRICE = 100;
                const currentBalance = await economy.getBalance(userId);
                
                if (currentBalance < DRINK_PRICE) {
                    return i.reply({ content: `❌ Not enough coins! You need $${DRINK_PRICE} but only have $${currentBalance}.`, ephemeral: true });
                }
                
                // Deduct cost and add drink
                await economy.removeBalance(userId, DRINK_PRICE);
                game.energyDrinks++;
                
                const newBalance = await economy.getBalance(userId);
                const buyMessage = `💰 **Purchased Energy Drink!**\n-$${DRINK_PRICE} (Balance: $${newBalance})\n🧃 You now have **${game.energyDrinks}** Energy Drinks`;
                
                await i.update({
                    embeds: [createGameEmbed(game, buyMessage)],
                    components: createAttackButtons(game)
                });
                return;
            }
            
            // Handle Attack
            const [action, targetIndex] = i.customId.split('_');
            if (action !== 'attack') return;

            const target = game.currentEnemies[parseInt(targetIndex)];
            if (!target || !target.alive) {
                return i.reply({ content: "That enemy is already defeated!", ephemeral: true });
            }

            // Check energy
            if (activePet.stats.energy < ENERGY_PER_ATTACK) {
                // Auto-prompt for switch or energy drink
                const otherPets = game.petQueue.filter((p, idx) => 
                    idx !== game.activePetIndex && p.stats.energy >= ENERGY_PER_ATTACK
                );
                
                let exhaustedMsg = `⚠️ **${activePet.petName} is exhausted!** (${activePet.stats.energy} energy)`;
                if (otherPets.length > 0) {
                    exhaustedMsg += `\n🔄 Click **Switch Pet** to use ${otherPets[0].petName}`;
                }
                if (game.energyDrinks > 0) {
                    exhaustedMsg += `\n⚡ Or use an **Energy Drink** to restore energy`;
                }
                if (otherPets.length === 0 && game.energyDrinks === 0) {
                    exhaustedMsg += `\n❌ **No options left!** All pets exhausted and no drinks!`;
                }
                
                await i.update({
                    embeds: [createGameEmbed(game, exhaustedMsg)],
                    components: createAttackButtons(game)
                });
                return;
            }

            // DRAIN ENERGY and save to DB
            activePet.stats.energy -= ENERGY_PER_ATTACK;
            await PetSystem.updatePet(activePet.id, (p) => {
                p.stats.energy = activePet.stats.energy;
            });

            // Pet attacks enemy - apply critical damage if applicable
            let baseDamage = Math.floor(activePet.stats.attack * (0.8 + Math.random() * 0.4));
            const critResult = applyCriticalDamage(activePet, baseDamage);
            const petDamage = critResult.damage;
            target.hp -= petDamage;
            game.turnsTaken++;

            let battleMessage = `⚔️ **${activePet.petName}** attacks ${target.emoji} for **${petDamage}** damage! (-${ENERGY_PER_ATTACK}⚡)`;
            if (critResult.isCritical) {
                const emoji = critResult.skillName === 'Chaos Fury' ? '🔥' : '💥';
                battleMessage += ` ${emoji} **${critResult.skillName}!** (+${critResult.bonusPercent}%)`;
            }

            // Check if enemy died - AWARD XP
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
                game.score += target.points;
                
                const enemyType = Object.keys(ENEMIES).find(k => ENEMIES[k].name === target.name) || 'rat';
                const xpGain = ENEMY_XP[enemyType] || 5;
                activePet.xp += xpGain;
                game.totalXpGained += xpGain;
                
                battleMessage += `\n💀 **${target.name}** defeated! +${target.points} pts | +${xpGain} XP`;
                
                // Check for level up
                if (checkLevelUp(activePet)) {
                    game.levelsGained++;
                    battleMessage += `\n🎉 **LEVEL UP!** ${activePet.petName} is now Level ${activePet.level}!`;
                    battleMessage += `\n   +10 Max HP | +3 ${activePet.level % 2 === 0 ? 'ATK' : 'DEF'}`;
                    
                    // Check for evolution!
                    const evolutionResult = checkEvolution(activePet);
                    if (evolutionResult) {
                        battleMessage += `\n\n✨✨✨ **EVOLUTION!!!** ✨✨✨`;
                        battleMessage += `\n${evolutionResult.from} → **${evolutionResult.to}**!`;
                        battleMessage += `\n⭐ TIER ${evolutionResult.tier} UNLOCKED!`;
                        battleMessage += `\n💪 New Stats: ${evolutionResult.newStats.attack} ATK | ${evolutionResult.newStats.defense} DEF | ${evolutionResult.newStats.health} HP`;
                        if (evolutionResult.innateSkill) {
                            battleMessage += `\n💥 Learned: **${evolutionResult.innateSkill}**!`;
                        }
                    }
                    
                    // Save level up (and evolution) immediately
                    await PetSystem.updatePet(activePet.id, (p) => {
                        p.type = activePet.type; // Save new type if evolved
                        p.xp = activePet.xp;
                        p.level = activePet.level;
                        p.maxHp = activePet.maxHp;
                        p.stats.health = activePet.maxHp;
                        p.stats.attack = activePet.stats.attack;
                        p.stats.defense = activePet.stats.defense;
                        p.skills = activePet.skills || [];
                    });
                }
            }

            // Check if wave cleared
            const aliveEnemies = game.currentEnemies.filter(e => e.alive);
            if (aliveEnemies.length === 0) {
                game.wavesSurvived = game.currentWave + 1;
                
                // Heal tower slightly between waves
                const healAmount = Math.min(10, game.maxTowerHp - game.towerHp);
                if (healAmount > 0) {
                    game.towerHp += healAmount;
                    battleMessage += `\n💚 Tower repaired! +${healAmount} HP`;
                }
                
                // Next wave
                game.currentWave++;
                game.currentEnemies = spawnWave(game.currentWave);
                
                const waveName = game.currentWave < 5 
                    ? WAVES[game.currentWave].name 
                    : generateEndlessWave(game.currentWave + 1).name;
                    
                battleMessage += `\n\n🌊 **${waveName}** begins!`;
                
                if (game.currentWave === 5) {
                    battleMessage += `\n⚡ **ENDLESS MODE UNLOCKED!** Keep going for bigger rewards!`;
                }
            } else {
                // Enemies attack after every 2 player attacks
                if (game.turnsTaken % 2 === 0) {
                    const { totalDamage, attackMessages } = enemyAttackPhase(game);
                    if (totalDamage > 0) {
                        battleMessage += `\n\n🔥 **Enemy Counter-Attack!**\n${attackMessages.join('\n')}`;
                        battleMessage += `\n**Total Damage:** ${totalDamage}`;
                    }
                }
            }

            // Check if tower destroyed
            if (game.towerHp <= 0) {
                const { reward, streakMultiplier } = getReward(game.wavesSurvived, 0, game.streak);
                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }
                
                // Save all pet states
                await saveAllPetStates(game);
                
                // Reset streak on loss
                await updateTowerStreak(userId, false, game.streak);
                
                const newBalance = await economy.getBalance(userId);
                
                const defeatEmbed = new EmbedBuilder()
                    .setTitle('💥 TOWER DESTROYED! 💥')
                    .setColor(0xFF0000)
                    .setDescription(
                        `The enemies overwhelmed your defenses!\n\n` +
                        `📢 **Waves Survived:** ${game.wavesSurvived}\n` +
                        `🏆 **Final Score:** ${game.score}\n` +
                        `${game.streak > 0 ? `🔥 **Streak Bonus:** x${streakMultiplier.toFixed(1)}\n` : ''}` +
                        `💰 **Reward:** $${reward}\n` +
                        `💵 **Balance:** $${newBalance.toLocaleString()}\n\n` +
                        `📊 **Total XP:** +${game.totalXpGained}` +
                        `${game.levelsGained > 0 ? ` | +${game.levelsGained} Level(s)!` : ''}\n\n` +
                        `😢 **Streak Reset!** Play again to build a new streak!`
                    )
                    .setTimestamp();
                
                await i.update({ embeds: [defeatEmbed], components: [] });
                activeGames.delete(userId);
                collector.stop('defeat');
                return;
            }

            // Check if active pet is exhausted after attack
            if (activePet.stats.energy < ENERGY_PER_ATTACK) {
                const otherPets = game.petQueue.filter((p, idx) => 
                    idx !== game.activePetIndex && p.stats.energy >= ENERGY_PER_ATTACK
                );
                
                if (otherPets.length > 0) {
                    battleMessage += `\n\n⚠️ **${activePet.petName} is exhausted!** Use 🔄 Switch Pet`;
                } else if (game.energyDrinks > 0) {
                    battleMessage += `\n\n⚠️ **${activePet.petName} is exhausted!** Use ⚡ Energy Drink`;
                } else {
                    battleMessage += `\n\n❌ **All pets exhausted!** No energy drinks left!`;
                }
            }

            // Update game display
            await i.update({
                embeds: [createGameEmbed(game, battleMessage)],
                components: createAttackButtons(game)
            });
        });

        collector.on('end', async (collected, reason) => {
            const game = activeGames.get(userId);
            if (game) {
                const { reward, streakMultiplier } = getReward(game.wavesSurvived, game.towerHp, game.streak);
                
                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }
                
                // Save all pet states
                await saveAllPetStates(game);
                
                const won = game.wavesSurvived >= 5;
                await updateTowerStreak(userId, won, game.streak);
                
                activeGames.delete(userId);
                
                if (reason === 'time') {
                    try {
                        const newBalance = await economy.getBalance(userId);
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('⏰ GAME TIMEOUT!')
                                    .setColor(0xFFAA00)
                                    .setDescription(
                                        `Game ended due to inactivity.\n\n` +
                                        `📢 **Waves Survived:** ${game.wavesSurvived}\n` +
                                        `🏆 **Final Score:** ${game.score}\n` +
                                        `💰 **Reward:** $${reward}\n` +
                                        `💵 **Balance:** $${newBalance.toLocaleString()}`
                                    )
                                    .setTimestamp()
                            ],
                            components: []
                        });
                    } catch (e) {
                        // Message may have been deleted
                    }
                }
            }
        });
    }
};
