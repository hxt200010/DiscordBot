const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

const petConfig = require('../../utils/petConfig');
const { applyWorkGains } = require('../../utils/petUtils');
const EconomySystem = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');

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
        {
            name: 'pet',
            description: 'Which pet? (Leave empty if you only have one)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        const userPets = await PetSystem.getUserPets(interaction.user.id);

        if (!userPets || userPets.length === 0) return interaction.respond([]);

        const options = userPets.map(pet => ({ name: `${pet.petName} (${pet.type})`, value: pet.petName }));

        // Add "All Pets" option if multiple pets
        if (userPets.length > 1) {
            options.unshift({ name: 'All Pets (Grind/Feed/Play/Sleep)', value: 'all_pets' });
        }

        const filtered = options.filter(opt => opt.name.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25));
    },
    callback: async (client, interaction) => {
        // Cooldown Check
        const userId = interaction.user.id;
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 2000; // Reduced cooldown for better UX with multiple pets
            if (Date.now() < expirationTime) {
                const timeLeft = ((expirationTime - Date.now()) / 1000).toFixed(1);
                return interaction.reply({ content: `⏳ Please wait ${timeLeft} seconds before interacting again.`, ephemeral: true });
            }
        }

        cooldowns.set(userId, Date.now());
        setTimeout(() => cooldowns.delete(userId), 2000);

        await interaction.deferReply();

        const userPets = await PetSystem.getUserPets(userId);

        if (!userPets || userPets.length === 0) {
            return interaction.editReply({ content: "You don't have a pet yet! Use /adopt to get one." });
        }

        const action = interaction.options.getString('action');
        const targetPetName = interaction.options.getString('pet');

        let targets = [];

        if (targetPetName === 'all_pets') {
            targets = userPets;
        } else if (targetPetName) {
            const p = userPets.find(pet => pet.petName === targetPetName);
            if (!p) return interaction.editReply({ content: `❌ Pet **${targetPetName}** not found.` });
            targets = [p];
        } else {
            if (userPets.length === 1) {
                targets = [userPets[0]];
            } else {
                return interaction.editReply({ content: "❌ You have multiple pets! Please select which one to interact with (or select 'All Pets')." });
            }
        }

        const inventory = await EconomySystem.getInventory(userId);
        // Helper to check item count (simple version, assumes inventory is array of objects)
        const countItem = (itemName) => inventory.filter(i => i.name.toLowerCase() === itemName.toLowerCase()).length;
        const useItem = async (itemName) => await EconomySystem.removeItem(userId, itemName);

        let results = [];

        for (const pet of targets) {
            // Initialize stats if missing
            if (!pet.stats) pet.stats = { hunger: 50, happiness: 50, affection: 50, energy: 50 };
            if (!pet.maxHp) pet.maxHp = pet.hp || 100;
            if (!pet.attack) {
                const config = petConfig.find(p => p.value === pet.type);
                const baseStats = config ? config.stats : { attack: 10, defense: 10, health: 100 };
                pet.attack = baseStats.attack;
                pet.defense = baseStats.defense;
                pet.hp = baseStats.health;
            }

            // Cap stats
            const cap = (val) => Math.min(100, val);
            const capHp = (val) => Math.min(pet.maxHp, val);

            // Skip dead pets unless reviving
            if (pet.isDead && action !== 'revive') {
                results.push(`💀 **${pet.petName}** is dead.`);
                continue;
            }

            let xpGain = 0;
            let actionResult = "";
            let itemUsed = false;

            switch (action) {
                case 'feed':
                    if (countItem('Pet Food') > 0) {
                        await useItem('Pet Food');
                        pet.stats.hunger = cap(pet.stats.hunger + 20);
                        xpGain = 3;
                        actionResult = `Fed (+20 Hunger)`;
                        itemUsed = true;
                    } else {
                        actionResult = `❌ No Food`;
                    }
                    break;

                case 'play':
                    pet.stats.happiness = cap(pet.stats.happiness + 15);
                    xpGain = 4;
                    actionResult = `Played (+15 Happy)`;
                    break;

                case 'pat':
                    pet.stats.affection = cap(pet.stats.affection + 15);
                    xpGain = 2;
                    actionResult = `Patted (+15 Affection)`;
                    break;

                case 'sleep':
                    pet.stats.energy = cap(pet.stats.energy + 20);
                    xpGain = 3;
                    actionResult = `Slep (+20 Energy)`;
                    break;

                case 'heal':
                    if (countItem('Health Pack') > 0) {
                        await useItem('Health Pack');
                        pet.hp = capHp(pet.hp + 50);
                        actionResult = `Healed (+50 HP)`;
                        itemUsed = true;
                    } else {
                        actionResult = `❌ No Health Pack`;
                    }
                    break;

                case 'revive':
                    if (!pet.isDead) {
                        actionResult = `Already alive`;
                    } else if (countItem('Health Kit') > 0) {
                        await useItem('Health Kit');
                        pet.isDead = false;
                        pet.hp = Math.floor(pet.maxHp * 0.5);
                        pet.stats.hunger = 50;
                        actionResult = `Revived!`;
                        itemUsed = true;
                    } else {
                        actionResult = `❌ No Health Kit`;
                    }
                    break;

                case 'grind':
                    if (pet.isWorking) {
                        const gains = applyWorkGains(pet);
                        pet.isWorking = false;
                        pet.lastWorkUpdate = null;
                        await EconomySystem.addBalance(userId, gains.coins);
                        actionResult = `Stopped Grinding (+${gains.coins} coins)`;
                    } else {
                        pet.isWorking = true;
                        pet.lastWorkUpdate = Date.now();
                        pet.currentWorkCoins = 0;
                        actionResult = `Started Grinding`;
                    }
                    break;
            }

            if (actionResult.startsWith('❌')) {
                results.push(`**${pet.petName}**: ${actionResult}`);
                continue; // Skip XP and level up if failed
            }

            // Bonus XP
            const allStatsAbove70 = Object.values(pet.stats).every(val => val >= 70);
            const allStatsAbove80 = Object.values(pet.stats).every(val => val >= 80);

            if (allStatsAbove70 && !pet.isDead) xpGain += 2;
            if (allStatsAbove80 && !pet.isDead) xpGain *= 2;

            pet.xp += xpGain;
            pet.lastInteraction = Date.now();

            // Level Up
            const xpThreshold = pet.level * 20;
            if (pet.xp >= xpThreshold) {
                pet.level += 1;
                pet.xp -= xpThreshold;
                pet.dailyCoins = 50 + (pet.level * 5);

                const cycleIndex = (pet.level - 2) % 3;
                if (cycleIndex === 0) pet.attack += 10;
                else if (cycleIndex === 1) pet.defense += 10;
                else { pet.maxHp += 50; pet.hp += 50; }

                actionResult += ` | **LEVEL UP!** (${pet.level})`;
            }

            results.push(`**${pet.petName}**: ${actionResult}`);

            // Update DB
            await PetSystem.updatePet(pet.id, (p) => {
                // Map local pet properties back to Mongoose document structure
                p.stats.health = pet.hp;
                p.stats.hunger = pet.stats.hunger;
                p.stats.happiness = pet.stats.happiness;
                p.stats.affection = pet.stats.affection;
                p.stats.energy = pet.stats.energy;
                p.stats.cleanliness = pet.stats.cleanliness || 100;
                p.stats.attack = pet.attack;
                p.stats.defense = pet.defense;

                p.isDead = pet.isDead;
                p.isWorking = pet.isWorking;
                p.lastWorkUpdate = pet.lastWorkUpdate;
                p.currentWorkCoins = pet.currentWorkCoins;
                p.xp = pet.xp;
                p.level = pet.level;
                p.lastInteraction = pet.lastInteraction;
                p.dailyCoins = pet.dailyCoins;
                p.maxHp = pet.maxHp;
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Pet Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setColor('Gold')
            .setDescription(results.join('\n') || "No changes.");

        interaction.editReply({ embeds: [embed] });
    }
};
