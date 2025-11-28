const { Client, Interaction } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'shield',
    description: 'Activate a Shield to protect yourself',
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;

        if (economySystem.getShield(userId)) {
            return interaction.reply({ content: "🛡️ You already have a Shield active!", ephemeral: true });
        }

        const success = economySystem.removeItem(userId, 'Shield');

        if (!success) {
            return interaction.reply({ content: "🚫 You don't have a **Shield**! Buy one from `/shop`.", ephemeral: true });
        }

        economySystem.setShield(userId, true);

        await interaction.reply({ content: "🛡️ **Shield Activated!** You are now protected from the next steal or shoot attempt." });
    }
};
