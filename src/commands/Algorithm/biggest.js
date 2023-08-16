const {Client, Interaction, ApplicationCommandOptionType, EmbedBuilder} = require('discord.js')
const biggest = `
let biggestNumber = numbers[0]; 
for (let i = 1; i < numbers.length; i++) {
     if (numbers[i] > biggestNumber) {
         biggestNumber = numbers[i]; 
     }
}`
module.exports = {
    name: 'biggest',
    description: 'Find the biggest number in the array',
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
           let biggestNumber = numbers[0]; 
           for (let i = 1; i < numbers.length; i++) {
                if (numbers[i] > biggestNumber) {
                    biggestNumber = numbers[i]; 
                }
           }

           const embed = new EmbedBuilder()
                .setTitle('Finding the biggest number in the array')
                .setColor('Random')
                .addFields([
                    {
                        name: `Input numbers`, 
                        value: `\`\`${numbers.join(', ')}\`\``,
                        inline: false
                    }, 
                    {
                        name: `Biggest Number`,
                        value: `\`\`${biggestNumber}\`\``,
                        inline: false
                    },

                    {
                        name: `Time Taken`,
                        value: `${Date.now() - startTimesstamp} ms`,
                        inline: false
                    },
                    {
                        name: 'Algorithm', 
                        value: `\`\`\`js\n${biggest}\n\`\`\``,
                        inline: false,
                    }
                ])
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.log(`${error}`); 
        }
    }

}