const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

// ============ ALGORITHM CODE SNIPPETS ============
const algorithms = {
    ascending: `// Sorting in ascending order (Bubble Sort)
for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] > numbers[j]) {
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
    }
}`,
    descending: `// Sorting in descending order (Bubble Sort)
for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] < numbers[j]) {
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
    }
}`,
    biggest: `let biggestNumber = numbers[0]; 
for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > biggestNumber) {
        biggestNumber = numbers[i]; 
    }
}`,
    smallest: `let smallestNumber = numbers[0]; 
for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] < smallestNumber) {
        smallestNumber = numbers[i]; 
    }
}`,
    binarySearch: `while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (numbers[mid] === target) {
        return mid; // Found
    } else if (numbers[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}`,
    exponentialSearch: `let bound = 1;
while (bound < numbers.length && numbers[bound] < target) {
    bound *= 2;
}
// Then binary search in range [bound/2, min(bound, n-1)]`,
    roman: `function romanToInt(s) {
    const map = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000};
    let result = 0, prev = 0;
    for (let i = s.length - 1; i >= 0; i--) {
        result += map[s[i]] >= prev ? map[s[i]] : -map[s[i]];
        prev = map[s[i]];
    }
    return result;
}`,
    stock: `let profit = 0;
for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
        profit += prices[i] - prices[i - 1];
    }
}`,
    removeDuplicate: `let l = 0, r = 0;
while (r < array.length) {
    let count = 1;
    while (r+1 < array.length && array[r] === array[r+1]) {
        r++; count++;
    }
    for (let i = 0; i < Math.min(2, count); i++) {
        array[l++] = array[r];
    }
    r++;
}`,
    removeElement: `let index = 0;
for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) {
        nums[index++] = nums[i];
    }
}`,
    smallestMissing: `// Cyclic sort approach - O(n) time, O(1) space
let i = 0;
while (i < n) {
    const correctPos = nums[i] - 1;
    if (nums[i] >= 1 && nums[i] <= n && nums[correctPos] !== nums[i]) {
        [nums[i], nums[correctPos]] = [nums[correctPos], nums[i]];
    } else { i++; }
}
// Find first missing
for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
}`
};

// ============ HELPER FUNCTIONS ============
class Graph {
    constructor() { this.vertices = new Map(); }
    addVertex(v) { if (!this.vertices.has(v)) this.vertices.set(v, []); }
    addEdge(v1, v2) { this.vertices.get(v1).push(v2); this.vertices.get(v2).push(v1); }
    dfs(start) {
        const visited = new Set(), result = [];
        const explore = (v) => {
            visited.add(v); result.push(v);
            for (const n of this.vertices.get(v) || [])
                if (!visited.has(n)) explore(n);
        };
        explore(start);
        return result;
    }
}

function romanToInt(s) {
    const map = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000};
    let result = 0, prev = 0;
    for (let i = s.length - 1; i >= 0; i--) {
        result += map[s[i]] >= prev ? map[s[i]] : -map[s[i]];
        prev = map[s[i]];
    }
    return result;
}

function findSmallestMissing(nums) {
    const n = nums.length;
    let i = 0;
    while (i < n) {
        const pos = nums[i] - 1;
        if (nums[i] >= 1 && nums[i] <= n && nums[pos] !== nums[i]) {
            [nums[i], nums[pos]] = [nums[pos], nums[i]];
        } else i++;
    }
    for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
    return n + 1;
}

