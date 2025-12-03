const { EmbedBuilder, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petConfig = require('../../utils/petConfig');
const EconomySystem = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');
const PetSystem = require('../../utils/PetSystem');
const { applyWorkGains, checkLevelUp } = require('../../utils/petUtils');

function createBar(value, max = 100) {
    const percentage = value / max;
    const filled = Math.max(0, Math.min(10, Math.round(percentage * 10)));
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

async function generatePetEmbed(pet, userId, interaction) {
    // Ensure stats exist (migration safety)
    if (!pet.stats) {
        pet.stats = { hunger: 50, happiness: 50, affection: 50, energy: 50 };
    }

    // Initialize MaxHP if missing OR if it's the default 100 but shouldn't be
    const config = petConfig.find(p => p.value === pet.type);
    const baseStats = config ? config.stats : { attack: 10, defense: 10, health: 100 };

    if (!pet.maxHp || (pet.maxHp === 100 && baseStats.health !== 100)) {
        pet.maxHp = baseStats.health;
    }

    // Initialize HP if missing or NaN
    if (pet.hp === undefined || pet.hp === null || isNaN(pet.hp)) {
        pet.hp = pet.maxHp;
    }

    // Apply pending work gains
    let workMessage = "";
    if (pet.isWorking) {
        const gains = applyWorkGains(pet);
        if (gains.coins > 0 || gains.xp > 0) {
            // Update economy with coins
            await EconomySystem.addBalance(userId, gains.coins);

            // Update pet stats in DB
            await PetSystem.updatePet(pet.id, (p) => {
                p.xp = (p.xp || 0) + gains.xp;
                p.stats.hunger = Math.max(0, (p.stats.hunger || 50) - gains.hungerLost);
                p.hp = Math.max(0, (p.hp || p.maxHp) - gains.hpLost);
                p.lastWorkUpdate = Date.now();
                p.currentWorkCoins = (p.currentWorkCoins || 0) + gains.coins;

                // Check for level up in DB
                checkLevelUp(p);
            });

            // Update local pet object for display
            // applyWorkGains already updated pet.xp, pet.stats.hunger, pet.hp, pet.lastWorkUpdate
            // We just need to update currentWorkCoins as applyWorkGains doesn't track that on the pet object directly in the same way?
            // Wait, applyWorkGains does NOT update currentWorkCoins on the pet object.
            pet.currentWorkCoins = (pet.currentWorkCoins || 0) + gains.coins;

            // Note: pet.xp, pet.level, pet.stats, pet.hp are already updated by applyWorkGains(pet) reference.

            workMessage = `\n⚔️ **Grinding:** Collected **${gains.coins} coins** & **${gains.xp.toFixed(2)} XP** since last check. (Total this session: **${pet.currentWorkCoins} coins**)`;
            if (gains.hungerLost > 0) workMessage += `\n📉 Stats: -${gains.hungerLost.toFixed(1)} Hunger`;
            if (gains.hpLost > 0) workMessage += `, -${gains.hpLost.toFixed(1)} HP`;
        } else {
            workMessage = `\n⚔️ **Grinding:** Currently grinding... (Total this session: **${pet.currentWorkCoins || 0} coins**)`;
        }
    }

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
        return { embed, file: new AttachmentBuilder(imagePath, { name: fileName }) };
    }

    return { embed, file: null };
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
        const userPets = await PetSystem.getUserPets(interaction.user.id);

        if (!userPets || userPets.length === 0) return interaction.respond([]);

        const filtered = userPets.filter(pet => pet.petName.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(
            filtered.slice(0, 25).map(pet => ({ name: `${pet.petName} (${pet.type})`, value: pet.petName }))
        );
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userPets = await PetSystem.getUserPets(interaction.user.id);

        if (!userPets || userPets.length === 0) {
            return interaction.editReply({ content: "You don't have a pet yet! Use /adopt to get one." });
        }

        const targetPetName = interaction.options.getString('name');
        let targets = [];

        if (targetPetName) {
            const pet = userPets.find(p => p.petName.toLowerCase() === targetPetName.toLowerCase());
            if (!pet) {
                return interaction.editReply({ content: `❌ You don't have a pet named **${targetPetName}**.` });
            }
            targets = [pet];
        } else {
            // Show all pets
            targets = userPets;
        }

        const embeds = [];
        const files = [];

        // Limit to 10 pets to avoid Discord limits
        const displayTargets = targets.slice(0, 10);

        for (const pet of displayTargets) {
            const { embed, file } = await generatePetEmbed(pet, interaction.user.id, interaction);
            embeds.push(embed);
            if (file) {
                const ext = path.extname(file.name);
                const name = path.basename(file.name, ext);
                const uniqueName = `${name}_${pet.petName.replace(/\s+/g, '')}${ext}`;
                file.setName(uniqueName);
                embed.setThumbnail(`attachment://${uniqueName}`);
                files.push(file);
            }
        }

        if (targets.length > 10) {
            const footerEmbed = new EmbedBuilder()
                .setDescription(`*...and ${targets.length - 10} more pets not shown.*`)
                .setColor('Grey');
            embeds.push(footerEmbed);
        }

        interaction.editReply({ embeds: embeds, files: files });
    }
};
