const fs = require('fs');
const path = require('path');
const adopt = require('./src/commands/Fun/adopt');
const sellPet = require('./src/commands/Fun/sellPet');
const economySystem = require('./src/utils/EconomySystem');

// Mock Interaction with Collector Support
class MockInteraction {
    constructor(userId, options = {}) {
        this.user = { id: userId };
        this.options = {
            getString: (name) => options[name],
            getFocused: () => ''
        };
        this.replies = [];
        this.collectors = [];
    }

    async deferReply() { }
    async editReply(content) {
        this.replies.push(content);
        return {
            createMessageComponentCollector: (options) => {
                const collector = {
                    on: (event, callback) => {
                        if (event === 'collect') this.collectCallback = callback;
                    },
                    stop: () => { }
                };
                this.collectors.push(collector);
                return collector;
            }
        };
    }
    async reply(content) {
        this.replies.push(content);
    }
}

// Mock Button Interaction
class MockButtonInteraction {
    constructor(customId, userId) {
        this.customId = customId;
        this.user = { id: userId };
    }
    async update(content) {
        // console.log(`Button Update (${this.customId}):`, content.content || "Embed Updated");
    }
    async reply(content) {
        // console.log(`Button Reply (${this.customId}):`, content.content);
    }
}

// Setup Test Data
const testUserId = 'test_user_sell_confirm';
const petsFile = path.join(__dirname, 'src/data/pets.json');
const economyFile = path.join(__dirname, 'src/data/economy.json');

// Reset Data
if (fs.existsSync(petsFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(petsFile));
        delete data[testUserId];
        fs.writeFileSync(petsFile, JSON.stringify(data, null, 2));
    } catch (e) { }
}
if (fs.existsSync(economyFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(economyFile));
        delete data[testUserId];
        fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
    } catch (e) { }
}

economySystem.addBalance(testUserId, 10000);

async function runTests() {
    console.log("--- Starting Verification ---");

    try {
        // 1. Adopt Pet (Cost 0)
        console.log("\n1. Adopting Pet...");
        const iAdopt = new MockInteraction(testUserId, { character: 'sonic', name: 'PetToSell' });
        await adopt.callback(null, iAdopt);
        if (iAdopt.collectCallback) await iAdopt.collectCallback(new MockButtonInteraction('confirm_adopt', testUserId));

        // 2. Initiate Sell
        console.log("\n2. Initiating Sell...");
        const iSell = new MockInteraction(testUserId, { pet: 'PetToSell' });
        await sellPet.callback(null, iSell);

        // Check for confirmation embed
        const confirmMsg = iSell.replies[0];
        if (confirmMsg.embeds && confirmMsg.embeds[0].data.title === '⚠️ Confirm Sale') {
            console.log("PASSED: Sell Confirmation Embed shown");
            console.log("Description:", confirmMsg.embeds[0].data.description);
        } else {
            console.error("FAILED: Sell Confirmation Embed not shown");
            return;
        }

        // 3. Click Confirm
        console.log("\n3. Clicking Confirm Sale...");
        if (iSell.collectCallback) {
            const btn = new MockButtonInteraction('confirm_sell', testUserId);
            await iSell.collectCallback(btn);

            // Verify Pet Removed
            const data = JSON.parse(fs.readFileSync(petsFile));
            const userPets = data[testUserId];
            if (!userPets || userPets.length === 0) {
                console.log("PASSED: Pet sold after confirmation");
            } else {
                console.error("FAILED: Pet not sold");
            }
        } else {
            console.error("FAILED: Collector not set up");
        }

    } catch (error) {
        console.error("TEST FAILED:", error);
    }

    console.log("\n--- Verification Complete ---");
}

runTests();
