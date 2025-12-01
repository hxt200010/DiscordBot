const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petConfig = require('../../utils/petConfig');
const economySystem = require('../../utils/EconomySystem');
const { applyWorkGains } = require('../../utils/petUtils');

const petsFile = path.join(__dirname, '../../data/pets.json');

function createBar(value, max = 100) {
    const percentage = value / max;
    const filled = Math.max(0, Math.min(10, Math.floor(percentage * 10)));
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

module.exports = {
    name: 'pet',
    description: 'Check your virtual pet status',
    options: [
        {
            name: 'name',
            description: 'Name of the pet to view',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        let petsData = {};
        if (fs.existsSync(petsFile)) {
            try {
                petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
            } catch (e) {
                return interaction.respond([]);
            }
        }

        let userPets = petsData[interaction.user.id];
        if (!userPets) return interaction.respond([]);
        if (!Array.isArray(userPets)) userPets = [userPets];

        const filtered = userPets.filter(pet => pet.petName.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(
            filtered.slice(0, 25).map(pet => ({ name: `${pet.petName} (${pet.type})`, value: pet.petName }))
        );
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        if (!fs.existsSync(petsFile)) {
            return interaction.editReply({ content: "No pets found! Use /adopt to get one." });
        }

        let petsData = {};
        try {
            petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.editReply({ content: "Error reading pet data." });
        }

        let userPets = petsData[interaction.user.id];

        if (!userPets) {
            return interaction.editReply({ content: "You don't have a pet yet! Use /adopt to get one." });
        }

        // Migration check
        if (!Array.isArray(userPets)) {
            userPets = [userPets];
            // We don't save here to avoid side effects during read, but adopt/action will fix it.
            // Actually, let's fix it here for consistency if we are going to use it.
            petsData[interaction.user.id] = userPets;
            fs.writeFileSync(petsFile, JSON.stringify(petsData, null, 2));
        }

        const targetPetName = interaction.options.getString('name');
        let pet;

        if (targetPetName) {
            pet = userPets.find(p => p.petName.toLowerCase() === targetPetName.toLowerCase());
            if (!pet) {
                return interaction.editReply({ content: `❌ You don't have a pet named **${targetPetName}**.` });
            }
        } else {
            // If no specific pet requested
            if (userPets.length > 1) {
                // Show list
                const embed = new EmbedBuilder()
                    .setTitle('🐾 Your Pets')
                    .setColor('Blue')
                    .setDescription('You have multiple pets! Use `/pet name:<name>` to see details.');

                userPets.forEach(p => {
                    embed.addFields({
                        name: `${p.isDead ? '💀' : '❤️'} ${p.petName} (${p.type})`,
                        value: `Lvl ${p.level} | HP: ${Math.round(p.hp)}/${p.maxHp || 100} | ${p.isWorking ? '⚔️ Grinding' : '💤 Idle'}`,
                        inline: false
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            } else {
                // Only 1 pet, show details
                pet = userPets[0];
            }
        }

        // Ensure stats exist (migration safety)
        if (!pet.stats) {
            pet.stats = { hunger: 50, happiness: 50, affection: 50, energy: 50 };
        }

        // Initialize MaxHP if missing
        if (!pet.maxHp) {
            pet.maxHp = pet.hp || 100;
        }

        const config = petConfig.find(p => p.value === pet.type);
        const baseStats = config ? config.stats : { attack: 10, defense: 10, health: 100 };

        // Apply pending work gains
        let workMessage = "";
        if (pet.isWorking) {
            const gains = applyWorkGains(pet);
            if (gains.coins > 0 || gains.xp > 0) {
                // Update economy with coins
                economySystem.addBalance(interaction.user.id, gains.coins);

                workMessage = `\n⚔️ **Grinding:** Collected **${gains.coins} coins** & **${gains.xp.toFixed(2)} XP** since last check.`;
                if (gains.hungerLost > 0) workMessage += `\n📉 Stats: -${Math.round(gains.hungerLost)} Hunger`;
                if (gains.hpLost > 0) workMessage += `, -${Math.round(gains.hpLost)} HP`;
            } else {
                workMessage = "\n⚔️ **Grinding:** Currently grinding...";
            }
        }

        // Save pet state (applyWorkGains updates pet object)
        // We need to update the specific pet in the array
        // Since 'pet' is a reference to the object in 'userPets' array (which is in petsData), 
        // modifying 'pet' modifies 'petsData' structure? 
        // Yes, in JS objects are references.

        fs.writeFileSync(petsFile, JSON.stringify(petsData, null, 2));

        const embed = new EmbedBuilder()
            .setColor(pet.isDead ? 'Black' : '#0099ff')
            .setTitle(`${pet.isDead ? '💀' : '🐾'} ${pet.petName}'s Status`)
            .setDescription(`**Type:** ${pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}\n**XP:** ${pet.xp.toFixed(1)}/${pet.level * 20}${workMessage}`)
            .addFields(
                { name: 'Health ❤️', value: `${createBar(pet.hp, pet.maxHp)} ${Math.round(pet.hp)}/${pet.maxHp}`, inline: true },
                { name: 'Hunger 🍖', value: `${createBar(pet.stats.hunger)} ${Math.round(pet.stats.hunger)}/100`, inline: true },
                { name: 'Energy ⚡', value: `${createBar(pet.stats.energy)} ${Math.round(pet.stats.energy)}/100`, inline: true },
                { name: 'Happiness 🎾', value: `${createBar(pet.stats.happiness)} ${Math.round(pet.stats.happiness)}/100`, inline: true },
                { name: 'Affection 💖', value: `${createBar(pet.stats.affection)} ${Math.round(pet.stats.affection)}/100`, inline: true },
                { name: 'Level 🏅', value: `${pet.level}`, inline: true },
                { name: 'Combat ⚔️', value: `AP: ${pet.attack || baseStats.attack} | DP: ${pet.defense || baseStats.defense}`, inline: false }
            );

        if (pet.isDead) {
            embed.addFields({ name: '💀 DECEASED', value: 'This pet has died. Use `/pet-action revive` with a Health Kit to bring them back.', inline: false });
        } else if (pet.boostActiveUntil && pet.boostActiveUntil > Date.now()) {
            embed.addFields({ name: '🔥 Boost Day Active!', value: 'Rewards increased!', inline: true });
        }

        const extensions = ['.png', '.jpg', '.jpeg'];
        let imagePath = null;
        let fileName = null;

        for (const ext of extensions) {
            const testPath = path.join(__dirname, `../../Images/${pet.type}_pet${ext}`);
            if (fs.existsSync(testPath)) {
                imagePath = testPath;
                fileName = `${pet.type}_pet${ext}`;
                break;
            }
        }

        if (imagePath) {
            embed.setThumbnail(`attachment://${fileName}`);
            return interaction.editReply({ embeds: [embed], files: [imagePath] });
        }

        interaction.editReply({ embeds: [embed] });
    }
};
