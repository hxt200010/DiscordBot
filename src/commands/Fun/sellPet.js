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
        {
            name: 'pet',
            description: 'Name of the pet to sell',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        let petsData = {};
        if (fs.existsSync(petsFile)) {
            try {
                petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
            } catch (e) {
                return interaction.respond([]);
            }
        }

        let userPets = petsData[interaction.user.id];
        if (!userPets) return interaction.respond([]);
        if (!Array.isArray(userPets)) userPets = [userPets];

        const filtered = userPets.filter(pet => pet.petName.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(
            filtered.slice(0, 25).map(pet => ({ name: `${pet.petName} (${pet.type})`, value: pet.petName }))
        );
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        if (!fs.existsSync(petsFile)) {
            return interaction.editReply({ content: "No pets found!" });
        }

        let petsData = {};
        try {
            petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
        } catch (e) {
            console.error(e);
            return interaction.editReply({ content: "Error reading pet data." });
        }

        let userPets = petsData[interaction.user.id];

        if (!userPets) {
            return interaction.editReply({ content: "You don't have a pet to sell!" });
        }

        if (!Array.isArray(userPets)) {
            userPets = [userPets];
            petsData[interaction.user.id] = userPets;
        }

        const confirmation = interaction.options.getString('confirm');
        if (confirmation.toLowerCase() !== 'confirm') {
            return interaction.editReply({ content: "You must type 'confirm' to sell your pet." });
        }

        const targetPetName = interaction.options.getString('pet');
        let petIndex = -1;

        if (targetPetName) {
            petIndex = userPets.findIndex(p => p.petName === targetPetName);
            if (petIndex === -1) {
                return interaction.editReply({ content: `❌ You don't have a pet named **${targetPetName}**.` });
            }
        } else {
            if (userPets.length === 1) {
                petIndex = 0;
            } else {
                return interaction.editReply({ content: "❌ You have multiple pets! Please select which one to sell." });
            }
        }

        const soldPet = userPets[petIndex];
        userPets.splice(petIndex, 1);

        // If empty, maybe delete key? Or keep empty array.
        if (userPets.length === 0) {
            delete petsData[interaction.user.id];
        } else {
            petsData[interaction.user.id] = userPets;
        }

        fs.writeFileSync(petsFile, JSON.stringify(petsData, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('👋 Goodbye!')
            .setDescription(`You have sold **${soldPet.petName}**. We hope they find a good home!`)
            .setColor('Red');

        interaction.editReply({ embeds: [embed] });
    }
};
