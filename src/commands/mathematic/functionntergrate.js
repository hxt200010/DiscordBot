const math = require('mathjs');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    deleted: true, // Consolidated into /math command
    name: 'integrate',
    description: 'Calculate a definite integral of a function',
    options: [
        {
            name: 'function',
            description: 'Mathematical function to integrate (e.g., x^2 + 3*x)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'lower-limit',
            description: 'Lower limit of integration',
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: 'upper-limit',
            description: 'Upper limit of integration',
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        try {
            const func = interaction.options.getString('function');
            const lowerLimit = interaction.options.getNumber('lower-limit');
            const upperLimit = interaction.options.getNumber('upper-limit');

            // Validate the input function
            try {
                math.compile(func); // Check if the function is valid
            } catch (error) {
                interaction.reply('Error: Invalid function format. Please use valid mathematical notation.');
                return;
            }

            // Numerical integration using the trapezoidal rule
            const f = math.compile(func);
            const numSteps = 1000; // Increase for better accuracy
            const stepSize = (upperLimit - lowerLimit) / numSteps;
            let result = 0;

            for (let i = 0; i < numSteps; i++) {
                const x1 = lowerLimit + i * stepSize;
                const x2 = x1 + stepSize;
                result += (f.evaluate({ x: x1 }) + f.evaluate({ x: x2 })) / 2 * stepSize;
            }

            if (isNaN(result)) {
                interaction.reply('Error: The result is not a valid number. Please check the input function and limits.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Definite Integral Result')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Function',
                        value: `\`\`${func}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Lower Limit',
                        value: `\`\`${lowerLimit}\`\``,
                        inline: true,
                    },
                    {
                        name: 'Upper Limit',
                        value: `\`\`${upperLimit}\`\``,
                        inline: true,
                    },
                    {
                        name: 'Result',
                        value: `\`\`${result.toFixed(3)}\`\``, // Display result with precision
                        inline: false,
                    },
                ]);

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred during callback execution:', error);
            interaction.reply('An error occurred while calculating the definite integral.');
        }
    },
};
