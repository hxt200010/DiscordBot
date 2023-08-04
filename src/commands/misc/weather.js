const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const apitoken = process.env.WEATHER_API;

module.exports = {
    name: 'weather',
    description: 'Get weather information for a city',
    options: [
        {
            name: 'city',
            description: 'The name of the city for weather information',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: (client, interaction) => {
        const city = interaction.options.getString('city');

        axios
            .get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apitoken}`
            )
            .then(response => {
                const apiData = response.data;
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setThumbnail(`http://openweathermap.org/img/w/${apiData.weather[0].icon}.png`)
                    .setTitle(`Temperature: ${apiData.main.temp}°C`)
                    .addFields(
                        {
                            name: 'City',
                            value: `${city}`, 
                            inline: true,
                        }, 
                        {
                            name: 'Maximum Temperature',
                            value: `${apiData.main.temp_max}°C`,
                            inline: true,
                        },
                        {
                            name: 'Minimum Temperature',
                            value: `${apiData.main.temp_min}°C`,
                            inline: true,
                        },
                        {
                            name: 'Humidity',
                            value: `${apiData.main.humidity}%`,
                            inline: true,
                        },
                        {
                            name: 'Wind Speed',
                            value: `${apiData.wind.speed} m/s`,
                            inline: true,
                        }
                    )

                interaction.reply({ embeds: [embed] });
            })
            .catch(error => {
                console.error(error);
                interaction.reply('Error: Weather data not available for the specified city.');
            });
    },
};
