const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'tictactoe',
    description: 'Challenge someone to Tic-Tac-Toe!',
    options: [
        {
            name: 'opponent',
            description: 'The user to challenge',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'bet',
            description: 'Amount to bet (optional)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 10,
        }
    ],

    callback: async (client, interaction) => {
        const opponent = interaction.options.getUser('opponent');
        const bet = interaction.options.getInteger('bet') || 0;
        const challenger = interaction.user;

        // Validation
        if (opponent.id === challenger.id) {
            return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });
        }

        if (opponent.bot) {
            return interaction.reply({ content: "You can't play against a bot!", ephemeral: true });
        }

        // Check balances if betting
        if (bet > 0) {
            const challengerBalance = await economy.getBalance(challenger.id);
            const opponentBalance = await economy.getBalance(opponent.id);

            if (challengerBalance < bet) {
                return interaction.reply({ 
                    content: `You don't have enough money! Your balance is $${challengerBalance}.`, 
                    ephemeral: true 
                });
            }

            if (opponentBalance < bet) {
                return interaction.reply({ 
                    content: `${opponent.username} doesn't have enough money! They need $${bet}.`, 
                    ephemeral: true 
                });
            }
        }

        // Game state
        const board = Array(9).fill(null);
        let currentPlayer = challenger.id;
        let gameOver = false;
        let accepted = false;

        const symbols = {
            [challenger.id]: '❌',
            [opponent.id]: '⭕'
        };

        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        const checkWinner = () => {
            for (const pattern of winPatterns) {
                const [a, b, c] = pattern;
                if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                    return board[a];
                }
            }
            return null;
        };

        const checkDraw = () => {
            return board.every(cell => cell !== null);
        };

        const createEmbed = (status = 'waiting') => {
            let color, description;

            switch (status) {
                case 'waiting':
                    color = 0xFFAA00;
                    description = `${opponent}, you've been challenged to Tic-Tac-Toe by ${challenger}!\n\n${bet > 0 ? `💰 **Bet: $${bet}**\n\n` : ''}Click **Accept** to play or **Decline** to reject.`;
                    break;
                case 'playing':
                    color = 0x3498DB;
                    const currentSymbol = symbols[currentPlayer];
                    const currentName = currentPlayer === challenger.id ? challenger.username : opponent.username;
                    description = `${currentSymbol} **${currentName}'s turn**${bet > 0 ? `\n\n💰 Pot: $${bet * 2}` : ''}`;
                    break;
                case 'win':
                    color = 0x00FF00;
                    const winner = currentPlayer;
                    const winnerName = winner === challenger.id ? challenger.username : opponent.username;
                    description = `🎉 **${winnerName} wins!**${bet > 0 ? `\n\n💰 Won **$${bet * 2}**!` : ''}`;
                    break;
                case 'draw':
                    color = 0x808080;
                    description = `🤝 **It's a draw!**${bet > 0 ? '\n\n💰 Bets returned.' : ''}`;
                    break;
                case 'declined':
                    color = 0xFF0000;
                    description = `❌ ${opponent.username} declined the challenge.`;
                    break;
                case 'timeout':
                    color = 0x808080;
                    description = '⏰ Challenge expired.';
                    break;
            }

            return new EmbedBuilder()
                .setTitle('⭕ Tic-Tac-Toe ❌')
                .setColor(color)
                .setDescription(description)
                .addFields({
                    name: `${challenger.username} (❌) vs ${opponent.username} (⭕)`,
                    value: '\u200B',
                    inline: false
                });
        };

        const createBoardButtons = () => {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 3; j++) {
                    const idx = i * 3 + j;
                    const cell = board[idx];
                    
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ttt_${idx}`)
                            .setLabel(cell || '⬜')
                            .setStyle(cell === '❌' ? ButtonStyle.Danger : cell === '⭕' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(cell !== null || gameOver)
                    );
                }
                rows.push(row);
            }
            return rows;
        };

        const createAcceptButtons = () => {
            return [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ttt_accept')
                        .setLabel('Accept')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('ttt_decline')
                        .setLabel('Decline')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                )];
        };

        await interaction.reply({
            embeds: [createEmbed('waiting')],
            components: createAcceptButtons()
        });

        const reply = await interaction.fetchReply();

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            // Accept/Decline phase
            if (!accepted) {
                if (i.customId === 'ttt_accept') {
                    if (i.user.id !== opponent.id) {
                        return i.reply({ content: "Only the challenged player can accept!", ephemeral: true });
                    }

                    accepted = true;

                    // Take bets
                    if (bet > 0) {
                        await economy.removeBalance(challenger.id, bet);
                        await economy.removeBalance(opponent.id, bet);
                    }

                    await i.update({
                        embeds: [createEmbed('playing')],
                        components: createBoardButtons()
                    });
                    return;
                }

                if (i.customId === 'ttt_decline') {
                    if (i.user.id !== opponent.id) {
                        return i.reply({ content: "Only the challenged player can decline!", ephemeral: true });
                    }

                    gameOver = true;
                    await i.update({
                        embeds: [createEmbed('declined')],
                        components: []
                    });
                    collector.stop('declined');
                    return;
                }
            }

            // Game phase
            if (i.customId.startsWith('ttt_')) {
                if (i.user.id !== currentPlayer) {
                    return i.reply({ content: "It's not your turn!", ephemeral: true });
                }

                const idx = parseInt(i.customId.split('_')[1]);

                if (board[idx] !== null) {
                    return i.reply({ content: "That cell is already taken!", ephemeral: true });
                }

                board[idx] = symbols[currentPlayer];

                // Check for winner
                const winner = checkWinner();
                if (winner) {
                    gameOver = true;
                    
                    // Pay winner
                    if (bet > 0) {
                        await economy.addBalance(currentPlayer, bet * 2);
                    }

                    await i.update({
                        embeds: [createEmbed('win')],
                        components: createBoardButtons()
                    });
                    collector.stop('win');
                    return;
                }

                // Check for draw
                if (checkDraw()) {
                    gameOver = true;

                    // Return bets
                    if (bet > 0) {
                        await economy.addBalance(challenger.id, bet);
                        await economy.addBalance(opponent.id, bet);
                    }

                    await i.update({
                        embeds: [createEmbed('draw')],
                        components: createBoardButtons()
                    });
                    collector.stop('draw');
                    return;
                }

                // Switch turns
                currentPlayer = currentPlayer === challenger.id ? opponent.id : challenger.id;

                await i.update({
                    embeds: [createEmbed('playing')],
                    components: createBoardButtons()
                });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                gameOver = true;

                // Return bets if game was accepted but timed out
                if (accepted && bet > 0) {
                    await economy.addBalance(challenger.id, bet);
                    await economy.addBalance(opponent.id, bet);
                }

                try {
                    await interaction.editReply({
                        embeds: [createEmbed('timeout')],
                        components: []
                    });
                } catch (e) {
                    // Interaction may have expired
                }
            }
        });
    }
};
