const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');
const EconomySystem = require('../../utils/EconomySystem');
const shopItems = require('../../utils/ShopItems');

// Get all accessory items from shop
const ACCESSORIES = shopItems.filter(item => item.type === 'accessory');
const ACCESSORY_NAMES = ACCESSORIES.map(a => a.name);

module.exports = {
    name: 'equip',
    description: 'Equip an accessory from your inventory onto a pet',
    options: [
        {
            name: 'accessory',
            description: 'The accessory to equip',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'pet',
            description: 'The pet to equip the accessory on',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'accessory') {
            // Show accessories from inventory
            const inventory = await EconomySystem.getInventory(interaction.user.id);
            const accessories = inventory.filter(item => ACCESSORY_NAMES.includes(item.name));

            const filtered = accessories.filter(a =>
                a.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(a => ({ name: a.name, value: a.name }))
            );
        } else if (focusedOption.name === 'pet') {
            const userPets = await PetSystem.getUserPets(interaction.user.id);
            if (!userPets || userPets.length === 0) return interaction.respond([]);

            const filtered = userPets.filter(pet =>
                pet.petName.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(pet => ({
                    name: `${pet.petName} (${pet.type})`,
                    value: pet.petName
                }))
            );
        }
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const accessoryName = interaction.options.getString('accessory');
        const petName = interaction.options.getString('pet');
        const userId = interaction.user.id;

        // Check if user has the accessory in inventory
        const inventory = await EconomySystem.getInventory(userId);
        const accessoryInInventory = inventory.find(item =>
            item.name.toLowerCase() === accessoryName.toLowerCase() &&
            ACCESSORY_NAMES.includes(item.name)
        );

        if (!accessoryInInventory) {
            return interaction.editReply({
                content: `❌ You don't have **${accessoryName}** in your inventory!\n\nBuy accessories from \`/shop\` first.`
            });
        }

        // Get pet
        const userPets = await PetSystem.getUserPets(userId);
        const pet = userPets?.find(p => p.petName.toLowerCase() === petName.toLowerCase());

        if (!pet) {
            return interaction.editReply({
                content: `❌ You don't have a pet named **${petName}**!`
            });
        }

        // Check if pet already has this accessory
        if (pet.accessories && pet.accessories.includes(accessoryInInventory.name)) {
            return interaction.editReply({
                content: `❌ **${pet.petName}** is already wearing **${accessoryInInventory.name}**!`
            });
        }

        // Get accessory data for stat bonuses
        const accessoryData = ACCESSORIES.find(a => a.name === accessoryInInventory.name);

        // Equip the accessory
        await PetSystem.updatePet(pet.id, (p) => {
            if (!p.accessories) p.accessories = [];
            p.accessories.push(accessoryInInventory.name);

            // Auto-enable glasses display when equipping Sunglasses
            if (accessoryInInventory.name === 'Sunglasses') {
                p.showGlasses = true;
            }

            // Apply stat bonuses
            if (accessoryData?.statBonus) {
                if (accessoryData.statBonus.attack) {
                    p.attack = (p.attack || 0) + accessoryData.statBonus.attack;
                }
                if (accessoryData.statBonus.defense) {
                    p.defense = (p.defense || 0) + accessoryData.statBonus.defense;
                }
            }
        });

        // Remove accessory from inventory
        await EconomySystem.removeItem(userId, accessoryInInventory.name);

        // Build response
        let statMessage = '';
        if (accessoryData?.statBonus) {
            const bonuses = [];
            if (accessoryData.statBonus.attack) bonuses.push(`+${accessoryData.statBonus.attack} Attack`);
            if (accessoryData.statBonus.defense) bonuses.push(`+${accessoryData.statBonus.defense} Defense`);
            statMessage = `\n📈 **Stat Bonus:** ${bonuses.join(', ')}`;
        }

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✨ Accessory Equipped!')
            .setDescription(
                `**${pet.petName}** is now wearing **${accessoryInInventory.name}**!${statMessage}`
            )
            .addFields({
                name: '👕 Current Accessories',
                value: [...(pet.accessories || []), accessoryInInventory.name].join(', ') || 'None',
                inline: false
            })
            .setFooter({ text: 'Use /pet to see your pet with their new look!' });

        await interaction.editReply({ embeds: [embed] });
    }
};
