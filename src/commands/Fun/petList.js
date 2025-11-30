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

        for (const pet of petConfig) {
            const embed = new EmbedBuilder()
                .setTitle(`${pet.emoji} ${pet.name}`)
                .setDescription(`Type: \`${pet.value}\``)
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
        
        // Add a footer to the last embed
        if (embeds.length > 0) {
            embeds[embeds.length - 1].setFooter({ text: 'Use /adopt <character> to adopt one!' });
        }

        interaction.editReply({ embeds: embeds, files: files });
    }
};
