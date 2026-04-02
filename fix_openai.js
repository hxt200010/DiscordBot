const fs = require('fs');
const path = require('path');

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

    // 1. Replace Imports
    content = content.replace(/const \{ Configuration, OpenAIApi \} = require\(['"]openai['"]\);/g, "const { OpenAI } = require('openai');");

    // 2. Replace Client setup (capture inside object params)
    content = content.replace(/const configuration = new Configuration\(\{([\s\S]*?)\}\);\s*const openai = new OpenAIApi\(configuration\);/g, "const openai = new OpenAI({$1});");

    // 3. Replace method calls
    content = content.replace(/openai\.createChatCompletion/g, 'openai.chat.completions.create');

    // 4. Update data parsing
    content = content.replace(/\.data\.choices/g, '.choices');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Updated OpenAI syntax in ${changedCount} files.`);
