const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'aboutme',
    description: 'Introduces who Sonic the Hedgehog is!',
    callback: async (client, interaction) => {
        const videoPath = path.join(__dirname, '../../images/sonic_jumping.mp4');
        const videoAttachment = new AttachmentBuilder(videoPath);

        const embed = new EmbedBuilder()
            .setTitle('About Sonic the Hedgehog')
            .setDescription("I'm Sonic the Hedgehog! The fastest thing alive! I run around saving the world from Dr. Eggman and his robotic army. I love chili dogs and hanging out with my friends Tails and Knuckles!")
            .setColor('#0000FF') // Blue color for Sonic
            .setFooter({ text: 'Gotta go fast!' });

        await interaction.reply({ embeds: [embed], files: [videoAttachment] });
    },
};
