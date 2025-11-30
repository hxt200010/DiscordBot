const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

module.exports = {
    name: 'sell-pet',
    description: 'Sell your virtual pet (Warning: This is permanent!)',
    options: [
        {
            name: 'confirm',
            description: 'Type "confirm" to proceed',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        if (!fs.existsSync(petsFile)) {
            return interaction.reply({ content: "No pets found!", ephemeral: true });
        }

        let pets = {};
        try {
            pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: "Error reading pet data.", ephemeral: true });
        }

        const pet = pets[interaction.user.id];

        if (!pet) {
            return interaction.reply({ content: "You don't have a pet to sell!", ephemeral: true });
        }

        const confirmation = interaction.options.getString('confirm');
        if (confirmation.toLowerCase() !== 'confirm') {
            return interaction.reply({ content: "You must type 'confirm' to sell your pet.", ephemeral: true });
        }

        const petName = pet.petName;
        delete pets[interaction.user.id];
        fs.writeFileSync(petsFile, JSON.stringify(pets, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('👋 Goodbye!')
            .setDescription(`You have sold **${petName}**. We hope they find a good home!`)
            .setColor('Red');

        interaction.reply({ embeds: [embed] });
    }
};
