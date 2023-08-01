/**require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'hey',
    description: 'Replies with hey!',
  },
  {
    name: 'help', 
    description: 'Generate the list of commands', 
  }, 
  {
    name: 'ping',
    description: 'Pong!',
  },
  {
    name: 'owner',
    description: 'Shows bot owner information.',
  },
  
  {
    name: 'subtract',
    description: 'subtract 2 numbers',
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
      }
    ]
  }, 
  {
    name: 'divide',
    description: 'divide 2 numbers',
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
      }
    ]
  }, 
  {
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
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
    
*/
