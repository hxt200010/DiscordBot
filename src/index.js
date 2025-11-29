require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const chatbotHandler = require('./handlers/chatbotHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
    ],
});

client.on('messageCreate', async (message) => {
    await chatbotHandler(client, message);
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;
});

eventHandler(client);
client.login(process.env.TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});
console.log("Auto deploy works!");