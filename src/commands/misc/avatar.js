const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    deleted: true, // Consolidated into /misc utility command
    name: 'avatar',
    description: 'Generate your or other avatar picture',
    options: [
        {
            name: 'user',
            description: 'someone else\'s profile',
            type: ApplicationCommandOptionType.Mentionable, 
            required: false,
        }
    ],
    /**
     * 
     * @param {*} client 
     * @param {*} interaction 
     */
    callback: async (client, interaction) => {
        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 4096, dynamic: true });
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setImage(avatarURL)
                .setTitle(`${user.tag}'s Avatar`);
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.log(`${error}`); 
        }
    },
};
