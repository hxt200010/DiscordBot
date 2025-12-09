const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const User = require('../../models/User');
const EconomySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'chaos-emeralds',
    description: 'View your Chaos Emerald collection and unlock Super Form!',
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;

        // Get or create user
        let user = await User.findOne({ userId });
        if (!user) {
            user = await User.create({ userId });
        }

        // Check inventory for Chaos Emerald Shards
        const inventory = await EconomySystem.getInventory(userId);
        const shards = inventory.filter(i => i.name === 'Chaos Emerald Shard').length;

        const currentEmeralds = user.chaosEmeralds || 0;
        const totalShards = currentEmeralds + shards;
        const hasSuperForm = user.hasSuperForm || false;

        // Create visual representation
        const emeraldEmojis = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪'];
        let emeraldDisplay = '';

        for (let i = 0; i < 7; i++) {
            if (i < totalShards) {
                emeraldDisplay += emeraldEmojis[i] + ' ';
            } else {
                emeraldDisplay += '⚫ ';
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Chaos Emerald Collection')
            .setColor(hasSuperForm ? 'Gold' : 'DarkPurple')
            .setDescription(
                hasSuperForm
                    ? '**SUPER FORM UNLOCKED!**\nYou have mastered the power of Chaos!'
                    : 'Collect all 7 Chaos Emeralds to unlock Super Form!'
            )
            .addFields(
                { name: 'Your Emeralds', value: emeraldDisplay, inline: false },
                { name: 'Progress', value: `${totalShards}/7 Emeralds`, inline: true },
                { name: 'Shards in Inventory', value: `${shards}`, inline: true }
            );

        if (hasSuperForm) {
            embed.addFields({
                name: 'Super Form Bonus',
                value: '+25% damage in battles\n+25% coin from grinding\n+25% XP gain',
                inline: false
            });
        } else {
            embed.addFields({
                name: 'How to Get Shards',
                value: '- Buy from `/shop` ($15,000)\n- Win rare drops from `/open`\n- Complete special achievements',
                inline: false
            });
        }

        // Check if can unlock Super Form
        const canUnlock = totalShards >= 7 && !hasSuperForm;
        const components = [];

        if (canUnlock) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('unlock_super')
                    .setLabel('UNLOCK SUPER FORM!')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚡')
            );
            components.push(row);
            embed.addFields({
                name: '⚡ READY TO TRANSFORM!',
                value: 'You have collected all 7 Chaos Emeralds! Click below to unlock Super Form!',
                inline: false
            });
        } else if (shards > 0 && !hasSuperForm) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('convert_shards')
                    .setLabel(`Convert ${shards} Shard(s) to Emeralds`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💎')
            );
            components.push(row);
        }

        const response = await interaction.editReply({ embeds: [embed], components });

        if (components.length === 0) return;

        // Handle buttons
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
            filter: i => i.user.id === userId
        });

        collector.on('collect', async i => {
            await i.deferUpdate();

            if (i.customId === 'convert_shards') {
                // Remove shards from inventory
                for (let j = 0; j < shards; j++) {
                    await EconomySystem.removeItem(userId, 'Chaos Emerald Shard');
                }

                // Add to emerald count
                await User.findOneAndUpdate(
                    { userId },
                    { $inc: { chaosEmeralds: shards } }
                );

                const convertEmbed = new EmbedBuilder()
                    .setTitle('Shards Converted!')
                    .setColor('Purple')
                    .setDescription(`You converted **${shards} Chaos Emerald Shard(s)** into emeralds!\n\nTotal Emeralds: **${currentEmeralds + shards}/7**`);

                await i.editReply({ embeds: [convertEmbed], components: [] });
            } else if (i.customId === 'unlock_super') {
                // Remove shards from inventory first
                for (let j = 0; j < shards; j++) {
                    await EconomySystem.removeItem(userId, 'Chaos Emerald Shard');
                }

                // Unlock Super Form
                await User.findOneAndUpdate(
                    { userId },
                    {
                        chaosEmeralds: 7,
                        hasSuperForm: true
                    }
                );

                const superEmbed = new EmbedBuilder()
                    .setTitle('⚡ SUPER FORM UNLOCKED! ⚡')
                    .setColor('Gold')
                    .setDescription(
                        '**THE POWER OF CHAOS IS YOURS!**\n\n' +
                        'You have unlocked the legendary Super Form!\n\n' +
                        '**Permanent Bonuses:**\n' +
                        '+25% damage in battles\n' +
                        '+25% coins from grinding\n' +
                        '+25% XP gain'
                    );

                await i.editReply({ embeds: [superEmbed], components: [] });
            }

            collector.stop();
        });
    }
};
