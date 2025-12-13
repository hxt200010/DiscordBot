const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economy = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');

const activeGames = new Map();

// Enemy types with stats
const ENEMIES = {
    rat: { emoji: '🐀', name: 'Rat', health: 20, damage: 5, speed: 'Fast', points: 10 },
    wolf: { emoji: '🐺', name: 'Wolf', health: 40, damage: 15, speed: 'Medium', points: 25 },
    bear: { emoji: '🐻', name: 'Bear', health: 80, damage: 25, speed: 'Slow', points: 50 },
    dragon: { emoji: '🐉', name: 'Dragon', health: 150, damage: 50, speed: 'Boss', points: 150 }
};

// Wave configurations
const WAVES = [
    { enemies: ['rat', 'rat', 'rat'], name: 'Wave 1: Rat Swarm' },
    { enemies: ['rat', 'wolf', 'rat', 'wolf'], name: 'Wave 2: Wolf Pack' },
    { enemies: ['wolf', 'wolf', 'bear'], name: 'Wave 3: Forest Assault' },
    { enemies: ['bear', 'wolf', 'bear', 'wolf'], name: 'Wave 4: Beast Onslaught' },
    { enemies: ['dragon'], name: 'Wave 5: FINAL BOSS' }
];

// Rewards based on waves survived
function getReward(wavesSurvived, towerHp) {
    const baseRewards = {
        5: 300, // Victory!
        4: 150,
        3: 75,
        2: 40,
        1: 20,
        0: 0
    };
    let reward = baseRewards[wavesSurvived] || 0;
    
    // Bonus for HP remaining on victory
    if (wavesSurvived === 5 && towerHp > 0) {
        reward += Math.floor(towerHp * 2); // +2 coins per HP remaining
    }
    
    return reward;
}

// Create health bar visualization
function createHealthBar(current, max, length = 10) {
    const filled = Math.round((current / max) * length);
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
    
    // Pet info
    description += `**⚔️ Defending Pet:** ${game.pet.petName} (${game.pet.type})\n`;
    description += `**ATK:** ${game.pet.stats.attack} | **DEF:** ${game.pet.stats.defense} | **⚡ Energy:** ${game.petEnergy}\n\n`;
    
    // Current wave
    description += `**📢 ${WAVES[game.currentWave].name}**\n\n`;
    
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
    description += `\n**🏆 Score:** ${game.score} | **Wave:** ${game.currentWave + 1}/5`;
    
    // Message
    if (message) {
        description += `\n\n${message}`;
    }

    embed.setDescription(description);
    embed.setFooter({ text: `Entry: $${game.entryFee} | Each attack costs 10 pet energy` });
    embed.setTimestamp();
    
    return embed;
}

// Create attack buttons for enemies
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

    // Create buttons for each alive enemy
    const buttons = aliveEnemies.slice(0, 5).map((enemy, index) => 
        new ButtonBuilder()
            .setCustomId(`attack_${game.currentEnemies.indexOf(enemy)}`)
            .setLabel(`⚔️ ${enemy.emoji} ${enemy.name}`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled || game.petEnergy < 10)
    );

    rows.push(new ActionRowBuilder().addComponents(buttons));
    
    return rows;
}

