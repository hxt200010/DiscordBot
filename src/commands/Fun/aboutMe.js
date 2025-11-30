const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'aboutme',
    description: 'Introduces who Sonic the Hedgehog is!',
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('About Sonic the Hedgehog')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription("I'm Sonic the Hedgehog! The fastest thing alive! I run around saving the world from Dr. Eggman and his robotic army. I love chili dogs and hanging out with my friends Tails and Knuckles!")
            .setColor('#0000FF') // Blue color for Sonic
            .setFooter({ text: 'Sonic deee HEDGEHOGGG' });

        await interaction.reply({ embeds: [embed] });
    },
};
