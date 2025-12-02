const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'shoot',
    description: 'Use a gun to shoot another user and steal money',
    options: [
        {
            name: 'target',
            description: 'The user you want to shoot',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        // Offset the global +1 currency reward for this command
        await economySystem.removeBalance(interaction.user.id, 1);

        const targetUser = interaction.options.getUser('target');
        const shooterId = interaction.user.id;
        const targetId = targetUser.id;

        if (shooterId === targetId) {
            return interaction.reply({ content: "🚫 You can't shoot yourself!", ephemeral: true });
        }

        const shooterInventory = await economySystem.getInventory(shooterId);
        const gun = shooterInventory.find(i => i.name === 'Gun');

        if (!gun) {
            return interaction.reply({ content: "🚫 You don't have a Gun! Buy one from `/shop`.", ephemeral: true });
        }

        // Check Shield
        if (await economySystem.getShield(targetId)) {
            await economySystem.setShield(targetId, false);
            return interaction.reply({
                content: `🛡️ **BLOCKED!** <@${targetId}> blocked your shot with a Shield!`,
            });
        }

        // Check Lucky Charm
        const hasCharm = shooterInventory.some(i => i.name === 'Lucky Charm');
        let successChance = 0.7;
        if (hasCharm) successChance = 0.8;

        const random = Math.random();

        // Reduce durability regardless of outcome
        const result = await economySystem.updateItem(shooterId, 'Gun', (item) => {
            item.durability -= 1;
        });

        if (random < successChance) {
            // SUCCESS
            const lostAmount = Math.floor(Math.random() * (40 - 20 + 1)) + 20;
            const gainedAmount = Math.floor(Math.random() * (25 - 15 + 1)) + 15;

            // Ensure target has enough
            const targetBalance = await economySystem.getBalance(targetId);
            const actualLost = Math.min(targetBalance, lostAmount);

            await economySystem.removeBalance(targetId, actualLost);
            await economySystem.addBalance(shooterId, gainedAmount);

            const embed = new EmbedBuilder()
                .setTitle('🔫 BANG! Shot Fired!')
                .setColor('#FF0000')
                .setDescription(`You shot <@${targetId}>!`)
                .addFields(
                    { name: 'They Lost', value: `$${actualLost}`, inline: true },
                    { name: 'You Gained', value: `$${gainedAmount}`, inline: true }
                );

            if (result === 'broken') {
                embed.setFooter({ text: '💥 Your Gun broke after this shot!' });
            }

            await interaction.reply({ embeds: [embed] });

        } else {
            // FAILURE
            let msg = `💨 You missed! Your gun lost 1 durability.`;
            if (result === 'broken') {
                msg += `\n💥 **Your Gun broke!**`;
            }

            await interaction.reply({ content: msg });
        }
    }
};
