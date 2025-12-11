const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'guess',
    description: 'Guess the number between 1-100! Fewer tries = more coins!',
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

        const targetNumber = Math.floor(Math.random() * 100) + 1;
        let attempts = 0;
        let lowBound = 1;
        let highBound = 100;
        let gameOver = false;

        // Multipliers based on attempts
        const getMultiplier = (tries) => {
            if (tries === 1) return 10;   // Perfect guess!
            if (tries === 2) return 5;
            if (tries === 3) return 3;
            if (tries === 4) return 2;
            if (tries === 5) return 1.5;
            if (tries === 6) return 1;
            if (tries === 7) return 0.5;
            return 0; // 8+ tries = lose
        };

        const createEmbed = (lastGuess = null, hint = '', won = false, lost = false) => {
            let color = 0x3498DB; // Blue for playing
            if (won) color = 0x00FF00;
            if (lost) color = 0xFF0000;

            const embed = new EmbedBuilder()
                .setTitle('🔢  Number Guessing Game  🔢')
                .setColor(color)
                .setDescription(won 
                    ? `🎉 **Correct! The number was ${targetNumber}!**`
                    : lost 
                        ? `💀 **Game Over! The number was ${targetNumber}.**`
                        : `Guess a number between **${lowBound}** and **${highBound}**!`
                )
                .addFields(
                    { name: '🎯 Range', value: `${lowBound} - ${highBound}`, inline: true },
                    { name: '🔄 Attempts', value: `${attempts}/7`, inline: true },
                    { name: '💰 Bet', value: `$${bet}`, inline: true }
                );

            if (lastGuess !== null && !won) {
                embed.addFields({ name: '📊 Last Guess', value: `${lastGuess} - ${hint}`, inline: false });
            }

            if (!gameOver) {
                // Show potential winnings
                const nextMultiplier = getMultiplier(attempts + 1);
                embed.addFields({
                    name: '🏆 Win on Next Guess',
                    value: `$${Math.floor(bet * nextMultiplier)} (${nextMultiplier}x)`,
                    inline: false
                });
            } else if (won) {
                const winAmount = Math.floor(bet * getMultiplier(attempts));
                embed.addFields({
                    name: '🏆 Winnings',
                    value: `$${winAmount} (${attempts} ${attempts === 1 ? 'try' : 'tries'} = ${getMultiplier(attempts)}x)`,
                    inline: false
                });
            }

            return embed;
        };

        // Create number buttons (in ranges)
        const createButtons = () => {
            const range = highBound - lowBound;
            const rows = [];
            
            // Create 5 buttons evenly distributed across the range
            const step = Math.max(1, Math.floor(range / 4));
            const buttonValues = [];
            
            for (let i = 0; i < 5; i++) {
                const value = Math.min(lowBound + (step * i), highBound);
                if (!buttonValues.includes(value)) {
                    buttonValues.push(value);
                }
            }
            
            // Ensure highBound is included
            if (!buttonValues.includes(highBound)) {
                buttonValues.push(highBound);
            }

            const row1 = new ActionRowBuilder();
            const row2 = new ActionRowBuilder();

            buttonValues.slice(0, 5).forEach((val, idx) => {
                row1.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`guess_${val}`)
                        .setLabel(val.toString())
                        .setStyle(ButtonStyle.Primary)
                );
            });

            if (buttonValues.length > 5) {
                buttonValues.slice(5).forEach((val) => {
                    row2.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`guess_${val}`)
                            .setLabel(val.toString())
                            .setStyle(ButtonStyle.Primary)
                    );
                });
            }

            // Add custom guess button
            row2.addComponents(
                new ButtonBuilder()
                    .setCustomId('custom_guess')
                    .setLabel('Custom')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Secondary)
            );

            return row2.components.length > 0 ? [row1, row2] : [row1];
        };

        await interaction.reply({
            embeds: [createEmbed()],
            components: createButtons()
        });

        const reply = await interaction.fetchReply();

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        // Also collect messages for custom guesses
        const messageCollector = interaction.channel.createMessageCollector({
            filter: (m) => m.author.id === userId && !isNaN(parseInt(m.content)),
            time: 300000
        });

        const processGuess = async (guess, updateFn) => {
            if (guess < lowBound || guess > highBound) {
                return; // Invalid guess
            }

            attempts++;

            if (guess === targetNumber) {
                gameOver = true;
                const winAmount = Math.floor(bet * getMultiplier(attempts));
                await economy.addBalance(userId, winAmount);
                
                await updateFn({
                    embeds: [createEmbed(guess, '', true)],
                    components: []
                });
                collector.stop('won');
                messageCollector.stop('won');
            } else if (attempts >= 7) {
                gameOver = true;
                await updateFn({
                    embeds: [createEmbed(guess, guess < targetNumber ? '📈 Too Low' : '📉 Too High', false, true)],
                    components: []
                });
                collector.stop('lost');
                messageCollector.stop('lost');
            } else {
                if (guess < targetNumber) {
                    lowBound = Math.max(lowBound, guess + 1);
                } else {
                    highBound = Math.min(highBound, guess - 1);
                }
                
                await updateFn({
                    embeds: [createEmbed(guess, guess < targetNumber ? '📈 Too Low!' : '📉 Too High!')],
                    components: createButtons()
                });
            }
        };

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            if (i.customId === 'custom_guess') {
                await i.reply({ 
                    content: `Type a number between ${lowBound} and ${highBound}:`, 
                    ephemeral: true 
                });
                return;
            }

            const guess = parseInt(i.customId.split('_')[1]);
            await processGuess(guess, (data) => i.update(data));
        });

        messageCollector.on('collect', async (msg) => {
            if (gameOver) return;
            
            const guess = parseInt(msg.content);
            
            try {
                await msg.delete();
            } catch (e) {
                // May not have permissions
            }

            await processGuess(guess, (data) => interaction.editReply(data));
        });

        collector.on('end', (collected, reason) => {
            gameOver = true;
            messageCollector.stop();
            
            if (reason === 'time') {
                interaction.editReply({
                    content: '⏰ Game timed out! You lost your bet.',
                    components: []
                });
            }
        });
    }
};
