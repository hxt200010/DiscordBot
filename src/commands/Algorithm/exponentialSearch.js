const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const exponentialSearchAlgorithmCode = `
let bound = 1;
while (bound < numbers.length && numbers[bound] < target) {
    bound *= 2;
}

const startIndex = Math.max(bound / 2, 0);
const endIndex = Math.min(bound, numbers.length - 1);

let index = -1;
for (let i = startIndex; i <= endIndex; i++) {
    if (numbers[i] === target) {
        index = i;
        break;
    }
}
`
module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'exponential_search',
    description: 'Perform exponential search on a sorted array',
    options: [
        {
            name: 'array',
            description: 'The sorted array of numbers separated with space',
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
            const arrayInput = interaction.options.getString('array');
            const target = interaction.options.getInteger('target');
            const numbers = arrayInput.split(' ').map(Number);
            // Start high-resolution time
            const start = process.hrtime();
            // Exponential Search Algorithm
            let bound = 1;
            while (bound < numbers.length && numbers[bound] < target) {
                bound *= 2;
            }   

            const startIndex = Math.max(bound / 2, 0);
            const endIndex = Math.min(bound, numbers.length - 1);

            let index = -1;
            for (let i = startIndex; i <= endIndex; i++) {
                if (numbers[i] === target) {
                    index = i;
                    break;
                }
            }
            // End high-resolution time
            const [seconds, nanoseconds] = process.hrtime(start);
            const timeTakenMs = (seconds * 1000) + (nanoseconds / 1e6); // Convert to milliseconds

            
             
            const embed = new EmbedBuilder()
                .setTitle('Exponential Search Result')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Array',
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
                        value: index !== -1 ? `Found at index \`\`${index}\`\`` : 'Target not found',
                        inline: false,
                    },
                    {
                        name: 'Time Taken',
                        value: `${timeTakenMs.toFixed(3)} ms`, // Show time taken with 3 decimal places
                        inline: false,
                    },
                    {
                        name: 'Algorithm',
                        value: `\`\`\`js\n${exponentialSearchAlgorithmCode}\n\`\`\``,
                        inline: false,
                    },
                ]);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while performing exponential search.');
        }
    },
};
