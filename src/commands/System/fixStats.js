const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');

module.exports = {
    name: 'fix-stats',
    description: 'Fix pet stats to 50% (Admin only)',
    // permissionsRequired: [PermissionFlagsBits.Administrator], // Optional, but good practice
    callback: async (client, interaction) => {
        await interaction.deferReply();

        try {
            const userPets = await PetSystem.getUserPets(interaction.user.id);

            if (!userPets || userPets.length === 0) {
                return interaction.editReply("You don't have any pets to fix.");
            }

            let count = 0;
            for (const pet of userPets) {
                await PetSystem.updatePet(pet.id, (p) => {
                    // Ensure Health/Hunger are full (or keep existing if high)
                    p.stats.hunger = 100;

                    // Set others to 50
                    p.stats.happiness = 50;
                    p.stats.affection = 50;
                    p.stats.energy = 50;
                    p.stats.cleanliness = 50;

                    // Ensure maxHp is set correctly if missing
                    if (!p.maxHp) p.maxHp = p.hp || 100;
                });
                count++;
            }

            interaction.editReply(`✅ Updated ${count} pets! Stats set to 50% (except Health/Hunger).`);
        } catch (error) {
            console.error(error);
            interaction.editReply("❌ Failed to update pets.");
        }
    }
};
