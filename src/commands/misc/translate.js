const { ApplicationCommandOptionType } = require('discord.js');
const translate = require('translate-google');

module.exports = {
    deleted: true, // Consolidated into /misc utility command
    name: 'translate',
    description: 'Translate a sentence to a target language',
    options: [
        {
            name: 'sentence',
            description: 'The sentence to translate',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'target-language',
            description: 'The target language to translate the sentence to',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const sentence = interaction.options.getString('sentence');
        const targetLanguage = interaction.options.getString('target-language');

        // Perform translation using the 'translate-google' library
        translate(sentence, { to: targetLanguage })
            .then((translatedSentence) => {
                interaction.reply(`${translatedSentence}`);
            })
            .catch((error) => {
                console.error(error);
                interaction.reply('Error: An error occurred during translation.');
            });
    },
};
