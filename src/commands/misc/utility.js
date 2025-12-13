const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const translate = require('translate-google');

module.exports = {
    name: 'misc',
    description: 'Miscellaneous utility commands',
    options: [
        {
            name: 'ping',
            description: 'Check bot latency',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'avatar',
            description: 'Get a user\'s avatar',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to get avatar of', type: ApplicationCommandOptionType.User, required: false }
            ]
        },
        {
            name: 'owner',
            description: 'Display the bot owner',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'userinfo',
            description: 'Get information about a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'user', description: 'User to get info about', type: ApplicationCommandOptionType.User, required: false }
            ]
        },
        {
            name: 'translate',
            description: 'Translate text to another language',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'text', description: 'Text to translate', type: ApplicationCommandOptionType.String, required: true },
                { name: 'language', description: 'Target language code (e.g., es, fr, de)', type: ApplicationCommandOptionType.String, required: true }
            ]
        },
        {
            name: 'time',
            description: 'Get current time',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'ping': {
                    await interaction.deferReply();
                    const reply = await interaction.fetchReply();
                    const ping = reply.createdTimestamp - interaction.createdTimestamp;
                    await interaction.editReply(`🏓 **Pong!**\nClient: ${ping}ms | WebSocket: ${client.ws.ping}ms`);
                    break;
                }
                case 'avatar': {
                    const user = interaction.options.getUser('user') || interaction.user;
                    const avatarURL = user.displayAvatarURL({ format: 'png', size: 4096, dynamic: true });
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setImage(avatarURL)
                        .setTitle(`${user.tag}'s Avatar`)
                        .setURL(avatarURL);
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'owner': {
                    const botOwnerId = '704744682080567306';
                    const botOwner = client.users.cache.get(botOwnerId);
                    if (botOwner) {
                        await interaction.reply(`👑 Bot owner: **${botOwner.tag}**`);
                    } else {
                        await interaction.reply('Bot owner not found.');
                    }
                    break;
                }
                case 'userinfo': {
                    const user = interaction.options.getUser('user') || interaction.user;
                    const member = await interaction.guild.members.fetch(user.id);
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                        .setThumbnail(user.displayAvatarURL())
                        .addFields(
                            { name: 'Member', value: `${user}`, inline: true },
                            { name: 'Bot?', value: user.bot ? 'Yes' : 'No', inline: true },
                            { name: 'Roles', value: member.roles.cache.map(r => r).join(' ').slice(0, 1024) || 'None' },
                            { name: 'Joined Server', value: `<t:${parseInt(member.joinedTimestamp / 1000)}:R>`, inline: true },
                            { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
                        )
                        .setFooter({ text: `User ID: ${user.id}` })
                        .setTimestamp();
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'translate': {
                    const text = interaction.options.getString('text');
                    const targetLang = interaction.options.getString('language');
                    await interaction.deferReply();
                    const translated = await translate(text, { to: targetLang });
                    await interaction.editReply(`🌐 **Translation:**\n${translated}`);
                    break;
                }
                case 'time': {
                    const now = new Date();
                    await interaction.reply(`🕐 Current time: **${now.toLocaleString()}**`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in /misc ${subcommand}:`, error);
            const reply = interaction.deferred ? interaction.editReply : interaction.reply;
            await reply.call(interaction, { content: `❌ An error occurred: ${error.message}`, ephemeral: true });
        }
    }
};
