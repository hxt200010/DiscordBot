const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getAllSkills } = require('../../utils/petSkills');
const shopItems = require('../../utils/ShopItems');
const petConfig = require('../../utils/petConfig');

module.exports = {
    name: 'help-pet',
    description: 'View complete guide for the pet system',
    options: [
        {
            name: 'section',
            description: 'Specific section to view',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'Overview', value: 'overview' },
                { name: 'Commands', value: 'commands' },
                { name: 'Stats', value: 'stats' },
                { name: 'Combat', value: 'combat' },
                { name: 'Skills', value: 'skills' },
                { name: 'Shop Items', value: 'shop' },
                { name: 'Accessories', value: 'accessories' }
            ]
        }
    ],
    callback: async (client, interaction) => {
        const section = interaction.options.getString('section') || 'overview';

        let embed;

        switch (section) {
            case 'overview':
                embed = createOverviewEmbed();
                break;
            case 'commands':
                embed = createCommandsEmbed();
                break;
            case 'stats':
                embed = createStatsEmbed();
                break;
            case 'combat':
                embed = createCombatEmbed();
                break;
            case 'skills':
                embed = createSkillsEmbed();
                break;
            case 'shop':
                embed = createShopEmbed();
                break;
            case 'accessories':
                embed = createAccessoriesEmbed();
                break;
            default:
                embed = createOverviewEmbed();
        }

        await interaction.reply({ embeds: [embed] });
    }
};

function createOverviewEmbed() {
    return new EmbedBuilder()
        .setTitle('Pet System Guide')
        .setColor('Blue')
        .setDescription(
            'Welcome to the Pet System! Adopt Sonic characters, train them, and battle!\n\n' +
            'Use `/help-pet section:<name>` for detailed info on each topic.'
        )
        .addFields(
            { name: 'Available Pets', value: petConfig.map(p => `${p.emoji} ${p.name}`).join(', '), inline: false },
            {
                name: 'Sections', value:
                    '**commands** - All pet commands\n' +
                    '**stats** - Pet statistics explained\n' +
                    '**combat** - Battle mechanics\n' +
                    '**skills** - Learnable abilities\n' +
                    '**shop** - Pet-related items\n' +
                    '**accessories** - Cosmetic equipment',
                inline: false
            }
        )
        .setFooter({ text: 'Tip: Use /adopt to get your first pet!' });
}

function createCommandsEmbed() {
    return new EmbedBuilder()
        .setTitle('Pet Commands')
        .setColor('Green')
        .addFields(
            {
                name: 'Basic Commands', value:
                    '`/adopt` - Adopt a new pet\n' +
                    '`/pet [name]` - View pet status\n' +
                    '`/pet-list` - List all your pets\n' +
                    '`/pet-action` - Feed, play, sleep, grind\n' +
                    '`/sell-pet` - Sell a pet for coins',
                inline: false
            },
            {
                name: 'Combat & Training', value:
                    '`/attack @user [pet]` - Attack another user\'s pet\n' +
                    '`/teach <pet>` - Use Skill Scroll to learn abilities\n' +
                    '`/equip <accessory> <pet>` - Equip accessory\n' +
                    '`/pet-glasses <on/off> [pet]` - Toggle sunglasses display',
                inline: false
            },
            {
                name: 'Economy & Shop', value:
                    '`/shop` - View items for sale\n' +
                    '`/buy <item> <qty>` - Purchase items\n' +
                    '`/inventory` - View your items\n' +
                    '`/open [qty]` - Open Mystery Boxes\n' +
                    '`/spin` - Daily wheel spin (free)\n' +
                    '`/gift <user> <item>` - Send items to friends',
                inline: false
            },
            {
                name: 'Progress & Rewards', value:
                    '`/achievements` - View your achievements\n' +
                    '`/bounty` - Daily challenges for coins\n' +
                    '`/chaos-emeralds` - Collect 7 for Super Form!\n' +
                    '`/balance` - Check your coins\n' +
                    '`/daily` - Claim daily reward',
                inline: false
            }
        );
}

function createStatsEmbed() {
    return new EmbedBuilder()
        .setTitle('Pet Stats Explained')
        .setColor('Yellow')
        .addFields(
            { name: 'Health (HP)', value: 'Pet\'s life. Reaches 0 = pet faints. Heal with Health Pack or rest.', inline: true },
            { name: 'Hunger', value: 'Decreases over time. Feed with Pet Food or Chili Dog.', inline: true },
            { name: 'Energy', value: 'Used for attacks (10 per attack). Restore with Energy Drink or Sleep.', inline: true },
            { name: 'Happiness', value: 'Increases from playing. Affects various bonuses.', inline: true },
            { name: 'Affection', value: 'Bond with your pet. Increases from Chili Dogs.', inline: true },
            { name: 'Level', value: 'Increases from XP. Grants +10 Max HP, +3 AP or DP per level.', inline: true },
            { name: 'Attack (AP)', value: 'Damage dealt in combat. Base varies by pet type.', inline: true },
            { name: 'Defense (DP)', value: 'Reduces damage taken. Higher = tankier.', inline: true }
        )
        .addFields({
            name: 'Base Stats by Pet',
            value: petConfig.map(p =>
                `**${p.name}**: ${p.stats.attack} AP / ${p.stats.defense} DP / ${p.stats.health} HP`
            ).join('\n'),
            inline: false
        });
}

