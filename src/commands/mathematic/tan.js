// tan.js
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const math = require('mathjs');

module.exports = {
    deleted: true, // Consolidated into /math command
    name: 'tan',
    description: 'Calculate the tangent of an angle',
    options: [
        {
            name: 'angle',
            description: 'Angle in degrees',
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const angle = interaction.options.getNumber('angle');
        const result = math.tan(math.unit(angle, 'deg'));

        const embed = new EmbedBuilder()
            .setTitle('Tangent Calculation')
            .setColor('Random')
            .addFields([
                { name: 'Angle (Degrees)', value: `\`\`${angle}\`\``, inline: true },
                { name: 'Result', value: `\`\`${result.toFixed(3)}\`\``, inline: true },
            ]);

        interaction.reply({ embeds: [embed] });
    },
};
