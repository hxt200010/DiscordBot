const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const binarySearchCode = `
while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (numbers[mid] === target) {
        found = true;
        index = mid;
        break;
    } else if (numbers[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}`;
module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'binarysearch',
    description: 'Perform binary search on a sorted array',
    options: [
        {
            name: 'numbers',
            description: 'Please type each number separated with space (sorted in ascending order)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'target',
            description: 'The number you want to find in the array',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        try {
            const startTimestamp = Date.now();
            const input = interaction.options.getString('numbers');
            const target = interaction.options.getInteger('target');
            const numbers = input.split(' ').map(Number);

            // Binary Search Algorithm
            let left = 0;
            let right = numbers.length - 1;
            let found = false;
            let index = -1;

            const algorithmSteps = []; // Initialize an empty array to store algorithm steps
            let step = 1; // Initialize the step counter
            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                if (numbers[mid] === target) {
                    found = true;
                    index = mid;
                    break;
                } else if (numbers[mid] < target) {
                    left = mid + 1;
                } else {
                    right = mid - 1;
                }

                // Add the current step to the algorithm steps
                algorithmSteps.push(`Step ${step}: Left=${left}, Right=${right}`);
                step++;
            }

            const embed = new EmbedBuilder()
                .setTitle('Binary Search Result')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Input Numbers',
                        value: `\`\`${numbers.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Target',
                        value: `\`\`${target}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Result',
                        value: found ? `\`\`${target}\`\` found at index \`\`${index}\`\`` : 'Target not found',
                        inline: false,
                    },
                    {
                        name: 'Time Taken',
                        value: `${Date.now() - startTimestamp} ms`,
                        inline: false,
                    },
                    {
                        name: 'Algorithm',
                        value: `\`\`\`js\n${binarySearchCode}\n\`\`\``,
                        inline: false,
                    },
                ]);

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply('Error: An error occurred while processing your request');
        }
    },
};