function createCombatEmbed() {
    return new EmbedBuilder()
        .setTitle('Combat Mechanics')
        .setColor('Red')
        .addFields(
            {
                name: 'Damage Formula', value:
                    '`Damage = (Attacker AP * 0.75) - (Defender DP * 0.5)`\n' +
                    'Minimum damage is always 1.',
                inline: false
            },
            {
                name: 'Energy System', value:
                    '- Each attack costs 10 Energy\n' +
                    '- If Energy < 10, pet cannot attack\n' +
                    '- If Energy drops too low, pet falls asleep',
                inline: false
            },
            {
                name: 'Shields', value:
                    '- Pet Shield reduces damage by 50%\n' +
                    '- Has durability (uses before breaking)\n' +
                    '- Apply with Pet Shield item',
                inline: false
            },
            {
                name: 'Death & Revival', value:
                    '- HP reaches 0 = pet faints\n' +
                    '- Use Health Kit ($3,000) to revive at 50% HP\n' +
                    '- Dead pets cannot attack or grind',
                inline: false
            }
        );
}

function createSkillsEmbed() {
    const skills = getAllSkills();

    const attackSkills = skills.filter(s => s.type === 'active');
    const passiveSkills = skills.filter(s => s.type === 'passive');

    return new EmbedBuilder()
        .setTitle('Pet Skills')
        .setColor('Purple')
        .setDescription(
            'Skills are learned from Skill Scrolls. Each pet can learn multiple skills.'
        )
        .addFields(
            {
                name: 'Attack Skills', value:
                    attackSkills.map(s => `**${s.name}** - ${s.description}`).join('\n'),
                inline: false
            },
            {
                name: 'Passive Skills', value:
                    passiveSkills.map(s => `**${s.name}** - ${s.description}`).join('\n'),
                inline: false
            },
            {
                name: 'How to Learn', value:
                    '1. Buy **Pet Skill Scroll** ($7,500) or **Legendary Skill Scroll** ($20,000)\n' +
                    '2. Use `/teach <pet_name>`\n' +
                    '3. Random scroll = random skill, Legendary = choose skill',
                inline: false
            }
        );
}

function createShopEmbed() {
    const petItems = shopItems.filter(i =>
        i.type === 'consumable' || i.type === 'skill' || i.type === 'skill_choice' || i.type === 'defense'
    ).filter(i =>
        i.name.includes('Pet') || i.name.includes('Energy') || i.name.includes('Chili') ||
        i.name.includes('Health') || i.name.includes('Skill') || i.name.includes('Training')
    );

    return new EmbedBuilder()
        .setTitle('Pet Shop Items')
        .setColor('Orange')
        .addFields(
            {
                name: 'Consumables', value:
                    '**Pet Food** ($50) - +20 Hunger\n' +
                    '**Chili Dog** ($150) - +30 Hunger, +5 Affection\n' +
                    '**Energy Drink** ($100) - +25 Energy\n' +
                    '**Health Pack** ($500) - +50 HP',
                inline: false
            },
            {
                name: 'Combat Items', value:
                    '**Pet Shield** ($1,000) - 50% damage reduction, 10 uses\n' +
                    '**Health Kit** ($3,000) - Revive dead pet at 50% HP\n' +
                    '**Training Weights** ($2,500) - +5 Defense permanently',
                inline: false
            },
            {
                name: 'Skill Scrolls', value:
                    '**Pet Skill Scroll** ($7,500) - Learn random skill\n' +
                    '**Legendary Skill Scroll** ($20,000) - Choose any skill',
                inline: false
            },
            {
                name: 'Premium Items', value:
                    '**Golden Ring** ($10,000) - +50% coin generation\n' +
                    '**Ultimate Serum** ($50,000) - +25% all base stats',
                inline: false
            }
        )
        .setFooter({ text: 'Use /shop to see all items, /buy to purchase' });
}

function createAccessoriesEmbed() {
    const accessories = shopItems.filter(i => i.type === 'accessory');

    return new EmbedBuilder()
        .setTitle('Pet Accessories')
        .setColor('Pink')
        .setDescription('Accessories are cosmetic items that can also provide stat bonuses.')
        .addFields(
            {
                name: 'Available Accessories', value:
                    accessories.map(a => {
                        let bonus = 'Cosmetic only';
                        if (a.statBonus) {
                            const parts = [];
                            if (a.statBonus.attack) parts.push(`+${a.statBonus.attack} AP`);
                            if (a.statBonus.defense) parts.push(`+${a.statBonus.defense} DP`);
                            bonus = parts.join(', ');
                        }
                        return `**${a.name}** ($${a.price.toLocaleString()}) - ${bonus}`;
                    }).join('\n'),
                inline: false
            },
            {
                name: 'How to Equip', value:
                    '1. Buy accessory from `/shop`\n' +
                    '2. Use `/equip <accessory_name> <pet_name>`\n' +
                    '3. View equipped items with `/pet`',
                inline: false
            }
        )
        .setFooter({ text: 'Accessories are permanent once equipped!' });
}
