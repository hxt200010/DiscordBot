const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

// Computer Science topic categories
const CS_CATEGORIES = [
    'Algorithms & Data Structures',
    'Artificial Intelligence & Machine Learning',
    'Web Development',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'Cybersecurity',
    'Software Engineering',
    'Programming Languages',
    'Cloud Computing',
    'DevOps',
    'Computer Architecture',
    'Distributed Systems',
    'Blockchain',
    'Game Development',
    'Mobile Development'
];

module.exports = {
    name: 'learncs',
    description: 'Learn about any Computer Science topic with AI-powered explanations!',
    options: [
        {
            name: 'topic',
            description: 'The CS topic to learn about (e.g., "binary search", "neural networks", "REST APIs")',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'language',
            description: 'Programming language for code examples (default: Python)',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Python', value: 'Python' },
                { name: 'JavaScript', value: 'JavaScript' },
                { name: 'Java', value: 'Java' },
                { name: 'C++', value: 'C++' },
                { name: 'C#', value: 'C#' },
                { name: 'Go', value: 'Go' },
                { name: 'Rust', value: 'Rust' },
                { name: 'TypeScript', value: 'TypeScript' }
            ]
        },
        {
            name: 'depth',
            description: 'How detailed should the explanation be?',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Beginner - Simple explanation', value: 'beginner' },
                { name: 'Intermediate - More detail', value: 'intermediate' },
                { name: 'Advanced - In-depth technical', value: 'advanced' }
            ]
        }
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const topic = interaction.options.getString('topic');
        const language = interaction.options.getString('language') || 'Python';
        const depth = interaction.options.getString('depth') || 'intermediate';

        await interaction.deferReply();

        const depthInstructions = {
            beginner: 'Explain like I\'m new to programming. Use simple terms and analogies.',
            intermediate: 'Assume basic programming knowledge. Provide practical examples.',
            advanced: 'Assume strong CS background. Include technical details and edge cases.'
        };

        try {
            const prompt = `Explain the Computer Science topic: "${topic}".
            Level: ${depth} - ${depthInstructions[depth]}
            Programming Language: ${language}
            
            Provide the output in strict JSON format with the following structure:
            {
                "title": "Title of the topic",
                "category": "Which CS field this belongs to (e.g., Algorithms, Web Dev, AI, etc.)",
                "definition": "Clear explanation of the topic (2-3 sentences).",
                "key_concepts": ["Concept 1", "Concept 2", "Concept 3"],
                "use_cases": ["Real-world use case 1", "Real-world use case 2"],
                "code": "A short, illustrative ${language} code snippet (max 15 lines) with comments.",
                "related_topics": ["Related topic 1", "Related topic 2", "Related topic 3"],
                "resources": ["Resource or tool 1", "Resource or tool 2"]
            }
            Keep the response concise to fit Discord embeds (under 1500 characters total).
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 800
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

            // Truncate code if too long
            let codeSnippet = data.code || 'No code example available';
            if (codeSnippet.length > 800) {
                codeSnippet = codeSnippet.substring(0, 797) + '...';
            }

            const embed = new EmbedBuilder()
                .setTitle(`📚 Learn CS: ${data.title}`)
                .setColor('Blue')
                .addFields(
                    { name: '📂 Category', value: data.category || 'General CS', inline: true },
                    { name: '📊 Level', value: depth.charAt(0).toUpperCase() + depth.slice(1), inline: true },
                    { name: '💻 Language', value: language, inline: true },
                    { name: '📖 What is it?', value: data.definition || 'No definition available' },
                    { name: '🔑 Key Concepts', value: (data.key_concepts || []).join('\n') || 'N/A', inline: true },
                    { name: '🌍 Use Cases', value: (data.use_cases || []).join('\n') || 'N/A', inline: true },
                    { name: '🔗 Related Topics', value: (data.related_topics || []).join(', ') || 'N/A' }
                )
                .setDescription(`**Example Code (${language}):**\n\`\`\`${language.toLowerCase()}\n${codeSnippet}\n\`\`\``)
                .setFooter({ text: 'You earned 5 coins for learning! Use /learncs to explore more topics.' });

            // Reward user
            await economySystem.addBalance(interaction.user.id, 5);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in learncs command:', error);
            await interaction.editReply({
                content: '⚠️ An error occurred while fetching the lesson. Please try again later.\n\n**Tip:** Try a more specific topic like "binary search tree" or "REST API authentication".'
            });
        }
    },
};
