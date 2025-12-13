const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const guildConfig = require('../../utils/GuildConfig');

module.exports = {
    name: 'config',
    description: 'Server configuration commands',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.SendMessages],
    options: [
        {
            name: 'chatbot-enable',
            description: 'Enable the chatbot in a specific channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'channel', description: 'Channel to enable chatbot in', type: ApplicationCommandOptionType.Channel, required: true }
            ]
        },
        {
            name: 'chatbot-disable',
            description: 'Disable the chatbot in a specific channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'channel', description: 'Channel to disable chatbot in', type: ApplicationCommandOptionType.Channel, required: true }
            ]
        }
    ],
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('channel');

        try {
            switch (subcommand) {
                case 'chatbot-enable': {
                    if (!channel.isTextBased()) {
                        return interaction.reply({ content: '❌ Please select a text-based channel.', ephemeral: true });
                    }
                    const added = guildConfig.addChatbotChannel(interaction.guild.id, channel.id);
                    if (added) {
                        await interaction.reply({ content: `✅ Chatbot enabled in ${channel}`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `ℹ️ Chatbot is already enabled in ${channel}`, ephemeral: true });
                    }
                    break;
                }
                case 'chatbot-disable': {
                    const removed = guildConfig.removeChatbotChannel(interaction.guild.id, channel.id);
                    if (removed) {
                        await interaction.reply({ content: `✅ Chatbot disabled in ${channel}`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `ℹ️ Chatbot was not enabled in ${channel}`, ephemeral: true });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in /config ${subcommand}:`, error);
            await interaction.reply({ content: `❌ An error occurred: ${error.message}`, ephemeral: true });
        }
    }
};
