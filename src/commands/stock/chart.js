const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'chart',
    description: 'Get historical stock chart',
    options: [
        {
            name: 'symbol',
            description: 'The stock symbol (e.g., AAPL, MSFT)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'days',
            description: 'Number of days for history (default: 30)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 365,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const days = interaction.options.getInteger('days') || 30;

        try {
            const history = await stockService.getHistory(symbol, '1d', days);

            if (!history || history.length === 0) {
                return interaction.editReply(`Could not find historical data for symbol: ${symbol}`);
            }

            const chartUrl = await stockService.generateChart(symbol, history);

            const embed = new EmbedBuilder()
                .setTitle(`${symbol} Stock Chart (${days} Days)`)
                .setURL(`https://finance.yahoo.com/quote/${symbol}`)
                .setImage(chartUrl)
                .setColor('#0099ff')
                .setFooter({ text: 'Data provided by Yahoo Finance' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while generating the chart.');
        }
    },
};
