const { Configuration, OpenAIApi } = require('openai');
const guildConfig = require('../utils/GuildConfig');

const configuration = new Configuration({
    apiKey: process.env.API_KEY
});
const openai = new OpenAIApi(configuration);

module.exports = async (client, message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('!')) return;

    const isConfiguredChannel = message.guild ? guildConfig.isChatbotChannel(message.guild.id, message.channel.id) : false;

    if (!isConfiguredChannel) return;

    let conversationLog = [{ role: 'system', content: "You are Sonic the Hedgehog, specifically from the movies. You are super fast, energetic, confident, and a bit cocky but with a heart of gold. You love chili dogs, making pop culture references, and protecting your friends. Keep your responses short and punchy, matching your speed." }];

    try {
        await message.channel.sendTyping();
        let prevMessage = await message.channel.messages.fetch({ limit: 15 });
        prevMessage.reverse();

        prevMessage.forEach((msg) => {
            if (msg.content.startsWith('!')) return;
            if (msg.author.id !== client.user.id && msg.author.bot) return;
            if (msg.author.id !== message.author.id) return;

            conversationLog.push({
                role: 'user',
                content: msg.content,
            });
        });

        conversationLog.push({
            role: 'user',
            content: message.content,
        });

        const result = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: conversationLog,
            max_tokens: 500  // Limit response length
        });

        let response = result.data.choices[0].message.content;

        // Discord has a 2000 character limit
        if (response.length > 1990) {
            response = response.substring(0, 1987) + '...';
        }

        message.reply(response);
    } catch (error) {
        console.error(`Error in chatbot handler: ${error}`);
    }
};
