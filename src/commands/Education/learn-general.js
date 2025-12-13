const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'learn-general',
    description: 'Learn about ANY topic - science, math, art, history, medicine, and more!',
    options: [
        {
            name: 'topic',
            description: 'What do you want to learn about? (e.g., "photosynthesis", "Renaissance art", "calculus")',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'depth',
            description: 'How detailed should the explanation be?',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Quick - 1 minute read', value: 'quick' },
                { name: 'Standard - 3 minute read', value: 'standard' },
                { name: 'Deep Dive - Comprehensive', value: 'deep' }
            ]
        },
        {
            name: 'style',
            description: 'How should it be explained?',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Explain like I\'m 5', value: 'eli5' },
                { name: 'Student - Clear & educational', value: 'student' },
                { name: 'Professional - Technical accuracy', value: 'professional' },
                { name: 'Fun - With humor & analogies', value: 'fun' }
            ]
        }
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const topic = interaction.options.getString('topic');
        const depth = interaction.options.getString('depth') || 'standard';
        const style = interaction.options.getString('style') || 'student';

        await interaction.deferReply();

        const depthInstructions = {
            quick: 'Keep it brief - just the essential facts in 2-3 sentences.',
            standard: 'Provide a well-rounded explanation with key details.',
            deep: 'Give a comprehensive explanation covering history, details, and implications.'
        };

        const styleInstructions = {
            eli5: 'Explain like I\'m 5 years old. Use simple words, fun analogies, and relatable examples.',
            student: 'Explain clearly for a student. Be educational but accessible.',
            professional: 'Use proper technical terminology. Be precise and accurate.',
            fun: 'Make it entertaining! Use humor, pop culture references, and creative analogies.'
        };

        try {
            const prompt = `Pretend you are a master of everything - a scholar who has mastered every field of human knowledge from ancient philosophy to quantum physics, from Renaissance art to modern medicine, from pure mathematics to practical engineering. You have the wisdom of the ages and the enthusiasm of a passionate teacher.

A curious learner asks you to teach them about: "${topic}"

Style: ${styleInstructions[style]}
Depth: ${depthInstructions[depth]}

Provide the output in strict JSON format:
{
    "title": "Title for this lesson",
    "field": "The field/subject this belongs to (e.g., Biology, Physics, Art History, Medicine, etc.)",
    "emoji": "A single emoji that represents this topic",
    "explanation": "Your main explanation of the topic (keep under 400 characters)",
    "key_facts": ["Interesting fact 1", "Interesting fact 2", "Interesting fact 3"],
    "why_it_matters": "Why this topic is important or interesting (1-2 sentences)",
    "fun_fact": "One surprising or fun fact most people don't know",
    "learn_more": ["Related topic 1", "Related topic 2", "Related topic 3"]
}

Keep the total response concise to fit Discord's limits.
Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 700
            });

            let responseContent = completion.data.choices[0].message.content;
            responseContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

            let data;
            try {
                data = JSON.parse(responseContent);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Failed to parse AI response.');
            }

            // Truncate if needed
            const explanation = (data.explanation || '').length > 500
                ? data.explanation.substring(0, 497) + '...'
                : data.explanation;

            const embed = new EmbedBuilder()
                .setTitle(`${data.emoji || '📚'} ${data.title}`)
                .setColor('Purple')
                .setDescription(explanation)
                .addFields(
                    { name: '📂 Field', value: data.field || 'General Knowledge', inline: true },
                    { name: '🎯 Style', value: style.charAt(0).toUpperCase() + style.slice(1), inline: true },
                    { name: '📊 Depth', value: depth.charAt(0).toUpperCase() + depth.slice(1), inline: true },
                    { name: '🔑 Key Facts', value: (data.key_facts || []).map((f, i) => `${i + 1}. ${f}`).join('\n') || 'N/A' },
                    { name: '💡 Why It Matters', value: data.why_it_matters || 'N/A' },
                    { name: '🎲 Fun Fact', value: data.fun_fact || 'N/A' },
                    { name: '🔗 Learn More About', value: (data.learn_more || []).join(', ') || 'N/A' }
                )
                .setFooter({ text: 'You earned 25 coins for learning! Knowledge is power!' });

            // Reward user
            await economySystem.addBalance(interaction.user.id, 25);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in learn-general command:', error);
            await interaction.editReply({
                content: '⚠️ An error occurred while fetching the lesson. Please try again!\n\n**Tip:** Try being more specific, like "how do black holes form" instead of just "black holes".'
            });
        }
    },
};
