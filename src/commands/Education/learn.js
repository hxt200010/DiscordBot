const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'learn',
    description: 'Learn a programming language with AI-generated exercises.',
    options: [
        {
            name: 'language',
            description: 'The programming language to learn.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'times',
            description: 'Number of questions (max 5).',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 5,
        },
        {
            name: 'difficulty',
            description: 'Difficulty level.',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Easy', value: 'easy' },
                { name: 'Medium', value: 'medium' },
                { name: 'Hard', value: 'hard' },
            ],
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const language = interaction.options.getString('language');
        const times = interaction.options.getInteger('times');
        const difficulty = interaction.options.getString('difficulty');

        await interaction.deferReply();

        let coinsEarned = 0;
        const rewards = { easy: 20, medium: 40, hard: 80 };
        const reward = rewards[difficulty];

        try {
            // Generate all questions at once to ensure variety
            const prompt = `Create ${times} unique ${difficulty} difficulty multiple-choice questions for ${language} programming language.
            The questions should be "fill in the blank" style code snippets.
            For each question, if it's real life application, make sure to write description, the expected input output of it
            Ensure each question covers a different concept or function. Do not repeat the same logic.
            For medium question, print out more than 10 lines of code
            For Hard questions, you may want to give user the real life application using leet code style medium / hard queestion
            Provide the output in strict JSON format as an array of objects with the following structure:
            [
                {
                    "question": "The question text describing what to do",
                    "code": "The code snippet with a '____' blank",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctIndex": 0 // The index of the correct option (0-3)
                }
            ]
            Please provide at least 6 lines of code for each question.
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });

            let responseContent = completion.data.choices[0].message.content;
            // Clean up if the model adds markdown
            responseContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

            let questions = [];
            try {
                questions = JSON.parse(responseContent);
                if (!Array.isArray(questions)) {
                    questions = [questions];
                }
            } catch (e) {
                console.error('Failed to parse questions JSON:', e);
                throw new Error('Failed to generate valid questions.');
            }

            for (let i = 0; i < questions.length; i++) {
                const questionData = questions[i];

                const embed = new EmbedBuilder()
                    .setTitle(`📚 Learn ${language} - Question ${i + 1}/${times}`)
                    .setDescription(`${questionData.question}\n\n\`\`\`${language.toLowerCase()}\n${questionData.code}\n\`\`\``)
                    .setColor('Blue')
                    .setFooter({ text: `Difficulty: ${difficulty} | Reward: ${reward} coins` });

                const buttons = questionData.options.map((opt, index) =>
                    new ButtonBuilder()
                        .setCustomId(`learn_${index}`)
                        .setLabel(opt)
                        .setStyle(ButtonStyle.Primary)
                );

                const row = new ActionRowBuilder().addComponents(buttons);

                let msg;
                if (i === 0) {
                    msg = await interaction.editReply({ embeds: [embed], components: [row], content: '' });
                } else {
                    msg = await interaction.editReply({ embeds: [embed], components: [row], content: '' });
                }

                try {
                    const confirmation = await msg.awaitMessageComponent({
                        filter: (btnInt) => btnInt.user.id === interaction.user.id,
                        time: 200000,
                        componentType: ComponentType.Button
                    });

                    const selectedIndex = parseInt(confirmation.customId.split('_')[1]);
                    const correctAnswer = questionData.options[questionData.correctIndex];
                    const completedCode = questionData.code.replace('____', correctAnswer);

                    if (selectedIndex === questionData.correctIndex) {
                        await economySystem.addBalance(interaction.user.id, reward);
                        coinsEarned += reward;
                        await confirmation.update({
                            content: `✅ **Correct!** You earned ${reward} coins.\n\n**Completed Code:**\n\`\`\`${language.toLowerCase()}\n${completedCode}\n\`\`\``,
                            components: []
                        });
                    } else {
                        await confirmation.update({
                            content: `❌ **Wrong!** The correct answer was: **${correctAnswer}**\n\n**Completed Code:**\n\`\`\`${language.toLowerCase()}\n${completedCode}\n\`\`\``,
                            components: []
                        });
                    }
                } catch (e) {
                    await interaction.editReply({ content: '⏰ Time ran out!', components: [] });
                    break;
                }

                if (i < questions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await interaction.editReply({ content: '🔄 Preparing next question...', embeds: [], components: [] });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

        } catch (error) {
            console.error('Error in learn command:', error);
            await interaction.editReply({ content: '⚠️ An error occurred while generating the questions. Please try again later.', components: [] });
        }

        await interaction.followUp(`🎓 **Session Complete!**\nYou earned a total of **${coinsEarned} coins**.`);
    },
};
