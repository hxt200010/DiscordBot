const { Client, Interaction, PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js');
const guildConfig = require('../../utils/GuildConfig');

module.exports = {
    deleted: true, // Consolidated into /config command
    name: 'setupchatbot',
    description: 'Enable the chatbot in a specific channel',
    options: [
        {
            name: 'channel',
            description: 'The channel to enable the chatbot in',
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

        if (!channel.isTextBased()) {
            interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
            return;
        }

        const added = guildConfig.addChatbotChannel(interaction.guild.id, channel.id);

        if (added) {
            interaction.reply({ content: `✅ Chatbot has been enabled in ${channel}.`, ephemeral: true });
        } else {
            interaction.reply({ content: `ℹ️ Chatbot is already enabled in ${channel}.`, ephemeral: true });
        }
    },
};
