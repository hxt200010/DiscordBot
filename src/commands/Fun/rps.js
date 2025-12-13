const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

// Track win streaks per user
const winStreaks = new Map();

module.exports = {
    name: 'rps',
    description: 'Play Rock Paper Scissors with betting!',
    options: [
        {
            name: 'bet',
            description: 'Amount to bet',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 10,
        }
    ],

    callback: async (client, interaction) => {
        const bet = interaction.options.getInteger('bet');
        const userId = interaction.user.id;

        const balance = await economy.getBalance(userId);
        if (balance < bet) {
            return interaction.reply({ 
                content: `You don't have enough money! Your balance is $${balance.toLocaleString()}.`, 
                ephemeral: true 
            });
        }

        await economy.removeBalance(userId, bet);

        const choices = [
            { name: 'Rock', emoji: '🪨' },
            { name: 'Paper', emoji: '📄' },
            { name: 'Scissors', emoji: '✂️' }
        ];

        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('rps_rock')
                    .setLabel('Rock')
                    .setEmoji('🪨')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('rps_paper')
                    .setLabel('Paper')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('rps_scissors')
                    .setLabel('Scissors')
                    .setEmoji('✂️')
                    .setStyle(ButtonStyle.Danger)
            );

        const currentStreak = winStreaks.get(userId) || 0;
        let streakBonus = '';
        if (currentStreak >= 5) {
            streakBonus = `\n🔥 **Win Streak: ${currentStreak}** (2x bonus active!)`;
        } else if (currentStreak >= 3) {
            streakBonus = `\n🔥 **Win Streak: ${currentStreak}** (1.5x bonus active!)`;
        } else if (currentStreak > 0) {
            streakBonus = `\n🔥 **Win Streak: ${currentStreak}**`;
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle('🎮  Rock Paper Scissors  🎮')
            .setColor(0x5865F2)
            .setDescription(`**Bet:** $${bet.toLocaleString()}${streakBonus}\n\nChoose your weapon!`)
            .setFooter({ text: `${interaction.user.username} is playing` })
            .setTimestamp();

        const reply = await interaction.reply({
            embeds: [initialEmbed],
            components: [row],
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000,
            max: 1
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            const playerChoice = i.customId.split('_')[1];
            const playerData = choices.find(c => c.name.toLowerCase() === playerChoice);
            
            // Bot makes its choice
            const botData = choices[Math.floor(Math.random() * choices.length)];

            // Show countdown animation
            const countdownEmbed = new EmbedBuilder()
                .setTitle('🎮  Rock Paper Scissors  🎮')
                .setColor(0xFFAA00)
                .setDescription('**3... 2... 1...**')
                .addFields(
                    { name: 'You', value: '❓', inline: true },
                    { name: 'VS', value: '⚔️', inline: true },
                    { name: 'Bot', value: '❓', inline: true }
                );

            await i.update({ embeds: [countdownEmbed], components: [] });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Determine winner
            let result, winAmount = 0, color;
            const playerIndex = choices.findIndex(c => c.name === playerData.name);
            const botIndex = choices.findIndex(c => c.name === botData.name);

            if (playerIndex === botIndex) {
                result = '🤝 **TIE!**';
                winAmount = bet; // Return bet
                color = 0xFFAA00;
                // Keep streak on tie
            } else if (
                (playerIndex === 0 && botIndex === 2) || // Rock beats Scissors
                (playerIndex === 1 && botIndex === 0) || // Paper beats Rock
                (playerIndex === 2 && botIndex === 1)    // Scissors beats Paper
            ) {
                // Calculate multiplier based on streak
                let multiplier = 2;
                const streak = winStreaks.get(userId) || 0;
                if (streak >= 5) multiplier = 2 * 2; // 4x total
                else if (streak >= 3) multiplier = 2 * 1.5; // 3x total

                winAmount = Math.floor(bet * multiplier);
                result = `🎉 **YOU WIN!**`;
                color = 0x00FF00;
                
                // Increase streak
                winStreaks.set(userId, streak + 1);
            } else {
                result = '💀 **YOU LOSE!**';
                winAmount = 0;
                color = 0xFF0000;
                
                // Reset streak
                winStreaks.set(userId, 0);
            }

            if (winAmount > 0) {
                await economy.addBalance(userId, winAmount);
            }

            const newBalance = await economy.getBalance(userId);
            const netGain = winAmount - bet;
            const newStreak = winStreaks.get(userId) || 0;

            let streakText = '';
            if (newStreak >= 5) {
                streakText = `\n\n🔥 **Streak: ${newStreak}** - Next win: 4x payout!`;
            } else if (newStreak >= 3) {
                streakText = `\n\n🔥 **Streak: ${newStreak}** - Next win: 3x payout!`;
            } else if (newStreak > 0) {
                streakText = `\n\n🔥 **Streak: ${newStreak}** - ${3 - newStreak} more for bonus!`;
            }

            const finalEmbed = new EmbedBuilder()
                .setTitle('🎮  Rock Paper Scissors  🎮')
                .setColor(color)
                .setDescription(result + streakText)
                .addFields(
                    { name: 'You', value: `${playerData.emoji}\n${playerData.name}`, inline: true },
                    { name: 'VS', value: '⚔️', inline: true },
                    { name: 'Bot', value: `${botData.emoji}\n${botData.name}`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: '💰 Bet', value: `$${bet.toLocaleString()}`, inline: true },
                    { name: winAmount > 0 ? '🏆 Won' : '❌ Lost', value: winAmount > 0 ? `$${winAmount.toLocaleString()}` : `$${bet.toLocaleString()}`, inline: true },
                    { name: '📊 Net', value: `${netGain >= 0 ? '+' : ''}$${netGain.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: `Balance: $${newBalance.toLocaleString()}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [finalEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                // Refund if timed out
                await economy.addBalance(userId, bet);
                
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('🎮  Rock Paper Scissors  🎮')
                    .setColor(0x808080)
                    .setDescription('⏰ **Time\'s up!** Your bet has been refunded.')
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        row.components.map(btn => 
                            ButtonBuilder.from(btn).setDisabled(true)
                        )
                    );

                await interaction.editReply({ 
                    embeds: [timeoutEmbed], 
                    components: [disabledRow] 
                });
            }
        });
    }
};
