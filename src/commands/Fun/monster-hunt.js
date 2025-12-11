const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const { 
    getRandomMonster, 
    generateHPBar, 
    getTierColor, 
    getTierDisplay 
} = require('../../utils/MonsterData');
const EconomySystem = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');
const User = require('../../models/User');

// Active hunts per channel (prevent multiple simultaneous hunts)
const activeHunts = new Map();

// Cooldown per user (5 minutes between starting hunts)
const userCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

module.exports = {
    name: 'monster-hunt',
    description: 'Start a monster hunt! Spam the attack button to defeat the monster and earn rewards!',

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const channelId = interaction.channelId;

        // Check if hunt is already active in this channel
        if (activeHunts.has(channelId)) {
            return interaction.reply({
                content: '⚠️ A monster hunt is already in progress in this channel! Join the fight!',
                ephemeral: true
            });
        }

        // Check user cooldown
        if (userCooldowns.has(userId)) {
            const remaining = userCooldowns.get(userId) - Date.now();
            if (remaining > 0) {
                const minutes = Math.ceil(remaining / 60000);
                return interaction.reply({
                    content: `⏰ You recently started a hunt! Wait **${minutes} minute(s)** before starting another.`,
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply();

        // Check for Monster Lure item
        let guaranteeRare = false;
        const user = await User.findOne({ userId });
        if (user && user.inventory) {
            const lureIndex = user.inventory.findIndex(item => item.name === 'Monster Lure');
            if (lureIndex !== -1) {
                // Consume the lure
                user.inventory.splice(lureIndex, 1);
                await user.save();
                guaranteeRare = true;
            }
        }

        // Spawn monster
        const monster = getRandomMonster(guaranteeRare);
        let currentHp = monster.maxHp;

        // Track damage per user
        const damageTracker = new Map();
        let totalClicks = 0;
        let lastClickTime = new Map();

        // Set hunt as active
        activeHunts.set(channelId, true);
        userCooldowns.set(userId, Date.now() + COOLDOWN_MS);

        // Get initiator's pet for attack bonus display
        const initiatorPets = await PetSystem.getUserPets(userId);
        const hasPet = initiatorPets && initiatorPets.length > 0;

        // Create initial embed
        const createEmbed = (phase = 'countdown', timeLeft = monster.timeLimit) => {
            const embed = new EmbedBuilder()
                .setTitle(`${monster.emoji} ${monster.name} Appeared!`)
                .setColor(getTierColor(monster.tier))
                .setFooter({ text: phase === 'fighting' ? `⏱️ ${timeLeft}s remaining | Click fast!` : 'Get ready...' });

            if (phase === 'countdown') {
                embed.setDescription(
                    `${monster.art}\n\n` +
                    `**${getTierDisplay(monster.tier)}** Monster\n\n` +
                    `*${monster.description}*\n\n` +
                    `❤️ **HP:** ${generateHPBar(currentHp, monster.maxHp)}\n\n` +
                    `⏳ **Battle starts in 3 seconds...**\n` +
                    (guaranteeRare ? '✨ *Monster Lure activated!*' : '') +
                    (hasPet ? '\n💪 *Your pet\'s attack stat will boost your damage!*' : '')
                );
            } else if (phase === 'fighting') {
                // Get top 5 attackers
                const topAttackers = [...damageTracker.entries()]
                    .sort((a, b) => b[1].damage - a[1].damage)
                    .slice(0, 5)
                    .map((entry, i) => {
                        const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
                        return `${medal} <@${entry[0]}>: **${entry[1].damage}** dmg (${entry[1].clicks} hits)`;
                    })
                    .join('\n') || '*No attacks yet!*';

                embed.setDescription(
                    `${monster.art}\n\n` +
                    `**${getTierDisplay(monster.tier)}** Monster\n\n` +
                    `❤️ **HP:** ${generateHPBar(currentHp, monster.maxHp)}\n\n` +
                    `**⚔️ Top Attackers:**\n${topAttackers}\n\n` +
                    `📊 **Total Hits:** ${totalClicks}`
                );
            }

            return embed;
        };

        // Create attack button
        const createButton = (disabled = false) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_attack')
                    .setLabel('⚔️ ATTACK!')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled)
            );
        };

        // Send countdown embed
        const message = await interaction.editReply({
            embeds: [createEmbed('countdown')],
            components: [createButton(true)]
        });

        // Wait 3 seconds before starting
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if hunt was cancelled
        if (!activeHunts.has(channelId)) {
            return;
        }

        // Start the battle!
        let timeRemaining = monster.timeLimit;
        let battleEnded = false;

        // Update the embed to fighting phase
        await interaction.editReply({
            embeds: [createEmbed('fighting', timeRemaining)],
            components: [createButton(false)]
        });

        // Create button collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: monster.timeLimit * 1000
        });

        // Update timer every 2 seconds
        const timerInterval = setInterval(async () => {
            if (battleEnded) {
                clearInterval(timerInterval);
                return;
            }

            timeRemaining -= 2;
            if (timeRemaining <= 0 || currentHp <= 0) {
                clearInterval(timerInterval);
                return;
            }

            try {
                await interaction.editReply({
                    embeds: [createEmbed('fighting', timeRemaining)],
                    components: [createButton(false)]
                });
            } catch (e) {
                // Message might have been deleted
                clearInterval(timerInterval);
            }
        }, 2000);

        // Handle button clicks
        collector.on('collect', async (buttonInteraction) => {
            if (battleEnded) return;

            const clicker = buttonInteraction.user.id;
            const now = Date.now();

            // Calculate damage
            let baseDamage = 1;
            let comboMultiplier = 1;

            // Check for combo (clicks within 500ms get bonus)
            if (lastClickTime.has(clicker)) {
                const timeSinceLastClick = now - lastClickTime.get(clicker);
                if (timeSinceLastClick < 300) comboMultiplier = 3;
                else if (timeSinceLastClick < 500) comboMultiplier = 2;
                else if (timeSinceLastClick < 750) comboMultiplier = 1.5;
            }
            lastClickTime.set(clicker, now);

            // Check for pet attack bonus
            const clickerPets = await PetSystem.getUserPets(clicker);
            let petBonus = 0;
            if (clickerPets && clickerPets.length > 0) {
                // Use highest attack pet
                const bestPet = clickerPets.reduce((best, pet) => 
                    (pet.stats?.attack || pet.attack || 10) > (best.stats?.attack || best.attack || 10) ? pet : best
                );
                petBonus = Math.floor((bestPet.stats?.attack || bestPet.attack || 10) / 5);
            }

            // Critical hit (10% chance for 5x damage)
            const isCritical = Math.random() < 0.10;
            const critMultiplier = isCritical ? 5 : 1;

            // Calculate final damage
            const damage = Math.floor((baseDamage + petBonus) * comboMultiplier * critMultiplier);

            // Update tracker
            if (!damageTracker.has(clicker)) {
                damageTracker.set(clicker, { damage: 0, clicks: 0, crits: 0 });
            }
            const stats = damageTracker.get(clicker);
            stats.damage += damage;
            stats.clicks += 1;
            if (isCritical) stats.crits += 1;

            totalClicks++;
            currentHp -= damage;

            // Acknowledge the click (deferred to prevent rate limits)
            try {
                await buttonInteraction.deferUpdate();
            } catch (e) {
                // Ignore interaction errors
            }

            // Check if monster is defeated
            if (currentHp <= 0) {
                currentHp = 0;
                battleEnded = true;
                collector.stop('defeated');
            }
        });

        // Handle battle end
        collector.on('end', async (collected, reason) => {
            battleEnded = true;
            clearInterval(timerInterval);
            activeHunts.delete(channelId);

            const isVictory = currentHp <= 0;

            // Calculate rewards for each participant
            const totalDamage = [...damageTracker.values()].reduce((sum, s) => sum + s.damage, 0);
            const participantRewards = [];

            for (const [participantId, stats] of damageTracker.entries()) {
                // Proportional reward based on damage contribution
                const damageRatio = totalDamage > 0 ? stats.damage / totalDamage : 0;
                
                let coinReward = 0;
                let xpReward = 0;

                if (isVictory) {
                    // Full rewards for victory
                    coinReward = Math.floor(monster.coinReward * damageRatio);
                    xpReward = Math.floor(monster.xpReward * damageRatio);
                } else {
                    // 25% rewards for escape
                    coinReward = Math.floor(monster.coinReward * 0.25 * damageRatio);
                    xpReward = Math.floor(monster.xpReward * 0.25 * damageRatio);
                }

                // Minimum rewards for participation
                coinReward = Math.max(coinReward, 5);
                xpReward = Math.max(xpReward, 1);

                // Apply rewards
                await EconomySystem.addBalance(participantId, coinReward);

                // Update user monster stats
                await User.findOneAndUpdate(
                    { userId: participantId },
                    {
                        $inc: {
                            'monsterStats.totalDamage': stats.damage,
                            'monsterStats.totalKills': isVictory ? 1 : 0
                        }
                    },
                    { upsert: true }
                );

                // Track highest damage
                const userData = await User.findOne({ userId: participantId });
                if (!userData?.monsterStats?.highestDamage || stats.damage > userData.monsterStats.highestDamage) {
                    await User.findOneAndUpdate(
                        { userId: participantId },
                        { 'monsterStats.highestDamage': stats.damage }
                    );
                }

                participantRewards.push({
                    id: participantId,
                    damage: stats.damage,
                    clicks: stats.clicks,
                    crits: stats.crits,
                    coins: coinReward,
                    xp: xpReward
                });
            }

            // Sort by damage
            participantRewards.sort((a, b) => b.damage - a.damage);

            // Create results embed
            const resultsEmbed = new EmbedBuilder()
                .setTitle(isVictory 
                    ? `🎉 Victory! ${monster.emoji} ${monster.name} Defeated!` 
                    : `💨 ${monster.emoji} ${monster.name} Escaped!`)
                .setColor(isVictory ? 0x00FF00 : 0xFF6600)
                .setDescription(
                    `${monster.art}\n\n` +
                    (isVictory 
                        ? `The **${monster.name}** has been vanquished!` 
                        : `The **${monster.name}** escaped with **${currentHp}/${monster.maxHp}** HP remaining!`) +
                    `\n\n📊 **Battle Stats:**\n` +
                    `Total Damage: **${totalDamage}**\n` +
                    `Total Clicks: **${totalClicks}**\n` +
                    `Participants: **${damageTracker.size}**`
                );

            // Add top 5 results
            if (participantRewards.length > 0) {
                const rewardsList = participantRewards.slice(0, 5).map((p, i) => {
                    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
                    return `${medal} <@${p.id}>: **${p.damage}** dmg (${p.clicks} hits${p.crits > 0 ? `, ${p.crits} crits` : ''}) → 💰 ${p.coins} coins`;
                }).join('\n');

                resultsEmbed.addFields({
                    name: '🏆 Top Hunters',
                    value: rewardsList
                });
            } else {
                resultsEmbed.addFields({
                    name: '😢 No Participants',
                    value: 'No one attacked the monster!'
                });
            }

            resultsEmbed.setFooter({ 
                text: `${getTierDisplay(monster.tier)} | Use /monster-hunt to start another battle!` 
            });

            // Update message with results
            try {
                await interaction.editReply({
                    embeds: [resultsEmbed],
                    components: [createButton(true)]
                });
            } catch (e) {
                // Message might have been deleted
            }
        });
    }
};
