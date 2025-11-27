const { testServer } = require('../../../config.json');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client) => {
    // console.log('Running command registration...');
    const localCommands = getLocalCommands();

    try {
        const applicationCommands = await getApplicationCommands(client, testServer);

        for (const localCommand of localCommands) {
            const { name, description, options } = localCommand;

            // Check for undefined or invalid command properties
            if (!name || !description || typeof name !== 'string' || typeof description !== 'string') {
                console.error(`Invalid command detected: ${JSON.stringify(localCommand)}`);
                continue; // Skip registering this command
            }

            const existingCommand = applicationCommands.cache.find(
                (cmd) => cmd.name === name
            );

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(`Deleted command "${name}".`);
                    continue;
                }

                if (areCommandsDifferent(existingCommand, localCommand)) {
                    console.log(`Editing existing command: "${name}"`);
                    await applicationCommands.edit(existingCommand.id, {
                        description,
                        options,
                    });
                    console.log(`Edited command "${name}".`);
                } else {
                    // console.log(`No changes detected for command: "${name}". Skipping update.`);
                }
            } else {
                if (localCommand.deleted) {
                    // console.log(`Skipping registration of command "${name}" as it is set to delete.`);
                    continue;
                }

                console.log(`Registering new command: "${name}"`);
                await applicationCommands.create({
                    name,
                    description,
                    options,
                });
                console.log(`Registered command "${name}".`);
            }
        }
    } catch (error) {
        console.error(`Error during command registration: ${error.stack}`);
    }
};