const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

module.exports = {
    name: 'reaction',
    description: 'Test your reaction speed! Click when the light turns green!',

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const entryFee = 20;

        const balance = await economy.getBalance(userId);
        if (balance < entryFee) {
            return interaction.reply({ 
                content: `You need $${entryFee} to play! Your balance is $${balance}.`, 
                ephemeral: true 
            });
        }

        await economy.removeBalance(userId, entryFee);

        const createEmbed = (state, reactionTime = 0) => {
            let color, title, description;

            switch (state) {
                case 'waiting':
                    color = 0xFF0000;
                    title = '🔴  WAIT...  🔴';
                    description = 'Wait for the light to turn **GREEN**!\n\n*Don\'t click too early!*';
                    break;
                case 'go':
                    color = 0x00FF00;
                    title = '🟢  GO! GO! GO!  🟢';
                    description = '# CLICK NOW!';
                    break;
                case 'early':
                    color = 0xFFAA00;
                    title = '⚠️  TOO EARLY!  ⚠️';
                    description = 'You clicked before the light turned green!\n\n**You lost your entry fee.**';
                    break;
                case 'timeout':
                    color = 0x808080;
                    title = '😴  TOO SLOW!  😴';
                    description = 'You didn\'t click in time!\n\n**You lost your entry fee.**';
                    break;
                case 'success':
                    color = reactionTime < 200 ? 0xFFD700 : reactionTime < 350 ? 0x00FF00 : reactionTime < 500 ? 0x00AA00 : 0x808080;
                    title = '⚡  REACTION TIME  ⚡';
                    
                    let rating, reward;
                    if (reactionTime < 150) {
                        rating = '🏆 **SUPERHUMAN!**';
                        reward = 200;
                    } else if (reactionTime < 200) {
                        rating = '🥇 **INCREDIBLE!**';
                        reward = 100;
                    } else if (reactionTime < 250) {
                        rating = '🥈 **EXCELLENT!**';
                        reward = 50;
                    } else if (reactionTime < 350) {
                        rating = '🥉 **GOOD!**';
                        reward = 25;
                    } else if (reactionTime < 500) {
                        rating = '👍 **AVERAGE**';
                        reward = 10;
                    } else {
                        rating = '🐢 **SLOW...**';
                        reward = 0;
                    }

                    description = `# ${reactionTime}ms\n\n${rating}${reward > 0 ? `\n\n💰 **You won $${reward}!**` : '\n\n*Too slow to win coins.*'}`;
                    break;
            }

            return new EmbedBuilder()
                .setTitle(title)
                .setColor(color)
                .setDescription(description)
                .setFooter({ text: `Entry Fee: $${entryFee}` });
        };

        const waitButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('react')
                    .setLabel('⬤')
                    .setStyle(ButtonStyle.Danger)
            );

        const goButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('react')
                    .setLabel('⬤')
                    .setStyle(ButtonStyle.Success)
            );

        const disabledButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('react')
                    .setLabel('Game Over')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        await interaction.reply({
            embeds: [createEmbed('waiting')],
            components: [waitButton]
        });

        const reply = await interaction.fetchReply();
        
        let gameState = 'waiting';
        let goTime = null;
        let clicked = false;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }

            if (clicked) return;
            clicked = true;

            if (gameState === 'waiting') {
                // Clicked too early!
                await i.update({
                    embeds: [createEmbed('early')],
                    components: [disabledButton]
                });
                collector.stop('early');
            } else if (gameState === 'go') {
                // Calculate reaction time
                const reactionTime = Date.now() - goTime;
                
                // Calculate reward
                let reward = 0;
                if (reactionTime < 150) reward = 200;
                else if (reactionTime < 200) reward = 100;
                else if (reactionTime < 250) reward = 50;
                else if (reactionTime < 350) reward = 25;
                else if (reactionTime < 500) reward = 10;

                if (reward > 0) {
                    await economy.addBalance(userId, reward);
                }

                await i.update({
                    embeds: [createEmbed('success', reactionTime)],
                    components: [disabledButton]
                });
                collector.stop('success');
            }
        });

        // Random delay before "GO!" (2-6 seconds)
        const delay = Math.floor(Math.random() * 4000) + 2000;
        
        setTimeout(async () => {
            if (clicked) return; // Already clicked early
            
            gameState = 'go';
            goTime = Date.now();
            
            try {
                await interaction.editReply({
                    embeds: [createEmbed('go')],
                    components: [goButton]
                });
            } catch (e) {
                // Interaction may have expired
            }

            // Timeout if they don't click within 2 seconds
            setTimeout(async () => {
                if (clicked) return;
                clicked = true;

                try {
                    await interaction.editReply({
                        embeds: [createEmbed('timeout')],
                        components: [disabledButton]
                    });
                } catch (e) {
                    // Interaction may have expired
                }
                collector.stop('timeout');
            }, 2000);

        }, delay);

        collector.on('end', (collected, reason) => {
            clicked = true;
        });
    }
};
