const fs = require('fs');
const path = require('path');
const petConfig = require('./src/utils/petConfig');

console.log('Current directory:', __dirname);
console.log('Pet Config:', petConfig);

const embeds = [];
const files = [];

// Mocking __dirname as if we are in src/commands/Fun
const mockDirName = path.join(__dirname, 'src/commands/Fun');
console.log('Mock __dirname:', mockDirName);

for (const pet of petConfig) {
    console.log(`Processing pet: ${pet.name} (${pet.value})`);
    
    // Find image
    const extensions = ['.png', '.jpg', '.jpeg'];
    let imagePath = null;
    let fileName = null;

    for (const ext of extensions) {
        // logic from petList.js: path.join(__dirname, `../../Images/${pet.value}_pet${ext}`)
        const testPath = path.join(mockDirName, `../../Images/${pet.value}_pet${ext}`);
        console.log(`  Checking path: ${testPath}`);
        if (fs.existsSync(testPath)) {
            console.log(`  Found file: ${testPath}`);
            imagePath = testPath;
            fileName = `${pet.value}_pet${ext}`;
            break;
        }
    }

    if (imagePath) {
        console.log(`  Adding attachment: ${fileName}`);
        files.push(imagePath);
    } else {
        console.error(`  ERROR: Image not found for ${pet.name}`);
    }
}

console.log('Final files array:', files);
