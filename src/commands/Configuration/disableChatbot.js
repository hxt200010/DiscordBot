const { Client, Interaction, PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');
const guildConfig = require('../../utils/GuildConfig');

module.exports = {
    deleted: true, // Consolidated into /config command
    name: 'disablechatbot',
    description: 'Disable the chatbot in a specific channel',
    options: [
        {
            name: 'channel',
            description: 'The channel to disable the chatbot in',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.SendMessages],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const channel = interaction.options.getChannel('channel');

        const removed = guildConfig.removeChatbotChannel(interaction.guild.id, channel.id);

        if (removed) {
            interaction.reply({ content: `✅ Chatbot has been disabled in ${channel}.`, ephemeral: true });
        } else {
            interaction.reply({ content: `ℹ️ Chatbot was not enabled in ${channel}.`, ephemeral: true });
        }
    },
};
