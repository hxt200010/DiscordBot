require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/utils/Database');
const EconomySystem = require('./src/utils/EconomySystem');
const PetSystem = require('./src/utils/PetSystem');

async function test() {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected!');

    const testUserId = 'test_user_12345';

    try {
        // 1. Test Economy
        console.log('\n--- Testing Economy ---');

        // Get initial balance
        const initialBalance = await EconomySystem.getBalance(testUserId);
        console.log(`Initial Balance: ${initialBalance}`);

        // Add Balance
        const newBalance = await EconomySystem.addBalance(testUserId, 500);
        console.log(`Added 500. New Balance: ${newBalance}`);

        if (newBalance !== initialBalance + 500) {
            console.error('❌ Balance mismatch!');
        } else {
            console.log('✅ Balance update successful.');
        }

        // 2. Test Inventory
        console.log('\n--- Testing Inventory ---');
        await EconomySystem.addItem(testUserId, { name: 'Test Item', price: 100, description: 'A test item' });
        const inventory = await EconomySystem.getInventory(testUserId);
        console.log(`Inventory count: ${inventory.length}`);

        const hasItem = inventory.some(i => i.name === 'Test Item');
        if (hasItem) {
            console.log('✅ Item added successfully.');
        } else {
            console.error('❌ Item not found in inventory!');
        }

        // 3. Test Pets
        console.log('\n--- Testing Pets ---');
        const petData = {
            petName: 'TestPet',
            type: 'dog',
            stats: { hunger: 50, happiness: 50 }
        };

        const petId = await PetSystem.addPet(testUserId, petData);
        console.log(`Pet created with ID: ${petId}`);

        const pets = await PetSystem.getUserPets(testUserId);
        console.log(`User pets count: ${pets.length}`);

        const myPet = pets.find(p => p.id === petId);
        if (myPet) {
            console.log(`✅ Pet found: ${myPet.petName} (${myPet.type})`);
        } else {
            console.error('❌ Pet not found!');
        }

        // 4. Cleanup
        console.log('\n--- Cleanup ---');
        // We can manually delete the test user data if we want, but for now let's just leave it or delete it.
        // Let's delete to keep it clean.

        const User = require('./src/models/User');
        const Inventory = require('./src/models/Inventory');
        const Pet = require('./src/models/Pet');

        await User.deleteOne({ userId: testUserId });
        await Inventory.deleteMany({ userId: testUserId });
        await Pet.deleteMany({ userId: testUserId });
        console.log('✅ Test data cleaned up.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
    }
}

test();
