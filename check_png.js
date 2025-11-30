const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/Images/amy_pet.png');

try {
    const buffer = fs.readFileSync(filePath);
    const header = buffer.slice(0, 8);
    console.log('Header:', header.toString('hex'));
    
    const pngSignature = '89504e470d0a1a0a';
    if (header.toString('hex') === pngSignature) {
        console.log('Valid PNG signature.');
    } else {
        console.error('Invalid PNG signature.');
    }
} catch (err) {
    console.error('Error reading file:', err);
}
