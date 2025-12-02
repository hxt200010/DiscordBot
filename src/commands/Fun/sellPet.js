const { ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');
const EconomySystem = require('../../utils/EconomySystem');

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
        try {
            const focusedValue = interaction.options.getFocused();
            console.log(`[SellPet] Autocomplete focused: "${focusedValue}"`);

            const userPets = PetSystem.getUserPets(interaction.user.id);
            console.log(`[SellPet] User pets found: ${userPets ? userPets.length : 'null'}`);

            if (!userPets || userPets.length === 0) return interaction.respond([]);

            // Filter pets by name
            const filtered = userPets.filter(pet => pet.petName.toLowerCase().includes(focusedValue.toLowerCase()));

            // Create options with unique values (IDs) and descriptive names
            const options = filtered.slice(0, 25).map(pet => {
                // Check if there are multiple pets with the same name to decide if we need extra info in the label
                const isDuplicateName = userPets.filter(p => p.petName === pet.petName).length > 1;

                let label = `${pet.petName} (${pet.type})`;
                if (isDuplicateName) {
                    // Add the last 4 digits of ID to distinguish
                    label += ` #${pet.id.slice(-4)}`;
                }

                // Truncate label to 100 chars to satisfy Discord API limits
                if (label.length > 100) label = label.substring(0, 97) + '...';

                return {
                    name: label,
                    value: pet.id // Use ID as the value
                };
            });

            console.log(`[SellPet] Responding with ${options.length} options`);
            await interaction.respond(options);
        } catch (error) {
            console.error('[SellPet] Autocomplete Error:', error);
            // Try to respond with empty to stop loading spinner if possible, though error might prevent it
            try { await interaction.respond([]); } catch (e) { }
        }
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const userPets = PetSystem.getUserPets(interaction.user.id);

        if (!userPets || userPets.length === 0) {
            return interaction.editReply({ content: "You don't have a pet to sell!" });
        }

        const targetPetId = interaction.options.getString('pet');
        let soldPet = null;

        if (targetPetId) {
            // Try to find by ID first (from autocomplete)
            soldPet = userPets.find(p => p.id === targetPetId);

            // Fallback: Try to find by name (if user typed manually)
            if (!soldPet) {
                soldPet = userPets.find(p => p.petName === targetPetId);
            }

            if (!soldPet) {
                return interaction.editReply({ content: `❌ You don't have a pet with that ID or name.` });
            }
        } else {
            if (userPets.length === 1) {
                soldPet = userPets[0];
            } else {
                return interaction.editReply({ content: "❌ You have multiple pets! Please select which one to sell." });
            }
        }

        // Calculate Refund
        let originalCost = 0;
        if (soldPet.purchaseCost !== undefined) {
            originalCost = soldPet.purchaseCost;
        } else {
            // Fallback for old pets
            originalCost = 1000;
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
                // Verify pet still exists
                if (!PetSystem.getPet(soldPet.id)) {
                    return i.update({
                        content: '❌ Pet not found. It may have been sold already.',
                        embeds: [],
                        components: []
                    });
                }

                PetSystem.removePet(soldPet.id);
                EconomySystem.addBalance(interaction.user.id, refundAmount);

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
