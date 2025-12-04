require('dotenv').config();
const mongoose = require('mongoose');
const Pet = require('./src/models/Pet');
// Add other models if needed, e.g. Economy/User
// const Economy = require('./src/models/Economy'); 

const resetDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Delete all pets
        const result = await Pet.deleteMany({});
        console.log(`Deleted ${result.deletedCount} pets.`);

        // If you want to delete other collections, add them here.
        // For now, user just said "delete all data inside mongodb", which implies everything.
        // But I only have Pet model imported. Let's check if there are other models.
        
        // List all collections
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }

        console.log('Database reset complete.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

resetDb();
