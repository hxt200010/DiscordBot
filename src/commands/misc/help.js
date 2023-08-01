const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help', 
    description: 'Generate list of commands, new version', 
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('List of commands')
            .setColor('Random')
            .setImage(client.guilds.icon)
            .setTimestamp(Date.now())
            .setAuthor({
                icon: interaction.user.avatar, 
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user.displayAvatarURL(), 
                text: client.user.tag
            })
            .addFields([
                {
                    name: `Moderation`, 
                    value: `\`\`\`kick, ban, mute, role\`\`\``,
                    inline: true
                }, 
                {
                    name: `math`, 
                    value: `\`\`\`add, subtract, multiply, divide\`\`\``, 
                    inline: true   
                }
            ])
    
        interaction.reply({ embeds: [embed] })
    }
}