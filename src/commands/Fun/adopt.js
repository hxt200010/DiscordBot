const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

module.exports = {
    name: 'adopt',
    description: 'Adopt a virtual pet!',
    options: [
        {
            name: 'character',
            description: 'Choose your pet character',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Sonic', value: 'sonic' },
                { name: 'Knuckles', value: 'knuckles' },
                { name: 'Tails', value: 'tails' },
                { name: 'Shadow', value: 'shadow' },
            ],
        },
        {
            name: 'name',
            description: 'Give your pet a name',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();

        let pets = {};
        if (fs.existsSync(petsFile)) {
            try {
                pets = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
            } catch (e) {
                console.error("Error reading pets.json", e);
                pets = {};
            }
        }

        if (pets[interaction.user.id]) {
            return interaction.editReply({
                content: "You already have a pet! You can only adopt one."
            });
        }

        const character = interaction.options.getString('character');
        const petName = interaction.options.getString('name');

        const newPet = {
            petName: petName,
            type: character,
            level: 1,
            xp: 0,
            stats: {
                hunger: 50,
                happiness: 50,
                affection: 50,
                energy: 50
            },
            lastInteraction: Date.now(),
            boostActiveUntil: null,
            dailyCoins: 50 + (1 * 5) // Initial daily coins
        };

        pets[interaction.user.id] = newPet;

        fs.writeFileSync(petsFile, JSON.stringify(pets, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('🎉 Adoption Successful!')
            .setDescription(`You have adopted **${petName}** the ${character}!`)
            .setColor('Green')
            .addFields(
                { name: 'Level', value: '1', inline: true },
                { name: 'Stats', value: 'All stats start at 50/100', inline: true }
            )
            .setFooter({ text: 'Use /pet to view your pet and /pet-action to care for it!' });

        const imagePath = path.join(__dirname, `../../Images/${character}_pet.png`);
        if (fs.existsSync(imagePath)) {
             embed.setThumbnail(`attachment://${character}_pet.png`);
             return interaction.editReply({ embeds: [embed], files: [imagePath] });
        }

        interaction.editReply({ embeds: [embed] });
    }
};
