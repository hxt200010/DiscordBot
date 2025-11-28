const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

const wordCategories = {
    food: ['pizza', 'burger', 'sushi', 'pasta', 'taco', 'ramen', 'curry', 'steak', 'salad', 'donut'],
    anime: ['naruto', 'bleach', 'pokemon', 'onepiece', 'dragonball', 'deathnote', 'attackontitan', 'demonslayer', 'myheroacademia'],
    geography: ['paris', 'tokyo', 'london', 'egypt', 'brazil', 'canada', 'australia', 'india', 'mexico', 'spain']
};

const hangmanStages = [
    '```\n=========\n```', // 0 - Just the base
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```', // 1 - Gallows
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```', // 2 - Head
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```', // 3 - Body
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n  |   |\n      |\n=========\n```', // 4 - Longer body
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n  |   |\n      |\n=========\n```', // 5 - Left arm
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n      |\n=========\n```', // 6 - Both arms
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n /    |\n=========\n```', // 7 - Left leg
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n / \\  |\n=========\n```', // 8 - Both legs
    '```\n  +---+\n  |   |\n  X   |\n /|\\  |\n  |   |\n / \\  |\n=========\n```', // 9 - Dead (X eyes)
    '```\n  +---+\n  |   |\n >X<  |\n /|\\  |\n  |   |\n / \\  |\n=========\nGAME OVER!\n```' // 10 - Final stage
];

const activeGames = new Map();

module.exports = {
    name: 'hangman',
    description: 'Play hangman with custom topics!',
    options: [
        {
            name: 'topic',
            description: 'Choose a topic',
            type: 3, // STRING
            required: true,
            choices: [
                { name: 'Food', value: 'food' },
                { name: 'Anime', value: 'anime' },
                { name: 'Geography', value: 'geography' }
            ]
        }
    ],
    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const topic = interaction.options.getString('topic');

        if (activeGames.has(userId)) {
            return interaction.reply({ content: "🎮 You already have an active hangman game! Finish it first.", ephemeral: true });
        }

        const words = wordCategories[topic];
        const word = words[Math.floor(Math.random() * words.length)];
        const guessed = [];
        const wrongGuesses = 0;

        function getDisplayWord() {
            return word.split('').map(letter => guessed.includes(letter) ? letter : '_').join(' ');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Hangman Game')
            .setDescription(`**Topic:** ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\n${hangmanStages[0]}\n\n**Word:** ${getDisplayWord()}`)
            .setColor('#2ECC71')
            .addFields({ name: 'Attempts Remaining', value: '10 wrong guesses allowed', inline: false })
            .setFooter({ text: 'Type a letter to guess! (You have 3 minutes)' });

        await interaction.reply({ embeds: [embed] });

        activeGames.set(userId, {
            word: word,
            guessed: guessed,
            wrongGuesses: wrongGuesses,
            topic: topic
        });

        const filter = (m) => m.author.id === userId && m.content.length === 1 && /[a-z]/i.test(m.content);
        const collector = interaction.channel.createMessageCollector({ filter, time: 180000 }); // 3 minutes

        collector.on('collect', async (msg) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const letter = msg.content.toLowerCase();

            if (game.guessed.includes(letter)) {
                await msg.reply('❌ You already guessed that letter!');
                return;
            }

            game.guessed.push(letter);

            if (game.word.includes(letter)) {
                const displayWord = game.word.split('').map(l => game.guessed.includes(l) ? l : '_').join(' ');
                
                if (!displayWord.includes('_')) {
                    // Won!
                    const reward = 60;
                    economySystem.addBalance(userId, reward);
                    
                    await msg.reply(`✅ **You won!** The word was: **${game.word}**\nYou earned **$${reward}**! Your balance: **$${economySystem.getBalance(userId)}**`);
                    activeGames.delete(userId);
                    collector.stop();
                } else {
                    const attemptsLeft = 10 - game.wrongGuesses;
                    await msg.reply(`✅ Correct!\n\n${hangmanStages[game.wrongGuesses]}\n\n**Word:** ${displayWord}\n**Attempts left:** ${attemptsLeft}`);
                }
            } else {
                game.wrongGuesses++;
                const wrongLetters = game.guessed.filter(l => !game.word.includes(l)).join(', ');
                const attemptsLeft = 10 - game.wrongGuesses;
                
                if (game.wrongGuesses >= 10) {
                    await msg.reply(`💀 **Game Over!** The word was: **${game.word}**\n\n${hangmanStages[10]}`);
                    activeGames.delete(userId);
                    collector.stop();
                } else {
                    const displayWord = game.word.split('').map(l => game.guessed.includes(l) ? l : '_').join(' ');
                    await msg.reply(`❌ Wrong!\n\n${hangmanStages[game.wrongGuesses]}\n\n**Word:** ${displayWord}\n**Wrong:** ${wrongLetters}\n**Attempts left:** ${attemptsLeft}`);
                }
            }
        });

        collector.on('end', () => {
            if (activeGames.has(userId)) {
                interaction.followUp({ content: `⏰ Time's up! The word was: **${activeGames.get(userId).word}**` });
                activeGames.delete(userId);
            }
        });
    }
};
