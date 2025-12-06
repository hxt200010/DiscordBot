const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'interview',
    description: 'Practice interview questions for a specific programming language or topic.',
    options: [
        {
            name: 'option',
            description: 'The programming language or topic to practice.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'times',
            description: 'Number of questions to ask.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
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
        const option = interaction.options.getString('option');
        const times = interaction.options.getInteger('times');
        const difficulty = interaction.options.getString('difficulty');

        await interaction.deferReply();

        let coinsEarned = 0;
        const reward = 5; // Flat reward of 5 coins
        const sessionData = [];

        try {
            // Generate questions
            const prompt = `Create ${times} unique ${difficulty} difficulty multiple-choice interview questions for "${option}".
            
            The questions should be "Theory-Heavy" style.
            For each question:
            1. Provide a clear "Title" (e.g., "What is a dictionary in Python?").
            2. Provide a "Theory" paragraph explaining the concept.
            3. Provide a "Code" snippet demonstrating the concept. **The code must be a COMPLETE, working example with NO blanks.**
            4. **CRITICAL:** Format the code properly with newlines and indentation. Do NOT minify the code.
            5. Include the expected output of the code as a comment at the end of the snippet.
            6. Create a "fill in the blank" challenge. The blank "____" MUST be in the "Theory" text and should represent a key term or keyword.
            7. Provide 4 options for the blank.
            
            Ensure each question is completely different and covers a different concept, write so it's easy for users to understand.
            
            Provide the output in strict JSON format as an array of objects with the following structure:
            [
                {
                    "title": "Question Title",
                    "theory": "The theory text with '____' for the missing keyword",
                    "code": "The complete code snippet (NO blanks)",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctIndex": 0 // The index of the correct option (0-3)
                }
            ]
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });

            let responseContent = completion.data.choices[0].message.content;
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

            // Interaction Loop
            for (let i = 0; i < questions.length; i++) {
                const questionData = questions[i];
                
                // Construct the description with Theory and Code
                let description = `**${questionData.title}**\n\n${questionData.theory}\n\n`;
                if (questionData.code && questionData.code.trim() !== '') {
                    description += `\`\`\`${option.toLowerCase().split(' ')[0]}\n${questionData.code}\n\`\`\``;
                }

                const questionEmbed = new EmbedBuilder()
                    .setTitle(`💼 Interview: ${option} - Question ${i + 1}/${times}`)
                    .setDescription(description)
                    .setColor(difficulty === 'hard' ? 'Red' : difficulty === 'medium' ? 'Yellow' : 'Green')
                    .setFooter({ text: `Difficulty: ${difficulty} | Reward: ${reward} coins | Time: 150s` });

                const buttons = questionData.options.map((opt, index) =>
                    new ButtonBuilder()
                        .setCustomId(`interview_${i}_${index}`)
                        .setLabel(opt.substring(0, 80)) // Ensure label is not too long
                        .setStyle(ButtonStyle.Secondary)
                );

                const row = new ActionRowBuilder().addComponents(buttons);

                // Send new message for each question
                const msg = await interaction.followUp({ embeds: [questionEmbed], components: [row] });

                let answered = false;
                let userCorrect = false;
                let userAnswerText = "Time Out";

                try {
                    const confirmation = await msg.awaitMessageComponent({
                        filter: (btnInt) => btnInt.user.id === interaction.user.id,
                        time: 150000, // 150 seconds
                        componentType: ComponentType.Button
                    });

                    const selectedIndex = parseInt(confirmation.customId.split('_')[2]);
                    const correctAnswer = questionData.options[questionData.correctIndex];
                    userAnswerText = questionData.options[selectedIndex];

                    // Prepare completed text/code for feedback
                    let completedTheory = questionData.theory.replace('____', `**${correctAnswer}**`);
                    let completedCode = questionData.code.replace('____', correctAnswer);
                    
                    let feedbackDescription = `**${questionData.title}**\n\n${completedTheory}\n\n`;
                    if (questionData.code && questionData.code.trim() !== '') {
                        feedbackDescription += `\`\`\`${option.toLowerCase().split(' ')[0]}\n${completedCode}\n\`\`\``;
                    }

                    if (selectedIndex === questionData.correctIndex) {
                        userCorrect = true;
                        await economySystem.addBalance(interaction.user.id, reward);
                        coinsEarned += reward;
                        
                        const successEmbed = new EmbedBuilder()
                            .setTitle('✅ Correct!')
                            .setDescription(`You earned ${reward} coins.\n\n${feedbackDescription}`)
                            .setColor('Green');

                        await confirmation.update({ embeds: [questionEmbed, successEmbed], components: [] });
                    } else {
                        const failEmbed = new EmbedBuilder()
                            .setTitle('❌ Incorrect')
                            .setDescription(`The correct answer was: **${correctAnswer}**\n\n${feedbackDescription}`)
                            .setColor('Red');

                        await confirmation.update({ embeds: [questionEmbed, failEmbed], components: [] });
                    }
                    answered = true;

                } catch (e) {
                    // Timeout
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Time Out!')
                        .setDescription(`You ran out of time. The correct answer was: **${questionData.options[questionData.correctIndex]}**`)
                        .setColor('Orange');
                    
                    await msg.edit({ embeds: [questionEmbed, timeoutEmbed], components: [] });
                }

                // Store session data
                sessionData.push({
                    title: questionData.title,
                    theory: questionData.theory,
                    code: questionData.code,
                    userAnswer: userAnswerText,
                    correctAnswer: questionData.options[questionData.correctIndex],
                    isCorrect: userCorrect
                });

                // Small delay between questions
                if (i < questions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            // Session Review
            let reviewContent = `Interview Session Review: ${option} (${difficulty})\n\n`;
            sessionData.forEach((data, index) => {
                reviewContent += `Question ${index + 1}: ${data.title}\n`;
                reviewContent += `Theory:\n${data.theory}\n`;
                if (data.code) reviewContent += `Code:\n${data.code}\n`;
                reviewContent += `Your Answer: ${data.userAnswer} ${data.isCorrect ? '(✅)' : '(❌)'}\n`;
                reviewContent += `Correct Answer: ${data.correctAnswer}\n`;
                reviewContent += `--------------------------------------------------\n\n`;
            });

            const summaryEmbed = new EmbedBuilder()
                .setTitle('🎓 Interview Session Complete')
                .setDescription(`You earned a total of **${coinsEarned} coins**.\n\nA detailed review of your session is attached below.`)
                .setColor('Gold');

            const buffer = Buffer.from(reviewContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: 'interview_review.txt' });

            await interaction.followUp({ embeds: [summaryEmbed], files: [attachment] });

        } catch (error) {
            console.error('Error in interview command:', error);
            await interaction.followUp({ content: '⚠️ An error occurred while generating the interview questions. Please try again later.' });
        }
    },
};
