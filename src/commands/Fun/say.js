const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Make the bot say what you want to say',
    options: [
        {
            name: 'message',
            description: 'The message you want the bot to say',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const message = interaction.options.getString('message');
        // Reply with the user's message
        interaction.reply(message);
        // Acknowledge the interaction without sending a reply
        interaction.deferReply();
    },
};
