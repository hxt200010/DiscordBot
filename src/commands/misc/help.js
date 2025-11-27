const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help', 
    description: 'Generate list of commands', 
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('List of commands')   
            .setColor('Random')
            .setThumbnail(client.user.displayAvatarURL())
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
                    value: `\`\`add, subtract, multiply, divide, sqrt, calculate, log, integrate, sin, cos, tan\`\``, 
                    inline: false  
                }, 
                {
                    name: `misc`, 
                    value: `\`\`owner, ping, avatar, weather, translate, userinfo, help, food\`\``, 
                    inline: false
                },
                {
                    name: `Algorithm gameplay`, 
                    value: `\`\`biggest, smallest, ascending, descending, binarySearch, exponential_search, dfs, roman, remove, duplicate\`\``, 
                    inline: false
                },
                {
                    name: `Fun`, 
                    value: `\`\`meme, say, blackjack\`\``, 
                    inline: false
                },
                {
                    name: `Education`, 
                    value: `\`\`trivia\`\``, 
                    inline: false
                }
            ])
    
        interaction.reply({ embeds: [embed] })
    }
}