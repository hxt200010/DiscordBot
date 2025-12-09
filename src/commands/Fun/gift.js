const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const EconomySystem = require('../../utils/EconomySystem');
const shopItems = require('../../utils/ShopItems');

// Items that can be gifted
const GIFTABLE_ITEMS = shopItems.filter(i =>
    i.type === 'consumable' || i.type === 'accessory' || i.type === 'skill' || i.type === 'skill_choice'
).map(i => i.name);

module.exports = {
    name: 'gift',
    description: 'Gift an item from your inventory to another user',
    options: [
        {
            name: 'user',
            description: 'The user to gift the item to',
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: 'item',
            description: 'The item to gift',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'quantity',
            description: 'How many to gift (default: 1)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 10
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'item') {
            const inventory = await EconomySystem.getInventory(interaction.user.id);

            // Filter to giftable items in inventory
            const giftable = inventory.filter(i => GIFTABLE_ITEMS.includes(i.name));

            // Count duplicates
            const itemCounts = {};
            giftable.forEach(i => {
                itemCounts[i.name] = (itemCounts[i.name] || 0) + 1;
            });

            const uniqueItems = Object.entries(itemCounts).map(([name, count]) => ({
                name: `${name} (x${count})`,
                value: name
            }));

            const filtered = uniqueItems.filter(i =>
                i.value.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(filtered.slice(0, 25));
        }
    },
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const itemName = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity') || 1;
        const userId = interaction.user.id;

        // Can't gift yourself
        if (targetUser.id === userId) {
            return interaction.editReply({ content: "You can't gift items to yourself!" });
        }

        // Can't gift bots
        if (targetUser.bot) {
            return interaction.editReply({ content: "You can't gift items to bots!" });
        }

        // Check if item is giftable
        if (!GIFTABLE_ITEMS.includes(itemName)) {
            return interaction.editReply({ content: `**${itemName}** cannot be gifted!` });
        }

        // Check inventory
        const inventory = await EconomySystem.getInventory(userId);
        const ownedCount = inventory.filter(i => i.name === itemName).length;

        if (ownedCount < quantity) {
            return interaction.editReply({
                content: `You don't have enough **${itemName}**!\n\nYou have: ${ownedCount}\nTrying to gift: ${quantity}`
            });
        }

        // Transfer items
        for (let i = 0; i < quantity; i++) {
            await EconomySystem.removeItem(userId, itemName);
            await EconomySystem.addItem(targetUser.id, itemName);
        }

        const embed = new EmbedBuilder()
            .setTitle('Gift Sent!')
            .setColor('Green')
            .setDescription(
                `You gifted **${quantity}x ${itemName}** to ${targetUser}!`
            )
            .addFields(
                { name: 'Sender', value: `${interaction.user}`, inline: true },
                { name: 'Receiver', value: `${targetUser}`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
