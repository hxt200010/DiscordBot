const { Client, ApplicationCommandOptionType, EmbedBuilder, IntegrationApplication, Embed } = require('discord.js');
const algorithm = `
class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        l, r = 0, 0  #left, right pointer 

        while r < len(nums): 
            count = 1 
            while r + 1 < len(nums) and nums[r] == nums[r + 1]: 
                r += 1
                count += 1

            for i in range(min(2, count)): 
                nums[l] = nums[r]
                l += 1
            r += 1
        return l
`
function removeDuplicate(array) {
    let l = 0; 
    let r = 0;
    let count; 
    while (r < array.length) {
        count = 1; 
        while (r+1 < array.length && array[r] === array[r+1]) {
            r++; 
            count++; 
        }
        for (let i = 0; i < Math.min(2, count); i++) {
            array[l] = array[r]; 
            l++; 
        }
        r++;
    }
    return l; 
}

module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'duplicate', 
    description: 'remove duplicate in an array', 
    options: [
        {
            name: 'array', 
            description: 'The array of numbers separated with space', 
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ], 
    callback: async (client, interaction) =>{
        try {
            const arrayInput = interaction.options.getString('array'); 
            const number = arrayInput.split(' ').map(Number); 
    

            // Create a copy of the original array to display in the embed
            const originalArray = [...number];


            const start = process.hrtime(); 
            const result = removeDuplicate(number); 
            const [seconds, nanoseconds] = process.hrtime(start); 
            const timeTakens = (seconds * 1000) + (nanoseconds / 1e6); 
            const embed = new EmbedBuilder()
            .setTitle('Remove Duplicate in an Array')
            .setColor('Random')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
                {
                    name: 'Array:', 
                    value: `\`\`${originalArray.join(', ')}\`\``,
                    inline: false, 
                }, 
                {
                    name: 'Array After Removal', 
                    value: `\`\`${number.slice(0, result).join(', ')}\`\``, 
                    inline: false,
                }, 
                {
                    name: 'Time Taken',
                    value: `${timeTakens.toFixed(3)} ms`, // Show time taken with 3 decimal places
                    inline: false,
                },
                {
                    name: 'Algorithm in Python',
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