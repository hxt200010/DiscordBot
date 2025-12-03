const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'compare',
    description: 'Compare performance of two stocks',
    options: [
        {
            name: 'symbol1',
            description: 'First stock symbol',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'symbol2',
            description: 'Second stock symbol',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'days',
            description: 'Number of days for comparison (default: 30)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 365,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const symbol1 = interaction.options.getString('symbol1').toUpperCase();
        const symbol2 = interaction.options.getString('symbol2').toUpperCase();
        const days = interaction.options.getInteger('days') || 30;

        try {
            const [history1, history2] = await Promise.all([
                stockService.getHistory(symbol1, '1d', days),
                stockService.getHistory(symbol2, '1d', days)
            ]);

            if (!history1 || history1.length === 0) {
                return interaction.editReply(`Could not find historical data for symbol: ${symbol1}`);
            }
            if (!history2 || history2.length === 0) {
                return interaction.editReply(`Could not find historical data for symbol: ${symbol2}`);
            }

            const chartUrl = await stockService.generateComparisonChart(symbol1, history1, symbol2, history2);

            const embed = new EmbedBuilder()
                .setTitle(`${symbol1} vs ${symbol2} Comparison (${days} Days)`)
                .setImage(chartUrl)
                .setColor('#0099ff')
                .setFooter({ text: 'Data provided by Yahoo Finance' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while generating the comparison chart.');
        }
    },
};
