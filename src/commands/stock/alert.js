const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const StockAlert = require('../../models/StockAlert');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'alert',
    description: 'Manage stock price alerts',
    options: [
        {
            name: 'set',
            description: 'Set a price alert',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'symbol',
                    description: 'The stock symbol',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'price',
                    description: 'The target price',
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
                {
                    name: 'condition',
                    description: 'Alert when price is above or below target',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Above', value: 'above' },
                        { name: 'Below', value: 'below' },
                    ],
                },
            ],
        },
        {
            name: 'list',
            description: 'List your active alerts',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'delete',
            description: 'Delete an alert',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'symbol',
                    description: 'The stock symbol',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            if (subcommand === 'set') {
                const symbol = interaction.options.getString('symbol').toUpperCase();
                const targetPrice = interaction.options.getNumber('price');
                const condition = interaction.options.getString('condition');

                // Verify symbol exists
                const quote = await stockService.getQuote(symbol);
                if (!quote) {
                    return interaction.editReply(`Invalid symbol: ${symbol}`);
                }

                // Check if alert already exists for this symbol
                const existingAlert = await StockAlert.findOne({ userId, symbol, active: true });
                if (existingAlert) {
                    existingAlert.targetPrice = targetPrice;
                    existingAlert.condition = condition;
                    await existingAlert.save();
                    return interaction.editReply(`Updated alert for ${symbol}: Notify when price is ${condition} $${targetPrice}`);
                }

                const newAlert = new StockAlert({
                    userId,
                    symbol,
                    targetPrice,
                    condition,
                });

                await newAlert.save();
                interaction.editReply(`Set alert for ${symbol}: Notify when price is ${condition} $${targetPrice}`);

            } else if (subcommand === 'list') {
                const alerts = await StockAlert.find({ userId, active: true });

                if (alerts.length === 0) {
                    return interaction.editReply('You have no active alerts.');
                }

                const embed = new EmbedBuilder()
                    .setTitle(`${interaction.user.username}'s Stock Alerts`)
                    .setColor('#0099ff')
                    .setTimestamp();

                let description = '';
                alerts.forEach(alert => {
                    description += `**${alert.symbol}**: ${alert.condition} $${alert.targetPrice}\n`;
                });

                embed.setDescription(description);
                interaction.editReply({ embeds: [embed] });

            } else if (subcommand === 'delete') {
                const symbol = interaction.options.getString('symbol').toUpperCase();

                const result = await StockAlert.deleteOne({ userId, symbol });

                if (result.deletedCount === 0) {
                    return interaction.editReply(`No active alert found for ${symbol}.`);
                }

                interaction.editReply(`Deleted alert for ${symbol}.`);
            }
        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while managing your alerts.');
        }
    },
};
