const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

// Python code to display in the embed
const smallestMissingPositiveCode = `def findSmallestMissingPositive(orderNumbers):
    # Write your code here
    n = len(orderNumbers)
    i = 0
    while i < n:
        correct_pos = orderNumbers[i] - 1
        # If the current element is positive and within range and not already at correct position
        if 1 <= orderNumbers[i] <= n and orderNumbers[correct_pos] != orderNumbers[i]:
            # Swap to put it in correct position
            orderNumbers[i], orderNumbers[correct_pos] = orderNumbers[correct_pos], orderNumbers[i]
        else: 
            #move to next element
            i += 1
    for i in range(n): 
        if orderNumbers[i] != i + 1:
            return i + 1
    #if all numbers from 1 to n are present, return n+1
    return n + 1`;

module.exports = {
    deleted: true, // Consolidated into /algo command
    name: "smallestpositivenumber",
    description: 'find the smallest positive integer not present in the array in O(n) time and O(1) extra space.',
    options: [
        {
            name: 'array',
            description: 'Enter the array of integers (comma-separated, e.g., "3,4,-1,1")',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        try {
            const arrayInput = interaction.options.get('array')?.value;

            if (!arrayInput) {
                return interaction.reply({
                    content: '❌ Please provide a valid array of integers.',
                    ephemeral: true
                });
            }

            // Parse the input string into an array of numbers
            const orderNumbers = arrayInput.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));

            if (orderNumbers.length === 0) {
                return interaction.reply({
                    content: '❌ Invalid input. Please provide a comma-separated list of integers.',
                    ephemeral: true
                });
            }

            // Call the algorithm
            const result = findSmallestMissingPositive([...orderNumbers]); // Use a copy to show original array

            // Create an embed to display the result
            const embed = new EmbedBuilder()
                .setTitle('🔢 Smallest Missing Positive Integer')
                .setColor('Random')
                .addFields(
                    { 
                        name: '📋 Problem Description', 
                        value: '**Goal:** Find the smallest positive integer (1, 2, 3, ...) that is NOT present in the array.\n\n**Input:** An array of integers (can include negative numbers, zero, and duplicates)\n**Output:** The smallest missing positive integer starting from 1\n\n**Example:** `[3, 4, -1, 1]` → Missing: `2` (because 1 is present, but 2 is not)', 
                        inline: false 
                    },
                    { name: 'Input Array', value: `\`[${orderNumbers.join(', ')}]\``, inline: false },
                    { name: 'Result', value: `The smallest missing positive integer is: **${result}**`, inline: false },
                    { name: 'Algorithm', value: '```python\n' + smallestMissingPositiveCode + '\n```', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Time Complexity: O(n) | Space Complexity: O(1)' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in smallestMissingPositive command:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
};

// JavaScript implementation of the algorithm
function findSmallestMissingPositive(orderNumbers) {
    const n = orderNumbers.length;
    let i = 0;
    
    while (i < n) {
        const correctPos = orderNumbers[i] - 1;
        // If the current element is positive and within range and not already at correct position
        if (orderNumbers[i] >= 1 && orderNumbers[i] <= n && orderNumbers[correctPos] !== orderNumbers[i]) {
            // Swap to put it in correct position
            [orderNumbers[i], orderNumbers[correctPos]] = [orderNumbers[correctPos], orderNumbers[i]];
        } else {
            // Move to next element
            i++;
        }
    }
    
    for (let i = 0; i < n; i++) {
        if (orderNumbers[i] !== i + 1) {
            return i + 1;
        }
    }
    
    // If all numbers from 1 to n are present, return n+1
    return n + 1;
}