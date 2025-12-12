const {Client, Interaction, ApplicationCommandOptionType, EmbedBuilder} = require('discord.js')
const smallest = `
let smallestNumber = numbers[0]; 
for (let i = 1; i < numbers.length; i++) {
     if (numbers[i] < smallestNumber) {
         smallestNumber = numbers[i]; 
     }
}`
module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'smallest',
    description: 'Find the smallest number in the array',
    options: [
        {
            name: 'numbers', 
            description: 'please type each number separated with space', 
            type: ApplicationCommandOptionType.String, 
            required: true, 
        }, 
    ], 
    callback: async (client, interaction) => {
        try {
           const startTimesstamp = Date.now(); 
           const input = interaction.options.getString('numbers');
           const numbers = input.split(' ').map(Number); 
           //Algorithm to find the biggest number
           let smallestNumber = numbers[0]; 
           for (let i = 1; i < numbers.length; i++) {
                if (numbers[i] < smallestNumber) {
                    smallestNumber = numbers[i]; 
                }
           }

           const embed = new EmbedBuilder()
                .setTitle('Finding the smallest number in the array')
                .setColor('Random')
                .addFields([
                    {
                        name: `Input numbers`, 
                        value: `\`\`${numbers.join(', ')}\`\``,
                        inline: false
                    }, 
                    {
                        name: `Smallest Number`,
                        value: `\`\`${smallestNumber}\`\``,
                        inline: false
                    },

                    {
                        name: `Time Taken`,
                        value: `${Date.now() - startTimesstamp} ms`,
                        inline: false
                    },
                    {
                        name: 'Algorithm', 
                        value: `\`\`\`js\n${smallest}\n\`\`\``,
                        inline: false,
                    }
                ])
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.log(`${error}`); 
        }
    }

}