const { Client, Interaction, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'whoisshadow',
    description: 'Introduces the Ultimate Life Form: Shadow the Hedgehog.',
    
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const imagePath = path.join(__dirname, '../../Images/shadow.png');
        const attachment = new AttachmentBuilder(imagePath, { name: 'shadow.png' });

        const embed = new EmbedBuilder()
            .setTitle('⚫ The Ultimate Life Form: Shadow the Hedgehog')
            .setDescription(
                "**\"I am Shadow. The world’s ultimate life form.\"**\n\n" +
                "Created by Professor Gerald Robotnik aboard the Space Colony ARK, I was born not merely to exist, but to surpass all limits. I am the cure, and I am the weapon. I rival even the fastest thing alive, but unlike him, I do not run for fun. I run to fulfill a promise.\n\n" +
                "**In Sonic the Hedgehog 3**, you will witness the true extent of my power. I do not fight for your petty concepts of justice or evil. I fight for Maria. When I unleash **Chaos Control**, time itself bends to my will, freezing my enemies in a helpless void. The inhibitors on my wrists are the only thing keeping the world from being consumed by my raw, unstable energy.\n\n" +
                "**Super Shadow:**\n" +
                "When the Chaos Emeralds answer my call, I ascend. My fur turns to gold, and I become an unstoppable force of destruction. In this form, I have teleported massive space colonies, battled biolizard monstrosities, and defied gravity itself. I am the storm that approaches. I am the end of the line.\n\n" +
                "When I take off my rings, you will see my true power."
            )
            .setColor('#8B0000') // Dark Red
            .setImage('attachment://shadow.png')
            .setFooter({ text: 'Hail to the Ultimate Life Form' });

        await interaction.reply({ embeds: [embed], files: [attachment] });
    },
};
