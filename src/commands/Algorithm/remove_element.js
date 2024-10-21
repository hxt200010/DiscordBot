const { ApplicationCommandOptionType, EmbedBuilder, IntegrationApplication } = require('discord.js');
const algorithm = `
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        index = 0
        for i in range(len(nums)): 
            if nums[i] != val:      
                nums[index] = nums[i]
                index += 1
        return index
`

function removeElement(num, val) {
    let index = 0; 
    for (let i = 0; i < num.length; i++) {
        if (num[i] != val) {
            num[index] = num[i]; 
            index++; 
        }
    }
    return index;

}
module.exports = {
    name: 'remove', 
    description: 'remove element in an array', 
    options: [
        {
            name: 'array',
            description: 'The array of numbers separated with space',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'target',
            description: 'The number you want to remove from an array',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ], 
    callback: async (client, interaction) => {
        try {
            const arrayInput = interaction.options.getString('array'); 
            const val = interaction.options.getInteger('target'); 
            const number = arrayInput.split(' ').map(Number); 

            // Create a copy of the original array to display in the embed
            const originalArray = [...number];

            //start the function command
            const start = process.hrtime(); 
            const result = removeElement(number, val); 
            const [seconds, nanoseconds] = process.hrtime(start); 
            const timeTakens = (seconds * 1000) + (nanoseconds / 1e6); 
            const embed = new EmbedBuilder() 
            .setTitle('Remove element from an array')
            .setColor('Random')
            .addFields([
                {
                    name: 'Array:', 
                    value: `\`\`${originalArray.join(', ')}\`\``,
                    inline: false,
                }, 
                {
                    name: 'Target',
                    value: `\`\`${val}\`\``,
                    inline: false,

                },
                {
                    name: 'Array After Removal',
                    value: `\`\`${number.slice(0, result).join(', ')}\`\``,  // Shows the modified array
                    inline: false,
                },
                {
                    name: 'Elements Removed',
                    value: `${number.length - result}`,
                    inline: false,
                },
                {
                    name: 'Time Taken',
                    value: `${timeTakens.toFixed(3)} ms`, // Show time taken with 3 decimal places
                    inline: false,
                },
                {
                    name: 'Algorithm',
                    value: `\`\`\`py\n${algorithm}\n\`\`\``,
                    inline: false,
                },
            ]);

        await interaction.reply({ embeds: [embed ]}); 
            

        } catch (error) {
            console.error(error); 
            await interaction.reply('An error occurred while performing your command')
        }
    }
}