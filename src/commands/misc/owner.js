const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'owner',
    description: 'Display the bot owner',
    callback: (client, interaction) => {
        // Get the bot owner's user ID from your .env or hardcoded
        const botOwnerId = '704744682080567306'; // Replace with your bot owner's user ID

        // Fetch the bot owner user object
        const botOwner = client.users.cache.get(botOwnerId);

        if (botOwner) {
            interaction.reply(`The bot owner is: ${botOwner.tag}`);
        } else {
            interaction.reply('Bot owner not found.');
        }
    },
};
