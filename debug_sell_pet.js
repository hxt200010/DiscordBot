const sellPet = require('./src/commands/Fun/sellPet');
const PetSystem = require('./src/utils/PetSystem');

// Mock Interaction
const mockInteraction = {
    user: { id: '704744682080567306' }, // Real user ID from migration
    options: {
        getFocused: () => '' // Simulate empty search first
    },
    respond: async (options) => {
        console.log('Respond called with:', JSON.stringify(options, null, 2));
    }
};

async function runDebug() {
    console.log('--- Debugging Sell Pet Autocomplete ---');

    // Ensure we have a pet for this user first
    const pets = PetSystem.getUserPets(mockInteraction.user.id);
    if (pets.length === 0) {
        console.log('Adding a test pet...');
        PetSystem.addPet(mockInteraction.user.id, {
            petName: 'DebugPet',
            type: 'cat',
            stats: { hunger: 50 },
            xp: 0,
            level: 1
        });
    }

    try {
        await sellPet.autocomplete(null, mockInteraction);
    } catch (error) {
        console.error('Error in autocomplete:', error);
    }
}

runDebug();
