const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');
const moment = require('moment-timezone'); 
const tzlookup = require('tz-lookup');
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
                 // Convert the timezone offset to a timezone identifier
                 const timezone = tzlookup(apiData.coord.lat, apiData.coord.lon);
                const currentWeatherTime = moment.unix(apiData.dt).tz(timezone).format('HH:mm:ss,  MM/DD/YYYY');
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
                            inline: false,
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
                        },
                        {
                            name: 'Weather Conditions',
                            value: apiData.weather[0].description,
                            inline: false,
                        },
                        {
                            name: 'Pressure',
                            value: `${apiData.main.pressure} hPa`,
                            inline: true,
                        },
                        {
                            name: 'Cloudiness',
                            value: `${apiData.clouds.all}%`,
                            inline: true,
                        },
                        {
                            name: `Current Time in __${city}__`,
                            value: currentWeatherTime,
                            inline: false,
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
