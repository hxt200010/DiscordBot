const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');

module.exports = {
    name: 'pet-glasses',
    description: 'Toggle sunglasses on/off for your pet (requires Sunglasses accessory)',
    options: [
        {
            name: 'toggle',
            description: 'Turn glasses on or off',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'On - Wear sunglasses', value: 'on' },
                { name: 'Off - Remove sunglasses', value: 'off' }
            ]
        },
        {
            name: 'pet',
            description: 'Which pet to change',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'pet') {
            const userPets = await PetSystem.getUserPets(interaction.user.id);
            if (!userPets || userPets.length === 0) return interaction.respond([]);

            // Show all pets, mark those with sunglasses
            const filtered = userPets.filter(pet =>
                pet.petName.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(pet => {
                    const hasGlasses = pet.accessories && pet.accessories.includes('Sunglasses');
                    return {
                        name: `${pet.petName} (${pet.type})${hasGlasses ? ' - Has Sunglasses' : ''}`,
                        value: pet.petName
                    };
                })
            );
        }
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const toggle = interaction.options.getString('toggle');
        const petName = interaction.options.getString('pet');

        // Get user's pets
        const userPets = await PetSystem.getUserPets(userId);

        if (!userPets || userPets.length === 0) {
            return interaction.editReply({ content: "You don't have any pets!" });
        }

        // Find the pet
        let pet;
        if (petName) {
            pet = userPets.find(p => p.petName.toLowerCase() === petName.toLowerCase());
            if (!pet) {
                return interaction.editReply({ content: `You don't have a pet named **${petName}**!` });
            }
        } else {
            // Find first pet with Sunglasses
            pet = userPets.find(p => p.accessories && p.accessories.includes('Sunglasses'));
            if (!pet) {
                return interaction.editReply({
                    content: "None of your pets have Sunglasses equipped!\n\nBuy Sunglasses from `/shop` and use `/equip Sunglasses <pet>` first."
                });
            }
        }

        // Check if pet has Sunglasses accessory
        if (!pet.accessories || !pet.accessories.includes('Sunglasses')) {
            return interaction.editReply({
                content: `**${pet.petName}** doesn't have Sunglasses!\n\nBuy from \`/shop\` and use \`/equip Sunglasses ${pet.petName}\` first.`
            });
        }

        // Toggle glasses state
        const showGlasses = toggle === 'on';

        await PetSystem.updatePet(pet.id, (p) => {
            p.showGlasses = showGlasses;
        });

        const embed = new EmbedBuilder()
            .setColor(showGlasses ? 'Blue' : 'Grey')
            .setTitle(showGlasses ? 'Sunglasses On!' : 'Sunglasses Off')
            .setDescription(
                showGlasses
                    ? `**${pet.petName}** is now looking cool with sunglasses!`
                    : `**${pet.petName}** took off their sunglasses.`
            )
            .setFooter({ text: 'Use /pet to see the new look!' });

        await interaction.editReply({ embeds: [embed] });
    }
};
