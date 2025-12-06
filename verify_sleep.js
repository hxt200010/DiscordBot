const mongoose = require('mongoose');
const Pet = require('./src/models/Pet');
const PetSystem = require('./src/utils/PetSystem');
require('dotenv').config();

// Mock Interaction
const createMockInteraction = (user, options = {}) => ({
    user: user,
    options: {
        getString: (name) => options.stringOptions ? options.stringOptions[name] : null,
        getFocused: () => ''
    },
    reply: async (msg) => console.log(`[${user.username} Reply]:`, msg),
    editReply: async (msg) => console.log(`[${user.username} EditReply]:`, JSON.stringify(msg, null, 2)),
    deferReply: async () => console.log(`[${user.username} Defer]`),
    respond: async (data) => console.log(`[${user.username} Respond]:`, data)
});

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const userA = { id: 'test_user_sleep', username: 'SleepyUser' };

        // Cleanup
        await Pet.deleteMany({ userId: userA.id });

        // Create Pet
        console.log("\n--- Creating Pet ---");
        await PetSystem.addPet(userA.id, { petName: 'SleepyPet', type: 'cat', stats: { energy: 5 } });
        
        let pet = (await PetSystem.getUserPets(userA.id))[0];
        
        // Force Sleep
        console.log("Forcing sleep...");
        await PetSystem.updatePet(pet.id, (p) => {
            p.isSleeping = true;
            p.sleepUntil = Date.now() + 600000; // 10 mins
        });

        const petActionCmd = require('./src/commands/Fun/petAction');

        // Test: Try to Play
        console.log("\n--- Test: Try to Play while Sleeping ---");
        await petActionCmd.callback(null, createMockInteraction(userA, { 
            stringOptions: { action: 'play', pet: 'SleepyPet' } 
        }));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
