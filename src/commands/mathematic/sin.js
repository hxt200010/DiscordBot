// sin.js
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const math = require('mathjs');

module.exports = {
    deleted: true, // Consolidated into /math command
    name: 'sin',
    description: 'Calculate the sine of an angle',
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
        const result = math.sin(math.unit(angle, 'deg'));

        const embed = new EmbedBuilder()
            .setTitle('Sine Calculation')
            .setColor('Random')
            .addFields([
                { name: 'Angle (Degrees)', value: `\`\`${angle}\`\``, inline: true },
                { name: 'Result', value: `\`\`${result.toFixed(3)}\`\``, inline: true },
            ]);

        interaction.reply({ embeds: [embed] });
    },
};

