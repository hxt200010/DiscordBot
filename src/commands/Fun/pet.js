const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

function createBar(stat) {
    const filled = Math.max(0, Math.min(10, Math.floor(stat / 10)));
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

module.exports = {
    name: 'pet',
    description: 'Check your virtual pet status',
    callback: async (client, interaction) => {
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

        const pet = pets[interaction.user.id];

        if (!pet) {
            return interaction.editReply({ content: "You don't have a pet yet! Use /adopt to get one." });
        }

        // Ensure stats exist (migration safety)
        if (!pet.stats) {
            pet.stats = { hunger: 50, happiness: 50, affection: 50, energy: 50 };
        }

        const stats = pet.stats;
        const embed = new EmbedBuilder()
            .setTitle(`🐾 ${pet.petName} (Level ${pet.level})`)
            .setDescription(`**Type:** ${pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}\n**XP:** ${pet.xp}/${pet.level * 20}`)
            .setColor('Blue')
            .addFields(
                { name: 'Hunger', value: `${createBar(stats.hunger)} ${stats.hunger}/100`, inline: false },
                { name: 'Happiness', value: `${createBar(stats.happiness)} ${stats.happiness}/100`, inline: false },
                { name: 'Affection', value: `${createBar(stats.affection)} ${stats.affection}/100`, inline: false },
                { name: 'Energy', value: `${createBar(stats.energy)} ${stats.energy}/100`, inline: false },
                { name: 'Daily Coins', value: `${pet.dailyCoins || (50 + pet.level * 5)}`, inline: true }
            );
        
        if (pet.boostActiveUntil && pet.boostActiveUntil > Date.now()) {
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
