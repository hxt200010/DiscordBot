const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'tictactoe',
    description: 'Challenge someone to Tic-Tac-Toe! Leave opponent empty to play against the bot.',
    options: [
        {
            name: 'opponent',
            description: 'The user to challenge (leave empty to play against bot)',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
        {
            name: 'bet',
            description: 'Amount to bet (optional, PvP only)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 10,
        }
    ],

    callback: async (client, interaction) => {
        const opponent = interaction.options.getUser('opponent');
        const challenger = interaction.user;
        
        // Check if playing against bot
        const isVsBot = !opponent;
        const botId = 'BOT_PLAYER';
        const actualOpponent = isVsBot ? { id: botId, username: '🤖 Bot', toString: () => '🤖 Bot' } : opponent;
        
        // Betting only allowed in PvP
        const bet = isVsBot ? 0 : (interaction.options.getInteger('bet') || 0);

        // Validation
        if (!isVsBot) {
            if (opponent.id === challenger.id) {
                return interaction.reply({ content: "You can't play against yourself!", ephemeral: true });
            }

            if (opponent.bot) {
                return interaction.reply({ content: "You can't play against Discord bots! Use the command without an opponent to play against the game bot.", ephemeral: true });
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
        }

        // Game state
        const board = Array(9).fill(null);
        let currentPlayer = challenger.id;
        let gameOver = false;
        let accepted = isVsBot; // Auto-accept for bot games

        const symbols = {
            [challenger.id]: '❌',
            [actualOpponent.id]: '⭕'
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

        // Minimax AI for bot moves
        const minimax = (boardState, depth, isMaximizing, alpha, beta) => {
            // Check terminal states
            for (const pattern of winPatterns) {
                const [a, b, c] = pattern;
                if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
                    return boardState[a] === '⭕' ? 10 - depth : depth - 10;
                }
            }
            
            if (boardState.every(cell => cell !== null)) {
                return 0; // Draw
            }

            if (isMaximizing) {
                let maxEval = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (boardState[i] === null) {
                        boardState[i] = '⭕';
                        const evalScore = minimax(boardState, depth + 1, false, alpha, beta);
                        boardState[i] = null;
                        maxEval = Math.max(maxEval, evalScore);
                        alpha = Math.max(alpha, evalScore);
                        if (beta <= alpha) break;
                    }
                }
                return maxEval;
            } else {
                let minEval = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (boardState[i] === null) {
                        boardState[i] = '❌';
                        const evalScore = minimax(boardState, depth + 1, true, alpha, beta);
                        boardState[i] = null;
                        minEval = Math.min(minEval, evalScore);
                        beta = Math.min(beta, evalScore);
                        if (beta <= alpha) break;
                    }
                }
                return minEval;
            }
        };

        const getBotMove = () => {
            let bestMove = -1;
            let bestScore = -Infinity;
            
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = '⭕';
                    const score = minimax(board, 0, false, -Infinity, Infinity);
                    board[i] = null;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = i;
                    }
                }
            }
            
            return bestMove;
        };

        const createEmbed = (status = 'waiting') => {
            let color, description;

            switch (status) {
                case 'waiting':
                    color = 0xFFAA00;
                    description = `${actualOpponent}, you've been challenged to Tic-Tac-Toe by ${challenger}!\n\n${bet > 0 ? `💰 **Bet: $${bet}**\n\n` : ''}Click **Accept** to play or **Decline** to reject.`;
                    break;
                case 'playing':
                    color = 0x3498DB;
                    const currentSymbol = symbols[currentPlayer];
                    const currentName = currentPlayer === challenger.id ? challenger.username : actualOpponent.username;
                    description = `${currentSymbol} **${currentName}'s turn**${bet > 0 ? `\n\n💰 Pot: $${bet * 2}` : ''}`;
                    break;
                case 'win':
                    color = 0x00FF00;
                    const winner = currentPlayer;
                    const winnerName = winner === challenger.id ? challenger.username : actualOpponent.username;
                    description = `🎉 **${winnerName} wins!**${bet > 0 ? `\n\n💰 Won **$${bet * 2}**!` : ''}`;
                    break;
                case 'draw':
                    color = 0x808080;
                    description = `🤝 **It's a draw!**${bet > 0 ? '\n\n💰 Bets returned.' : ''}`;
                    break;
                case 'declined':
                    color = 0xFF0000;
                    description = `❌ ${actualOpponent.username} declined the challenge.`;
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
                    name: `${challenger.username} (❌) vs ${actualOpponent.username} (⭕)`,
                    value: isVsBot ? '🤖 *Playing against AI*' : '\u200B',
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

        // For bot games, start immediately. For PvP, show accept/decline buttons
        if (isVsBot) {
            await interaction.reply({
                embeds: [createEmbed('playing')],
                components: createBoardButtons()
            });
        } else {
            await interaction.reply({
                embeds: [createEmbed('waiting')],
                components: createAcceptButtons()
            });
        }

        const reply = await interaction.fetchReply();

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        // Helper function to make bot move
        const makeBotMove = async (updateInteraction) => {
            if (gameOver || currentPlayer !== botId) return;

            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            const botMoveIdx = getBotMove();
            if (botMoveIdx === -1) return;

            board[botMoveIdx] = symbols[botId];

            // Check for bot winner
            const winner = checkWinner();
            if (winner) {
                gameOver = true;
                currentPlayer = botId; // Set current player to bot for win message
                await updateInteraction.editReply({
                    embeds: [createEmbed('win')],
                    components: createBoardButtons()
                });
                collector.stop('win');
                return;
            }

            // Check for draw after bot move
            if (checkDraw()) {
                gameOver = true;
                await updateInteraction.editReply({
                    embeds: [createEmbed('draw')],
                    components: createBoardButtons()
                });
                collector.stop('draw');
                return;
            }

            // Switch back to player
            currentPlayer = challenger.id;
            await updateInteraction.editReply({
                embeds: [createEmbed('playing')],
                components: createBoardButtons()
            });
        };

        collector.on('collect', async (i) => {
            // Accept/Decline phase (only for PvP)
            if (!accepted) {
                if (i.customId === 'ttt_accept') {
                    if (i.user.id !== actualOpponent.id) {
                        return i.reply({ content: "Only the challenged player can accept!", ephemeral: true });
                    }

                    accepted = true;

                    // Take bets
                    if (bet > 0) {
                        await economy.removeBalance(challenger.id, bet);
                        await economy.removeBalance(actualOpponent.id, bet);
                    }

                    await i.update({
                        embeds: [createEmbed('playing')],
                        components: createBoardButtons()
                    });
                    return;
                }

                if (i.customId === 'ttt_decline') {
                    if (i.user.id !== actualOpponent.id) {
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
                // For bot games, only the challenger can play
                if (isVsBot && i.user.id !== challenger.id) {
                    return i.reply({ content: "This is a single-player game!", ephemeral: true });
                }

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
                    
                    // Pay winner (PvP only)
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

                    // Return bets (PvP only)
                    if (bet > 0) {
                        await economy.addBalance(challenger.id, bet);
                        await economy.addBalance(actualOpponent.id, bet);
                    }

                    await i.update({
                        embeds: [createEmbed('draw')],
                        components: createBoardButtons()
                    });
                    collector.stop('draw');
                    return;
                }

                // Switch turns
                currentPlayer = currentPlayer === challenger.id ? actualOpponent.id : challenger.id;

                await i.update({
                    embeds: [createEmbed('playing')],
                    components: createBoardButtons()
                });

                // If playing against bot, make bot move
                if (isVsBot && currentPlayer === botId && !gameOver) {
                    await makeBotMove(interaction);
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                gameOver = true;

                // Return bets if game was accepted but timed out (PvP only)
                if (accepted && bet > 0) {
                    await economy.addBalance(challenger.id, bet);
                    await economy.addBalance(actualOpponent.id, bet);
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
