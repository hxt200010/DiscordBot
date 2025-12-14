const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economy = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');
const User = require('../../models/User');
const { checkLevelUp } = require('../../utils/petUtils');

const activeGames = new Map();

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
const ENEMIES = {
    rat: { emoji: '🐀', name: 'Rat', health: 20, damage: 5, speed: 'Fast', points: 10 },
    wolf: { emoji: '🐺', name: 'Wolf', health: 40, damage: 15, speed: 'Medium', points: 25 },
    bear: { emoji: '🐻', name: 'Bear', health: 80, damage: 25, speed: 'Slow', points: 50 },
    dragon: { emoji: '🐉', name: 'Dragon', health: 150, damage: 50, speed: 'Boss', points: 150 },
    // Endless mode enemies
    hydra: { emoji: '🐲', name: 'Hydra', health: 200, damage: 60, speed: 'Boss', points: 200 },
    titan: { emoji: '👹', name: 'Titan', health: 300, damage: 80, speed: 'Boss', points: 350 },
    demon: { emoji: '😈', name: 'Demon Lord', health: 500, damage: 100, speed: 'Boss', points: 500 }
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
    const waveIndex = waveNum - 5; // 1 for wave 6, 2 for wave 7, etc.
    const enemies = [];
    
    // Each wave gets progressively harder
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

// Rewards based on waves survived (with streak multiplier) - INCREASED REWARDS!
function getReward(wavesSurvived, towerHp, streak = 0) {
    // Base reward calculation - MUCH HIGHER!
    let reward = 0;
    
    if (wavesSurvived <= 5) {
        // Wave 5 = $800, scaling down
        const baseRewards = { 5: 800, 4: 400, 3: 200, 2: 100, 1: 50, 0: 0 };
        reward = baseRewards[wavesSurvived] || 0;
    } else {
        // Endless mode: exponential scaling (starting from $800)
        reward = 800 + (wavesSurvived - 5) * 200 + Math.pow(wavesSurvived - 5, 2) * 50;
    }
    
    // HP Bonus (only if won at least 5 waves) - +5 coins per HP
    if (wavesSurvived >= 5 && towerHp > 0) {
        reward += Math.floor(towerHp * 5);
    }
    
    // Streak multiplier: +10% per streak (max 100%)
    const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;
    reward = Math.floor(reward * streakMultiplier);
    
    return { reward, streakMultiplier };
}

// Create health bar visualization
function createHealthBar(current, max, length = 10) {
    const filled = Math.max(0, Math.round((current / max) * length));
    const empty = length - filled;
    const filledChar = '█';
    const emptyChar = '░';
    return `${filledChar.repeat(filled)}${emptyChar.repeat(empty)} ${current}/${max}`;
}

// Create game embed
function createGameEmbed(game, message = '') {
    const embed = new EmbedBuilder()
        .setTitle(`🏰 TOWER DEFENSE 🏰`)
        .setColor(game.towerHp > 50 ? 0x00FF00 : game.towerHp > 25 ? 0xFFAA00 : 0xFF0000);

    // Tower status
    let description = `**🏰 Tower Health:** ${createHealthBar(game.towerHp, game.maxTowerHp, 15)}\n\n`;
    
    // Pet info with level and XP
    description += `**⚔️ Defending Pet:** ${game.pet.petName} (${game.pet.type})\n`;
    description += `**ATK:** ${game.pet.stats.attack} | **DEF:** ${game.pet.stats.defense} | **LVL:** ${game.pet.level}\n`;
    description += `**📊 XP:** ${Math.floor(game.pet.xp)}/${game.pet.level * 20}\n\n`;
    
    // Energy drink count
    if (game.energyDrinks > 0) {
        description += `**⚡ Energy Drinks:** ${game.energyDrinks}\n`;
    }
    
    // Streak info
    if (game.streak > 0) {
        description += `**🔥 Streak:** ${game.streak}x (+${Math.min(game.streak, 10) * 10}% coins)\n\n`;
    }
    
    // Current wave
    const waveName = game.currentWave < 5 ? WAVES[game.currentWave].name : generateEndlessWave(game.currentWave + 1).name;
    description += `**📢 ${waveName}**\n\n`;
    
    // Enemies
    description += `**🎯 Enemies:**\n`;
    game.currentEnemies.forEach((enemy, index) => {
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
    embed.setFooter({ text: `Entry: $${game.entryFee} | Keep fighting for bigger rewards!` });
    embed.setTimestamp();
    
    return embed;
}

// Create attack buttons for enemies + energy drink button
function createAttackButtons(game, disabled = false) {
    const rows = [];
    const aliveEnemies = game.currentEnemies.filter(e => e.alive);
    
    if (aliveEnemies.length === 0 || disabled) {
        return [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('disabled')
                .setLabel('No Targets')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        )];
    }

    // Create buttons for each alive enemy (always enabled - no energy limit!)
    const buttons = aliveEnemies.slice(0, 4).map((enemy, index) => 
        new ButtonBuilder()
            .setCustomId(`attack_${game.currentEnemies.indexOf(enemy)}`)
            .setLabel(`⚔️ ${enemy.emoji} ${enemy.name}`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled)
    );

    rows.push(new ActionRowBuilder().addComponents(buttons));
    
    // Add utility row with Energy Drink button
    const utilityRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('use_energy_drink')
            .setLabel(`⚡ Energy Drink (${game.energyDrinks || 0})`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled || game.energyDrinks <= 0)
    );
    rows.push(utilityRow);
    
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
        
        // Scale enemy stats for endless mode
        if (waveIndex >= 5) {
            const scaling = 1 + (waveIndex - 5) * 0.15; // +15% per wave after 5
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

// Process enemy attacks on tower
function enemyAttackPhase(game) {
    let totalDamage = 0;
    const attackMessages = [];
    
    game.currentEnemies.forEach(enemy => {
        if (enemy.alive) {
            // Defense reduces damage
            const reducedDamage = Math.max(1, enemy.damage - Math.floor(game.pet.stats.defense * 0.3));
            totalDamage += reducedDamage;
            attackMessages.push(`${enemy.emoji} dealt **${reducedDamage}** damage!`);
        }
    });
    
    game.towerHp = Math.max(0, game.towerHp - totalDamage);
    
    return { totalDamage, attackMessages };
}

// Get or create user's tower streak data
async function getTowerStreak(userId) {
    try {
        const user = await User.findOne({ userId });
        if (user && user.towerStreak !== undefined) {
            // Check if streak is still valid (within 24 hours of last game)
            const lastGame = user.lastTowerGame || 0;
            const hoursSince = (Date.now() - lastGame) / (1000 * 60 * 60);
            if (hoursSince > 24) {
                return 0; // Streak reset
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
    description: 'Defend your tower using your pet! Battle endless waves for huge rewards!',

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

        // Get user's pet
        const userPets = await PetSystem.getUserPets(userId);
        if (!userPets || userPets.length === 0) {
            return interaction.reply({ 
                content: "❌ You need a pet to play Tower Defense! Use `/adopt` to get one.", 
                ephemeral: true 
            });
        }

        // Use first alive pet (no energy requirement!)
        const alivePets = userPets.filter(p => !p.isDead && !p.isSleeping);
        if (alivePets.length === 0) {
            return interaction.reply({ 
                content: "❌ All your pets are either fainted or sleeping!", 
                ephemeral: true 
            });
        }

        const pet = alivePets[0];
        
        // Get current streak
        const streak = await getTowerStreak(userId);

        // Deduct entry fee
        await economy.removeBalance(userId, entryFee);

        // Get user inventory to count energy drinks
        const inventory = await economy.getInventory(userId);
        const energyDrinkCount = inventory.filter(i => i.name === 'Energy Drink').length;

        // Initialize game state
        const game = {
            towerHp: 100,
            maxTowerHp: 100,
            pet: pet,
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
        const startMessage = streak > 0 
            ? `🎮 **Battle Start!** 🔥 **${streak}x Streak Bonus!** Click an enemy to attack!`
            : `🎮 **Battle Start!** Click an enemy to attack with ${pet.petName}!`;
            
        await interaction.reply({
            embeds: [createGameEmbed(game, startMessage)],
            components: createAttackButtons(game)
        });

        const reply = await interaction.fetchReply();

        // Button collector (10 minutes timeout for endless mode)
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600000 // 10 minutes
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            const game = activeGames.get(userId);
            if (!game) {
                return i.reply({ content: "Game not found!", ephemeral: true });
            }

            // Parse action
            const [action, targetIndex] = i.customId.split('_');
            
            // Handle Energy Drink use
            if (i.customId === 'use_energy_drink') {
                if (game.energyDrinks <= 0) {
                    return i.reply({ content: "❌ You don't have any Energy Drinks!", ephemeral: true });
                }
                
                // Use energy drink from inventory
                await economy.removeItem(userId, 'Energy Drink');
                game.energyDrinks--;
                
                // Restore pet energy (+25)
                game.pet.stats.energy = Math.min(100, (game.pet.stats.energy || 0) + 25);
                
                // Heal tower slightly (+15 HP)
                const towerHeal = Math.min(15, game.maxTowerHp - game.towerHp);
                game.towerHp += towerHeal;
                
                const energyMessage = `⚡ **Energy Drink used!**\n+25 Pet Energy | +${towerHeal} Tower HP\n*${game.energyDrinks} drinks remaining*`;
                
                await i.update({
                    embeds: [createGameEmbed(game, energyMessage)],
                    components: createAttackButtons(game)
                });
                return;
            }
            
            if (action !== 'attack') return;

            const target = game.currentEnemies[parseInt(targetIndex)];
            if (!target || !target.alive) {
                return i.reply({ content: "That enemy is already defeated!", ephemeral: true });
            }

            // Pet attacks enemy (NO ENERGY COST!)
            const petDamage = Math.floor(game.pet.stats.attack * (0.8 + Math.random() * 0.4)); // 80-120% of attack
            target.hp -= petDamage;
            game.turnsTaken++;

            let battleMessage = `⚔️ **${game.pet.petName}** attacks ${target.emoji} for **${petDamage}** damage!`;

            // Check if enemy died - AWARD XP!
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
                game.score += target.points;
                
                // Get enemy type and award XP
                const enemyType = Object.keys(ENEMIES).find(k => ENEMIES[k].name === target.name) || 'rat';
                const xpGain = ENEMY_XP[enemyType] || 5;
                game.pet.xp += xpGain;
                game.totalXpGained += xpGain;
                
                battleMessage += `\n💀 **${target.name}** defeated! +${target.points} pts | +${xpGain} XP`;
                
                // Check for level up
                const oldLevel = game.pet.level;
                if (checkLevelUp(game.pet)) {
                    game.levelsGained++;
                    battleMessage += `\n🎉 **LEVEL UP!** ${game.pet.petName} is now Level ${game.pet.level}!`;
                    battleMessage += `\n   +10 Max HP | +3 ${game.pet.level % 2 === 0 ? 'ATK' : 'DEF'}`;
                }
            }

            // Check if wave cleared
            const aliveEnemies = game.currentEnemies.filter(e => e.alive);
            if (aliveEnemies.length === 0) {
                game.wavesSurvived = game.currentWave + 1;
                
                // Heal tower slightly between waves (bonus for skill)
                const healAmount = Math.min(10, game.maxTowerHp - game.towerHp);
                if (healAmount > 0) {
                    game.towerHp += healAmount;
                    battleMessage += `\n💚 Tower repaired! +${healAmount} HP`;
                }
                
                // Next wave (endless!)
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
                
                // Save pet XP and level changes to database
                await PetSystem.updatePet(game.pet.id, (p) => {
                    p.xp = game.pet.xp;
                    p.level = game.pet.level;
                    p.maxHp = game.pet.maxHp;
                    p.stats.health = game.pet.maxHp;
                    p.stats.attack = game.pet.stats.attack;
                    p.stats.defense = game.pet.stats.defense;
                });
                
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
                        `� **${game.pet.petName}:** +${game.totalXpGained} XP` +
                        `${game.levelsGained > 0 ? ` | +${game.levelsGained} Level(s)!` : ''}\n\n` +
                        `�😢 **Streak Reset!** Play again to build a new streak!`
                    )
                    .setTimestamp();
                
                await i.update({ embeds: [defeatEmbed], components: [] });
                activeGames.delete(userId);
                collector.stop('defeat');
                return;
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
                // Game ended (timeout or manual stop) - give rewards for current progress
                const { reward, streakMultiplier } = getReward(game.wavesSurvived, game.towerHp, game.streak);
                
                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }
                
                // Save pet XP and level changes to database
                await PetSystem.updatePet(game.pet.id, (p) => {
                    p.xp = game.pet.xp;
                    p.level = game.pet.level;
                    p.maxHp = game.pet.maxHp;
                    p.stats.health = game.pet.maxHp;
                    p.stats.attack = game.pet.stats.attack;
                    p.stats.defense = game.pet.stats.defense;
                });
                
                // Update streak based on if they survived 5+ waves
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
