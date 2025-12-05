const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const activeGames = new Map();

const fallbackRiddles = [
    { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "echo" },
    { question: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
    { question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "map" },
    { question: "What has keys, but no locks; space, but no room; you can enter, but never go outside?", answer: "keyboard" },
    { question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?", answer: "fire" }
];

async function generateRiddle() {
    try {
        const randomSeed = Math.floor(Math.random() * 1000000);
        const result = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a creative riddle master. Generate a unique, challenging, and random riddle with a single-word answer. Avoid common riddles. Return ONLY a JSON object with 'question' and 'answer' fields. The answer must be a single word (or short phrase max 2 words). Random seed: ${randomSeed}`
                },
                {
                    role: "user",
                    content: "Generate a creative riddle. Format: {\"question\": \"riddle text here\", \"answer\": \"single word answer\"}"
                }
            ],
            max_tokens: 150,
            temperature: 1.0
        });

        const content = result.data.choices[0].message.content.trim();
        // Try to parse JSON, handle both with and without code blocks
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Fallback to random hardcoded riddle if parsing fails
        return fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
    } catch (error) {
        console.error('OpenAI Riddle Generation Error:', error);
        // Fallback riddle
        return fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
    }
}

async function getAIHint(riddle, previousGuesses) {
    try {
        const result = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful riddle assistant. Give subtle hints without revealing the answer directly. Be encouraging and playful."
                },
                {
                    role: "user",
                    content: `The riddle is: "${riddle.question}"\nThe answer is: "${riddle.answer}"\nThe user has guessed: ${previousGuesses.join(', ') || 'nothing yet'}\n\nGive a subtle hint (1-2 sentences) without revealing the answer.`
                }
            ],
            max_tokens: 100,
            temperature: 0.8
        });

        return result.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI Hint Error:', error);
        return "🤔 Think about what the riddle describes literally and metaphorically!";
    }
}

async function checkAnswer(userAnswer, correctAnswer, riddleQuestion) {
    try {
        const result = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a riddle judge. Determine if the user's answer is correct or a valid synonym/alternative answer to the riddle. Return ONLY 'true' or 'false'."
                },
                {
                    role: "user",
                    content: `Riddle: "${riddleQuestion}"\nCorrect answer: "${correctAnswer}"\nUser's answer: "${userAnswer}"\n\nIs the user's answer correct or a valid alternative? Reply with only 'true' or 'false'.`
                }
            ],
            max_tokens: 10,
            temperature: 0.3
        });

        const response = result.data.choices[0].message.content.trim().toLowerCase();
        return response === 'true';
    } catch (error) {
        console.error('OpenAI Answer Check Error:', error);
        // Fallback to exact match
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    }
}

module.exports = {
    name: 'riddle',
    description: 'Solve an AI-generated riddle in 3 tries to win coins!',
    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;

        if (activeGames.has(userId)) {
            return interaction.reply({ content: "You already have an active riddle! Finish it first.", ephemeral: true });
        }

        // Show loading message
        await interaction.reply({ content: "**AI is generating a unique riddle for you...**" });

        const riddle = await generateRiddle();

        const embed = new EmbedBuilder()
            .setTitle('🧩 AI-Generated Riddle Challenge')
            .setDescription(riddle.question)
            .setColor('#9B59B6')
            .addFields({ name: 'Attempts', value: '3 tries remaining', inline: false })
            .setFooter({ text: 'Type your answer or "hint" for an AI-powered clue! (90 seconds)' });

        await interaction.editReply({ content: null, embeds: [embed] });

        activeGames.set(userId, {
            answer: riddle.answer.toLowerCase(),
            riddle: riddle,
            attempts: 3,
            wrongGuesses: [],
            startTime: Date.now()
        });

        const filter = (m) => m.author.id === userId;
        const collector = interaction.channel.createMessageCollector({ filter, time: 90000 });

        collector.on('collect', async (message) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const userInput = message.content.toLowerCase().trim();

            // Check if user wants a hint
            if (userInput === 'hint') {
                await message.react('🤔');
                const hint = await getAIHint(game.riddle, game.wrongGuesses);
                await message.reply(`💡 **AI Hint:** ${hint}`);
                return;
            }

            // Use AI to check if answer is correct (handles synonyms)
            const isCorrect = await checkAnswer(userInput, game.answer, game.riddle.question);

            if (isCorrect) {
                const reward = 50;
                await economySystem.addBalance(userId, reward);

                await message.reply(`✅ **Correct!** The answer was: **${game.answer}**\nYou earned **$${reward}**! Your balance: **$${await economySystem.getBalance(userId)}**`);
                activeGames.delete(userId);
                collector.stop();
            } else {
                game.attempts--;
                game.wrongGuesses.push(userInput);

                if (game.attempts > 0) {
                    // Get AI feedback on wrong answer
                    await message.react('❌');
                    const feedback = await getAIHint(game.riddle, game.wrongGuesses);
                    await message.reply(`❌ Not quite! You have **${game.attempts}** ${game.attempts === 1 ? 'try' : 'tries'} left.\n\n💡 **Hint:** ${feedback}`);
                } else {
                    await message.reply(`Out of attempts! The answer was: **${game.answer}**`);
                    activeGames.delete(userId);
                    collector.stop();
                }
            }
        });

        collector.on('end', () => {
            if (activeGames.has(userId)) {
                interaction.followUp({ content: `⏰ Time's up! The answer was: **${activeGames.get(userId).answer}**` });
                activeGames.delete(userId);
            }
        });
    }
};
