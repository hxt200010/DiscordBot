module.exports = {
    deleted: true, // Consolidated into /misc utility command
    name: 'ping',
    description: 'Reply with a bot ping',
    // devOnly: Boolean,
    callback: async (client, interaction) => {
      await interaction.deferReply(); 
      const reply = await interaction.fetchReply(); 
      const ping = reply.createdTimesStamp - interaction.createdTimesstamp; 

      interaction.editReply(`:ping_pong: Pong! Client ${ping}ms | Bot response: ${client.ws.ping}ms`); 
    }
  };