const fs = require('fs');
const path = require('path');
const adopt = require('./src/commands/Fun/adopt');
const pet = require('./src/commands/Fun/pet');
const petAction = require('./src/commands/Fun/petAction');
const sellPet = require('./src/commands/Fun/sellPet');
const economySystem = require('./src/utils/EconomySystem');

// Mock Interaction
class MockInteraction {
    constructor(userId, options = {}) {
        this.user = { id: userId };
        this.options = {
            getString: (name) => options[name],
            getFocused: () => ''
        };
        this.replies = [];
    }

    async deferReply() { }
    async editReply(content) {
        this.replies.push(content);
        return {
            createMessageComponentCollector: () => ({ on: () => { } })
        };
    }
    async reply(content) {
        this.replies.push(content);
    }
}

// Setup Test Data
const testUserId = 'test_user_multi_pet';
const petsFile = path.join(__dirname, 'src/data/pets.json');
const economyFile = path.join(__dirname, 'src/data/economy.json');

// Reset Data
if (fs.existsSync(petsFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(petsFile));
        delete data[testUserId];
        fs.writeFileSync(petsFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error resetting pets:", e);
    }
}

// Give money
economySystem.addBalance(testUserId, 10000);

async function runTests() {
    console.log("--- Starting Verification ---");

    try {
        // 1. Adopt First Pet (Free)
        console.log("\n1. Adopting First Pet (Shadow)...");
        const i1 = new MockInteraction(testUserId, { character: 'shadow', name: 'Shadow1' });
        await adopt.callback(null, i1);
        if (!i1.replies[0]) throw new Error("No reply from adopt 1");
        console.log("Result:", i1.replies[0].embeds?.[0]?.data?.description || i1.replies[0].content);

        // Check Price
        const field1 = i1.replies[0].embeds?.[0]?.data?.fields?.find(f => f.name === 'Cost');
        console.log("Cost:", field1?.value);

        // 2. Adopt Second Pet ($1000)
        console.log("\n2. Adopting Second Pet (Sonic)...");
        const i2 = new MockInteraction(testUserId, { character: 'sonic', name: 'Sonic1' });
        await adopt.callback(null, i2);
        if (!i2.replies[0]) throw new Error("No reply from adopt 2");
        console.log("Result:", i2.replies[0].embeds?.[0]?.data?.description || i2.replies[0].content);

        // Check Price
        const field2 = i2.replies[0].embeds?.[0]?.data?.fields?.find(f => f.name === 'Cost');
        console.log("Cost:", field2?.value);

        // 3. List Pets
        console.log("\n3. Listing Pets...");
        const i3 = new MockInteraction(testUserId, {});
        await pet.callback(null, i3);
        const desc = i3.replies[0].embeds?.[0]?.data?.description;
        console.log("Description:", desc);
        const fields = i3.replies[0].embeds?.[0]?.data?.fields;
        console.log("Pets Listed:", fields?.length);

        // 4. Pet Action (Specific Pet)
        console.log("\n4. Feeding Shadow1...");
        // Give food first
        economySystem.addItem(testUserId, { name: 'Pet Food', price: 20 });

        const i4 = new MockInteraction(testUserId, { action: 'feed', pet: 'Shadow1' });
        await petAction.callback(null, i4);
        console.log("Action Result:", i4.replies[0].embeds?.[0]?.data?.description || i4.replies[0].content);

        // 5. Pet Action (All Pets)
        console.log("\n5. Grinding All Pets...");
        const i5 = new MockInteraction(testUserId, { action: 'grind', pet: 'all_pets' });
        await petAction.callback(null, i5);
        console.log("Action Result:", i5.replies[0].embeds?.[0]?.data?.description || i5.replies[0].content);

        // Verify both are working
        const petsData = JSON.parse(fs.readFileSync(petsFile));
        const userPets = petsData[testUserId];
        console.log("Shadow1 Working:", userPets.find(p => p.petName === 'Shadow1').isWorking);
        console.log("Sonic1 Working:", userPets.find(p => p.petName === 'Sonic1').isWorking);

        // 6. Sell Pet
        console.log("\n6. Selling Sonic1...");
        const i6 = new MockInteraction(testUserId, { confirm: 'confirm', pet: 'Sonic1' });
        await sellPet.callback(null, i6);
        console.log("Sell Result:", i6.replies[0].embeds?.[0]?.data?.description || i6.replies[0].content);

        // Verify removal
        const petsDataAfter = JSON.parse(fs.readFileSync(petsFile));
        const userPetsAfter = petsDataAfter[testUserId];
        console.log("Pets remaining:", userPetsAfter.length);
        console.log("Remaining pet:", userPetsAfter[0].petName);

    } catch (error) {
        console.error("TEST FAILED:", error);
    }

    console.log("\n--- Verification Complete ---");
}

runTests();
