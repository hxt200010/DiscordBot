const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'datastructure',
    description: 'Learn about data structures and algorithms with AI-generated content.',
    options: [
        {
            name: 'option',
            description: 'The data structure or algorithm to learn about.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'language',
            description: 'The programming language for examples (default: Python).',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'difficulty',
            description: 'The difficulty level of the content.',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Easy', value: 'Easy' },
                { name: 'Medium', value: 'Medium' },
                { name: 'Slightly Hard', value: 'Slightly Hard' },
                { name: 'Hard', value: 'Hard' },
            ],
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const option = interaction.options.getString('option');
        const language = interaction.options.getString('language') || 'Python';
        const difficulty = interaction.options.getString('difficulty') || 'Medium';

        await interaction.deferReply();

        try {
            if (!option) {
                // General list mode
                const prompt = `List the most common data structures and algorithms.
                For each, provide a very brief description (1 sentence), its average time complexity for access/search/insertion/deletion (if applicable), and one common use case.
                Do NOT include any code snippets.
                Format the output as a clean list.
                Keep the total length under 2000 characters.`;

                const completion = await openai.createChatCompletion({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                });

                const content = completion.data.choices[0].message.content;

                const embed = new EmbedBuilder()
                    .setTitle('📚 Common Data Structures & Algorithms')
                    .setDescription(content)
                    .setColor('Green')
                    .setFooter({ text: 'Use /datastructure option:<name> for detailed learning.' });

                await interaction.editReply({ embeds: [embed] });

            } else {
                // Specific topic mode
                const prompt = `Teach me about "${option}" in data structures and algorithms using ${language} at a ${difficulty} level.
                Provide the response in strict JSON format with the following keys:
                {
                    "definition": "High-level definition suitable for ${difficulty} level",
                    "example": "Code example in ${language} suitable for ${difficulty} level",
                    "operations": "Common operations list",
                    "time_complexity": "Big-O time complexities",
                    "use_cases": "Real-world use cases",
                    "practice_question": "A practice question for the user to solve (Difficulty: ${difficulty})",
                    "solution": { "code": "Step-by-step solution code in ${language}", "explanation": "Detailed explanation of the solution" }
                }
                Ensure the explanations are detailed but concise enough to fit in a Discord embed.
                Do not include markdown formatting like \`\`\`json in the wrapper, just the raw JSON string.`;

                const completion = await openai.createChatCompletion({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                });

                let responseContent = completion.data.choices[0].message.content;
                // Clean up if the model adds markdown
                responseContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

                let data;
                try {
                    data = JSON.parse(responseContent);
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    await interaction.editReply('⚠️ Failed to parse AI response. Please try again.');
                    return;
                }

                console.log('OpenAI Response Data:', data); // Debug logging

                const formatField = (content) => {
                    if (typeof content === 'string') return content;
                    if (Array.isArray(content)) return content.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
                    if (typeof content === 'object' && content !== null) return JSON.stringify(content, null, 2);
                    return String(content || 'N/A');
                };

                const embed = new EmbedBuilder()
                    .setTitle(`📖 Learn: ${option}`)
                    .setColor('Blue')
                    .addFields(
                        { name: 'Definition', value: formatField(data.definition) },
                        { name: 'Example', value: `\`\`\`${language.toLowerCase()}\n${formatField(data.example)}\n\`\`\`` },
                        { name: 'Operations', value: formatField(data.operations) },
                        { name: 'Time Complexity', value: formatField(data.time_complexity) },
                        { name: 'Use Cases', value: formatField(data.use_cases) },
                        { name: 'Practice Question', value: formatField(data.practice_question) }
                    )
                    .setFooter({ text: 'Click "Show Solution" to see the answer and earn coins!' });

                const button = new ButtonBuilder()
                    .setCustomId('show_solution')
                    .setLabel('Show Solution')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(button);

                const msg = await interaction.editReply({ embeds: [embed], components: [row] });

                // Button collector
                try {
                    const confirmation = await msg.awaitMessageComponent({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 300000, // 5 minutes
                        componentType: ComponentType.Button
                    });

                    if (confirmation.customId === 'show_solution') {
                        const reward = 30;
                        await economySystem.addBalance(interaction.user.id, reward);

                        let solutionText = '';
                        if (typeof data.solution === 'object' && data.solution !== null) {
                            if (data.solution.code && data.solution.explanation) {
                                solutionText = `${data.solution.explanation}\n\n**Code:**\n\`\`\`${language.toLowerCase()}\n${data.solution.code}\n\`\`\``;
                            } else {
                                solutionText = JSON.stringify(data.solution, null, 2);
                            }
                        } else {
                            solutionText = formatField(data.solution);
                        }

                        const finalSolutionEmbed = new EmbedBuilder()
                            .setTitle(`✅ Solution: ${option}`)
                            .setDescription(`${solutionText}\n\n**Reward:** You earned ${reward} coins!`)
                            .setColor('Gold');

                        await confirmation.update({ embeds: [embed, finalSolutionEmbed], components: [] });
                    }
                } catch (e) {
                    // Time ran out, remove button
                    await interaction.editReply({ components: [] });
                }
            }
        } catch (error) {
            console.error('Error in /datastructure:', error);
            await interaction.editReply({ content: '⚠️ An error occurred while processing your request. Please try again later.', embeds: [] });
        }
    },
};
