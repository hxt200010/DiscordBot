const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const path = require('path');
const fs = require('fs'); // Keep fs for checking image existence

const petConfig = require('../../utils/petConfig');
const EconomySystem = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');

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

        const userPets = await PetSystem.getUserPets(interaction.user.id);

        // Calculate Price
        const petCount = userPets.length;
        const price = petCount * 1000;

        const balance = await EconomySystem.getBalance(interaction.user.id);

        if (price > 0 && balance < price) {
            return interaction.editReply({
                content: `❌ You need **$${price}** to adopt your ${petCount + 1}th pet! You currently have **$${balance}**.`
            });
        }

        const character = interaction.options.getString('character');
        const petName = interaction.options.getString('name');

        // Confirmation Step
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🐾 Confirm Adoption')
            .setDescription(`Are you sure you want to adopt **${petName}** the ${character}?\n\n💰 **Cost:** ${price === 0 ? 'Free' : `$${price}`}`)
            .setColor('Yellow');

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_adopt')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_adopt')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const response = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'This confirmation is not for you.', ephemeral: true });
            }

            if (i.customId === 'confirm_adopt') {
                // Re-check balance in case it changed
                const currentBalance = await EconomySystem.getBalance(interaction.user.id);
                if (price > 0 && currentBalance < price) {
                    return i.update({
                        content: `❌ Transaction failed. You need **$${price}** but have **$${currentBalance}**.`,
                        embeds: [],
                        components: []
                    });
                }

                // Deduct money
                if (price > 0) {
                    await EconomySystem.removeBalance(interaction.user.id, price);
                }

                const config = petConfig.find(p => p.value === character);
                const baseStats = config ? config.stats : { attack: 10, defense: 10, health: 100 };

                const newPet = {
                    // id: Date.now().toString(), // Mongoose will generate ID
                    petName: petName,
                    type: character,
                    level: 1,
                    xp: 0,
                    stats: {
                        hunger: 100,
                        happiness: 50,
                        affection: 50,
                        energy: 50,
                        cleanliness: 50
                    },
                    lastInteraction: Date.now(),
                    boostActiveUntil: null,
                    dailyCoins: 50 + (1 * 5),
                    isWorking: false,
                    lastWorkUpdate: null,
                    maxHp: baseStats.health,
                    hp: baseStats.health,
                    attack: baseStats.attack,
                    defense: baseStats.defense,
                    purchaseCost: price
                };

                await PetSystem.addPet(interaction.user.id, newPet);

                // Re-fetch pets to get accurate total count
                const updatedUserPets = await PetSystem.getUserPets(interaction.user.id);

                const embed = new EmbedBuilder()
                    .setTitle('🎉 Adoption Successful!')
                    .setDescription(`You have adopted **${petName}** the ${character}!`)
                    .setColor('Green')
                    .addFields(
                        { name: 'Cost', value: price === 0 ? 'Free' : `$${price}`, inline: true },
                        { name: 'Total Pets', value: `${updatedUserPets.length}`, inline: true }
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

                const updatePayload = { embeds: [embed], components: [] };
                if (imagePath) {
                    updatePayload.files = [imagePath];
                    embed.setThumbnail(`attachment://${fileName}`);
                }

                await i.update(updatePayload);

            } else if (i.customId === 'cancel_adopt') {
                await i.update({
                    content: '❌ Adoption cancelled.',
                    embeds: [],
                    components: []
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '⏳ Adoption timed out.',
                    embeds: [],
                    components: []
                });
            }
        });
    }
};
