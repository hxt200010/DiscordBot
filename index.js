require('dotenv/config'); 
const { Client, IntentsBitField, ActivityType } = require('discord.js');
const { Configuration, OpenAIApi} = require('openai'); 

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
    ],
});
/**
 * Open AI configuration 
 */
const configuration = new Configuration({
    apiKey: process.env.API_KEY
})
const openai = new OpenAIApi(configuration); 

client.on('messageCreate', async (message) => {
    //if the user is the bot, return 
    if (message.author.bot) return; 
    if (message.channel.id !== process.env.CHANNEL_ID) return; 
    if (message.content.startsWith('!')) return; 
    let conversationLog = [{ role: 'system', content: "You are a Friendly Chatbot"}]; 
    
    await message.channel.sendTyping(); 
    let prevMessage = await message.channel.messages.fetch({ limit: 15});
    prevMessage.reverse(); 
    prevMessage.forEach((msg) => {
        if (message.content.startsWith('!')) return; 
        if (msg.author.id !== client.user.id && message.author.bot) return; 
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
        model: 'gpt-3.5-turbo', 
        messages: conversationLog,
    })
    message.reply(result.data.choices[0].message); 
}); 

let status = [
    {
        name: "Mình là một chú bot cu te dễ thương nè",
    }, 
    {
        name: "Bạn hãy trò chuyện với mình dưới kênh riêng nhe",
    },
    {
        
    }
]

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
    setInterval(() => {
        let random = Math.floor(Math.random() * status.length); 
        client.user.setActivity(status[random]); 
    }, 10000)
});
client.login(process.env.TOKEN); 