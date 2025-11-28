/**require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Delete all commands (both guild and global)
(async () => {
    try {
        console.log('Started deleting all application commands.');

        // For guild commands (faster, recommended for testing)
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: [] }
            );
            console.log('Successfully deleted all guild commands.');
        }

        // For global commands (takes up to 1 hour to update)
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        console.log('Successfully deleted all global commands.');

    } catch (error) {
        console.error(error);
    }
})();  */
