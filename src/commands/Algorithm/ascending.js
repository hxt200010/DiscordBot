const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const algorithm = `
// Sorting the numbers in ascending order
for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] > numbers[j]) {
            // Swap the numbers if the first number is greater than the second number
            const temp = numbers[i];
            numbers[i] = numbers[j];
            numbers[j] = temp;
        }
    }
}`
module.exports = {
    name: 'sortascending',
    description: 'Sort the numbers in ascending order',
    options: [
        {
            name: 'numbers',
            description: 'Please type each number separated with space',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        try {
            const startTime = Date.now();
            const input = interaction.options.getString('numbers');
            const numbers = input.split(' ').map(Number);

            // Sorting the numbers in ascending order
            for (let i = 0; i < numbers.length; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    if (numbers[i] > numbers[j]) {
                        // Swap the numbers if the first number is greater than the second number
                        const temp = numbers[i];
                        numbers[i] = numbers[j];
                        numbers[j] = temp;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Sorting Numbers in Ascending Order')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Input numbers',
                        value: `\`\`${input}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Sorted Numbers',
                        value: `\`\`${numbers.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Time Taken',
                        value: `${Date.now() - startTime} ms`,
                        inline: false,
                    },
                    {
                        name: 'Algorithm',
                        value: `\`\`\`js\n${algorithm}\n\`\`\``,
                        inline: false,
                    },
                ]);
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.log(`${error}`);
        }
    },
};
