const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const Watchlist = require('../../models/Watchlist');
const stockService = require('../../services/stockService');

module.exports = {
    name: 'watchlist',
    description: 'Manage your stock watchlist',
    options: [
        {
            name: 'add',
            description: 'Add a stock to your watchlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'symbol',
                    description: 'The stock symbol to add',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Remove a stock from your watchlist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'symbol',
                    description: 'The stock symbol to remove',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'view',
            description: 'View your watchlist',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            let watchlist = await Watchlist.findOne({ userId });

            if (!watchlist) {
                watchlist = new Watchlist({ userId, symbols: [] });
            }

            if (subcommand === 'add') {
                const symbol = interaction.options.getString('symbol').toUpperCase();
                
                // Verify symbol exists
                const quote = await stockService.getQuote(symbol);
                if (!quote) {
                    return interaction.editReply(`Invalid symbol: ${symbol}`);
                }

                if (watchlist.symbols.includes(symbol)) {
                    return interaction.editReply(`${symbol} is already in your watchlist.`);
                }

                watchlist.symbols.push(symbol);
                await watchlist.save();
                interaction.editReply(`Added ${symbol} to your watchlist.`);

            } else if (subcommand === 'remove') {
                const symbol = interaction.options.getString('symbol').toUpperCase();

                if (!watchlist.symbols.includes(symbol)) {
                    return interaction.editReply(`${symbol} is not in your watchlist.`);
                }

                watchlist.symbols = watchlist.symbols.filter(s => s !== symbol);
                await watchlist.save();
                interaction.editReply(`Removed ${symbol} from your watchlist.`);

            } else if (subcommand === 'view') {
                if (watchlist.symbols.length === 0) {
                    return interaction.editReply('Your watchlist is empty.');
                }

                const embed = new EmbedBuilder()
                    .setTitle(`${interaction.user.username}'s Watchlist`)
                    .setColor('#0099ff')
                    .setTimestamp();

                // Fetch data for all symbols
                const quotes = await Promise.all(watchlist.symbols.map(s => stockService.getQuote(s)));

                let description = '';
                for (let i = 0; i < quotes.length; i++) {
                    const quote = quotes[i];
                    const symbol = watchlist.symbols[i];
                    
                    if (quote) {
                        const price = quote.regularMarketPrice.toFixed(2);
                        const change = quote.regularMarketChange.toFixed(2);
                        const changePercent = quote.regularMarketChangePercent.toFixed(2);
                        const arrow = quote.regularMarketChange >= 0 ? '📈' : '📉';
                        description += `**${symbol}**: $${price} | ${arrow} ${change} (${changePercent}%)\n`;
                    } else {
                        description += `**${symbol}**: Data unavailable\n`;
                    }
                }

                embed.setDescription(description);
                interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while managing your watchlist.');
        }
    },
};
