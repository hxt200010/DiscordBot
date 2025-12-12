// Script to delete ALL global commands from Discord API
// Run this once to clear the slate, then restart your bot

require('dotenv').config();
const { REST, Routes } = require('discord.js');

const token = process.env.TOKEN;
const clientId = '1130301590146916435';

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Fetching all global commands...');
        
        // Get all global commands
        const commands = await rest.get(Routes.applicationCommands(clientId));
        console.log(`Found ${commands.length} global commands.`);
        
        if (commands.length === 0) {
            console.log('No commands to delete!');
            return;
        }

        console.log('Deleting all global commands...');
        
        // Delete each command
        for (const command of commands) {
            console.log(`Deleting: ${command.name}`);
            await rest.delete(Routes.applicationCommand(clientId, command.id));
        }
        
        console.log('\n✅ All global commands deleted!');
        console.log('Now restart your bot to register the new consolidated commands.');
    } catch (error) {
        console.error('Error:', error);
    }
})();
