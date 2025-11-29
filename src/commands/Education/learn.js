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
        const rewards = { easy: 10, medium: 20, hard: 40 };
        const reward = rewards[difficulty];

        for (let i = 0; i < times; i++) {
            try {
                // Generate question
                const prompt = `Create a ${difficulty} difficulty multiple-choice question for ${language} programming language.
                The question should be a "fill in the blank" style code snippet.
                Provide the output in strict JSON format with the following structure:
                {
                    "question": "The question text describing what to do",
                    "code": "The code snippet with a '____' blank",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctIndex": 0 // The index of the correct option (0-3)
                }
                Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

                const completion = await openai.createChatCompletion({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                });

                let responseContent = completion.data.choices[0].message.content;
                // Clean up if the model adds markdown
                responseContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const questionData = JSON.parse(responseContent);

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

                const msg = await interaction.editReply({ embeds: [embed], components: [row] });

                try {
                    const confirmation = await msg.awaitMessageComponent({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000,
                        componentType: ComponentType.Button
                    });

                    const selectedIndex = parseInt(confirmation.customId.split('_')[1]);
                    const correctAnswer = questionData.options[questionData.correctIndex];
                    const completedCode = questionData.code.replace('____', correctAnswer);

                    if (selectedIndex === questionData.correctIndex) {
                        economySystem.addBalance(interaction.user.id, reward);
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
                }

                // Small delay between questions
                if (i < times - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await interaction.followUp({ content: `Generating next question...`, ephemeral: true });
                }

            } catch (error) {
                console.error('Error generating question:', error);
                await interaction.editReply({ content: '⚠️ An error occurred while generating the question. Please try again later.', components: [] });
                break; // Stop loop on error
            }
        }

        await interaction.followUp(`🎓 **Session Complete!**\nYou earned a total of **${coinsEarned} coins**.`);
    },
};
