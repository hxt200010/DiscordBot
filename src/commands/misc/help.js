const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help', 
    description: 'Generate list of commands', 
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
                    value: `\`\`kick, ban\`\``,
                    inline: false
                }, 
                {
                    name: `mathematic`, 
                    value: `\`\`add, subtract, multiply, divide, sqrt, calculate, log\`\``, 
                    inline: false  
                }, 
                {
                    name: `misc`, 
                    value: `\`\`owner, ping, avatar, help\`\``, 
                    inline: false
                },
                {
                    name: `Algorithm gameplay`, 
                    value: `\`\`biggest, smallest\`\``, 
                    inline: false
                },
                {
                    name: `Fun`, 
                    value: `\`\`meme\`\``, 
                    inline: false
                }
            ])
    
        interaction.reply({ embeds: [embed] })
    }
}