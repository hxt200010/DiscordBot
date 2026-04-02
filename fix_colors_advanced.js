const fs = require('fs');
const path = require('path');

const colorMap = {
    'Blue': "'#0000FF'",
    'Grey': "'#808080'",
    'Gold': "'#FFD700'",
    'Purple': "'#800080'",
    'DarkPurple': "'#301934'",
    'Green': "'#00FF00'",
    'Yellow': "'#FFFF00'",
    'Red': "'#FF0000'",
    'Orange': "'#FFA500'",
    'Black': "'#000000'",
    'White': "'#FFFFFF'"
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/\.setColor\(([^)]+)\)/g, (match, inner) => {
        let newInner = inner;
        for (const [name, hex] of Object.entries(colorMap)) {
            // Replace 'Name' or "Name" with '#Hex'
            const regex1 = new RegExp(`'${name}'`, 'g');
            const regex2 = new RegExp(`"${name}"`, 'g');
            newInner = newInner.replace(regex1, hex);
            newInner = newInner.replace(regex2, hex);
        }
        return `.setColor(${newInner})`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
        console.log(`Updated ${file}`);
    }
}
console.log(`Fixed advanced colors in ${count} files.`);
