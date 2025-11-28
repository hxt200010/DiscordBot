const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

const messages = [
    "hello world",
    "discord bot",
    "puzzle game",
    "secret code",
    "crypto fun",
    "brain teaser",
    "logic puzzle",
    "code breaker"
];

function caesarCipher(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const base = code >= 65 && code <= 90 ? 65 : 97;
            return String.fromCharCode(((code - base + shift) % 26) + base);
        }
        return char;
    }).join('');
}

const activeGames = new Map();

module.exports = {
    name: 'cipher',
    description: 'Decrypt a Caesar cipher message!',
    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;

        if (activeGames.has(userId)) {
            return interaction.reply({ content: "🔐 You already have an active cipher! Finish it first.", ephemeral: true });
        }

        const message = messages[Math.floor(Math.random() * messages.length)];
        const shift = Math.floor(Math.random() * 25) + 1; // 1-25
        const encrypted = caesarCipher(message, shift);

        const embed = new EmbedBuilder()
            .setTitle('🔐 Caesar Cipher Challenge')
            .setDescription(`Decrypt this message:\n\`\`\`${encrypted}\`\`\``)
            .setColor('#E74C3C')
            .addFields(
                { name: 'Hint', value: 'This is a Caesar cipher (letter shift)', inline: false },
                { name: 'Attempts', value: '3 tries remaining', inline: false }
            )
            .setFooter({ text: 'Type your answer in chat! (You have 90 seconds)' });

        await interaction.reply({ embeds: [embed] });

        activeGames.set(userId, {
            answer: message.toLowerCase(),
            attempts: 3,
            encrypted: encrypted
        });

        const filter = (m) => m.author.id === userId;
        const collector = interaction.channel.createMessageCollector({ filter, time: 90000 });

        collector.on('collect', async (msg) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const userAnswer = msg.content.toLowerCase().trim();

            if (userAnswer === game.answer) {
                const reward = 75;
                economySystem.addBalance(userId, reward);
                
                await msg.reply(`✅ **Decrypted!** You earned **$${reward}**! Your balance: **$${economySystem.getBalance(userId)}**`);
                activeGames.delete(userId);
                collector.stop();
            } else {
                game.attempts--;
                
                if (game.attempts > 0) {
                    await msg.reply(`❌ Wrong! You have **${game.attempts}** ${game.attempts === 1 ? 'try' : 'tries'} left.`);
                } else {
                    await msg.reply(`💀 Out of attempts! The answer was: **${game.answer}**`);
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
