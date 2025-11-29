const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/guildConfig.json');

class GuildConfig {
    constructor() {
        this.config = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                this.config = JSON.parse(data);
            } else {
                this.config = {};
                this.save();
            }
        } catch (error) {
            console.error('Error loading guild config:', error);
            this.config = {};
        }
    }

    save() {
        try {
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 4));
        } catch (error) {
            console.error('Error saving guild config:', error);
        }
    }

    get(guildId) {
        if (!this.config[guildId]) {
            this.config[guildId] = {
                chatbotChannels: []
            };
            this.save();
        }
        return this.config[guildId];
    }

    addChatbotChannel(guildId, channelId) {
        const guildConfig = this.get(guildId);
        if (!guildConfig.chatbotChannels) {
            guildConfig.chatbotChannels = [];
        }
        if (!guildConfig.chatbotChannels.includes(channelId)) {
            guildConfig.chatbotChannels.push(channelId);
            this.save();
            return true;
        }
        return false;
    }

    removeChatbotChannel(guildId, channelId) {
        const guildConfig = this.get(guildId);
        if (guildConfig.chatbotChannels && guildConfig.chatbotChannels.includes(channelId)) {
            guildConfig.chatbotChannels = guildConfig.chatbotChannels.filter(id => id !== channelId);
            this.save();
            return true;
        }
        return false;
    }

    isChatbotChannel(guildId, channelId) {
        const guildConfig = this.get(guildId);
        return guildConfig.chatbotChannels && guildConfig.chatbotChannels.includes(channelId);
    }
}

module.exports = new GuildConfig();
