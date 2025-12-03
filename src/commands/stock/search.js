const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'stock-search',
    description: 'Search for stock symbols by company name',
    options: [
        {
            name: 'query',
            description: 'The company name or symbol to search for',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const query = interaction.options.getString('query');

        try {
            const results = await stockService.search(query);

            if (!results || results.length === 0) {
                return interaction.editReply(`No results found for: ${query}`);
            }

            // Limit to top 10
            const topResults = results.slice(0, 10);

            const embed = new EmbedBuilder()
                .setTitle(`Search Results for "${query}"`)
                .setColor('#0099ff')
                .setFooter({ text: 'Data provided by Yahoo Finance' })
                .setTimestamp();

            let description = '';
            topResults.forEach(r => {
                const symbol = r.symbol;
                const name = r.shortname || r.longname || 'N/A';
                const type = r.typeDisp || r.quoteType || 'N/A';
                const exchange = r.exchange || 'N/A';
                
                description += `**${symbol}** - ${name} (${type} on ${exchange})\n`;
            });

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while searching for stock symbols.');
        }
    },
};
