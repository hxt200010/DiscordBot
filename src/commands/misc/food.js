const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'calories',
    description: 'Recommend a food based on your prompt',
    options: [
        {
            name: 'prompt',
            description: 'enter a query like "1 cup mashed potatoes and 2 tbsp gravy" to see how it works',
            type: ApplicationCommandOptionType.String,
            required: true,  // Make the prompt required
        },
    ],

    callback: async (client, interaction) => {
        try {
            // Get the prompt provided by the user
            const prompt = interaction.options.getString('prompt');

            const apiKey = process.env.FOOD_API;
            const appId = process.env.FOOD_APPID;

            const url = `https://trackapi.nutritionix.com/v2/natural/nutrients`;
            const headers = {
                'x-app-id': appId,
                'x-app-key': apiKey,
                'Content-Type': 'application/json',
            };

            const payload = { query: prompt };  // Use the user's prompt directly

            console.log('Sending request to API:', payload);  // Log the request

            const response = await axios.post(url, payload, { headers });

            console.log('API Response:', response.data);  // Log the response

            const items = response.data.foods;

            if (!items || items.length === 0) {
                interaction.reply('Sorry, I couldn\'t find any food recommendations matching your prompt.');
                return;
            }

            // Format the results
            const foodList = items.map(item => `${item.food_name} (${item.nf_calories} calories)`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${interaction.user.username}'s Food Recommendations`)
                .setDescription(foodList);

            // Print the user's prompt and respond with the list of ingredients
            interaction.reply({ content: `"${prompt}"`, embeds: [embed] });
            

        } catch (error) {
            console.error(error);
            // Extract the error message from the API response
            const apiErrorMessage = error.response?.data?.message || 'There was an error trying to fetch real-time food recommendations.';
                        
            // Send the API error message to the user
            interaction.reply(`${apiErrorMessage}`);
        }
    },
};
