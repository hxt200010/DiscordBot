
const { ApplicationCommandOptionType, EmbedBuilder, Embed } = require('discord.js');
const { callback } = require('./exponentialSearch');
const roman_to_integer_algorithm = `
# example: IX = X - I = 10 - 1 = 9 
# 998 = CMXCVIII = CM + XC + VIII = (-100 + 1000) + (-10+100) + 8 
class Solution:
    def romanToInt(self, s: str) -> int:
        result_number = 0 
        previous_number = 0
        mapping = {
            'I': 1, 
            'V': 5, 
            'X': 10, 
            'L': 50, 
            'C': 100, 
            'D': 500, 
            'M': 1000
        }
        
        for symbol in s[::-1]:
            if mapping[symbol] >= previous_number:
                result_number += mapping[symbol]
            else:
                result_number -= mapping[symbol]
            previous_number = mapping[symbol]
        
        return result_number
`

function romanToInt(s) {
    let resultNumber = 0; 
    let previousNumber = 0; 
    const mapping = {
        'I': 1,
        'V': 5,
        'X': 10,
        'L': 50,
        'C': 100,
        'D': 500,
        'M': 1000
    };

    //loop through string 
    for (let i = s.length - 1; i >= 0; i--) {
        const symbol = s[i]; 
        if (mapping[symbol] >= previousNumber) {
            resultNumber += mapping[symbol]; 
        } else {
            resultNumber -= mapping[symbol]; 
        }
        previousNumber = mapping[symbol];
    }

    return resultNumber; 
}


module.exports = {
    name: 'romantointeger', 
    description: 'convert from Roman to integer',
    options: [
        {
            name: 'symbols', 
            description: 'Enter a roman symbol or a list of roman symbol', 
            type: ApplicationCommandOptionType.String, 
            required: true, 
        }
    ], 
    callback: async (client, interaction) => {
        try {
            const symbol = interaction.options.getString('symbols'); 
            // Start high-resolution time
            const start = process.hrtime();
            const result = romanToInt(symbol);  // <- Convert roman to integer using string
            // End high-resolution time
            const [seconds, nanoseconds] = process.hrtime(start);
            const timeTakenMs = (seconds * 1000) + (nanoseconds / 1e6); // Convert to milliseconds
            const embed = new EmbedBuilder()
                .setTitle('Roman To Integer Result')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Symbol', 
                        value: `\`\`${symbol}\`\``,
                        inline: false,
                    }, 
                    {
                        name: 'Integer value',
                        value: `\`\`${result}\`\``, 
                        inline: false,

                    },
                    {
                        name: 'Time Taken',
                        value: `${timeTakenMs} ms`,
                        inline: false,
                    },
                    {
                        name: 'Algorithm',
                        value: `\`\`\`py\n${roman_to_integer_algorithm}\n\`\`\``,
                        inline: false,
                    },
                ]);
            //send the embed to discord
            await interaction.reply({ embeds: [embed]});
        } catch (error) {
            console.error(error); 
            await interaction.reply('An error occurred while converting the Roman numeral.'); 
        }
    }
}