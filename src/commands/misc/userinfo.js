const { ApplicationCommandOptionType, EmbedBuilder, Embed } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Get information about a user',
    options: [
        {
            name: 'user',
            description: 'The user you want to get information about',
            type: ApplicationCommandOptionType.Mentionable,
            required: false, // Set to true if you want to make the user parameter required
        },
    ],
    callback: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id); 
        const icon = user.displayAvatarURL();
        const tag = user.tag; 
        const embed = new EmbedBuilder()
        .setColor('Random')
        .setAuthor({name: tag, iconURL: icon})
        .setThumbnail(icon)
        .addFields(
            { 
                 name: "Member", 
                 value: `${user}`,
                 inline: false
            })
        .addFields(
            {
                name: "Roles", 
                value: `${member.roles.cache.map(r => r).join(' ')}`,
                inline: false
            }
        )
        .addFields(
            {
                name: "Joined Server", 
                value: `<t:${parseInt(member.joinedTimestamp / 1000)}:R>`, 
                inline: true
            }
        )
        .addFields(
            {
                name: "Joined Discord", 
                value: `<t:${Math.floor(user.createdTimestamp/ 1000)}:R>`, 
                inline: true
            },
            {
                name: 'Bot Account',
                value: user.bot ? 'Yes' : 'No',
                inline: true,
            }
            // Add more fields as needed
        )
        
        .setFooter({
            text: `User ID: ${user.id}`
        })
        .setTimestamp()

        await interaction.reply({ embeds: [embed] });
    },
};
