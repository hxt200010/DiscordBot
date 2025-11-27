const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');
require('dotenv/config'); 
const { Configuration, OpenAIApi } = require("openai");


const configuration = new Configuration({
    apiKey: process.env.API_KEY
});
const openai = new OpenAIApi(configuration);

module.exports = {
    name: "calories",
    description: "Estimate calories & macros using OpenAI",
    options: [
        {
            name: "prompt",
            description: 'Describe the food (e.g. "1 cup mashed potatoes and gravy")',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],

    callback: async (client, interaction) => {
        try {
            const prompt = interaction.options.getString("prompt");

            await interaction.deferReply(); // prevent timeout

            // --- AI Nutrition Extraction Prompt ---
            const systemInstruction = `
You are a nutrition expert AI.
Given a messy natural-language food description, break it down and estimate calories & macros
based on USDA data and typical values.

Respond ONLY in this strict JSON format:

{
  "items": [
    {
      "name": "",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "total_calories": number
}

If the prompt is unclear, return an empty array.
            `;

            const result = await openai.createChatCompletion({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Food description: ${prompt}` }
                ],
                temperature: 0.1,
            });

            const aiMessage = result.data.choices[0].message.content;

            let nutrition;
            try {
                nutrition = JSON.parse(aiMessage);
            } catch (e) {
                console.error("JSON Parse Error:", aiMessage);
                return interaction.editReply("I couldn't interpret the nutrition info. Try again.");
            }

            if (!nutrition.items || nutrition.items.length === 0) {
                return interaction.editReply("I couldn't understand that food. Try another description.");
            }

            // --- Format Output ---
            const fields = nutrition.items.map((item) => ({
                name: item.name,
                value:
                    `Calories: **${item.calories} kcal**\n` +
                    `Protein: **${item.protein_g}g**\n` +
                    `Carbs: **${item.carbs_g}g**\n` +
                    `Fat: **${item.fat_g}g**`,
                inline: false,
            }));

            const embed = new EmbedBuilder()
                .setColor("#4CAF50")
                .setTitle("🍽 Nutrition Estimate")
                .setDescription(`Analysis for: **"${prompt}"**`)
                .addFields(fields)
                .addFields({
                    name: "🔥 Total Calories",
                    value: `**${nutrition.total_calories} kcal**`,
                });

            return interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return interaction.editReply("There was an error with the nutrition request.");
        }
    },
};
