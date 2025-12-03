const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const chatbotHandler = require('./handlers/chatbotHandler');
const connectDB = require('./utils/Database');
const stockAlertHandler = require('./handlers/stockAlertHandler');

// Connect to Database
connectDB();

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
stockAlertHandler(client);
client.login(process.env.TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});
console.log("Auto deploy works!");

// DEBUG: Log URI to file
const fs = require('fs');
try {
    fs.writeFileSync(path.join(__dirname, '../debug_bot_env.txt'), `URI: ${process.env.MONGODB_URI}\nCWD: ${process.cwd()}\nDOTENV: ${path.join(__dirname, '../.env')}`);
} catch (e) {
    console.error('Debug write failed', e);
}