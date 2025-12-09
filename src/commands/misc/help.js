const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Generate list of commands',
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('Sonic Bot Command List')
            .setColor('Blue')
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp(Date.now())
            .setAuthor({
                icon: interaction.user.avatar,
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user.displayAvatarURL(),
                text: 'Use /help-pet for detailed pet system guide!'
            })
            .addFields([
                {
                    name: 'Pet System',
                    value: '`adopt, pet, pet-action, pet-list, sell-pet, attack, equip, teach, pet-glasses, help-pet`',
                    inline: false
                },
                {
                    name: 'Economy',
                    value: '`balance, daily, give, achievements, spin`',
                    inline: false
                },
                {
                    name: 'Shop',
                    value: '`shop, buy, inventory, open, shoot, repair, shield`',
                    inline: false
                },
                {
                    name: 'Fun & Games',
                    value: '`shadow, meme, say, blackjack, mine, riddle, cipher, sudoku, hangman`',
                    inline: false
                },
                {
                    name: 'Education',
                    value: '`learn, learnai, trivia, datastructure, interview, job-interview`',
                    inline: false
                },
                {
                    name: 'Mathematic',
                    value: '`add, subtract, multiply, divide, sqrt, calculate, log, integrate, sin, cos, tan`',
                    inline: false
                },
                {
                    name: 'Algorithm Gameplay',
                    value: '`biggest, smallest, ascending, descending, binarySearch, exponential_search, dfs, roman, remove, duplicate`',
                    inline: false
                },
                {
                    name: 'Moderation',
                    value: '`kick, ban, timeout, unban, untimeout, purge`',
                    inline: false
                },
                {
                    name: 'Stock Market',
                    value: '`stock, chart, compare, watchlist, alert, stock-search, stock-trending`',
                    inline: false
                },
                {
                    name: 'Misc',
                    value: '`owner, ping, avatar, weather, translate, userinfo, food, work, poll, steal`',
                    inline: false
                },
                {
                    name: 'Configuration',
                    value: '`setupChatbot, disableChatbot`',
                    inline: false
                }
            ]);

        try {
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in help command:', error);
        }
    }
};