// Spawn enemies for a wave
function spawnWave(waveIndex) {
    const wave = WAVES[waveIndex];
    return wave.enemies.map((type, index) => {
        const enemy = { ...ENEMIES[type] };
        enemy.hp = enemy.health;
        enemy.maxHp = enemy.health;
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

module.exports = {
    name: 'tower',
    description: 'Defend your tower using your pet! Battle waves of enemies!',

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

        // Use first alive pet with enough energy
        const alivePets = userPets.filter(p => !p.isDead && !p.isSleeping);
        if (alivePets.length === 0) {
            return interaction.reply({ 
                content: "❌ All your pets are either fainted or sleeping!", 
                ephemeral: true 
            });
        }

        const pet = alivePets[0];
        if (pet.stats.energy < 10) {
            return interaction.reply({ 
                content: `❌ **${pet.petName}** needs at least 10 energy to defend! Current: ${pet.stats.energy}`, 
                ephemeral: true 
            });
        }

        // Deduct entry fee
        await economy.removeBalance(userId, entryFee);

        // Initialize game state
        const game = {
            towerHp: 100,
            maxTowerHp: 100,
            pet: pet,
            petEnergy: pet.stats.energy,
            currentWave: 0,
            currentEnemies: spawnWave(0),
            score: 0,
            entryFee: entryFee,
            wavesSurvived: 0,
            turnsTaken: 0
        };

        activeGames.set(userId, game);

        // Send initial game state
        await interaction.reply({
            embeds: [createGameEmbed(game, `🎮 **Battle Start!** Click an enemy to attack with ${pet.petName}!`)],
            components: createAttackButtons(game)
        });

        const reply = await interaction.fetchReply();

        // Button collector (5 minutes timeout)
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
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
            
            if (action !== 'attack') return;

            const target = game.currentEnemies[parseInt(targetIndex)];
            if (!target || !target.alive) {
                return i.reply({ content: "That enemy is already defeated!", ephemeral: true });
            }

            // Check if pet has enough energy
            if (game.petEnergy < 10) {
                await i.update({
                    embeds: [createGameEmbed(game, `⚠️ **${game.pet.petName}** is too tired to attack! (Need 10 energy)`)],
                    components: createAttackButtons(game, true)
                });
                return;
            }

            // Pet attacks enemy
            const petDamage = Math.floor(game.pet.stats.attack * (0.8 + Math.random() * 0.4)); // 80-120% of attack
            target.hp -= petDamage;
            game.petEnergy -= 10;
            game.turnsTaken++;

            let battleMessage = `⚔️ **${game.pet.petName}** attacks ${target.emoji} for **${petDamage}** damage!`;

            // Check if enemy died
            if (target.hp <= 0) {
                target.hp = 0;
                target.alive = false;
                game.score += target.points;
                battleMessage += `\n💀 **${target.name}** defeated! +${target.points} points!`;
            }

            // Check if wave cleared
            const aliveEnemies = game.currentEnemies.filter(e => e.alive);
            if (aliveEnemies.length === 0) {
                game.wavesSurvived = game.currentWave + 1;
                
                // Check if all waves completed
                if (game.currentWave >= WAVES.length - 1) {
                    // VICTORY!
                    const reward = getReward(5, game.towerHp);
                    await economy.addBalance(userId, reward);
                    
                    // Update pet energy in database
                    await PetSystem.updatePet(game.pet.id, (p) => {
                        p.stats.energy = game.petEnergy;
                    });
                    
                    const newBalance = await economy.getBalance(userId);
                    
                    const victoryEmbed = new EmbedBuilder()
                        .setTitle('🏆 VICTORY! 🏆')
                        .setColor(0xFFD700)
                        .setDescription(
                            `**${game.pet.petName}** defended the tower against all waves!\n\n` +
                            `🏰 **Tower HP:** ${game.towerHp}/${game.maxTowerHp}\n` +
                            `🏆 **Final Score:** ${game.score}\n` +
                            `💰 **Reward:** $${reward}\n` +
                            `💵 **Balance:** $${newBalance.toLocaleString()}\n\n` +
                            `⚡ **${game.pet.petName}'s Energy:** ${game.petEnergy}`
                        )
                        .setFooter({ text: `HP Bonus: +$${Math.floor(game.towerHp * 2)} for surviving HP` })
                        .setTimestamp();
                    
                    await i.update({ embeds: [victoryEmbed], components: [] });
                    activeGames.delete(userId);
                    collector.stop('victory');
                    return;
                }
                
                // Next wave
                game.currentWave++;
                game.currentEnemies = spawnWave(game.currentWave);
                battleMessage += `\n\n🌊 **${WAVES[game.currentWave].name}** begins!`;
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
                const reward = getReward(game.wavesSurvived, 0);
                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }
                
                // Update pet energy in database
                await PetSystem.updatePet(game.pet.id, (p) => {
                    p.stats.energy = game.petEnergy;
                });
                
                const newBalance = await economy.getBalance(userId);
                
                const defeatEmbed = new EmbedBuilder()
                    .setTitle('💥 TOWER DESTROYED! 💥')
                    .setColor(0xFF0000)
                    .setDescription(
                        `The enemies overwhelmed your defenses!\n\n` +
                        `📢 **Waves Survived:** ${game.wavesSurvived}/5\n` +
                        `🏆 **Final Score:** ${game.score}\n` +
                        `💰 **Consolation:** $${reward}\n` +
                        `💵 **Balance:** $${newBalance.toLocaleString()}\n\n` +
                        `⚡ **${game.pet.petName}'s Energy:** ${game.petEnergy}`
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
            if (game && reason === 'time') {
                // Update pet energy on timeout
                await PetSystem.updatePet(game.pet.id, (p) => {
                    p.stats.energy = game.petEnergy;
                });
                
                activeGames.delete(userId);
                
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('⏰ GAME TIMEOUT!')
                                .setColor(0xFF0000)
                                .setDescription(`The game ended due to inactivity.\n\n**Lost:** $${entryFee}`)
                                .setTimestamp()
                        ],
                        components: []
                    });
                } catch (e) {
                    // Message may have been deleted
                }
            }
        });
    }
};
