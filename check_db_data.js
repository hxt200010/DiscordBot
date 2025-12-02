const db = require('./src/utils/Database');

const pets = db.prepare('SELECT * FROM pets').all();
console.log(`Checking ${pets.length} pets...`);

let issues = 0;
for (const pet of pets) {
    if (!pet.pet_name || typeof pet.pet_name !== 'string') {
        console.log(`Invalid Name for pet ${pet.id}:`, pet.pet_name);
        issues++;
    }
    if (!pet.type) {
        console.log(`Invalid Type for pet ${pet.id}:`, pet.type);
        issues++;
    }
    try {
        JSON.parse(pet.stats);
    } catch (e) {
        console.log(`Invalid JSON stats for pet ${pet.id}:`, pet.stats);
        issues++;
    }
}

console.log(`Found ${issues} issues.`);
