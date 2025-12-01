const { Client, Interaction, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Generate list of commands',
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle('You don’t know what I’m capable of!')
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
                    name: `Configuration`,
                    value: `\`\`setupChatbot, disableChatbot\`\``,
                    inline: false
                },
                {
                    name: `Moderation`,
                    value: `\`\`kick, ban, timeout, unban, untimeout, purge\`\``,
                    inline: false
                },
                {
                    name: `Education`,
                    value: `\`\`learn, learnai, trivia, datastructure\`\``,
                    inline: false
                },
                {
                    name: `mathematic`,
                    value: `\`\`add, subtract, multiply, divide, sqrt, calculate, log, integrate, sin, cos, tan\`\``,
                    inline: false
                },
                {
                    name: `misc`,
                    value: `\`\`owner, ping, avatar, weather, translate, userinfo, help, food, work\`\``,
                    inline: false
                },
                {
                    name: `Algorithm gameplay`,
                    value: `\`\`biggest, smallest, ascending, descending, binarySearch, exponential_search, dfs, roman, remove, duplicate, smallestpositivenumber\`\``,
                    inline: false
                },
                {
                    name: `Fun`,
                    value: `\`\`shadow, meme, say, blackjack, mine, adopt, pet, pet-action, sell-pet, pet-list\`\``,
                    inline: false
                },
                {
                    name: `Economy`,
                    value: `\`\`balance, daily, give\`\``,
                    inline: false
                },
                {
                    name: `Shop`,
                    value: `\`\`shop, buy, inventory, shoot, repair, shield\`\``,
                    inline: false
                },
                {
                    name: `User Interaction`,
                    value: `\`\`steal\`\``,
                    inline: false
                },
                {
                    name: `Puzzle / Logic Games`,
                    value: `\`\`riddle, cipher, sudoku, hangman\`\``,
                    inline: false
                }
            ]);

        interaction.reply({ embeds: [embed] });
    }
};