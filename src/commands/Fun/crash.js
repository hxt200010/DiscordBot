const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'crash',
    description: 'Play Crash! Cash out before the multiplier crashes!',
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
                content: `You don't have enough money! Your balance is $${balance}.`, 
                ephemeral: true 
            });
        }

        await economy.removeBalance(userId, bet);
        await interaction.deferReply();

        // Generate crash point (house edge ~5%)
        // Using exponential distribution with 95% RTP
        const generateCrashPoint = () => {
            const e = 2.718281828;
            const houseEdge = 0.05;
            const r = Math.random();
            
            // Instant crash ~5% of the time
            if (r < houseEdge) return 1.00;
            
            // Exponential distribution for the rest
            const crash = Math.floor(100 * (0.95 / (1 - r))) / 100;
            return Math.min(crash, 100); // Cap at 100x
        };

        const crashPoint = generateCrashPoint();
        let currentMultiplier = 1.00;
        let cashedOut = false;
        let gameOver = false;

        const createEmbed = (crashed = false, cashOutMultiplier = 0) => {
            let color = 0x2F3136;
            let status = '📈 **RISING...**';
            
            if (crashed) {
                color = 0xFF0000;
                status = '💥 **CRASHED!**';
            } else if (cashedOut) {
                color = 0x00FF00;
                status = '💰 **CASHED OUT!**';
            }

            const multiplierDisplay = crashed ? crashPoint.toFixed(2) : currentMultiplier.toFixed(2);
            
            // Create visual multiplier bar
            const barLength = 20;
            const filled = Math.min(Math.floor((currentMultiplier - 1) * 5), barLength);
            const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

            const embed = new EmbedBuilder()
                .setTitle('💥  CRASH  💥')
                .setColor(color)
                .setDescription(`${status}\n\n# ${multiplierDisplay}x\n\n\`[${bar}]\``)
                .addFields(
                    { name: '💵 Bet', value: `$${bet}`, inline: true },
                    { name: '🎯 Potential Win', value: `$${Math.floor(bet * currentMultiplier)}`, inline: true }
                );

            if (crashed && !cashedOut) {
                embed.addFields({ 
                    name: '❌ Result', 
                    value: `You lost **$${bet}**`, 
                    inline: false 
                });
            } else if (cashedOut) {
                const winAmount = Math.floor(bet * cashOutMultiplier);
                embed.addFields({ 
                    name: '✅ Result', 
                    value: `You won **$${winAmount}** at **${cashOutMultiplier.toFixed(2)}x**!`, 
                    inline: false 
                });
            }

            return embed;
        };

        const cashOutButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cashout')
                    .setLabel(`Cash Out ($${Math.floor(bet * currentMultiplier)})`)
                    .setEmoji('💰')
                    .setStyle(ButtonStyle.Success)
            );

        const disabledButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cashout')
                    .setLabel('Game Over')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        const reply = await interaction.editReply({
            embeds: [createEmbed()],
            components: [cashOutButton],
            fetchReply: true
        });

        // Create button collector
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            if (i.customId === 'cashout' && !gameOver) {
                cashedOut = true;
                gameOver = true;
                
                const winAmount = Math.floor(bet * currentMultiplier);
                await economy.addBalance(userId, winAmount);
                
                await i.update({
                    embeds: [createEmbed(false, currentMultiplier)],
                    components: [disabledButton]
                });
                
                collector.stop('cashout');
            }
        });

        // Multiplier increase loop
        const increaseMultiplier = async () => {
            const increaseSpeed = 50; // ms between updates
            
            while (!gameOver && currentMultiplier < crashPoint) {
                await new Promise(resolve => setTimeout(resolve, increaseSpeed));
                
                if (gameOver) break;
                
                // Increase multiplier (faster as it gets higher)
                const increase = 0.01 + (currentMultiplier * 0.005);
                currentMultiplier = Math.min(currentMultiplier + increase, crashPoint);
                
                // Update button label
                const updatedButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('cashout')
                            .setLabel(`Cash Out ($${Math.floor(bet * currentMultiplier)})`)
                            .setEmoji('💰')
                            .setStyle(ButtonStyle.Success)
                    );

                try {
                    await interaction.editReply({
                        embeds: [createEmbed()],
                        components: [updatedButton]
                    });
                } catch (e) {
                    // Interaction may have expired
                    break;
                }
            }

            // If not cashed out, crash
            if (!cashedOut) {
                gameOver = true;
                
                try {
                    await interaction.editReply({
                        embeds: [createEmbed(true)],
                        components: [disabledButton]
                    });
                } catch (e) {
                    // Interaction expired
                }
            }
            
            collector.stop('ended');
        };

        // Start the multiplier increase
        increaseMultiplier();

        collector.on('end', (collected, reason) => {
            gameOver = true;
        });
    }
};
