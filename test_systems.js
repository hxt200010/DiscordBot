const EconomySystem = require('./src/utils/EconomySystem');
const PetSystem = require('./src/utils/PetSystem');

const testUserId = 'test_user_verification';

console.log('--- Testing EconomySystem ---');
console.log('Initial Balance:', EconomySystem.getBalance(testUserId));
EconomySystem.addBalance(testUserId, 100);
console.log('Balance after adding 100:', EconomySystem.getBalance(testUserId));
EconomySystem.removeBalance(testUserId, 50);
console.log('Balance after removing 50:', EconomySystem.getBalance(testUserId));

console.log('--- Testing PetSystem ---');
const newPet = {
    id: 'test_pet_id',
    petName: 'TestPet',
    type: 'dog',
    stats: { hunger: 50, happiness: 50 },
    xp: 0,
    level: 1
};

PetSystem.addPet(testUserId, newPet);
console.log('Pet added.');

const pets = PetSystem.getUserPets(testUserId);
console.log('User Pets:', pets.length);
console.log('Pet Name:', pets[0].petName);

PetSystem.updatePet('test_pet_id', (p) => {
    p.xp += 10;
});
const updatedPet = PetSystem.getPet('test_pet_id');
console.log('Updated Pet XP:', updatedPet.xp);

PetSystem.removePet('test_pet_id');
console.log('Pet removed.');
const petsAfter = PetSystem.getUserPets(testUserId);
console.log('User Pets after removal:', petsAfter.length);

console.log('--- Verification Complete ---');
