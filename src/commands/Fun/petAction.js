const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petConfig = require('../../utils/petConfig');
const { applyWorkGains } = require('../../utils/petUtils');
const economySystem = require('../../utils/EconomySystem');

const petsFile = path.join(__dirname, '../../data/pets.json');
const economyFile = path.join(__dirname, '../../data/economy.json');

const cooldowns = new Map();

module.exports = {
    name: 'pet-action',
    description: 'Interact with your pet (Feed, Play, Work, etc.)',
    options: [
        {
            name: 'action',
            description: 'What do you want to do?',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Feed 🍎 (Needs Pet Food)', value: 'feed' },
                { name: 'Play 🎾', value: 'play' },
                { name: 'Pat 👋', value: 'pat' },
                { name: 'Sleep 💤', value: 'sleep' },
                { name: 'Grind ⚔️', value: 'grind' },
                { name: 'Heal 💊 (Needs Health Pack)', value: 'heal' },
                { name: 'Revive 💖 (Needs Health Kit)', value: 'revive' },
            ],
        },
    ],
    callback: async (client, interaction) => {
        // Cooldown Check
        const userId = interaction.user.id;
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 5000;
            if (Date.now() < expirationTime) {
                const timeLeft = ((expirationTime - Date.now()) / 1000).toFixed(1);
                return interaction.reply({ content: `⏳ Please wait ${timeLeft} seconds before interacting again.`, ephemeral: true });
            }
        }

        cooldowns.set(userId, Date.now());
        setTimeout(() => cooldowns.delete(userId), 5000);

        await interaction.deferReply();

        if (!fs.existsSync(petsFile)) {
            return interaction.editReply({ content: "No pets found! Use /adopt to get one." });
        }

        let pets = {};
        try {
            pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.editReply({ content: "Error reading pet data." });
        }

        let pet = pets[interaction.user.id];

        if (!pet) {
            return interaction.editReply({ content: "You don't have a pet yet! Use /adopt to get one." });
        }

        // Initialize combat stats if missing
        if (!pet.attack || !pet.defense || !pet.hp) {
            const config = petConfig.find(p => p.value === pet.type);
            const baseStats = config ? config.stats : { attack: 10, defense: 10, health: 100 };

            if (!pet.attack) pet.attack = baseStats.attack;
            if (!pet.defense) pet.defense = baseStats.defense;
            if (!pet.hp) pet.hp = baseStats.health;
        }

        // Initialize MaxHP if missing
        if (!pet.maxHp) {
            pet.maxHp = pet.hp || 100;
        }

        const action = interaction.options.getString('action');
        let message = "";
        let xpGain = 0;

        // Cap stats at 100
        const cap = (val) => Math.min(100, val);
        // Cap HP at MaxHP
        const capHp = (val) => Math.min(pet.maxHp, val);

        // Check for Death
        if (pet.isDead && action !== 'revive') {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('💀 Your Pet is Dead')
                .setDescription(`**${pet.petName}** has passed away.\nYou cannot interact with them until you **Revive** them.\n\nUse \`/pet-action revive\` (Requires a **Health Kit** from \`/shop\`).`);
            return interaction.editReply({ embeds: [embed] });
        }

        const inventory = economySystem.getInventory(userId);
        const hasItem = (itemName) => inventory.some(i => i.name.toLowerCase() === itemName.toLowerCase());
        const useItem = (itemName) => economySystem.removeItem(userId, itemName);

        switch (action) {
            case 'feed':
                if (!hasItem('Pet Food')) {
                    return interaction.editReply({ content: "❌ You need **Pet Food** to feed your pet! Buy it from `/shop`." });
                }
                useItem('Pet Food');
                pet.stats.hunger = cap(pet.stats.hunger + 20);
                xpGain = 3;
                message = `You fed **${pet.petName}**. Yummy! (+20 Hunger, +3 XP)`;
                break;

            case 'play':
                pet.stats.happiness = cap(pet.stats.happiness + 15);
                xpGain = 4;
                message = `You played with **${pet.petName}**. So fun! (+15 Happiness, +4 XP)`;
                break;

            case 'pat':
                pet.stats.affection = cap(pet.stats.affection + 15);
                xpGain = 2;
                message = `You patted **${pet.petName}**. They look happy! (+15 Affection, +2 XP)`;
                break;

            case 'sleep':
                pet.stats.energy = cap(pet.stats.energy + 20);
                xpGain = 3;
                message = `**${pet.petName}** took a nap. Zzz... (+20 Energy, +3 XP)`;
                break;

            case 'heal':
                if (!hasItem('Health Pack')) {
                    return interaction.editReply({ content: "❌ You need a **Health Pack** to heal your pet! Buy it from `/shop`." });
                }
                useItem('Health Pack');
                pet.hp = capHp(pet.hp + 50);
                message = `💊 You used a Health Pack on **${pet.petName}**. (+50 HP)`;
                break;

            case 'revive':
                if (!pet.isDead) {
                    return interaction.editReply({ content: "Your pet is already alive!" });
                }
                if (!hasItem('Health Kit')) {
                    return interaction.editReply({ content: "❌ You need a **Health Kit** to revive your pet! Buy it from `/shop`." });
                }
                useItem('Health Kit');
                pet.isDead = false;
                pet.hp = Math.floor(pet.maxHp * 0.5); // Revive with 50% Max HP
                pet.stats.hunger = 50; // Reset hunger slightly
                message = `💖 **${pet.petName}** has been revived! Welcome back!`;
                break;

            case 'grind':
                // Toggle work/grind state
                if (pet.isWorking) {
                    // Stop working
                    const gains = applyWorkGains(pet);
                    pet.isWorking = false;
                    pet.lastWorkUpdate = null;

                    // Add coins to economy
                    economySystem.addBalance(userId, gains.coins);

                    message = `🛑 **${pet.petName}** stopped grinding.\nTime spent: ${(gains.timeWorked / (1000 * 60 * 60)).toFixed(2)} hours.\nEarned: **${gains.coins} coins** and **${gains.xp.toFixed(2)} XP**.\nStats: -${Math.round(gains.hungerLost)} Hunger, -${Math.round(gains.hpLost)} HP.`;

                    xpGain = 0;

                } else {
                    // Start working
                    pet.isWorking = true;
                    pet.lastWorkUpdate = Date.now();
                    message = `⚔️ **${pet.petName}** started grinding! They will earn coins and XP over time.\nUse \`/pet-action grind\` again to stop.\n⚠️ **Warning:** Grinding consumes Hunger. If Hunger reaches 0, your pet will lose HP and die!`;

                    // Save immediately and return
                    pets[interaction.user.id] = pet;
                    fs.writeFileSync(petsFile, JSON.stringify(pets, null, 2));

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(message);
                    return interaction.editReply({ embeds: [embed] });
                }
                break;
        }

        // Bonus XP if stats are high
        const allStatsAbove70 = Object.values(pet.stats).every(val => val >= 70);
        const allStatsAbove80 = Object.values(pet.stats).every(val => val >= 80);

        if (allStatsAbove70 && !pet.isDead) {
            xpGain += 2;
            message += "\n🌟 Bonus XP for keeping stats high!";
        }

        if (allStatsAbove80 && !pet.isDead) {
            xpGain *= 2; // Double growth speed
            message += "\n🚀 2x Growth Speed active!";
        }

        pet.xp += xpGain;
        pet.lastInteraction = Date.now();

        // Level Up Logic
        const xpThreshold = pet.level * 20;
        if (pet.xp >= xpThreshold) {
            pet.level += 1;
            pet.xp -= xpThreshold;
            pet.dailyCoins = 50 + (pet.level * 5);

            // Stat Growth Cycle
            // Level 2: Attack (0)
            // Level 3: Defense (1)
            // Level 4: HP (2)
            // Level 5: Attack (0) ...
            const cycleIndex = (pet.level - 2) % 3;
            let statMsg = "";

            if (cycleIndex === 0) {
                pet.attack += 10;
                statMsg = "⚔️ Attack increased by 10!";
            } else if (cycleIndex === 1) {
                pet.defense += 10;
                statMsg = "🛡️ Defense increased by 10!";
            } else {
                pet.maxHp += 50; // Increase Max HP
                pet.hp += 50;    // Heal by the amount increased
                statMsg = "❤️ Max HP increased by 50!";
            }

            message += `\n🎉 **LEVEL UP!** ${pet.petName} is now Level ${pet.level}!\n${statMsg}\nDaily earnings increased to ${pet.dailyCoins}.`;

            // Visual evolution check (placeholder)
            if (pet.level % 10 === 0) {
                message += `\n✨ **EVOLUTION!** ${pet.petName} looks stronger!`;
            }
        }

        // Boost Day Logic
        if (allStatsAbove80 && pet.level >= 5) {
            // Check if boost is already active
            const isBoostActive = pet.boostActiveUntil && pet.boostActiveUntil > Date.now();
            if (!isBoostActive) {
                // 20-50% increase
                const boostPercent = Math.floor(Math.random() * 31) + 20;
                pet.boostActiveUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
                message += `\n🔥 **BOOST DAY UNLOCKED!** Daily rewards increased by ${boostPercent}% for 24 hours!`;
            }
        }

        pets[interaction.user.id] = pet;
        fs.writeFileSync(petsFile, JSON.stringify(pets, null, 2));

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setDescription(message);

        interaction.editReply({ embeds: [embed] });
    }
};
