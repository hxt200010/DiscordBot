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
                iconURL: interaction.user.displayAvatarURL(),
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user.displayAvatarURL(),
                text: 'Use /help-pet for detailed pet system guide!'
            })
            .addFields([
                {
                    name: '🐾 Pet System',
                    value: '`adopt, pet, pet-action, pet-list, sell-pet, attack, equip, teach, pet-glasses, pet-chat, help-pet`',
                    inline: false
                },
                {
                    name: '💰 Economy & Rewards',
                    value: '`balance, daily, give, gift, achievements, spin, bounty, chaos-emeralds`',
                    inline: false
                },
                {
                    name: '🛒 Shop',
                    value: '`shop, buy, inventory, open, shoot, repair, shield, use-item`',
                    inline: false
                },
                {
                    name: '🎰 Casino & Betting',
                    value: '`blackjack, highlow, slots, crash, scratch, guess`',
                    inline: false
                },
                {
                    name: '🎮 Fun & Games',
                    value: '`shadow, meme, say, reaction, tictactoe, mine, riddle, cipher, sudoku, hangman, monster-hunt, monster-stats`',
                    inline: false
                },
                {
                    name: '📚 Education',
                    value: '`learn, learncs, learnai, learn-general, trivia, datastructure, interview, job-interview`',
                    inline: false
                },
                {
                    name: '🔢 Math (`/math <subcommand>`)',
                    value: 'Subcommands: `add, subtract, multiply, divide, sqrt, sin, cos, tan, log, calculate, integrate`',
                    inline: false
                },
                {
                    name: '⚙️ Algorithms (`/algo <subcommand>`)',
                    value: 'Subcommands: `ascending, descending, biggest, smallest, binary-search, exponential-search, dfs, roman, stock, remove-duplicates, remove-element, smallest-missing`',
                    inline: false
                },
                {
                    name: '🛡️ Moderation',
                    value: '`kick, ban, timeout, unban, untimeout, purge`',
                    inline: false
                },
                {
                    name: '📈 Stock Market',
                    value: '`stock, chart, compare, watchlist, alert, stock-search, stock-trending`',
                    inline: false
                },
                {
                    name: '🔧 Misc',
                    value: '`owner, ping, avatar, weather, translate, userinfo, work, poll, steal, reminder`',
                    inline: false
                },
                {
                    name: '⚙️ Configuration',
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