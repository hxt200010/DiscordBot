const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const PetSystem = require('../../utils/PetSystem');

const cooldowns = new Map();

module.exports = {
    name: 'attack',
    description: 'Command your pet to attack another user\'s pet!',
    options: [
        {
            name: 'target',
            description: 'The user you want to attack',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'pet',
            description: 'Which of your pets is attacking? (Optional if you have one)',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
        },
        {
            name: 'target_pet',
            description: 'Name of the opponent\'s pet to attack (Optional - Random if empty)',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'pet') {
            const userPets = await PetSystem.getUserPets(interaction.user.id);
            if (!userPets || userPets.length === 0) return interaction.respond([]);
            const options = userPets.map(pet => ({ name: `${pet.petName} (${pet.type})`, value: pet.petName }));
            const filtered = options.filter(opt => opt.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
            await interaction.respond(filtered.slice(0, 25));
        }
    },
    callback: async (client, interaction) => {
        // Cooldown Check (30 mins) - Disabled for testing as per request
        /*
        const userId = interaction.user.id;
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + (30 * 60 * 1000);
            if (Date.now() < expirationTime) {
                const timeLeft = ((expirationTime - Date.now()) / 1000 / 60).toFixed(1);
                return interaction.reply({ content: `⏳ Your pets are tired. Wait ${timeLeft} minutes.`, ephemeral: true });
            }
        }
        */

        await interaction.deferReply();

        const attackerId = interaction.user.id;
        const targetUser = interaction.options.getUser('target');
        const targetId = targetUser.id;

        if (attackerId === targetId) {
            return interaction.editReply("❌ You cannot attack yourself!");
        }

        // Get Attacker Pet
        const attackerPets = await PetSystem.getUserPets(attackerId);
        if (!attackerPets || attackerPets.length === 0) {
            return interaction.editReply("❌ You don't have a pet to attack with!");
        }

        let attackerPet = null;
        const selectedPetName = interaction.options.getString('pet');
        if (selectedPetName) {
            attackerPet = attackerPets.find(p => p.petName === selectedPetName);
            if (!attackerPet) return interaction.editReply(`❌ You don't own a pet named **${selectedPetName}**.`);
        } else {
            if (attackerPets.length === 1) {
                attackerPet = attackerPets[0];
            } else {
                return interaction.editReply("❌ You have multiple pets! Please select which one to attack with.");
            }
        }

        // Get Defender Pet
        const targetPets = await PetSystem.getUserPets(targetId);
        if (!targetPets || targetPets.length === 0) {
            return interaction.editReply(`❌ **${targetUser.username}** doesn't have any pets to attack!`);
        }

        // Find alive pets
        const alivePets = targetPets.filter(p => !p.isDead);
        if (alivePets.length === 0) {
            return interaction.editReply(`❌ All of **${targetUser.username}**'s pets are fainted!`);
        }

        let defenderPet = null;
        const targetPetName = interaction.options.getString('target_pet');

        if (targetPetName) {
            // Specific Target
            defenderPet = alivePets.find(p => p.petName.toLowerCase() === targetPetName.toLowerCase());
            if (!defenderPet) {
                return interaction.editReply(`❌ **${targetUser.username}** doesn't have an alive pet named **${targetPetName}**.`);
            }
        } else {
            // Random Target
            const randomIndex = Math.floor(Math.random() * alivePets.length);
            defenderPet = alivePets[randomIndex];
        }

        // --- CHECKS ---

        // 1. Attacker Alive?
        if (attackerPet.isDead) {
            return interaction.editReply(`❌ **${attackerPet.petName}** is fainted and cannot attack! Revive it first.`);
        }

        // 2. Attacker Awake?
        if (attackerPet.isSleeping) {
            if (attackerPet.sleepUntil && Date.now() < attackerPet.sleepUntil) {
                const remaining = Math.ceil((attackerPet.sleepUntil - Date.now()) / 60000);
                return interaction.editReply(`💤 **${attackerPet.petName}** is exhausted and sleeping for ${remaining} more minutes.`);
            } else {
                // Woke up naturally
                attackerPet.isSleeping = false;
                attackerPet.sleepUntil = null;
                // Update DB? We'll update at the end or now. 
                // Let's just proceed, and the final update will clear the sleep flag if we don't set it again.
            }
        }

        // 3. Attacker Energy >= 10?
        if (attackerPet.stats.energy < 10) {
            return interaction.editReply(`⚠️ **${attackerPet.petName}** is too tired (Energy < 10) to attack! Feed or let it sleep.`);
        }

        // --- COMBAT LOGIC ---

        // Stats
        const AP = attackerPet.attack || 10;
        const DP = defenderPet.defense || 10;

        // Damage Formula
        const rawDamage = AP * 0.75;
        const defenseReduction = DP * 0.5;
        let netDamage = Math.max(1, Math.floor(rawDamage - defenseReduction));

        // Shield Logic
        let shieldMessage = "";
        if (defenderPet.shield > 0) {
            netDamage = Math.floor(netDamage * 0.5); // 50% reduction
            defenderPet.shield -= 1;
            shieldMessage = `\n🛡️ **${defenderPet.petName}**'s shield absorbed 50% damage! (${defenderPet.shield} durability left)`;
            if (defenderPet.shield <= 0) {
                defenderPet.shield = 0;
                shieldMessage += "\n💥 The shield broke!";
            }
        }

        // Apply Damage
        defenderPet.hp -= netDamage;
        let faintMessage = "";
        if (defenderPet.hp <= 0) {
            defenderPet.hp = 0;
            defenderPet.isDead = true;
            faintMessage = `\n💀 **${defenderPet.petName}** fainted!`;
        }

        // Energy Consumption
        attackerPet.stats.energy -= 10;
        let sleepMessage = "";
        
        // Forced Sleep Check
        if (attackerPet.stats.energy < 10) {
            attackerPet.isSleeping = true;
            
            // Stop Grinding if active
            if (attackerPet.isWorking) {
                const { applyWorkGains } = require('../../utils/petUtils');
                const EconomySystem = require('../../utils/EconomySystem');
                const gains = applyWorkGains(attackerPet);
                attackerPet.isWorking = false;
                attackerPet.lastWorkUpdate = null;
                await EconomySystem.addBalance(attackerId, gains.coins);
                sleepMessage += `\n🛑 **Stopped Grinding**: Collected ${gains.coins} coins.`;
            }

            // Duration based on how drained? 
            // "The lower its remaining Energy... the longer it will need to sleep"
            // Let's say: Base 1 hour + (10 - Energy) * 10 minutes.
            // If Energy drops to 9: 60 + 10 = 70 mins.
            // If Energy drops to 0: 60 + 100 = 160 mins.
            const energyDeficit = 10 - attackerPet.stats.energy;
            const sleepMinutes = 60 + (energyDeficit * 10);
            attackerPet.sleepUntil = Date.now() + (sleepMinutes * 60 * 1000);
            attackerPet.sleepStart = Date.now();
            sleepMessage += `\n💤 **${attackerPet.petName}** collapsed from exhaustion! Sleeping for ${sleepMinutes} minutes.`;
        }

        // --- UPDATE DB ---
        
        // Update Attacker
        await PetSystem.updatePet(attackerPet.id, (p) => {
            p.stats.energy = attackerPet.stats.energy;
            p.isSleeping = attackerPet.isSleeping;
            p.sleepUntil = attackerPet.sleepUntil;
            p.sleepStart = attackerPet.sleepStart;
            p.isWorking = attackerPet.isWorking;
            p.lastWorkUpdate = attackerPet.lastWorkUpdate;
        });

        // Update Defender
        await PetSystem.updatePet(defenderPet.id, (p) => {
            p.stats.health = defenderPet.hp;
            p.isDead = defenderPet.isDead;
            p.shield = defenderPet.shield;
        });

        // Set Cooldown (disabled for now, but logic is here)
        // cooldowns.set(interaction.user.id, Date.now());

        // Response
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ Battle: ${attackerPet.petName} vs ${defenderPet.petName}`)
            .setColor(defenderPet.isDead ? 'Red' : 'Orange')
            .setDescription(
                `**${attackerPet.petName}** attacked with **${AP} AP**!\n` +
                `**${defenderPet.petName}** defended with **${DP} DP**.\n\n` +
                `💥 **Damage Dealt:** ${netDamage}\n` +
                `${shieldMessage}` +
                `\n📉 **${defenderPet.petName} HP:** ${defenderPet.hp}/${defenderPet.maxHp}` +
                `${faintMessage}` +
                `\n\n⚡ **${attackerPet.petName} Energy:** ${attackerPet.stats.energy} (-10)` +
                `${sleepMessage}`
            )
            .setTimestamp();

        interaction.editReply({ embeds: [embed] });
    }
};
