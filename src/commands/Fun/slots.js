const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'slots',
    description: 'Spin the slot machine and try your luck!',
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

        // Slot symbols with their weights and multipliers
        const symbols = [
            { emoji: '🍒', name: 'Cherry', weight: 30, multiplier: 2 },
            { emoji: '🍋', name: 'Lemon', weight: 25, multiplier: 2.5 },
            { emoji: '🍊', name: 'Orange', weight: 20, multiplier: 3 },
            { emoji: '🍇', name: 'Grapes', weight: 15, multiplier: 4 },
            { emoji: '🔔', name: 'Bell', weight: 7, multiplier: 8 },
            { emoji: '💎', name: 'Diamond', weight: 2, multiplier: 15 },
            { emoji: '7️⃣', name: 'Seven', weight: 1, multiplier: 50 },
        ];

        // Weighted random selection
        const spinReel = () => {
            const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const symbol of symbols) {
                random -= symbol.weight;
                if (random <= 0) return symbol;
            }
            return symbols[0];
        };

        // Spin animation frames
        const animationFrames = ['🎰', '❓', '⭐', '✨'];
        
        // Create initial spinning embed
        const createSpinEmbed = (reel1, reel2, reel3, spinning = true) => {
            const embed = new EmbedBuilder()
                .setTitle('🎰  SLOT MACHINE  🎰')
                .setColor(spinning ? 0xFFAA00 : 0x2F3136)
                .setDescription(spinning ? '**Spinning...**' : '')
                .addFields({
                    name: '╔════════════════╗',
                    value: `║  ${reel1}  │  ${reel2}  │  ${reel3}  ║\n╚════════════════╝`,
                    inline: false
                })
                .setFooter({ text: `Bet: $${bet}` });
            
            return embed;
        };

        // Spin the reels
        const results = [spinReel(), spinReel(), spinReel()];
        
        // Show spinning animation
        let spinEmbed = createSpinEmbed(
            animationFrames[Math.floor(Math.random() * animationFrames.length)],
            animationFrames[Math.floor(Math.random() * animationFrames.length)],
            animationFrames[Math.floor(Math.random() * animationFrames.length)]
        );
        
        const message = await interaction.editReply({ embeds: [spinEmbed] });

        // Animate the spin
        await new Promise(resolve => setTimeout(resolve, 500));
        
        spinEmbed = createSpinEmbed(
            results[0].emoji,
            animationFrames[Math.floor(Math.random() * animationFrames.length)],
            animationFrames[Math.floor(Math.random() * animationFrames.length)]
        );
        await interaction.editReply({ embeds: [spinEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        spinEmbed = createSpinEmbed(
            results[0].emoji,
            results[1].emoji,
            animationFrames[Math.floor(Math.random() * animationFrames.length)]
        );
        await interaction.editReply({ embeds: [spinEmbed] });
        
        await new Promise(resolve => setTimeout(resolve, 500));

        // Calculate winnings
        let winAmount = 0;
        let resultMessage = '';
        let color = 0xFF0000; // Red for loss

        // Three of a kind
        if (results[0].emoji === results[1].emoji && results[1].emoji === results[2].emoji) {
            winAmount = Math.floor(bet * results[0].multiplier);
            resultMessage = `🎉 **JACKPOT!** Three ${results[0].name}s!`;
            color = 0xFFD700; // Gold
        }
        // Two of a kind
        else if (results[0].emoji === results[1].emoji || 
                 results[1].emoji === results[2].emoji || 
                 results[0].emoji === results[2].emoji) {
            let matchedSymbol;
            if (results[0].emoji === results[1].emoji) matchedSymbol = results[0];
            else if (results[1].emoji === results[2].emoji) matchedSymbol = results[1];
            else matchedSymbol = results[0];
            
            winAmount = Math.floor(bet * (matchedSymbol.multiplier / 2));
            resultMessage = `✨ **Nice!** Two ${matchedSymbol.name}s!`;
            color = 0x00FF00; // Green
        }
        // Special: Cherry in first position always pays
        else if (results[0].emoji === '🍒') {
            winAmount = Math.floor(bet * 1.2);
            resultMessage = `🍒 **Cherry!** First reel cherry bonus!`;
            color = 0x00AA00;
        }
        else {
            resultMessage = '💨 **No match.** Better luck next time!';
        }

        if (winAmount > 0) {
            await economy.addBalance(userId, winAmount);
        }

        const newBalance = await economy.getBalance(userId);
        const netGain = winAmount - bet;

        // Final result embed
        const finalEmbed = new EmbedBuilder()
            .setTitle('🎰  SLOT MACHINE  🎰')
            .setColor(color)
            .setDescription(resultMessage)
            .addFields(
                {
                    name: '╔════════════════╗',
                    value: `║  ${results[0].emoji}  │  ${results[1].emoji}  │  ${results[2].emoji}  ║\n╚════════════════╝`,
                    inline: false
                },
                { name: '\u200B', value: '\u200B' },
                { name: '💰 Bet', value: `$${bet}`, inline: true },
                { name: winAmount > 0 ? '🏆 Won' : '❌ Lost', value: winAmount > 0 ? `$${winAmount}` : `$${bet}`, inline: true },
                { name: '📊 Net', value: `${netGain >= 0 ? '+' : ''}$${netGain}`, inline: true }
            )
            .setFooter({ text: `Balance: $${newBalance.toLocaleString()}` })
            .setTimestamp();

        // Add paytable hint
        if (winAmount === 0) {
            finalEmbed.addFields({
                name: '💡 Paytable',
                value: '`3x 7️⃣ = 50x` │ `3x 💎 = 15x` │ `3x 🔔 = 8x`',
                inline: false
            });
        }

        await interaction.editReply({ embeds: [finalEmbed] });
    }
};
