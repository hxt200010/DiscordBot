const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const economySystem = require('../../utils/EconomySystem');

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: 'learnai',
    description: 'Learn about AI and Machine Learning concepts.',
    options: [
        {
            name: 'topic',
            description: 'The specific AI/ML topic to learn about.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'tech1',
            description: 'Specific technology or library to include.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'tech2',
            description: 'Specific technology or library to include.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'tech3',
            description: 'Specific technology or library to include.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const topic = interaction.options.getString('topic') || 'Machine Learning';
        const tech1 = interaction.options.getString('tech1');
        const tech2 = interaction.options.getString('tech2');
        const tech3 = interaction.options.getString('tech3');

        const techs = [tech1, tech2, tech3].filter(Boolean).join(', ');
        const techPrompt = techs ? `Include these specific technologies/libraries: ${techs}.` : '';

        await interaction.deferReply();

        try {
            const prompt = `Explain the AI/ML topic: "${topic}".
            ${techPrompt}
            Provide the output in strict JSON format with the following structure:
            {
                "title": "Title of the topic",
                "definition": "Clear and concise definition of the topic.",
                "sub_techniques": ["Sub-technique 1", "Sub-technique 2", "Sub-technique 3"],
                "applications": ["Real-life application 1", "Real-life application 2"],
                "code": "A short, illustrative Python code snippet (max 15 lines).",
                "libraries": ["Library/Tool 1", "Library/Tool 2", "Library/Tool 3"]
            }
            Ensure the total content length fits within a Discord Embed (approx 2000 chars).
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const completion = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
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

            const embed = new EmbedBuilder()
                .setTitle(`🤖 Learn AI: ${data.title}`)
                .setColor('Aqua')
                .addFields(
                    { name: '📖 Definition', value: data.definition },
                    { name: '🔍 Sub-techniques', value: data.sub_techniques.join('\n') || 'N/A', inline: true },
                    { name: '🛠️ Libraries & Tools', value: data.libraries.join('\n') || 'N/A', inline: true },
                    { name: '🌍 Real-life Applications', value: data.applications.join('\n') || 'N/A' }
                )
                .setDescription(`**Example Code:**\n\`\`\`python\n${data.code}\n\`\`\``)
                .setFooter({ text: 'You earned 3 coins for learning!' });

            // Reward user
            economySystem.addBalance(interaction.user.id, 3);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in learnai command:', error);
            await interaction.editReply({ content: '⚠️ An error occurred while fetching the AI lesson. Please try again later.' });
        }
    },
};
