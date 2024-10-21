const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const { drawCard, calculateScore, createBlackjackButtons } = require('../../commands/Game/blackjack');

let gameState = {}; // Store game state for blackjack

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

      await commandObject.callback(client, interaction);
    } catch (error) {
      console.log(`There was an error running this command: ${error}`);
    }
  }

  // Add button interaction handling for blackjack
  if (interaction.isButton()) {
    const userId = interaction.user.id;
    const game = gameState[userId]; // Fetch game state

    if (!game) {
      return interaction.reply({ content: 'You are not in a game of blackjack.', ephemeral: true });
    }

    if (interaction.customId === 'hit') {
      // Handle "Hit" button
      const newCard = drawCard();
      game.playerHand.push(newCard);
      const playerScore = calculateScore(game.playerHand);

      if (playerScore > 21) {
        // Player busted
        const embed = new EmbedBuilder()
          .setColor('Random')
          .setTitle('Blackjack')
          .setDescription(`Your hand: ${game.playerHand.join(', ')}`)
          .addFields(
            { name: "Bot's hand", value: `${game.botHand[0]}, ???`, inline: true },
            { name: 'Your score', value: playerScore.toString(), inline: true }
          )
          .setFooter({ text: 'You busted! Game over.' });

        await interaction.update({ embeds: [embed], components: [] });
        delete gameState[userId]; // Clear game state
      } else {
        // Update the game with the new hand and score
        const embed = new EmbedBuilder()
          .setColor('Random')
          .setTitle('Blackjack')
          .setDescription(`Your hand: ${game.playerHand.join(', ')}`)
          .addFields(
            { name: "Bot's hand", value: `${game.botHand[0]}, ???`, inline: true },
            { name: 'Your score', value: playerScore.toString(), inline: true }
          )
          .setFooter({ text: 'Type /hit to get another card or /stand to stay.' });

        await interaction.update({ embeds: [embed] });
      }
    } else if (interaction.customId === 'stand') {
      // Handle "Stand" button (bot's turn)
      const botScore = calculateScore(game.botHand);
      const playerScore = calculateScore(game.playerHand);

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Blackjack - Final Results')
        .setDescription(`Your hand: ${game.playerHand.join(', ')}`)
        .addFields(
          { name: "Bot's hand", value: `${game.botHand.join(', ')}`, inline: true },
          { name: 'Your score', value: playerScore.toString(), inline: true },
          { name: 'Bot\'s score', value: botScore.toString(), inline: true }
        );

      if (botScore > 21 || playerScore > botScore) {
        embed.setFooter({ text: 'You win!' });
      } else if (playerScore < botScore) {
        embed.setFooter({ text: 'You lose!' });
      } else {
        embed.setFooter({ text: 'It\'s a tie!' });
      }

      await interaction.update({ embeds: [embed], components: [] });
      delete gameState[userId]; // Clear game state after the game ends
    }
  }
};
