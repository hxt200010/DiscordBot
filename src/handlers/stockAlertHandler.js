const StockAlert = require('../models/StockAlert');
const stockService = require('../services/stockService');
const { EmbedBuilder } = require('discord.js');

const checkAlerts = async (client) => {
    try {
        const alerts = await StockAlert.find({ active: true });
        if (alerts.length === 0) return;

        // Group alerts by symbol to minimize API calls
        const alertsBySymbol = {};
        alerts.forEach(alert => {
            if (!alertsBySymbol[alert.symbol]) {
                alertsBySymbol[alert.symbol] = [];
            }
            alertsBySymbol[alert.symbol].push(alert);
        });

        const symbols = Object.keys(alertsBySymbol);
        
        // Process symbols in batches if needed, but for now just loop
        for (const symbol of symbols) {
            const quote = await stockService.getQuote(symbol);
            if (!quote) continue;

            const currentPrice = quote.regularMarketPrice;

            for (const alert of alertsBySymbol[symbol]) {
                let triggered = false;

                if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                    triggered = true;
                } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                    triggered = true;
                }

                if (triggered) {
                    try {
                        const user = await client.users.fetch(alert.userId);
                        if (user) {
                            const embed = new EmbedBuilder()
                                .setTitle(`Stock Alert: ${symbol}`)
                                .setDescription(`**${symbol}** has reached your target price of **$${alert.targetPrice}**.\nCurrent Price: **$${currentPrice.toFixed(2)}**`)
                                .setColor('#FFD700') // Gold color
                                .setTimestamp();

                            await user.send({ embeds: [embed] });
                            
                            // Deactivate alert after triggering
                            alert.active = false;
                            await alert.save();
                        }
                    } catch (err) {
                        console.error(`Failed to send alert to user ${alert.userId}:`, err);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking stock alerts:', error);
    }
};

module.exports = (client) => {
    // Check every 5 minutes
    setInterval(() => checkAlerts(client), 5 * 60 * 1000);
    
    // Initial check on startup
    checkAlerts(client);
};
