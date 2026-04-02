const fs = require('fs');
const path = require('path');

const colorMap = {
    'random': 'Math.floor(Math.random() * 16777215)',
    'blue': "'#0000FF'",
    'red': "'#FF0000'",
    'green': "'#00FF00'",
    'yellow': "'#FFFF00'",
    'gold': "'#FFD700'",
    'orange': "'#FFA500'",
    'purple': "'#800080'",
    'aqua': "'#00FFFF'",
    'darkblue': "'#00008B'",
    'darkgreen': "'#006400'",
    'darkred': "'#8B0000'",
    'fuchsia': "'#FF00FF'",
    'grey': "'#808080'",
    'white': "'#FFFFFF'",
    'black': "'#000000'"
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Match .setColor('...') or .setColor("...")
    content = content.replace(/\.setColor\(['"]([A-Za-z]+)['"]\)/g, (match, color) => {
        const lowerColor = color.toLowerCase();
        if (colorMap[lowerColor]) {
            return `.setColor(${colorMap[lowerColor]})`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedCount++;
    }
}

console.log(`Updated colors in ${changedCount} files.`);
