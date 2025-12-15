const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const petConfig = require('../../utils/petConfig');

module.exports = {
    name: 'pet-list',
    description: 'Show all available pets to adopt',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const embeds = [];
        const files = [];
        const fs = require('fs');
        const path = require('path');

        // Split pets into adoptable and evolution pets
        const adoptablePets = petConfig.filter(p => !p.isEvolution);
        const evolutionPets = petConfig.filter(p => p.isEvolution);

        for (const pet of adoptablePets) {
            const embed = new EmbedBuilder()
                .setTitle(`${pet.emoji} ${pet.name}`)
                .setDescription(pet.description)
                .addFields(
                    { name: 'Type', value: `\`${pet.value}\``, inline: true },
                    { name: 'Stats', value: `⚔️ AP: ${pet.stats.attack} | 🛡️ DP: ${pet.stats.defense} | ❤️ HP: ${pet.stats.health}`, inline: true }
                )
                .setColor('Blue');

            // Find image
            const extensions = ['.png', '.jpg', '.jpeg'];
            let imagePath = null;
            let fileName = null;

            for (const ext of extensions) {
                const testPath = path.join(__dirname, `../../Images/${pet.value}_pet${ext}`);
                if (fs.existsSync(testPath)) {
                    imagePath = testPath;
                    fileName = `${pet.value}_pet${ext}`;
                    break;
                }
            }

            if (imagePath) {
                const attachment = new AttachmentBuilder(imagePath, { name: fileName });
                embed.setThumbnail(`attachment://${fileName}`);
                files.push(attachment);
            }

            embeds.push(embed);
        }

        // Add evolution pets section
        for (const pet of evolutionPets) {
            const baseConfig = petConfig.find(p => p.value === pet.evolvesFrom);
            const baseName = baseConfig ? baseConfig.name : pet.evolvesFrom;
            
            const embed = new EmbedBuilder()
                .setTitle(`${pet.emoji} ${pet.name} ⭐ TIER ${pet.tier || 2}`)
                .setDescription(pet.description)
                .addFields(
                    { name: 'Stats', value: `⚔️ AP: ${pet.stats.attack} | 🛡️ DP: ${pet.stats.defense} | ❤️ HP: ${pet.stats.health}`, inline: true },
                    { name: '🔓 How to Obtain', value: `Evolve **${baseName}** to **Level ${pet.evolutionLevel}**`, inline: true },
                    { name: '✨ Innate Skill', value: pet.innateSkill || 'None', inline: true }
                )
                .setColor('Gold');

            // Find image
            const extensions = ['.png', '.jpg', '.jpeg'];
            let imagePath = null;
            let fileName = null;

            for (const ext of extensions) {
                const testPath = path.join(__dirname, `../../Images/${pet.value}_pet${ext}`);
                if (fs.existsSync(testPath)) {
                    imagePath = testPath;
                    fileName = `${pet.value}_pet${ext}`;
                    break;
                }
            }

            if (imagePath) {
                const attachment = new AttachmentBuilder(imagePath, { name: fileName });
                embed.setThumbnail(`attachment://${fileName}`);
                files.push(attachment);
            }

            embeds.push(embed);
        }

        // Add a footer to the last embed
        if (embeds.length > 0) {
            embeds[embeds.length - 1].setFooter({ text: 'Use /adopt <character> to adopt one! Evolution pets must be earned!' });
        }

        interaction.editReply({ embeds: embeds, files: files });
    }
};
