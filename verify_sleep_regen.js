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
    editReply: async (msg) => console.log(`[${user.username} EditReply]:`, msg.embeds ? msg.embeds[0].description : msg),
    deferReply: async () => console.log(`[${user.username} Defer]`),
    respond: async (data) => console.log(`[${user.username} Respond]:`, data)
});

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const userA = { id: `test_user_${Date.now()}`, username: 'SleepyUser' };

        // Cleanup
        await Pet.deleteMany({ userId: userA.id });

        // Create Pet
        console.log("\n--- Creating Pet ---");
        await PetSystem.addPet(userA.id, { petName: 'SleepyPet', type: 'cat', stats: { energy: 50 } });
        
        const petActionCmd = require('./src/commands/Fun/petAction');

        // Test 1: Start Sleeping
        console.log("\n--- Test 1: Start Sleeping ---");
        await petActionCmd.callback(null, createMockInteraction(userA, { 
            stringOptions: { action: 'sleep', pet: 'SleepyPet' } 
        }));

        // Simulate time passing (modify DB directly)
        let pet = (await PetSystem.getUserPets(userA.id))[0];
        console.log("Simulating 10 minutes passing...");
        await PetSystem.updatePet(pet.id, (p) => {
            p.sleepStart = Date.now() - (10 * 60 * 1000); // 10 mins ago
            p.isSleeping = true;
        });

        pet = (await PetSystem.getUserPets(userA.id))[0];
        console.log(`[DEBUG] Pet sleepStart: ${pet.sleepStart}, Current: ${Date.now()}`);

        // Wait for cooldown
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Test 2: Wake Up
        console.log("\n--- Test 2: Wake Up ---");
        await petActionCmd.callback(null, createMockInteraction(userA, { 
            stringOptions: { action: 'wake', pet: 'SleepyPet' } 
        }));

        pet = (await PetSystem.getUserPets(userA.id))[0];
        console.log(`Energy: ${pet.stats.energy} (Expected ~60)`);

        // Test 3: Forced Sleep (Attack simulation)
        console.log("\n--- Test 3: Forced Sleep Wake Attempt ---");
        await PetSystem.updatePet(pet.id, (p) => {
            p.isSleeping = true;
            p.sleepStart = Date.now();
            p.sleepUntil = Date.now() + 600000; // 10 mins forced
        });

        await petActionCmd.callback(null, createMockInteraction(userA, { 
            stringOptions: { action: 'wake', pet: 'SleepyPet' } 
        }));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
