const { Client, Interaction, EmbedBuilder } = require('discord.js');
const MiningEngine = require('./Mine/MiningEngine');
const economySystem = require('../../utils/EconomySystem');

const engine = new MiningEngine();
const cooldowns = new Map();
const COOLDOWN_SECONDS = 60;

module.exports = {
    name: 'mine',
    description: 'Mine for valuable resources and earn coins!',
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;

        // Check cooldown
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_SECONDS * 1000;
            const now = Date.now();

            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000);
                return interaction.reply({
                    content: `⏳ You are tired from mining! Please wait **${timeLeft} seconds** before mining again.`,
                    ephemeral: true
                });
            }
        }

        // Perform mining
        const result = engine.mine();

        // Update balance
        const newBalance = await economySystem.addBalance(userId, result.value);

        // Set cooldown
        cooldowns.set(userId, Date.now());
        setTimeout(() => cooldowns.delete(userId), COOLDOWN_SECONDS * 1000);

        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('⛏️ Mining Expedition')
            .setColor(result.name === 'Garbage' ? '#555555' : '#FFD700') // Grey for garbage, Gold for others
            .setDescription(`You went mining and found...`)
            .addFields(
                { name: 'Found Item', value: `${result.emoji} **${result.name}**`, inline: true },
                { name: 'Value', value: `💰 **${result.value}** coins`, inline: true },
                { name: '\u200B', value: '\u200B', inline: false }, // Spacer
                { name: 'Current Balance', value: `💳 **${newBalance}** coins`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
