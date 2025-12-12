const { Client, ApplicationCommandOptionType, EmbedBuilder, IntegrationApplication, Embed } = require('discord.js');
const { callback } = require('./remove_duplicate2');
const algorithm = `
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        profit = 0 
        for i in range(1, len(prices)): 
            if prices[i] > prices[i - 1]:   # if today price is higher, sell
                profit += (prices[i] - prices[i-1])

        return profit
`

function maxProfit (price) {
    let profit = 0; 
    for (let i = 1;  i < price.length; i++ ) {
        if (price[i] > price[i - 1]) {
            profit += (price[i] - price[i-1]); 
        }
    }
    return profit; 
}

module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'stock1', 
    description: 'best time to buy and sell stock', 
    options: [
        {
            name: 'prices', 
            description: 'the list of prices for each day: e.g: 7, 4, 3, 1, 5', 
            type: ApplicationCommandOptionType.String, 
            required: true,

        }
    ], 
    callback: async (client, interaction) => {
        try {
            const priceInput = interaction.options.getString('prices'); 
            const number = priceInput.split(' ').map(Number); 
            

            const originalPrice = [...number]; 

            const start = process.hrtime(); 
            const result = maxProfit(number); 
            const [seconds, nanoseconds] = process.hrtime(start); 
            const timeTaken = (seconds * 1000) + (nanoseconds / 1e6); 
            const embed = new EmbedBuilder()
            .setTitle('Best time to buy and sell stock version 1')
            .setColor('Random')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
                {
                    name: 'Description',
                    value: 'This problem is about finding the maximum profit you can achieve from a list of stock prices, where you can buy and sell the stock as many times as you like. The aim is to find the highest possible profit by considering the best times to buy and sell.',
                    inline: false,
                },
                {
                    name: 'Prices:', 
                    value: `\`\`${originalPrice.join(', ')}\`\``,
                    inline: false, 
                }, 
                {
                    name: 'Target',
                    value: `\`\`${result}\`\``,
                    inline: false,

                },
                {
                    name: 'Time Taken',
                    value: `${timeTaken.toFixed(3)} ms`, // Show time taken with 3 decimal places
                    inline: false,
                },
                {
                    name: 'Algorithm in Python',
                    value: `\`\`\`py\n${algorithm}\n\`\`\``,
                    inline: false,
                },
                
            ]); 

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error); 
            await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    }
}