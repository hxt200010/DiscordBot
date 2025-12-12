const {Client, Interaction, ApplicationCommandOptionType} = require('discord.js')

module.exports = {
    deleted: true, // Consolidated into /math command
    name: 'sqrt',
    description: 'Squareroot a number, example: sqrt(4) = 2',
    options: [
      {
        name: 'number',
        description: 'number for calculation', 
        type: ApplicationCommandOptionType.Number,
        required: true, 
      }, 
    ], 
    callback: async (client, interaction) => {
        const num = interaction.options.get('number').value;
        const squareRoot = Math.sqrt(num); 
        interaction.reply(`Square root of \`\`${num}\`\` is \`\`${squareRoot}\`\``); 

    }

    
}