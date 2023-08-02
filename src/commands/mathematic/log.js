const math = require('mathjs');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'log',
    description: 'Logarithmic',
    options: [
        {
            name: 'first-number',
            description: 'First Number',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: 'second-number',
            description: 'Second Number',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const expression1 = interaction.options.getInteger('first-number');
        const expression2 = interaction.options.getInteger('second-number');
        if (expression1 <= 0 || expression2 <= 0) {
            interaction.reply('Error: Both numbers must be positive for logarithm calculation.');
            return;
        }

        const result = math.log(expression1, expression2);

        if (isNaN(result)) {
            interaction.reply('Error: The result is not a valid number. Please check the input.');
            return;
        }
        interaction.reply(`Result: ${result}`); 
    },
};
