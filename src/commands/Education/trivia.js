const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios'); 
const economySystem = require('../../utils/EconomySystem');

// Example of available categories
const categories = [
    { id: 9, name: 'General Knowledge' },
    { id: 10, name: 'Entertainment: Books' },
    { id: 11, name: 'Entertainment: Film' },
    { id: 12, name: 'Entertainment: Music' },
    { id: 13, name: 'Entertainment: Musicals & Theatres' },
    { id: 14, name: 'Entertainment: Television' },
    { id: 15, name: 'Entertainment: Video Games' },
    { id: 16, name: 'Entertainment: Board Games' },
    { id: 17, name: 'Science & Nature' },
    { id: 18, name: 'Science: Computers' },
    { id: 19, name: 'Science: Mathematics' },
    { id: 20, name: 'Mythology' },
    { id: 21, name: 'Sports' },
    { id: 22, name: 'Geography' },
    { id: 23, name: 'History' },
    { id: 24, name: 'Politics' },
    { id: 25, name: 'Art' },
    { id: 26, name: 'Celebrities' },
    { id: 27, name: 'Animals' },
    { id: 28, name: 'Vehicles' },
    { id: 29, name: 'Entertainment: Comics' },
    { id: 30, name: 'Science: Gadgets' },
    { id: 31, name: 'Entertainment: Japanese Anime & Manga' },
    { id: 32, name: 'Entertainment: Cartoon & Animations' },
  ];

module.exports = {
  name: 'trivia',
  description: 'Start a trivia quiz and earn coins!',
  options: [
    {
      name: 'category',
      description: 'Choose a category for the trivia quiz',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: categories.map((category) => ({
        name: category.name,
        value: category.id.toString(),
      })),
    },
  ],
  callback: async (client, interaction) => {
    try {
      const chosenCategoryId = interaction.options.getString('category');
      const chosenCategory = categories.find((category) => category.id.toString() === chosenCategoryId);

      if (!chosenCategory) {
        interaction.reply('Invalid category selected.');
        return;
      }

      const response = await axios.get(
        `https://opentdb.com/api.php?amount=5&category=${chosenCategory.id}&type=multiple`
      );

      const questions = response.data.results;
      const reward = 15; // Coins per trivia quiz

      const embed = new EmbedBuilder()
        .setTitle(`🎯 Trivia Quiz: ${chosenCategory.name}`)
        .setColor('Random')
        .setFooter({ text: `You earned ${reward} coins for playing trivia!` });

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i].question;
        const correctAnswer = questions[i].correct_answer;
        const incorrectAnswers = questions[i].incorrect_answers;
        const allAnswers = [...incorrectAnswers, correctAnswer];

        // Shuffle the answers
        for (let j = allAnswers.length - 1; j > 0; j--) {
          const randomIndex = Math.floor(Math.random() * (j + 1));
          [allAnswers[j], allAnswers[randomIndex]] = [allAnswers[randomIndex], allAnswers[j]];
        }

        // Add the question and answers to the embed
        embed.addFields({
          name: `Question ${i + 1}`,
          value: `${question}\n\n${allAnswers.map((answer) => `- ${answer}`).join('\n')}`,
          inline: false,
        });
        embed.addFields({
          name: `Correct Answer for Question ${i + 1}`,
          value: correctAnswer,
          inline: false,
        });
      }

      // Reward user for playing trivia
      await economySystem.addBalance(interaction.user.id, reward);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
    }
  },
};
