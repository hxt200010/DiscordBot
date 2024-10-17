const {testServer} = require('../../../config.json'); 
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client) => {
    const localCommands = getLocalCommands(); 
    try {
        const localCommands = getLocalCommands(); 
        const applicationCommands = await getApplicationCommands(client, testServer);

        for (const localCommand of localCommands) {
            const {name, description, options} = localCommand; 
            const existingCommand = await applicationCommands.cache.find(
                (cmd) => cmd.name === name
            ); 

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id); 
                    console.log(`Deleted command "${name}".`); 
                    break; 
                }
                //if the command already exist, we edit it
                if(areCommandsDifferent(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {
                        description, 
                        options, 
                    }); 
                    console.log(`Edited command "${name}".`); 
                }
            } else {
                if (localCommand.deleted) {
                    console.log(`SKipping registering command "${name}" as it's set to delete. `); 
                    continue; 
                }

                await applicationCommands.create({
                    name, 
                    description, 
                    options, 
                }); 
                console.log(`Registered command "${name}".`); 
            }
        }
    } catch (error) {
        console.log(`Error: ${error}`); 
    }
}; 