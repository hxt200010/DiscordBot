const { Client, Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

function generateMiniSudoku() {
    // Generate a simple 4x4 sudoku
    const solutions = [
        [[1,2,3,4],[3,4,1,2],[2,3,4,1],[4,1,2,3]],
        [[2,1,4,3],[4,3,2,1],[1,4,3,2],[3,2,1,4]],
        [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]],
        [[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]],
        [[1,3,2,4],[2,4,3,1],[4,2,1,3],[3,1,4,2]]
    ];
    
    const solution = solutions[Math.floor(Math.random() * solutions.length)];
    const puzzle = solution.map(row => [...row]);
    
    // Remove 6-8 numbers
    const cellsToRemove = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cellsToRemove; i++) {
        const row = Math.floor(Math.random() * 4);
        const col = Math.floor(Math.random() * 4);
        puzzle[row][col] = 0;
    }
    
    return { puzzle, solution };
}

function formatSudoku(grid) {
    let output = '```\n';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            output += grid[i][j] === 0 ? '_ ' : grid[i][j] + ' ';
            if (j === 1) output += '| ';
        }
        output += '\n';
        if (i === 1) output += '------+------\n';
    }
    output += '```';
    return output;
}

const activeGames = new Map();

module.exports = {
    name: 'sudoku',
    description: 'Solve a 4x4 mini sudoku puzzle!',
    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;

        if (activeGames.has(userId)) {
            return interaction.reply({ content: "🔢 You already have an active sudoku! Finish it first.", ephemeral: true });
        }

        const { puzzle, solution } = generateMiniSudoku();

        const embed = new EmbedBuilder()
            .setTitle('🔢 Mini Sudoku Challenge')
            .setDescription(`Fill in the missing numbers (1-4):\n${formatSudoku(puzzle)}`)
            .setColor('#3498DB')
            .addFields(
                { name: 'Rules', value: 'Each row, column, and 2x2 box must contain 1, 2, 3, 4', inline: false },
                { name: 'How to Answer', value: 'Type your answer as: `row col number` (e.g., `1 2 3`)', inline: false }
            )
            .setFooter({ text: 'You have 3 minutes to solve it!' });

        await interaction.reply({ embeds: [embed] });

        activeGames.set(userId, {
            puzzle: puzzle.map(row => [...row]),
            solution: solution,
            startTime: Date.now()
        });

        const filter = (m) => m.author.id === userId;
        const collector = interaction.channel.createMessageCollector({ filter, time: 180000 });

        collector.on('collect', async (msg) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const input = msg.content.trim().toLowerCase();
            
            if (input === 'solve' || input === 'show') {
                await msg.reply(`Here's the current state:\n${formatSudoku(game.puzzle)}`);
                return;
            }

            const parts = input.split(/\s+/);
            if (parts.length === 3) {
                const row = parseInt(parts[0]) - 1;
                const col = parseInt(parts[1]) - 1;
                const num = parseInt(parts[2]);

                if (row >= 0 && row < 4 && col >= 0 && col < 4 && num >= 1 && num <= 4) {
                    game.puzzle[row][col] = num;
                    
                    // Check if solved
                    const isSolved = game.puzzle.every((row, i) => 
                        row.every((cell, j) => cell === game.solution[i][j])
                    );

                    if (isSolved) {
                        const reward = 100;
                        economySystem.addBalance(userId, reward);
                        
                        await msg.reply(`✅ **Solved!** You earned **$${reward}**! Your balance: **$${economySystem.getBalance(userId)}**`);
                        activeGames.delete(userId);
                        collector.stop();
                    } else {
                        await msg.reply(`Updated!\n${formatSudoku(game.puzzle)}`);
                    }
                } else {
                    await msg.reply('❌ Invalid input! Use format: `row col number` (1-4 for each)');
                }
            } else {
                await msg.reply('❌ Invalid format! Use: `row col number` (e.g., `1 2 3`)');
            }
        });

        collector.on('end', () => {
            if (activeGames.has(userId)) {
                interaction.followUp({ content: `⏰ Time's up! Here was the solution:\n${formatSudoku(activeGames.get(userId).solution)}` });
                activeGames.delete(userId);
            }
        });
    }
};
