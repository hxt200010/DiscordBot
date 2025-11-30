const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

module.exports = {
    name: 'pet-action',
    description: 'Interact with your pet',
    options: [
        {
            name: 'action',
            description: 'What do you want to do?',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Feed 🍎', value: 'feed' },
                { name: 'Play 🎾', value: 'play' },
                { name: 'Pat 👋', value: 'pat' },
                { name: 'Sleep 💤', value: 'sleep' },
            ],
        },
    ],
    callback: async (client, interaction) => {
        if (!fs.existsSync(petsFile)) {
            return interaction.reply({ content: "No pets found! Use /adopt to get one.", ephemeral: true });
        }

        let pets = {};
        try {
            pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: "Error reading pet data.", ephemeral: true });
        }

        let pet = pets[interaction.user.id];

        if (!pet) {
            return interaction.reply({ content: "You don't have a pet yet! Use /adopt to get one.", ephemeral: true });
        }

        const action = interaction.options.getString('action');
        let message = "";
        let xpGain = 0;

        // Cap stats at 100
        const cap = (val) => Math.min(100, val);

        switch (action) {
            case 'feed':
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
        }

        // Bonus XP if stats are high
        const allStatsAbove70 = Object.values(pet.stats).every(val => val >= 70);
        const allStatsAbove80 = Object.values(pet.stats).every(val => val >= 80);

        if (allStatsAbove70) {
            xpGain += 2;
            message += "\n🌟 Bonus XP for keeping stats high!";
        }
        
        if (allStatsAbove80) {
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
            message += `\n🎉 **LEVEL UP!** ${pet.petName} is now Level ${pet.level}! Daily earnings increased to ${pet.dailyCoins}.`;
            
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

        interaction.reply({ embeds: [embed] });
    }
};
