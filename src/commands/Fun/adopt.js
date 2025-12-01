const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

const petConfig = require('../../utils/petConfig');

module.exports = {
    name: 'adopt',
    description: 'Adopt a virtual pet!',
    options: [
        {
            name: 'character',
            description: 'Choose your pet character',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: petConfig.map(pet => ({ name: pet.name, value: pet.value })),
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

        let petsData = {};
        if (fs.existsSync(petsFile)) {
            try {
                petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
            } catch (e) {
                console.error("Error reading pets.json", e);
                petsData = {};
            }
        }

        // Migration: Ensure user's data is an array
        let userPets = petsData[interaction.user.id];
        if (!userPets) {
            userPets = [];
        } else if (!Array.isArray(userPets)) {
            // Migrate single object to array
            userPets = [userPets];
        }

        // Calculate Price
        // 1st pet (index 0) = Free
        // 2nd pet (index 1) = 1000
        // 3rd pet (index 2) = 2000
        const petCount = userPets.length;
        const price = petCount * 1000;

        const economySystem = require('../../utils/EconomySystem');
        const balance = economySystem.getBalance(interaction.user.id);

        if (price > 0 && balance < price) {
            return interaction.editReply({
                content: `❌ You need **$${price}** to adopt your ${petCount + 1}th pet! You currently have **$${balance}**.`
            });
        }

        const character = interaction.options.getString('character');
        const petName = interaction.options.getString('name');

        // Deduct money if applicable
        if (price > 0) {
            economySystem.removeBalance(interaction.user.id, price);
        }

        const newPet = {
            id: Date.now().toString(), // Unique ID for the pet
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
            dailyCoins: 50 + (1 * 5), // Initial daily coins
            isWorking: false,
            lastWorkUpdate: null
        };

        userPets.push(newPet);
        petsData[interaction.user.id] = userPets;

        fs.writeFileSync(petsFile, JSON.stringify(petsData, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('🎉 Adoption Successful!')
            .setDescription(`You have adopted **${petName}** the ${character}!`)
            .setColor('Green')
            .addFields(
                { name: 'Cost', value: price === 0 ? 'Free' : `$${price}`, inline: true },
                { name: 'Total Pets', value: `${userPets.length}`, inline: true }
            )
            .setFooter({ text: 'Use /pet to view your pets and /pet-action to care for them!' });

        const extensions = ['.png', '.jpg', '.jpeg'];
        let imagePath = null;
        let fileName = null;

        for (const ext of extensions) {
            const testPath = path.join(__dirname, `../../Images/${character}_pet${ext}`);
            if (fs.existsSync(testPath)) {
                imagePath = testPath;
                fileName = `${character}_pet${ext}`;
                break;
            }
        }

        if (imagePath) {
            embed.setThumbnail(`attachment://${fileName}`);
            return interaction.editReply({ embeds: [embed], files: [imagePath] });
        }

        interaction.editReply({ embeds: [embed] });
    }
};
