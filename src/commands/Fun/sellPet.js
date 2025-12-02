const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const petsFile = path.join(__dirname, '../../data/pets.json');

module.exports = {
    name: 'sell-pet',
    description: 'Sell your virtual pet (Warning: This is permanent!)',
    options: [
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

        // Calculate Refund
        let originalCost = 0;
        if (soldPet.purchaseCost !== undefined) {
            originalCost = soldPet.purchaseCost;
        } else {
            // Fallback for old pets
            originalCost = petIndex * 1000;
        }

        const refundAmount = originalCost * 0.5;

        // Confirmation Step
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Confirm Sale')
            .setDescription(`Are you sure you want to sell **${soldPet.petName}**?\n\n💰 **Refund Amount:** $${refundAmount}\n⚠️ **This action cannot be undone.**`)
            .setColor('Red');

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_sell')
            .setLabel('Confirm Sale')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_sell')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

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

            if (i.customId === 'confirm_sell') {
                // Re-read data to ensure consistency (race conditions)
                if (fs.existsSync(petsFile)) {
                    try {
                        petsData = JSON.parse(fs.readFileSync(petsFile, 'utf8'));
                    } catch (e) { petsData = {}; }
                }
                userPets = petsData[interaction.user.id] || [];
                if (!Array.isArray(userPets)) userPets = [userPets];

                // Find index again in case it changed
                const currentIndex = userPets.findIndex(p => p.petName === soldPet.petName);
                if (currentIndex === -1) {
                    return i.update({
                        content: '❌ Pet not found. It may have been sold already.',
                        embeds: [],
                        components: []
                    });
                }

                userPets.splice(currentIndex, 1);

                if (userPets.length === 0) {
                    delete petsData[interaction.user.id];
                } else {
                    petsData[interaction.user.id] = userPets;
                }

                fs.writeFileSync(petsFile, JSON.stringify(petsData, null, 2));

                // Add refund to balance
                const economySystem = require('../../utils/EconomySystem');
                economySystem.addBalance(interaction.user.id, refundAmount);

                const embed = new EmbedBuilder()
                    .setTitle('👋 Goodbye!')
                    .setDescription(`You have sold **${soldPet.petName}**.\n\n💰 **Refund:** $${refundAmount} (50% of original value)\nWe hope they find a good home!`)
                    .setColor('Red');

                await i.update({
                    embeds: [embed],
                    components: []
                });

            } else if (i.customId === 'cancel_sell') {
                await i.update({
                    content: '❌ Sale cancelled.',
                    embeds: [],
                    components: []
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '⏳ Sale confirmation timed out.',
                    embeds: [],
                    components: []
                });
            }
        });
    }
};
