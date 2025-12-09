const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');
const EconomySystem = require('../../utils/EconomySystem');
const { getRandomSkill, getSkill, getAllSkills } = require('../../utils/petSkills');

module.exports = {
    name: 'teach',
    description: 'Use a Skill Scroll to teach your pet a new ability!',
    options: [
        {
            name: 'pet',
            description: 'The pet to teach',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'pet') {
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
        const petName = interaction.options.getString('pet');

        // Get pet
        const userPets = await PetSystem.getUserPets(userId);
        const pet = userPets?.find(p => p.petName.toLowerCase() === petName.toLowerCase());

        if (!pet) {
            return interaction.editReply({
                content: `❌ You don't have a pet named **${petName}**!`
            });
        }

        // Check for scrolls in inventory
        const inventory = await EconomySystem.getInventory(userId);
        const randomScroll = inventory.find(i => i.name === 'Pet Skill Scroll');
        const choiceScroll = inventory.find(i => i.name === 'Legendary Skill Scroll');

        if (!randomScroll && !choiceScroll) {
            return interaction.editReply({
                content: `❌ You don't have any Skill Scrolls!\n\nBuy from \`/shop\`:\n• **Pet Skill Scroll** ($7,500) - Random skill\n• **Legendary Skill Scroll** ($20,000) - Choose skill`
            });
        }

        // If only has random scroll OR random is preferred
        if (randomScroll && !choiceScroll) {
            return await useRandomScroll(interaction, userId, pet);
        }

        // If only has choice scroll
        if (!randomScroll && choiceScroll) {
            return await useChoiceScroll(interaction, userId, pet);
        }

        // Has both - ask which to use
        const embed = new EmbedBuilder()
            .setTitle('📜 Skill Scroll Selection')
            .setDescription(`Choose which scroll to use on **${pet.petName}**:`)
            .addFields(
                { name: '🎲 Pet Skill Scroll', value: 'Learn a random skill', inline: true },
                { name: '✨ Legendary Skill Scroll', value: 'Choose any skill', inline: true }
            )
            .setColor('Blue');

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('scroll_select')
                .setPlaceholder('Select a scroll...')
                .addOptions([
                    { label: 'Pet Skill Scroll (Random)', value: 'random', emoji: '🎲' },
                    { label: 'Legendary Skill Scroll (Choose)', value: 'choice', emoji: '✨' }
                ])
        );

        const response = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 30000,
            filter: i => i.user.id === userId
        });

        collector.on('collect', async i => {
            if (i.values[0] === 'random') {
                await i.deferUpdate();
                await useRandomScroll(i, userId, pet, true);
            } else {
                await i.deferUpdate();
                await useChoiceScroll(i, userId, pet, true);
            }
            collector.stop();
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                interaction.editReply({ content: '⏰ Selection timed out.', embeds: [], components: [] });
            }
        });
    }
};

async function useRandomScroll(interaction, userId, pet, isUpdate = false) {
    // Remove scroll from inventory
    await EconomySystem.removeItem(userId, 'Pet Skill Scroll');

    // Get random skill
    const skillName = getRandomSkill();
    const skillData = getSkill(skillName);

    // Check if pet already has this skill
    if (pet.skills && pet.skills.includes(skillName)) {
        // Refund with different skill
        let attempts = 0;
        let newSkill = skillName;
        while (pet.skills.includes(newSkill) && attempts < 20) {
            newSkill = getRandomSkill();
            attempts++;
        }

        if (pet.skills.includes(newSkill)) {
            // Pet knows all skills!
            await EconomySystem.addItem(userId, { name: 'Pet Skill Scroll', type: 'skill', tier: 'medium', price: 7500 });
            const embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle('🎓 Master of All!')
                .setDescription(`**${pet.petName}** already knows ALL available skills!\n\nYour scroll has been refunded.`);

            return isUpdate
                ? interaction.editReply({ embeds: [embed], components: [] })
                : interaction.editReply({ embeds: [embed] });
        }
    }

    // Teach the skill
    await PetSystem.updatePet(pet.id, (p) => {
        if (!p.skills) p.skills = [];
        p.skills.push(skillName);
    });

    const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('📜 Skill Learned!')
        .setDescription(
            `**${pet.petName}** learned a new skill!\n\n` +
            `━━━━━━━━━━━━━━━━━\n` +
            `${skillData.emoji} **${skillData.name}**\n` +
            `━━━━━━━━━━━━━━━━━\n\n` +
            `*${skillData.description}*`
        )
        .addFields({
            name: '📚 Current Skills',
            value: [...(pet.skills || []), skillName].join(', ') || 'None',
            inline: false
        })
        .setFooter({ text: `Type: ${skillData.type.charAt(0).toUpperCase() + skillData.type.slice(1)}` });

    return isUpdate
        ? interaction.editReply({ embeds: [embed], components: [] })
        : interaction.editReply({ embeds: [embed] });
}

async function useChoiceScroll(interaction, userId, pet, isUpdate = false) {
    const allSkills = getAllSkills();
    const learnedSkills = pet.skills || [];

    // Filter out already learned skills
    const availableSkills = allSkills.filter(s => !learnedSkills.includes(s.name));

    if (availableSkills.length === 0) {
        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🎓 Master of All!')
            .setDescription(`**${pet.petName}** already knows ALL available skills!`);

        return isUpdate
            ? interaction.editReply({ embeds: [embed], components: [] })
            : interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
        .setTitle('✨ Choose a Skill')
        .setDescription(`Select a skill to teach **${pet.petName}**:`)
        .setColor('Purple');

    const options = availableSkills.slice(0, 25).map(skill => ({
        label: skill.name,
        value: skill.name,
        description: skill.description.substring(0, 100),
        emoji: skill.emoji
    }));

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('skill_select')
            .setPlaceholder('Choose a skill...')
            .addOptions(options)
    );

    const response = await (isUpdate
        ? interaction.editReply({ embeds: [embed], components: [row] })
        : interaction.editReply({ embeds: [embed], components: [row] }));

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
        filter: i => i.user.id === userId
    });

    collector.on('collect', async i => {
        await i.deferUpdate();

        const selectedSkill = i.values[0];
        const skillData = getSkill(selectedSkill);

        // Remove scroll
        await EconomySystem.removeItem(userId, 'Legendary Skill Scroll');

        // Teach skill
        await PetSystem.updatePet(pet.id, (p) => {
            if (!p.skills) p.skills = [];
            p.skills.push(selectedSkill);
        });

        const resultEmbed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('✨ Skill Mastered!')
            .setDescription(
                `**${pet.petName}** learned:\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `${skillData.emoji} **${skillData.name}**\n` +
                `━━━━━━━━━━━━━━━━━\n\n` +
                `*${skillData.description}*`
            )
            .addFields({
                name: '📚 Current Skills',
                value: [...(pet.skills || []), selectedSkill].join(', '),
                inline: false
            });

        await i.editReply({ embeds: [resultEmbed], components: [] });
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.editReply({ content: '⏰ Skill selection timed out.', embeds: [], components: [] });
        }
    });
}
