const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'job-interview',
    description: 'Practice interview questions based on a specific job description or requirements.',
    options: [
        {
            name: 'role-description',
            description: 'The job role description or requirements (paste the job posting details).',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'time',
            description: 'Number of questions to ask.',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
            maxValue: 10,
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const roleDescription = interaction.options.getString('role-description');
        const times = interaction.options.getInteger('time');

        await interaction.deferReply();

        let coinsEarned = 0;
        const rewardPerQuestion = 50; // Reward for each correct answer
        const sessionData = [];

        try {
            // Generate questions based on job description
            const prompt = `You are a professional job interviewer. Based on the following job description/requirements, create ${times} unique interview questions that would help someone prepare for this role.

JOB DESCRIPTION:
${roleDescription}

Generate a mix of:
- Technical questions related to the skills mentioned
- Behavioral/situational questions ("Tell me about a time when...")
- Knowledge-based questions about concepts in the job requirements

For each question:
1. Provide a clear "Title" (the main question being asked)
2. Provide a "Context" paragraph that sets up the scenario or provides context for the question
3. Create 4 multiple-choice answer options where:
   - One answer is clearly the best/correct answer
   - The other 3 are plausible but incorrect or less optimal answers
4. Include a brief "Explanation" of why the correct answer is best

Provide the output in strict JSON format as an array of objects with the following structure:
[
    {
        "title": "Interview Question Title",
        "context": "Context or scenario for the question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Brief explanation of why this is the correct answer"
    }
]

Make the questions realistic and helpful for someone preparing for this specific job. Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-5-mini',
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

            // Send initial embed
            const startEmbed = new EmbedBuilder()
                .setTitle('💼 Job Interview Session Starting')
                .setDescription(`**Role Analysis Complete!**\n\nI've analyzed the job requirements and prepared ${times} interview question${times > 1 ? 's' : ''} to help you prepare.\n\n⏱️ You have **150 seconds** to answer each question.\n💰 Earn **${rewardPerQuestion} coins** for each correct answer!`)
                .setColor('Blue')
                .setFooter({ text: 'Good luck with your interview preparation!' });

            await interaction.editReply({ embeds: [startEmbed] });

            // Small delay before first question
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Question Loop
            for (let i = 0; i < questions.length; i++) {
                const questionData = questions[i];

                // Option labels for buttons
                const optionLabels = ['A', 'B', 'C', 'D'];

                // Construct the question embed with full options displayed
                let description = `**${questionData.title}**\n\n`;
                if (questionData.context && questionData.context.trim() !== '') {
                    description += `📋 *${questionData.context}*\n\n`;
                }
                description += `**Choose the best answer:**\n\n`;

                // Add full options to the description
                questionData.options.forEach((opt, index) => {
                    description += `**${optionLabels[index]}.** ${opt}\n\n`;
                });

                const questionEmbed = new EmbedBuilder()
                    .setTitle(`💼 Job Interview - Question ${i + 1}/${times}`)
                    .setDescription(description)
                    .setColor('Blue')
                    .setFooter({ text: `Reward: ${rewardPerQuestion} coins per correct answer | Time: 300s` });

                // Use short letter labels for buttons
                const buttons = questionData.options.map((opt, index) =>
                    new ButtonBuilder()
                        .setCustomId(`jobinterview_${i}_${index}`)
                        .setLabel(`${optionLabels[index]}`)
                        .setStyle(ButtonStyle.Primary)
                );

                // Split buttons into rows if needed (max 5 per row)
                const rows = [];
                for (let j = 0; j < buttons.length; j += 2) {
                    const row = new ActionRowBuilder().addComponents(buttons.slice(j, j + 2));
                    rows.push(row);
                }

                // Send new message for each question
                const msg = await interaction.followUp({ embeds: [questionEmbed], components: rows });

                let answered = false;
                let userCorrect = false;
                let userAnswerText = "Time Out";

                try {
                    const confirmation = await msg.awaitMessageComponent({
                        filter: (btnInt) => btnInt.user.id === interaction.user.id,
                        time: 300000, // 300 seconds
                        componentType: ComponentType.Button
                    });

                    const selectedIndex = parseInt(confirmation.customId.split('_')[2]);
                    const correctAnswer = questionData.options[questionData.correctIndex];
                    userAnswerText = questionData.options[selectedIndex];

                    if (selectedIndex === questionData.correctIndex) {
                        userCorrect = true;
                        await economySystem.addBalance(interaction.user.id, rewardPerQuestion);
                        coinsEarned += rewardPerQuestion;

                        const successEmbed = new EmbedBuilder()
                            .setTitle('✅ Excellent Answer!')
                            .setDescription(`You earned **${rewardPerQuestion} coins**!\n\n**Why this is correct:**\n${questionData.explanation || 'This answer best demonstrates the skills and knowledge required for this role.'}`)
                            .setColor('Green');

                        await confirmation.update({ embeds: [questionEmbed, successEmbed], components: [] });
                    } else {
                        const failEmbed = new EmbedBuilder()
                            .setTitle('❌ Not Quite Right')
                            .setDescription(`The best answer was: **${correctAnswer}**\n\n**Explanation:**\n${questionData.explanation || 'This answer best demonstrates the skills and knowledge required for this role.'}`)
                            .setColor('Red');

                        await confirmation.update({ embeds: [questionEmbed, failEmbed], components: [] });
                    }
                    answered = true;

                } catch (e) {
                    // Timeout
                    const timeoutEmbed = new EmbedBuilder()
                        .setTitle('⏰ Time Out!')
                        .setDescription(`You ran out of time. The best answer was: **${questionData.options[questionData.correctIndex]}**\n\n**Explanation:**\n${questionData.explanation || 'This answer best demonstrates the skills and knowledge required for this role.'}`)
                        .setColor('Orange');

                    await msg.edit({ embeds: [questionEmbed, timeoutEmbed], components: [] });
                }

                // Store session data
                sessionData.push({
                    title: questionData.title,
                    context: questionData.context,
                    userAnswer: userAnswerText,
                    correctAnswer: questionData.options[questionData.correctIndex],
                    explanation: questionData.explanation,
                    isCorrect: userCorrect
                });

                // Small delay between questions
                if (i < questions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2500));
                }
            }

            // Session Review
            const correctCount = sessionData.filter(q => q.isCorrect).length;
            const percentage = Math.round((correctCount / times) * 100);

            let reviewContent = `===========================================\n`;
            reviewContent += `       JOB INTERVIEW SESSION REVIEW\n`;
            reviewContent += `===========================================\n\n`;
            reviewContent += `📊 RESULTS: ${correctCount}/${times} correct (${percentage}%)\n`;
            reviewContent += `💰 COINS EARNED: ${coinsEarned}\n\n`;
            reviewContent += `-------------------------------------------\n`;
            reviewContent += `JOB DESCRIPTION ANALYZED:\n`;
            reviewContent += `-------------------------------------------\n`;
            reviewContent += `${roleDescription}\n\n`;
            reviewContent += `-------------------------------------------\n`;
            reviewContent += `DETAILED QUESTION REVIEW:\n`;
            reviewContent += `-------------------------------------------\n\n`;

            sessionData.forEach((data, index) => {
                reviewContent += `QUESTION ${index + 1}: ${data.title}\n`;
                if (data.context) reviewContent += `Context: ${data.context}\n`;
                reviewContent += `\nYour Answer: ${data.userAnswer} ${data.isCorrect ? '✅' : '❌'}\n`;
                reviewContent += `Correct Answer: ${data.correctAnswer}\n`;
                if (data.explanation) reviewContent += `Explanation: ${data.explanation}\n`;
                reviewContent += `\n------------------------------------------\n\n`;
            });

            reviewContent += `===========================================\n`;
            reviewContent += `           INTERVIEW TIPS\n`;
            reviewContent += `===========================================\n\n`;
            reviewContent += `• Research the company thoroughly before your interview\n`;
            reviewContent += `• Prepare specific examples from your experience\n`;
            reviewContent += `• Practice the STAR method for behavioral questions\n`;
            reviewContent += `• Prepare thoughtful questions to ask the interviewer\n`;
            reviewContent += `• Review and understand all the skills mentioned in the job posting\n`;

            // Performance message
            let performanceMsg = '';
            if (percentage >= 80) {
                performanceMsg = '🌟 **Outstanding!** You\'re well-prepared for this role!';
            } else if (percentage >= 60) {
                performanceMsg = '👍 **Good job!** A bit more study and you\'ll be ready!';
            } else if (percentage >= 40) {
                performanceMsg = '📚 **Keep practicing!** Review the job requirements and try again.';
            } else {
                performanceMsg = '💪 **Don\'t give up!** Study the skills in the job posting and practice more.';
            }

            const summaryEmbed = new EmbedBuilder()
                .setTitle('🎓 Interview Session Complete!')
                .setDescription(`**Score:** ${correctCount}/${times} (${percentage}%)\n**Coins Earned:** ${coinsEarned}\n\n${performanceMsg}\n\nA detailed review of your session is attached below.`)
                .setColor(percentage >= 60 ? 'Green' : percentage >= 40 ? 'Yellow' : 'Red');

            const buffer = Buffer.from(reviewContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: 'job_interview_review.txt' });

            await interaction.followUp({ embeds: [summaryEmbed], files: [attachment] });

        } catch (error) {
            console.error('Error in job-interview command:', error);
            await interaction.followUp({ content: '⚠️ An error occurred while generating the interview questions. Please try again later.' });
        }
    },
};
