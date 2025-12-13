const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const shopItems = require('../../utils/ShopItems');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'buy',
    description: 'Buy items from the shop (up to 5 different items)',
    options: [
        {
            name: 'item1',
            description: 'First item to buy',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'quantity1',
            description: 'Quantity for first item',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1
        },
        {
            name: 'item2',
            description: 'Second item to buy (Optional)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        },
        {
            name: 'quantity2',
            description: 'Quantity for second item',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1
        },
        {
            name: 'item3',
            description: 'Third item to buy (Optional)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        },
        {
            name: 'quantity3',
            description: 'Quantity for third item',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1
        },
        {
            name: 'item4',
            description: 'Fourth item to buy (Optional)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        },
        {
            name: 'quantity4',
            description: 'Quantity for fourth item',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1
        },
        {
            name: 'item5',
            description: 'Fifth item to buy (Optional)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        },
        {
            name: 'quantity5',
            description: 'Quantity for fifth item',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1
        }
    ],

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();

        if (focusedOption.name.startsWith('item')) {
            const filtered = shopItems.filter(item =>
                item.name.toLowerCase().includes(focusedValue)
            );

            // Limit to 25 choices
            await interaction.respond(
                filtered.slice(0, 25).map(item => ({ name: `${item.name} ($${item.price})`, value: item.name }))
            );
        }
    },

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const requestedItems = [];

        // Collect all items
        for (let i = 1; i <= 5; i++) {
            const itemName = interaction.options.getString(`item${i}`);
            let quantity = interaction.options.getInteger(`quantity${i}`);

            if (itemName) {
                // Find item in shop
                const shopItem = shopItems.find(si => si.name.toLowerCase() === itemName.toLowerCase());

                if (!shopItem) {
                    return interaction.reply({
                        content: `❌ Item **${itemName}** (in slot ${i}) not found in the shop.`,
                        ephemeral: true
                    });
                }

                // Default quantity to 1 if not specified for optional items
                if (!quantity) quantity = 1;

                requestedItems.push({ item: shopItem, quantity });
            }
        }

        if (requestedItems.length === 0) {
            return interaction.reply({ content: "❌ You didn't select any items to buy.", ephemeral: true });
        }

        // Merge duplicates
        const mergedItems = [];
        requestedItems.forEach(req => {
            const existing = mergedItems.find(i => i.item.name === req.item.name);
            if (existing) {
                existing.quantity += req.quantity;
            } else {
                mergedItems.push({ ...req }); // Clone to avoid reference issues
            }
        });

        // Calculate total
        let totalCost = 0;
        let summary = "";

        mergedItems.forEach(req => {
            const cost = req.item.price * req.quantity;
            totalCost += cost;
            summary += `• **${req.quantity}x ${req.item.name}** - $${cost}\n`;
        });

        const balance = await economySystem.getBalance(userId);

        if (balance < totalCost) {
            return interaction.reply({
                content: `❌ You don't have enough money! Total cost is **$${totalCost}**, but you only have **$${balance}**.`,
                ephemeral: true
            });
        }

        // Confirmation Embed
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🛒 Confirm Purchase')
            .setDescription(`You are about to buy:\n\n${summary}\n**Total: $${totalCost}**`)
            .setColor('#FFA500')
            .setFooter({ text: `Current Balance: $${balance} | Remaining after: $${balance - totalCost}` });

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_buy')
            .setLabel('Confirm Purchase')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_buy')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            fetchReply: true
        });

        let isProcessing = false; // Flag to prevent double-processing
        
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This isn't your purchase!", ephemeral: true });
            }

            // Prevent double-clicks from processing multiple times
            if (isProcessing) {
                return i.reply({ content: "⏳ Already processing your request...", ephemeral: true });
            }
            isProcessing = true;
            collector.stop('processed'); // Stop collecting more button clicks

            if (i.customId === 'confirm_buy') {
                await i.deferUpdate();

                // Re-check balance just in case
                const currentBalance = await economySystem.getBalance(userId);
                if (currentBalance < totalCost) {
                    return i.editReply({ content: "❌ Transaction failed: Insufficient funds.", embeds: [], components: [] });
                }

                // Process transaction
                const success = await economySystem.removeBalance(userId, totalCost);
                if (!success) {
                    return i.editReply({ content: "❌ Transaction failed: Error processing payment.", embeds: [], components: [] });
                }

                // Add items
                let speedShoesActivated = false;
                let speedShoesCount = 0;
                
                for (const req of mergedItems) {
                    // Check for auto-activate items like Speed Shoes
                    if (req.item.autoActivate && req.item.name === 'Speed Shoes') {
                        speedShoesCount += req.quantity;
                        speedShoesActivated = true;
                        // Don't add to inventory, activate directly
                        continue;
                    }
                    
                    for (let k = 0; k < req.quantity; k++) {
                        // Create new instance for each item (important for durability items)
                        await economySystem.addItem(userId, { ...req.item });
                    }
                }
                
                // Handle Speed Shoes auto-activation
                if (speedShoesActivated) {
                    const User = require('../../models/User');
                    let user = await User.findOne({ userId });
                    if (!user) {
                        user = await User.create({ userId });
                    }
                    
                    const now = Date.now();
                    const duration = 24 * 60 * 60 * 1000; // 24 hours
                    
                    // Activate Speed Shoes boost for ALL pets (+50% grinding coins)
                    user.speedShoesBoost = { 
                        active: true, 
                        expiresAt: now + duration 
                    };
                    
                    await user.save();
                }

                let confirmationMsg = `✅ Purchase successful! You spent **$${totalCost}**.`;
                if (speedShoesActivated) {
                    const PetSystem = require('../../utils/PetSystem');
                    const userPets = await PetSystem.getUserPets(userId);
                    const petCount = userPets?.length || 0;
                    confirmationMsg += `\n\n👟 **Speed Shoes Activated!**`;
                    confirmationMsg += `\n🚀 **+50%** coin grinding for ALL **${petCount}** pet${petCount !== 1 ? 's' : ''}!`;
                    confirmationMsg += `\n⏰ Lasts **24 hours**`;
                }
                confirmationMsg += `\nItems added to your inventory.`;

                await i.editReply({
                    content: confirmationMsg,
                    embeds: [],
                    components: []
                });
            } else if (i.customId === 'cancel_buy') {
                await i.update({ content: "❌ Purchase cancelled.", embeds: [], components: [] });
            }
        });

        collector.on('end', (collected, reason) => {
            // Only show timeout if it actually timed out (not if we stopped it after processing)
            if (reason === 'time' && collected.size === 0) {
                interaction.editReply({ content: "❌ Purchase timed out.", embeds: [], components: [] });
            }
        });
    }
};
