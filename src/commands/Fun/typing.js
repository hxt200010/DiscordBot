const { EmbedBuilder } = require('discord.js');
const economy = require('../../utils/EconomySystem');
const { Configuration, OpenAIApi } = require("openai");

// OpenAI Setup
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const activeGames = new Map();

// Fallback phrases if OpenAI fails
const fallbackPhrases = [
    "The quick brown fox jumps over the lazy dog",
    "Pack my box with five dozen liquor jugs",
    "How vexingly quick daft zebras jump",
    "The five boxing wizards jump quickly",
    "Sphinx of black quartz judge my vow",
    "Two driven jocks help fax my big quiz",
    "The jay pig fox and zebra quickly vanished",
    "Crazy Frederick bought many very exquisite opal jewels",
    "We promptly judged antique ivory buckles for the next prize",
    "A mad boxer shot a quick gloved jab to the jaw of his dizzy opponent"
];

/**
 * Generate a random typing phrase using OpenAI
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 */
async function generatePhrase(difficulty = 'medium') {
    try {
        const wordCount = difficulty === 'easy' ? '5-8' : difficulty === 'hard' ? '15-20' : '10-12';
        const randomSeed = Math.floor(Math.random() * 1000000);
        
        const result = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a typing test generator. Generate a random, interesting sentence or phrase that is ${wordCount} words long. 
The phrase should be:
- Grammatically correct
- Interesting or fun to type
- Include a mix of common and uncommon words
- Vary between themes (nature, technology, food, travel, animals, etc.)
Return ONLY the phrase, nothing else. Random seed: ${randomSeed}`
                },
                {
                    role: "user",
                    content: `Generate a unique ${difficulty} typing phrase (${wordCount} words).`
                }
            ],
            max_tokens: 100,
            temperature: 1.0
        });

        const phrase = result.data.choices[0].message.content.trim();
        // Remove any quotes that OpenAI might add
        return phrase.replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('OpenAI Phrase Generation Error:', error);
        // Fallback to random hardcoded phrase
        return fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
    }
}

/**
 * Calculate WPM from time taken and word count
 */
function calculateWPM(phrase, timeMs) {
    const words = phrase.split(/\s+/).length;
    const minutes = timeMs / 60000;
    return Math.round(words / minutes);
}

/**
 * Get reward based on WPM
 */
function getReward(wpm) {
    if (wpm >= 100) return { rating: '🏆 **LIGHTNING!**', reward: 200, color: 0xFFD700 };
    if (wpm >= 80) return { rating: '🥇 **BLAZING!**', reward: 100, color: 0xFFD700 };
    if (wpm >= 60) return { rating: '🥈 **FAST!**', reward: 50, color: 0xC0C0C0 };
    if (wpm >= 40) return { rating: '🥉 **GOOD!**', reward: 25, color: 0xCD7F32 };
    if (wpm >= 20) return { rating: '👍 **AVERAGE**', reward: 10, color: 0x00AA00 };
    return { rating: '🐢 **SLOW...**', reward: 0, color: 0x808080 };
}

module.exports = {
    name: 'typing',
    description: 'Test your typing speed! Type the phrase as fast as you can!',

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const entryFee = 25;

        // Check if already in a game
        if (activeGames.has(userId)) {
            return interaction.reply({ 
                content: "❌ You already have an active typing test! Finish it first.", 
                ephemeral: true 
            });
        }

        // Check balance
        const balance = await economy.getBalance(userId);
        if (balance < entryFee) {
            return interaction.reply({ 
                content: `You need $${entryFee} to play! Your balance is $${balance}.`, 
                ephemeral: true 
            });
        }

        await economy.removeBalance(userId, entryFee);

        // Show loading message
        await interaction.reply({ 
            embeds: [
                new EmbedBuilder()
                    .setTitle('⌨️ Typing Speed Test')
                    .setDescription('🤖 **AI is generating a unique phrase for you...**')
                    .setColor(0x5865F2)
            ]
        });

        // Pick random difficulty
        const difficulties = ['easy', 'medium', 'medium', 'hard'];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        // Generate phrase with OpenAI
        const phrase = await generatePhrase(difficulty);
        const wordCount = phrase.split(/\s+/).length;

        // Create game embed
        const gameEmbed = new EmbedBuilder()
            .setTitle('⌨️ TYPING SPEED TEST ⌨️')
            .setColor(0x00FF00)
            .setDescription(`**Type the following phrase exactly:**\n\n\`\`\`${phrase}\`\`\``)
            .addFields(
                { name: '📝 Words', value: `${wordCount}`, inline: true },
                { name: '⚡ Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), inline: true },
                { name: '⏱️ Time Limit', value: '30 seconds', inline: true }
            )
            .setFooter({ text: `Entry Fee: $${entryFee} | Type the phrase exactly!` })
            .setTimestamp();

        await interaction.editReply({ embeds: [gameEmbed] });

        // Store game state
        const startTime = Date.now();
        activeGames.set(userId, {
            phrase: phrase,
            startTime: startTime
        });

        // Create message collector
        const filter = (m) => m.author.id === userId;
        const collector = interaction.channel.createMessageCollector({ 
            filter, 
            time: 30000,
            max: 1
        });

        collector.on('collect', async (message) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const endTime = Date.now();
            const timeTaken = endTime - game.startTime;
            const userInput = message.content;

            // Clean up game
            activeGames.delete(userId);

            // Check if phrase matches exactly
            if (userInput === game.phrase) {
                const wpm = calculateWPM(game.phrase, timeTaken);
                const { rating, reward, color } = getReward(wpm);

                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }

                const newBalance = await economy.getBalance(userId);
                const seconds = (timeTaken / 1000).toFixed(2);

                const successEmbed = new EmbedBuilder()
                    .setTitle('⌨️ TYPING COMPLETE! ⌨️')
                    .setColor(color)
                    .setDescription(`# ${wpm} WPM\n\n${rating}`)
                    .addFields(
                        { name: '⏱️ Time', value: `${seconds}s`, inline: true },
                        { name: '📝 Words', value: `${wordCount}`, inline: true },
                        { name: '✅ Accuracy', value: '100%', inline: true },
                        { name: '\u200B', value: '\u200B' },
                        { name: '💰 Reward', value: reward > 0 ? `+$${reward}` : 'Too slow!', inline: true },
                        { name: '💵 Balance', value: `$${newBalance.toLocaleString()}`, inline: true }
                    )
                    .setFooter({ text: '100+ WPM = $200 | 80+ = $100 | 60+ = $50 | 40+ = $25 | 20+ = $10' })
                    .setTimestamp();

                await message.reply({ embeds: [successEmbed] });
            } else {
                // Wrong text - calculate similarity for feedback
                const failEmbed = new EmbedBuilder()
                    .setTitle('❌ INCORRECT!')
                    .setColor(0xFF0000)
                    .setDescription('You didn\'t type the phrase correctly!\n\n**You must type it exactly as shown.**')
                    .addFields(
                        { name: '📋 Expected', value: `\`\`\`${game.phrase}\`\`\``, inline: false },
                        { name: '❌ Your Input', value: `\`\`\`${userInput.substring(0, 200)}${userInput.length > 200 ? '...' : ''}\`\`\``, inline: false },
                        { name: '💸 Lost', value: `$${entryFee}`, inline: true }
                    )
                    .setFooter({ text: 'Tip: Watch for capitalization and punctuation!' })
                    .setTimestamp();

                await message.reply({ embeds: [failEmbed] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && activeGames.has(userId)) {
                activeGames.delete(userId);
                
                interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⏰ TIME\'S UP!')
                            .setColor(0xFF0000)
                            .setDescription(`You didn't type the phrase in time!\n\n**Lost:** $${entryFee}`)
                            .setTimestamp()
                    ]
                });
            }
        });
    }
};
