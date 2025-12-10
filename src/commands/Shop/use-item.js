const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const EconomySystem = require('../../utils/EconomySystem');
const PetSystem = require('../../utils/PetSystem');
const petConfig = require('../../utils/petConfig');

// Items that can be used with this command
const USABLE_ITEMS = ['Speed Shoes', 'Training Weights', 'Ultimate Serum'];

module.exports = {
    name: 'use-item',
    description: 'Use a consumable item from your inventory',
    options: [
        {
            name: 'item',
            description: 'The item to use',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'pet',
            description: 'The pet to apply the item on (for pet-specific items)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'item') {
            // Show usable items from inventory
            const inventory = await EconomySystem.getInventory(interaction.user.id);
            const usableItems = inventory.filter(item => USABLE_ITEMS.includes(item.name));

            // Get unique items
            const uniqueItems = [...new Set(usableItems.map(i => i.name))];
            
            const filtered = uniqueItems.filter(name =>
                name.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(name => ({ name, value: name }))
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

        const userId = interaction.user.id;
        const itemName = interaction.options.getString('item');
        const petName = interaction.options.getString('pet');

        // Check if user has the item
        const inventory = await EconomySystem.getInventory(userId);
        const itemInInventory = inventory.find(i => i.name === itemName);

        if (!itemInInventory) {
            return interaction.editReply({
                content: `❌ You don't have **${itemName}** in your inventory!`
            });
        }

        let embed;

        switch (itemName) {
            case 'Speed Shoes': {
                // Activate Speed Shoes boost - stacks up to 3x
                await EconomySystem.removeItem(userId, 'Speed Shoes');

                // Get or create user data for tracking active boosts
                let user = await require('../../models/User').findOne({ userId });
                if (!user) {
                    user = await require('../../models/User').create({ userId });
                }

                // Initialize speedShoesBoost if not present
                if (!user.speedShoesBoost) {
                    user.speedShoesBoost = { stacks: 0, expiresAt: null };
                }

                // Add a stack (max 3)
                const now = Date.now();
                const duration = 24 * 60 * 60 * 1000; // 24 hours

                // If expired or not active, reset
                if (!user.speedShoesBoost.expiresAt || user.speedShoesBoost.expiresAt < now) {
                    user.speedShoesBoost = { stacks: 1, expiresAt: now + duration };
                } else {
                    // Add stack, max 3
                    user.speedShoesBoost.stacks = Math.min(3, user.speedShoesBoost.stacks + 1);
                    // Extend expiry
                    user.speedShoesBoost.expiresAt = now + duration;
                }

                await user.save();

                const bonusPercent = user.speedShoesBoost.stacks * 10;
                const hoursLeft = Math.ceil((user.speedShoesBoost.expiresAt - now) / (60 * 60 * 1000));

                embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('👟 Speed Shoes Activated!')
                    .setDescription(
                        `You now have **${user.speedShoesBoost.stacks}x** Speed Shoes active!\n\n` +
                        `🚀 **+${bonusPercent}%** coin grinding speed\n` +
                        `⏰ Expires in **${hoursLeft} hours**`
                    )
                    .setFooter({ text: user.speedShoesBoost.stacks < 3 ? 'Use another Speed Shoes to stack up to 3x!' : 'Maximum stacks reached!' });
                break;
            }

            case 'Training Weights': {
                // Requires a pet target
                if (!petName) {
                    return interaction.editReply({
                        content: '❌ Please specify which pet to give Training Weights to!\n\nUsage: `/use-item item:Training Weights pet:<pet_name>`'
                    });
                }

                const userPets = await PetSystem.getUserPets(userId);
                const pet = userPets?.find(p => p.petName.toLowerCase() === petName.toLowerCase());

                if (!pet) {
                    return interaction.editReply({
                        content: `❌ You don't have a pet named **${petName}**!`
                    });
                }

                // Apply +5 Defense permanently
                await EconomySystem.removeItem(userId, 'Training Weights');

                await PetSystem.updatePet(pet.id, (p) => {
                    p.stats.defense = (p.stats.defense || 10) + 5;
                    if (p.defense !== undefined) p.defense = p.stats.defense;
                });

                embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🏋️ Training Complete!')
                    .setDescription(
                        `**${pet.petName}** completed training with the weights!\n\n` +
                        `🛡️ **+5 Defense** permanently added!\n` +
                        `New Defense: **${(pet.stats?.defense || pet.defense || 10) + 5}**`
                    );
                break;
            }

            case 'Ultimate Serum': {
                // Requires a pet target
                if (!petName) {
                    return interaction.editReply({
                        content: '❌ Please specify which pet to give the Ultimate Serum to!\n\nUsage: `/use-item item:Ultimate Serum pet:<pet_name>`'
                    });
                }

                const userPets = await PetSystem.getUserPets(userId);
                const pet = userPets?.find(p => p.petName.toLowerCase() === petName.toLowerCase());

                if (!pet) {
                    return interaction.editReply({
                        content: `❌ You don't have a pet named **${petName}**!`
                    });
                }

                // Apply +25% to all base stats permanently
                await EconomySystem.removeItem(userId, 'Ultimate Serum');

                const oldAttack = pet.stats?.attack || pet.attack || 10;
                const oldDefense = pet.stats?.defense || pet.defense || 10;
                const oldMaxHp = pet.maxHp || 100;

                const attackBoost = Math.floor(oldAttack * 0.25);
                const defenseBoost = Math.floor(oldDefense * 0.25);
                const hpBoost = Math.floor(oldMaxHp * 0.25);

                await PetSystem.updatePet(pet.id, (p) => {
                    p.stats.attack = (p.stats.attack || 10) + attackBoost;
                    p.stats.defense = (p.stats.defense || 10) + defenseBoost;
                    p.maxHp = (p.maxHp || 100) + hpBoost;
                    p.stats.health = p.maxHp; // Full heal

                    // Sync top-level properties
                    if (p.attack !== undefined) p.attack = p.stats.attack;
                    if (p.defense !== undefined) p.defense = p.stats.defense;
                    if (p.hp !== undefined) p.hp = p.maxHp;
                });

                embed = new EmbedBuilder()
                    .setColor('Gold')
                    .setTitle('💉 Ultimate Serum Injected!')
                    .setDescription(
                        `**${pet.petName}** has been enhanced!\n\n` +
                        `⚔️ Attack: **+${attackBoost}** (${oldAttack} → ${oldAttack + attackBoost})\n` +
                        `🛡️ Defense: **+${defenseBoost}** (${oldDefense} → ${oldDefense + defenseBoost})\n` +
                        `❤️ Max HP: **+${hpBoost}** (${oldMaxHp} → ${oldMaxHp + hpBoost})`
                    )
                    .setFooter({ text: 'Your pet has been permanently enhanced!' });
                break;
            }

            default:
                return interaction.editReply({
                    content: `❌ **${itemName}** cannot be used with this command.`
                });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
