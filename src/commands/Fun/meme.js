const { purple } = require('@material-ui/core/colors');
const { EmbedBuilder, Embed } = require('discord.js');

module.exports = {
    name: 'meme',
    description: 'Get a meme!',
    callback: async (client, interaction) => {
        try {
            const url = 'https://api.giphy.com/v1/gifs/random';
            const params = new URLSearchParams({
                api_key: process.env.MEME_API, // Replace with your Giphy API key
                tag: 'meme',
            });

            const response = await fetch(`${url}?${params}`);
            const data = await response.json();

            const title = data.data.title;
            const image = data.data.images.original.url;
            const author = data.data.username;

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle(title || 'Random Meme')
                .setImage(`${image}`)
                .setURL(`${image}`)
                .setFooter({ text: author || 'Giphy' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply('An error occurred while fetching the meme.');
        }
    },
};
