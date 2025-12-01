const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const shopItems = require('../../utils/ShopItems');
const economySystem = require('../../utils/EconomySystem');

module.exports = {
    name: 'buy',
    description: 'Buy an item from the shop',
    options: [
        {
            name: 'item',
            description: 'The name of the item to buy',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true // We can implement autocomplete later, but for now string is fine
        }
    ],
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    autocomplete: async (client, interaction) => {
        const focusedValue = interaction.options.getFocused();
        const filtered = shopItems.filter(item => item.name.toLowerCase().includes(focusedValue.toLowerCase()));

        await interaction.respond(
            filtered.slice(0, 25).map(item => ({ name: `${item.name} ($${item.price})`, value: item.name }))
        );
    },

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const itemName = interaction.options.getString('item');
        const item = shopItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (!item) {
            return interaction.reply({ content: "❌ Item not found! Check `/shop` for the list.", ephemeral: true });
        }

        const userId = interaction.user.id;
        const balance = economySystem.getBalance(userId);

        if (balance < item.price) {
            return interaction.reply({ content: `❌ You don't have enough money! You need **$${item.price}** but have **$${balance}**.`, ephemeral: true });
        }

        // Deduct money
        economySystem.removeBalance(userId, item.price);

        // Add to inventory
        // Create a new instance of the item to track individual durability
        const newItem = { ...item };
        economySystem.addItem(userId, newItem);

        await interaction.reply({
            content: `✅ You bought a **${item.name}** for **$${item.price}**! Check your \`/inventory\`.`
        });
    }
};
