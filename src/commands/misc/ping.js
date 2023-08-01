module.exports = {
    name: 'ping',
    description: 'Reply with a bot ping',
    // devOnly: Boolean,
    callback: async (client, interaction) => {
      await interaction.deferReply(); 
      const reply = await interaction.fetchReply(); 
      const ping = reply.createdTimesStamp - interaction.createdTimesstamp; 

      interaction.editReply(`Pong! Client ${ping}ms | Websocket: ${client.ws.ping}ms`); 
    }
  };