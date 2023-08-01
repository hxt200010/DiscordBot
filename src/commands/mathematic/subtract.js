const {Client, Interaction, ApplicationCommandOptionType} = require('discord.js')

module.exports = {
    name: 'subtract',
    description: 'subtract 2 numbers, module export',
    options: [
      {
        name: 'first-number',
        description: 'The first number.', 
        type: ApplicationCommandOptionType.Number,
        required: true, 
      }, 
      {
        name: 'second-number',
        description: 'The second number.', 
        type: ApplicationCommandOptionType.Number,
        required:true,
      }, 
    ], 
    callback: async (client, interaction) => {
        const num1 = interaction.options.get('first-number').value;
        const num2 = interaction.options.get('second-number').value;
        interaction.reply(`The difference is ${num1 - num2}`);
    }

    
}