// ============ MAIN COMMAND ============
module.exports = {
    name: 'algo',
    description: 'Algorithm demonstrations and utilities',
    options: [
        {
            name: 'ascending',
            description: 'Sort numbers in ascending order',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'numbers', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'descending',
            description: 'Sort numbers in descending order',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'numbers', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'biggest',
            description: 'Find the biggest number',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'numbers', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'smallest',
            description: 'Find the smallest number',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'numbers', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'binary-search',
            description: 'Binary search on sorted array',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'numbers', description: 'Sorted numbers separated by space', type: ApplicationCommandOptionType.String, required: true },
                { name: 'target', description: 'Number to find', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        },
        {
            name: 'exponential-search',
            description: 'Exponential search on sorted array',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'numbers', description: 'Sorted numbers separated by space', type: ApplicationCommandOptionType.String, required: true },
                { name: 'target', description: 'Number to find', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        },
        {
            name: 'dfs',
            description: 'Depth-first search on graph',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'vertices', description: 'Vertices separated by space', type: ApplicationCommandOptionType.String, required: true },
                { name: 'start', description: 'Starting vertex', type: ApplicationCommandOptionType.String, required: true }
            ]
        },
        {
            name: 'roman',
            description: 'Convert Roman numeral to integer',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'numeral', description: 'Roman numeral (e.g., XIV)', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'stock',
            description: 'Best time to buy/sell stock for max profit',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'prices', description: 'Prices separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'remove-duplicates',
            description: 'Remove duplicates from sorted array (keep max 2)',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'array', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true }]
        },
        {
            name: 'remove-element',
            description: 'Remove element from array',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'array', description: 'Numbers separated by space', type: ApplicationCommandOptionType.String, required: true },
                { name: 'target', description: 'Element to remove', type: ApplicationCommandOptionType.Integer, required: true }
            ]
        },
        {
            name: 'smallest-missing',
            description: 'Find smallest missing positive integer',
            type: ApplicationCommandOptionType.Subcommand,
            options: [{ name: 'array', description: 'Numbers separated by comma', type: ApplicationCommandOptionType.String, required: true }]
        }
    ],
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const start = process.hrtime();
        let embed;

        try {
            switch (subcommand) {
                case 'ascending': {
                    const input = interaction.options.getString('numbers');
                    const numbers = input.split(' ').map(Number);
                    const sorted = [...numbers].sort((a, b) => a - b);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔢 Sort Ascending')
                        .setColor('Green')
                        .addFields(
                            { name: 'Input', value: `\`${input}\``, inline: false },
                            { name: 'Sorted', value: `\`${sorted.join(', ')}\``, inline: false },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.ascending}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'descending': {
                    const input = interaction.options.getString('numbers');
                    const numbers = input.split(' ').map(Number);
                    const sorted = [...numbers].sort((a, b) => b - a);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔢 Sort Descending')
                        .setColor('Blue')
                        .addFields(
                            { name: 'Input', value: `\`${input}\``, inline: false },
                            { name: 'Sorted', value: `\`${sorted.join(', ')}\``, inline: false },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.descending}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'biggest': {
                    const input = interaction.options.getString('numbers');
                    const numbers = input.split(' ').map(Number);
                    const biggest = Math.max(...numbers);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔝 Find Biggest')
                        .setColor('Gold')
                        .addFields(
                            { name: 'Input', value: `\`${numbers.join(', ')}\``, inline: false },
                            { name: 'Biggest', value: `\`${biggest}\``, inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.biggest}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'smallest': {
                    const input = interaction.options.getString('numbers');
                    const numbers = input.split(' ').map(Number);
                    const smallest = Math.min(...numbers);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔻 Find Smallest')
                        .setColor('Purple')
                        .addFields(
                            { name: 'Input', value: `\`${numbers.join(', ')}\``, inline: false },
                            { name: 'Smallest', value: `\`${smallest}\``, inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.smallest}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'binary-search': {
                    const input = interaction.options.getString('numbers');
                    const target = interaction.options.getInteger('target');
                    const numbers = input.split(' ').map(Number);
                    
                    let left = 0, right = numbers.length - 1, found = -1;
                    while (left <= right) {
                        const mid = Math.floor((left + right) / 2);
                        if (numbers[mid] === target) { found = mid; break; }
                        else if (numbers[mid] < target) left = mid + 1;
                        else right = mid - 1;
                    }
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔍 Binary Search')
                        .setColor(found >= 0 ? 'Green' : 'Red')
                        .addFields(
                            { name: 'Array', value: `\`${numbers.join(', ')}\``, inline: false },
                            { name: 'Target', value: `\`${target}\``, inline: true },
                            { name: 'Result', value: found >= 0 ? `Found at index \`${found}\`` : 'Not found', inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.binarySearch}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'exponential-search': {
                    const input = interaction.options.getString('numbers');
                    const target = interaction.options.getInteger('target');
                    const numbers = input.split(' ').map(Number);
                    
                    let bound = 1;
                    while (bound < numbers.length && numbers[bound] < target) bound *= 2;
                    const startIdx = Math.floor(bound / 2);
                    const endIdx = Math.min(bound, numbers.length - 1);
                    let found = -1;
                    for (let i = startIdx; i <= endIdx; i++) {
                        if (numbers[i] === target) { found = i; break; }
                    }
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔍 Exponential Search')
                        .setColor(found >= 0 ? 'Green' : 'Red')
                        .addFields(
                            { name: 'Array', value: `\`${numbers.join(', ')}\``, inline: false },
                            { name: 'Target', value: `\`${target}\``, inline: true },
                            { name: 'Result', value: found >= 0 ? `Found at index \`${found}\`` : 'Not found', inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.exponentialSearch}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'dfs': {
                    const verticesInput = interaction.options.getString('vertices');
                    const startVertex = interaction.options.getString('start');
                    const vertices = verticesInput.split(' ');
                    
                    const graph = new Graph();
                    vertices.forEach(v => graph.addVertex(v));
                    const visited = graph.dfs(startVertex);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🌲 Depth-First Search')
                        .setColor('DarkGreen')
                        .addFields(
                            { name: 'Vertices', value: `\`${vertices.join(', ')}\``, inline: false },
                            { name: 'Start', value: `\`${startVertex}\``, inline: true },
                            { name: 'Visited Order', value: `\`${visited.join(' → ')}\``, inline: false },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true }
                        );
                    break;
                }
                case 'roman': {
                    const numeral = interaction.options.getString('numeral').toUpperCase();
                    if (!/^[IVXLCDM]+$/.test(numeral)) {
                        return interaction.reply({ content: '❌ Invalid Roman numeral. Use only I, V, X, L, C, D, M', ephemeral: true });
                    }
                    const result = romanToInt(numeral);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🏛️ Roman to Integer')
                        .setColor('Gold')
                        .addFields(
                            { name: 'Roman', value: `\`${numeral}\``, inline: true },
                            { name: 'Integer', value: `\`${result}\``, inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.roman}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'stock': {
                    const input = interaction.options.getString('prices');
                    const prices = input.split(' ').map(Number);
                    let profit = 0;
                    for (let i = 1; i < prices.length; i++) {
                        if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
                    }
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('📈 Best Time to Buy/Sell Stock')
                        .setColor('Green')
                        .addFields(
                            { name: 'Prices', value: `\`${prices.join(', ')}\``, inline: false },
                            { name: 'Max Profit', value: `\`$${profit}\``, inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.stock}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'remove-duplicates': {
                    const input = interaction.options.getString('array');
                    const original = input.split(' ').map(Number);
                    const arr = [...original];
                    let l = 0, r = 0;
                    while (r < arr.length) {
                        let count = 1;
                        while (r + 1 < arr.length && arr[r] === arr[r + 1]) { r++; count++; }
                        for (let i = 0; i < Math.min(2, count); i++) arr[l++] = arr[r];
                        r++;
                    }
                    const result = arr.slice(0, l);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🧹 Remove Duplicates')
                        .setColor('Orange')
                        .addFields(
                            { name: 'Original', value: `\`${original.join(', ')}\``, inline: false },
                            { name: 'After Removal', value: `\`${result.join(', ')}\``, inline: false },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.removeDuplicate}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'remove-element': {
                    const input = interaction.options.getString('array');
                    const target = interaction.options.getInteger('target');
                    const original = input.split(' ').map(Number);
                    const arr = [...original];
                    let idx = 0;
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] !== target) arr[idx++] = arr[i];
                    }
                    const result = arr.slice(0, idx);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🗑️ Remove Element')
                        .setColor('Red')
                        .addFields(
                            { name: 'Original', value: `\`${original.join(', ')}\``, inline: false },
                            { name: 'Target', value: `\`${target}\``, inline: true },
                            { name: 'Removed', value: `${original.length - idx} elements`, inline: true },
                            { name: 'Result', value: `\`${result.join(', ')}\``, inline: false },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.removeElement}\n\`\`\``, inline: false }
                        );
                    break;
                }
                case 'smallest-missing': {
                    const input = interaction.options.getString('array');
                    const nums = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    if (nums.length === 0) {
                        return interaction.reply({ content: '❌ Invalid input. Use comma-separated integers.', ephemeral: true });
                    }
                    const result = findSmallestMissing([...nums]);
                    const [s, ns] = process.hrtime(start);
                    
                    embed = new EmbedBuilder()
                        .setTitle('🔢 Smallest Missing Positive')
                        .setColor('Purple')
                        .addFields(
                            { name: 'Array', value: `\`[${nums.join(', ')}]\``, inline: false },
                            { name: 'Result', value: `Smallest missing: **${result}**`, inline: true },
                            { name: 'Time', value: `${((s * 1000) + (ns / 1e6)).toFixed(3)} ms`, inline: true },
                            { name: 'Algorithm', value: `\`\`\`js\n${algorithms.smallestMissing}\n\`\`\``, inline: false }
                        )
                        .setFooter({ text: 'O(n) time | O(1) space' });
                    break;
                }
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error in /algo ${subcommand}:`, error);
            await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
        }
    }
};
