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
        await interaction.deferReply();

        if (!fs.existsSync(petsFile)) {
            return interaction.editReply({ content: "No pets found!" });
        }

        let pets = {};
        try {
            pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.editReply({ content: "Error reading pet data." });
        }

        const pet = pets[interaction.user.id];

        if (!pet) {
            return interaction.editReply({ content: "You don't have a pet to sell!" });
        }

        const confirmation = interaction.options.getString('confirm');
        if (confirmation.toLowerCase() !== 'confirm') {
            return interaction.editReply({ content: "You must type 'confirm' to sell your pet." });
        }

        const petName = pet.petName;
        delete pets[interaction.user.id];
        fs.writeFileSync(petsFile, JSON.stringify(pets, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('👋 Goodbye!')
            .setDescription(`You have sold **${petName}**. We hope they find a good home!`)
            .setColor('Red');

        interaction.editReply({ embeds: [embed] });
    }
};
