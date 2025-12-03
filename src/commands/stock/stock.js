const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'stock',
    description: 'Get real-time stock data',
    options: [
        {
            name: 'symbol',
            description: 'The stock symbol (e.g., AAPL, MSFT)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const symbol = interaction.options.getString('symbol').toUpperCase();

        try {
            const quote = await stockService.getQuote(symbol);

            if (!quote) {
                return interaction.editReply(`Could not find stock data for symbol: ${symbol}`);
            }

            const price = quote.regularMarketPrice;
            const change = quote.regularMarketChange;
            const changePercent = quote.regularMarketChangePercent;
            const isPositive = change >= 0;
            const color = isPositive ? '#00FF00' : '#FF0000';
            const arrow = isPositive ? '📈' : '📉';

            const embed = new EmbedBuilder()
                .setTitle(`${quote.longName || symbol} (${symbol})`)
                .setURL(`https://finance.yahoo.com/quote/${symbol}`)
                .setColor(color)
                .addFields(
                    { name: 'Price', value: `$${price.toFixed(2)}`, inline: true },
                    { name: 'Change', value: `${arrow} ${change.toFixed(2)} (${changePercent.toFixed(2)}%)`, inline: true },
                    { name: 'Volume', value: quote.regularMarketVolume ? quote.regularMarketVolume.toLocaleString() : 'N/A', inline: true },
                    { name: 'High', value: `$${quote.regularMarketDayHigh ? quote.regularMarketDayHigh.toFixed(2) : 'N/A'}`, inline: true },
                    { name: 'Low', value: `$${quote.regularMarketDayLow ? quote.regularMarketDayLow.toFixed(2) : 'N/A'}`, inline: true },
                    { name: 'Market Cap', value: quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : 'N/A', inline: true }
                )
                .setFooter({ text: 'Data provided by Yahoo Finance' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while fetching stock data.');
        }
    },
};
