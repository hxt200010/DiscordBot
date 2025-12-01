const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const path = require('path');

const economyFile = path.join(__dirname, '../../data/economy.json');

// OpenAI Setup
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const COOLDOWNS = new Set();
const COOLDOWN_SECONDS = 4;

module.exports = {
    name: 'work',
    description: 'Work to earn coins by answering questions!',
    options: [
        {
            name: 'subject',
            description: 'The subject you want to be tested on (e.g., Math, History, CS)',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        if (COOLDOWNS.has(interaction.user.id)) {
            return interaction.reply({
                content: `You are working too fast! Please wait ${COOLDOWN_SECONDS} seconds.`,
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Add cooldown
        COOLDOWNS.add(interaction.user.id);
        setTimeout(() => COOLDOWNS.delete(interaction.user.id), COOLDOWN_SECONDS * 1000);

        const subject = interaction.options.getString('subject') || 'General Knowledge';

        try {
            const prompt = `Generate a multiple-choice question about ${subject}. 
            Provide the question and 4 options. 
            Indicate the correct answer clearly. 
            Format the response exactly like this JSON:
            {
                "question": "The question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctIndex": 0
            }`;

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });

            const responseText = completion.data.choices[0].message.content;

            // Attempt to parse JSON. If it fails, we might need a fallback or better prompting.
            // For robustness, let's try to find the JSON block if there's extra text.
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse OpenAI response");

            const quizData = JSON.parse(jsonMatch[0]);

            const embed = new EmbedBuilder()
                .setTitle(`🧠 Work: ${subject} Quiz`)
                .setDescription(quizData.question)
                .setColor('Blue')
                .setFooter({ text: 'You have 30 seconds to answer!' });

            const buttons = quizData.options.map((opt, index) => {
                return new ButtonBuilder()
                    .setCustomId(`work_answer_${index}`)
                    .setLabel(opt.substring(0, 80)) // Discord limit
                    .setStyle(ButtonStyle.Primary);
            });

            const row = new ActionRowBuilder().addComponents(buttons);

            const reply = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 30000,
                filter: (i) => i.user.id === interaction.user.id
            });

            collector.on('collect', async (i) => {
                const selectedIndex = parseInt(i.customId.split('_')[2]);
                const isCorrect = selectedIndex === quizData.correctIndex;

                if (isCorrect) {
                    // Give rewards
                    let economy = {};
                    if (fs.existsSync(economyFile)) {
                        economy = JSON.parse(fs.readFileSync(economyFile, 'utf8'));
                    }

                    if (!economy[interaction.user.id]) {
                        economy[interaction.user.id] = { balance: 0, inventory: [] };
                    }

                    economy[interaction.user.id].balance += 10;
                    fs.writeFileSync(economyFile, JSON.stringify(economy, null, 2));

                    await i.update({
                        content: `✅ **Correct!** You earned **10 coins**.`,
                        embeds: [],
                        components: []
                    });
                } else {
                    await i.update({
                        content: `❌ **Wrong!** The correct answer was: ${quizData.options[quizData.correctIndex]}`,
                        embeds: [],
                        components: []
                    });
                }
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.editReply({
                        content: '⏰ Time is up!',
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error("Work command error:", error);
            interaction.editReply({
                content: "Sorry, I couldn't generate a job for you right now. Please try again later."
            });
        }
    }
};
