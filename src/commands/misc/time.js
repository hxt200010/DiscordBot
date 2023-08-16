const { ApplicationCommandOptionType } = require('discord.js');
const moment = require('moment-timezone');

module.exports = {
  name: 'time',
  description: 'Get the current time in UTC',
  
  callback: async (client, interaction) => {
    const now = moment.utc();
    const time = now.format('YYYY-MM-DD HH:mm:ss');
    return interaction.reply(`The current time is: ${time} UTC`);
  },
};
