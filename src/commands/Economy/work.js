const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const path = require('path');

const economyFile = path.join(__dirname, '../../data/economy.json');

// OpenAI Setup
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
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
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });

            const responseText = completion.data.choices[0].message.content;

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse OpenAI response");

            const quizData = JSON.parse(jsonMatch[0]);
            await handleQuiz(interaction, quizData, subject);

        } catch (error) {
            console.error("Work command error:", error);
            if (error.response) {
                console.error("OpenAI Response Error:", error.response.status, error.response.data);
            }

            // Fallback Questions Database
            const fallbackDB = {
                "computer science": [
                    {
                        question: "What does CPU stand for?",
                        options: ["Central Processing Unit", "Computer Personal Unit", "Central Process Utility", "Central Processor Unit"],
                        correctIndex: 0
                    },
                    {
                        question: "Which language is known as the language of the web?",
                        options: ["Python", "Java", "JavaScript", "C++"],
                        correctIndex: 2
                    },
                    {
                        question: "What is 1 byte equal to?",
                        options: ["4 bits", "8 bits", "16 bits", "32 bits"],
                        correctIndex: 1
                    },
                    {
                        question: "What does HTML stand for?",
                        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Mark Language", "Home Tool Markup Language"],
                        correctIndex: 0
                    }
                ],
                "math": [
                    {
                        question: "What is the square root of 64?",
                        options: ["6", "7", "8", "9"],
                        correctIndex: 2
                    },
                    {
                        question: "What is 15 * 4?",
                        options: ["45", "50", "60", "75"],
                        correctIndex: 2
                    },
                    {
                        question: "What is the value of Pi (approx)?",
                        options: ["3.12", "3.14", "3.16", "3.18"],
                        correctIndex: 1
                    }
                ],
                "default": [
                    {
                        question: "What is the capital of France?",
                        options: ["London", "Berlin", "Paris", "Madrid"],
                        correctIndex: 2
                    },
                    {
                        question: "Which planet is known as the Red Planet?",
                        options: ["Mars", "Venus", "Jupiter", "Saturn"],
                        correctIndex: 0
                    },
                    {
                        question: "Who wrote 'Romeo and Juliet'?",
                        options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
                        correctIndex: 1
                    }
                ]
            };

            const normalizedSubject = subject.toLowerCase();
            let selectedQuestions = fallbackDB["default"];

            if (normalizedSubject.includes("computer") || normalizedSubject.includes("cs") || normalizedSubject.includes("coding") || normalizedSubject.includes("programming")) {
                selectedQuestions = fallbackDB["computer science"];
            } else if (normalizedSubject.includes("math")) {
                selectedQuestions = fallbackDB["math"];
            }

            const randomFallback = selectedQuestions[Math.floor(Math.random() * selectedQuestions.length)];

            await handleQuiz(interaction, randomFallback, `${subject} (Offline Mode)`);
        }
    }
};

async function handleQuiz(interaction, quizData, titleSuffix) {
    const embed = new EmbedBuilder()
        .setTitle(`🧠 Work: ${titleSuffix}`)
        .setDescription(quizData.question)
        .setColor('Blue')
        .setFooter({ text: 'You have 30 seconds to answer!' });

    const buttons = quizData.options.map((opt, index) => {
        return new ButtonBuilder()
            .setCustomId(`work_answer_${index}`)
            .setLabel(opt.substring(0, 80))
            .setStyle(ButtonStyle.Primary);
    });

    const row = new ActionRowBuilder().addComponents(buttons);

    // Use editReply because we deferred
    const reply = await interaction.editReply({ embeds: [embed], components: [row], content: null });

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
        filter: (i) => i.user.id === interaction.user.id
    });

    collector.on('collect', async (i) => {
        const selectedIndex = parseInt(i.customId.split('_')[2]);
        const isCorrect = selectedIndex === quizData.correctIndex;

        if (isCorrect) {
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
}
