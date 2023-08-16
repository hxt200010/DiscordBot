const math = require('mathjs');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    options: [
        {
            name: 'expression',
            description: 'The mathematical expression to evaluate',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const expression = interaction.options.getString('expression');
        const result = math.evaluate(expression); 
        interaction.reply(`Result: ${result}`); 
    },
};
