const { EmbedBuilder } = require('discord.js');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'stock-trending',
    description: 'Get a list of trending stocks',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        try {
            const symbols = await stockService.getTrending();

            if (!symbols || symbols.length === 0) {
                return interaction.editReply('Could not fetch trending stocks at this time.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Trending Stocks (US)')
                .setColor('#FFD700')
                .setFooter({ text: 'Data provided by Yahoo Finance' })
                .setTimestamp();

            let description = '';
            
            // Fetch details for each symbol
            // We'll limit to 5 to avoid hitting rate limits or taking too long
            const topSymbols = symbols.slice(0, 5);
            
            for (const symbol of topSymbols) {
                const quote = await stockService.getQuote(symbol);
                if (quote) {
                    const price = quote.regularMarketPrice;
                    const change = quote.regularMarketChangePercent;
                    const arrow = change >= 0 ? '📈' : '📉';
                    const name = quote.shortName || quote.longName || symbol;
                    
                    description += `**${name} (${symbol})**\n`;
                    description += `Price: $${price ? price.toFixed(2) : 'N/A'} | Change: ${arrow} ${change ? change.toFixed(2) : 'N/A'}%\n\n`;
                } else {
                    description += `**${symbol}**\nData unavailable\n\n`;
                }
            }

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while fetching trending stocks.');
        }
    },
};
