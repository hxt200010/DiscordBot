const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client, interaction) => {
    if (!interaction.isAutocomplete()) return;

    const localCommands = getLocalCommands();
    const command = localCommands.find((c) => c.name === interaction.commandName);

    if (!command || !command.autocomplete) return;

    try {
        await command.autocomplete(client, interaction);
    } catch (error) {
        console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
    }
};
