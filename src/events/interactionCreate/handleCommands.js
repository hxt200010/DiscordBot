const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');


module.exports = async (client, interaction) => {
  if (interaction.isChatInputCommand()) {
    const localCommands = getLocalCommands();

    try {
      const commandObject = localCommands.find(
        (cmd) => cmd.name === interaction.commandName
      );

      if (!commandObject) return;

      if (commandObject.devOnly) {
        if (!devs.includes(interaction.member.id)) {
          interaction.reply({
            content: 'Only developers are allowed to run this command.',
            ephemeral: true,
          });
          return;
        }
      }

      if (commandObject.testOnly) {
        if (!(interaction.guild.id === testServer)) {
          interaction.reply({
            content: 'This command cannot be run here.',
            ephemeral: true,
          });
          return;
        }
      }

      if (commandObject.permissionsRequired?.length) {
        for (const permission of commandObject.permissionsRequired) {
          if (!interaction.member.permissions.has(permission)) {
            interaction.reply({
              content: 'Not enough permissions.',
              ephemeral: true,
            });
            return;
          }
        }
      }

      if (commandObject.botPermissions?.length) {
        for (const permission of commandObject.botPermissions) {
          const bot = interaction.guild.members.me;

          if (!bot.permissions.has(permission)) {
            interaction.reply({
              content: "I don't have enough permissions.",
              ephemeral: true,
            });
            return;
          }
        }
      }

      // Currency System Logic
      const economySystem = require('../../utils/EconomySystem');
      let reward = 1; // Default reward

      if (commandObject.category === 'mathematic' || commandObject.category === 'Algorithm') {
          reward = 2;
      } else if (commandObject.category === 'moderation') {
          reward = 0;
      }

      if (reward > 0) {
          economySystem.addBalance(interaction.member.id, reward);
      }

      await commandObject.callback(client, interaction);
    } catch (error) {
      console.log(`There was an error running this command: ${error}`);
    }
  }
};
