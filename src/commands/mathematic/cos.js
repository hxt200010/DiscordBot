// cos.js
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const math = require('mathjs');

module.exports = {
    name: 'cos',
    description: 'Calculate the cosine of an angle',
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
        const result = math.cos(math.unit(angle, 'deg'));

        const embed = new EmbedBuilder()
            .setTitle('Cosine Calculation')
            .setColor('Random')
            .addFields([
                { name: 'Angle (Degrees)', value: `\`\`${angle}\`\``, inline: true },
                { name: 'Result', value: `\`\`${result.toFixed(3)}\`\``, inline: true },
            ]);

        interaction.reply({ embeds: [embed] });
    },
};