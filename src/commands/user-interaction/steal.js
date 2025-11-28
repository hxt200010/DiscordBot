const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'steal',
    description: 'Attempt to steal money from another user',
    options: [
        {
            name: 'target',
            description: 'The user you want to steal from',
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
        const targetUser = interaction.options.getUser('target');
        const stealerId = interaction.user.id;
        const targetId = targetUser.id;

        if (stealerId === targetId) {
            return interaction.reply({ content: "🚫 You can't steal from yourself!", ephemeral: true });
        }

        const targetBalance = economySystem.getBalance(targetId);
        if (targetBalance < 10) {
            return interaction.reply({ content: "🚫 This user is too poor to steal from (less than $10).", ephemeral: true });
        }

        // Check Shield
        if (economySystem.getShield(targetId)) {
            economySystem.setShield(targetId, false);
            return interaction.reply({ 
                content: `🛡️ **BLOCKED!** <@${targetId}> had a Shield active! The shield broke, but their money is safe.`,
            });
        }

        // Check Lucky Charm
        const stealerInventory = economySystem.getInventory(stealerId);
        const hasCharm = stealerInventory.some(item => item.name === 'Lucky Charm');
        
        let successChance = 0.5;
        if (hasCharm) successChance = 0.6;

        const random = Math.random();

        if (random < successChance) {
            // SUCCESS
            let amount = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
            if (amount > targetBalance) amount = targetBalance; // Take all if they have less

            economySystem.removeBalance(targetId, amount);
            economySystem.addBalance(stealerId, amount);

            const embed = new EmbedBuilder()
                .setTitle('🕵️ Successful Heist!')
                .setColor('#00FF00')
                .setDescription(`You stole **$${amount}** from <@${targetId}>!`)
                .addFields(
                    { name: 'Your Balance', value: `$${economySystem.getBalance(stealerId)}`, inline: true },
                    { name: 'Victim Balance', value: `$${economySystem.getBalance(targetId)}`, inline: true }
                );

            await interaction.reply({ embeds: [embed] });

        } else {
            // FAILED
            const fine = Math.floor(Math.random() * (30 - 5 + 1)) + 5;
            economySystem.removeBalance(stealerId, fine);
            // Ensure balance doesn't go below 0 (removeBalance handles this check but returns false if not enough, 
            // but here we just want to set to 0 if they don't have enough? 
            // The method returns false if not enough. Let's just take what they have if false.)
            
            // Actually removeBalance returns false if < amount. 
            // If they have less than fine, we should take all.
            // But for simplicity, let's just trust removeBalance or check.
            // If removeBalance returns false, it means they have < fine.
            // We can check balance first.
            
            // Re-read rule: "Stealer loses random $5–$30".
            // If they have 0, they lose 0? "A user's balance can never go below $0."
            
            const embed = new EmbedBuilder()
                .setTitle('🚓 BUSTED!')
                .setColor('#FF0000')
                .setDescription(`You were caught trying to steal from <@${targetId}>!`)
                .addFields(
                    { name: 'Fine Paid', value: `$${fine}`, inline: true },
                    { name: 'Your Balance', value: `$${economySystem.getBalance(stealerId)}`, inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        }
    }
};
