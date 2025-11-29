const getLocalCommands = require('./src/utils/getLocalCommands');

try {
    console.log("Starting to load commands...");
    getLocalCommands();
    console.log("Successfully loaded all commands.");
} catch (error) {
    console.error("Caught error:");
    console.error(error);
}
