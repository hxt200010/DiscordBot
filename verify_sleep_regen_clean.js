const mongoose = require('mongoose');
const Pet = require('./src/models/Pet');
const PetSystem = require('./src/utils/PetSystem');
require('dotenv').config();

const createMockInteraction = (user, options = {}) => ({
    user: user,
    options: {
        getString: (name) => options.stringOptions ? options.stringOptions[name] : null,
        getFocused: () => ''
    },
    reply: async () => {}, // Silence
    editReply: async () => {}, // Silence
    deferReply: async () => {}, // Silence
    respond: async () => {} // Silence
});

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const userA = { id: `test_user_${Date.now()}`, username: 'SleepyUser' };
        await Pet.deleteMany({ userId: userA.id });
        await PetSystem.addPet(userA.id, { petName: 'SleepyPet', type: 'cat', stats: { energy: 50 } });
        
        const petActionCmd = require('./src/commands/Fun/petAction');

        // 1. Sleep
        await petActionCmd.callback(null, createMockInteraction(userA, { stringOptions: { action: 'sleep', pet: 'SleepyPet' } }));

        // 2. Simulate Time
        let pet = (await PetSystem.getUserPets(userA.id))[0];
        await PetSystem.updatePet(pet.id, (p) => {
            p.sleepStart = Date.now() - (10 * 60 * 1000);
            p.isSleeping = true; // Ensure sleeping
        });

        // Wait for cooldown
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 3. Wake
        await petActionCmd.callback(null, createMockInteraction(userA, { stringOptions: { action: 'wake', pet: 'SleepyPet' } }));

        // 4. Check Energy
        pet = (await PetSystem.getUserPets(userA.id))[0];
        console.log(`FINAL ENERGY: ${pet.stats.energy}`);
        if (pet.stats.energy >= 60) console.log("SUCCESS: Energy increased.");
        else console.log("FAILURE: Energy did not increase.");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
