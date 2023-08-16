const {Client, Interaction, ApplicationCommandOptionType} = require('discord.js')

module.exports = {
    name: 'multiply',
    description: 'multiply 2 numbers',
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
        interaction.reply(`The multiplication result is \`\`${num1 * num2}\`\``);
    }

    
}