const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
    name: 'math',
    description: 'Mathematical calculations and operations',
    options: [
        {
            name: 'add',
            description: 'Add two numbers',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'first', description: 'First number', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'second', description: 'Second number', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'subtract',
            description: 'Subtract two numbers',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'first', description: 'First number', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'second', description: 'Second number', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'multiply',
            description: 'Multiply two numbers',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'first', description: 'First number', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'second', description: 'Second number', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'divide',
            description: 'Divide two numbers',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'first', description: 'First number (dividend)', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'second', description: 'Second number (divisor)', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'sqrt',
            description: 'Calculate square root',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'number', description: 'Number to find square root of', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'sin',
            description: 'Calculate sine of an angle (degrees)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'angle', description: 'Angle in degrees', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'cos',
            description: 'Calculate cosine of an angle (degrees)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'angle', description: 'Angle in degrees', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'tan',
            description: 'Calculate tangent of an angle (degrees)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'angle', description: 'Angle in degrees', type: ApplicationCommandOptionType.Number, required: true }
            ]
        },
        {
            name: 'log',
            description: 'Calculate logarithm',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'value', description: 'Value to take log of', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'base', description: 'Logarithm base (default: 10)', type: ApplicationCommandOptionType.Number, required: false }
            ]
        },
        {
            name: 'calculate',
            description: 'Evaluate a mathematical expression',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'expression', description: 'Expression to evaluate (e.g., 2+3*4)', type: ApplicationCommandOptionType.String, required: true }
            ]
        },
        {
            name: 'integrate',
            description: 'Calculate definite integral',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'function', description: 'Function to integrate (e.g., x^2 + 3*x)', type: ApplicationCommandOptionType.String, required: true },
                { name: 'lower', description: 'Lower limit', type: ApplicationCommandOptionType.Number, required: true },
                { name: 'upper', description: 'Upper limit', type: ApplicationCommandOptionType.Number, required: true }
            ]
        }
    ],
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        let embed;

        try {
            switch (subcommand) {
                case 'add': {
                    const a = interaction.options.getNumber('first');
                    const b = interaction.options.getNumber('second');
                    const result = a + b;
                    
                    embed = new EmbedBuilder()
                        .setTitle('➕ Addition')
                        .setColor('Green')
                        .addFields(
                            { name: 'Expression', value: `\`${a} + ${b}\``, inline: true },
                            { name: 'Result', value: `\`${result}\``, inline: true }
                        );
                    break;
                }
                case 'subtract': {
                    const a = interaction.options.getNumber('first');
                    const b = interaction.options.getNumber('second');
                    const result = a - b;
                    
                    embed = new EmbedBuilder()
                        .setTitle('➖ Subtraction')
                        .setColor('Blue')
                        .addFields(
                            { name: 'Expression', value: `\`${a} - ${b}\``, inline: true },
                            { name: 'Result', value: `\`${result}\``, inline: true }
                        );
                    break;
                }
                case 'multiply': {
                    const a = interaction.options.getNumber('first');
                    const b = interaction.options.getNumber('second');
                    const result = a * b;
                    
                    embed = new EmbedBuilder()
                        .setTitle('✖️ Multiplication')
                        .setColor('Purple')
                        .addFields(
                            { name: 'Expression', value: `\`${a} × ${b}\``, inline: true },
                            { name: 'Result', value: `\`${result}\``, inline: true }
                        );
                    break;
                }
                case 'divide': {
                    const a = interaction.options.getNumber('first');
                    const b = interaction.options.getNumber('second');
                    
                    if (b === 0) {
                        return interaction.reply({ content: '❌ Cannot divide by zero!', ephemeral: true });
                    }
                    const result = a / b;
                    
                    embed = new EmbedBuilder()
                        .setTitle('➗ Division')
                        .setColor('Orange')
                        .addFields(
                            { name: 'Expression', value: `\`${a} ÷ ${b}\``, inline: true },
                            { name: 'Result', value: `\`${result}\``, inline: true }
                        );
                    break;
                }
                case 'sqrt': {
                    const num = interaction.options.getNumber('number');
                    
                    if (num < 0) {
                        return interaction.reply({ content: '❌ Cannot calculate square root of negative number!', ephemeral: true });
                    }
                    const result = Math.sqrt(num);
                    
                    embed = new EmbedBuilder()
                        .setTitle('√ Square Root')
                        .setColor('Aqua')
                        .addFields(
                            { name: 'Expression', value: `\`√${num}\``, inline: true },
                            { name: 'Result', value: `\`${result}\``, inline: true }
                        );
                    break;
                }
                case 'sin': {
                    const angle = interaction.options.getNumber('angle');
                    const result = math.sin(math.unit(angle, 'deg'));
                    
                    embed = new EmbedBuilder()
                        .setTitle('📐 Sine')
                        .setColor('Gold')
                        .addFields(
                            { name: 'Angle (°)', value: `\`${angle}°\``, inline: true },
                            { name: 'Result', value: `\`${result.toFixed(6)}\``, inline: true }
                        );
                    break;
                }
                case 'cos': {
                    const angle = interaction.options.getNumber('angle');
                    const result = math.cos(math.unit(angle, 'deg'));
                    
                    embed = new EmbedBuilder()
                        .setTitle('📐 Cosine')
                        .setColor('Gold')
                        .addFields(
                            { name: 'Angle (°)', value: `\`${angle}°\``, inline: true },
                            { name: 'Result', value: `\`${result.toFixed(6)}\``, inline: true }
                        );
                    break;
                }
                case 'tan': {
                    const angle = interaction.options.getNumber('angle');
                    const result = math.tan(math.unit(angle, 'deg'));
                    
                    embed = new EmbedBuilder()
                        .setTitle('📐 Tangent')
                        .setColor('Gold')
                        .addFields(
                            { name: 'Angle (°)', value: `\`${angle}°\``, inline: true },
                            { name: 'Result', value: `\`${result.toFixed(6)}\``, inline: true }
                        );
                    break;
                }
                case 'log': {
                    const value = interaction.options.getNumber('value');
                    const base = interaction.options.getNumber('base') || 10;
                    
                    if (value <= 0 || base <= 0) {
                        return interaction.reply({ content: '❌ Both value and base must be positive!', ephemeral: true });
                    }
                    const result = math.log(value, base);
                    
                    embed = new EmbedBuilder()
                        .setTitle('📊 Logarithm')
                        .setColor('DarkBlue')
                        .addFields(
                            { name: 'Expression', value: `\`log${base === 10 ? '' : '_' + base}(${value})\``, inline: true },
                            { name: 'Result', value: `\`${result.toFixed(6)}\``, inline: true }
                        );
                    break;
                }
                case 'calculate': {
                    const expression = interaction.options.getString('expression');
                    
                    try {
                        const result = math.evaluate(expression);
                        
                        embed = new EmbedBuilder()
                            .setTitle('🧮 Calculator')
                            .setColor('Green')
                            .addFields(
                                { name: 'Expression', value: `\`${expression}\``, inline: false },
                                { name: 'Result', value: `\`${result}\``, inline: false }
                            );
                    } catch (err) {
                        return interaction.reply({ content: `❌ Invalid expression: ${err.message}`, ephemeral: true });
                    }
                    break;
                }
                case 'integrate': {
                    const func = interaction.options.getString('function');
                    const lower = interaction.options.getNumber('lower');
                    const upper = interaction.options.getNumber('upper');
                    
                    try {
                        const f = math.compile(func);
                        const numSteps = 1000;
                        const stepSize = (upper - lower) / numSteps;
                        let result = 0;
                        
                        for (let i = 0; i < numSteps; i++) {
                            const x1 = lower + i * stepSize;
                            const x2 = x1 + stepSize;
                            result += (f.evaluate({ x: x1 }) + f.evaluate({ x: x2 })) / 2 * stepSize;
                        }
                        
                        embed = new EmbedBuilder()
                            .setTitle('∫ Definite Integral')
                            .setColor('Purple')
                            .addFields(
                                { name: 'Function', value: `\`f(x) = ${func}\``, inline: false },
                                { name: 'Limits', value: `\`[${lower}, ${upper}]\``, inline: true },
                                { name: 'Result', value: `\`${result.toFixed(6)}\``, inline: true }
                            )
                            .setFooter({ text: 'Computed using trapezoidal rule (n=1000)' });
                    } catch (err) {
                        return interaction.reply({ content: `❌ Invalid function: ${err.message}`, ephemeral: true });
                    }
                    break;
                }
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error in /math ${subcommand}:`, error);
            await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
        }
    }
};
