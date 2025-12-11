const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const PetSystem = require('../../utils/PetSystem');
const User = require('../../models/User');
const { getPersonality, buildSystemPrompt, formatConversationHistory } = require('../../utils/PetPersonalities');

// OpenAI Setup
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

// Cooldown to prevent spam
const cooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 seconds between chats

module.exports = {
    name: 'pet-chat',
    description: 'Have a conversation with your pet! Each pet has a unique personality.',
    options: [
        {
            name: 'pet',
            description: 'Which pet do you want to talk to?',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: 'message',
            description: 'What do you want to say to your pet?',
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 500
        }
    ],

    autocomplete: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'pet') {
            const userPets = await PetSystem.getUserPets(interaction.user.id);
            if (!userPets || userPets.length === 0) {
                return interaction.respond([]);
            }
            
            const options = userPets.map(pet => ({
                name: `${pet.petName} (${pet.type})`,
                value: pet.petName
            }));
            
            const filtered = options.filter(opt => 
                opt.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            );
            
            await interaction.respond(filtered.slice(0, 25));
        }
    },

    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const petName = interaction.options.getString('pet');
        const userMessage = interaction.options.getString('message');

        // Check cooldown
        if (cooldowns.has(userId)) {
            const remaining = cooldowns.get(userId) - Date.now();
            if (remaining > 0) {
                return interaction.reply({
                    content: `⏳ Wait ${Math.ceil(remaining / 1000)} seconds before chatting again!`,
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply();

        // Get the pet
        const userPets = await PetSystem.getUserPets(userId);
        if (!userPets || userPets.length === 0) {
            return interaction.editReply("❌ You don't have any pets! Use `/adopt` to get one first.");
        }

        const pet = userPets.find(p => p.petName.toLowerCase() === petName.toLowerCase());
        if (!pet) {
            return interaction.editReply(`❌ You don't have a pet named **${petName}**.`);
        }

        // Check if pet is dead
        if (pet.isDead) {
            return interaction.editReply(`💀 **${pet.petName}** is fainted and can't chat right now. Revive them first!`);
        }

        // Check if pet is sleeping
        if (pet.isSleeping && pet.sleepUntil && Date.now() < pet.sleepUntil) {
            const personality = getPersonality(pet.type);
            return interaction.editReply(`💤 *${pet.petName} mumbles something in their sleep...* zzz...`);
        }

        // Set cooldown
        cooldowns.set(userId, Date.now() + COOLDOWN_MS);

        try {
            // Get or create conversation history
            let user = await User.findOne({ userId });
            if (!user) {
                user = await User.create({ userId });
            }

            // Get existing chat history for this pet
            let chatHistory = [];
            if (user.petChatHistory && user.petChatHistory.get(pet.petName)) {
                chatHistory = user.petChatHistory.get(pet.petName);
            }

            // Build the system prompt with pet personality and mood
            const systemPrompt = buildSystemPrompt(pet);
            const personality = getPersonality(pet.type);

            // Prepare messages for OpenAI
            const messages = [
                { role: 'system', content: systemPrompt },
                ...formatConversationHistory(chatHistory),
                { role: 'user', content: userMessage }
            ];

            // Call OpenAI
            const result = await openai.createChatCompletion({
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 200,
                temperature: 0.9, // Higher creativity for personality
                presence_penalty: 0.6, // Encourage variety
                frequency_penalty: 0.3
            });

            const petResponse = result.data.choices[0].message.content.trim();

            // Update conversation history (keep last 5 exchanges = 10 messages)
            chatHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: petResponse }
            );
            if (chatHistory.length > 10) {
                chatHistory = chatHistory.slice(-10);
            }

            // Save updated history
            if (!user.petChatHistory) {
                user.petChatHistory = new Map();
            }
            user.petChatHistory.set(pet.petName, chatHistory);
            await user.save();

            // Increase pet affection for chatting (+1)
            await PetSystem.updatePet(pet.id, (p) => {
                if (p.stats && p.stats.affection !== undefined) {
                    p.stats.affection = Math.min(100, (p.stats.affection || 0) + 1);
                }
            });

            // Build response embed
            const embed = new EmbedBuilder()
                .setColor(getPetColor(pet.type))
                .setAuthor({
                    name: `${personality.emoji} ${pet.petName} (${pet.type})`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .addFields(
                    {
                        name: `💬 You said:`,
                        value: userMessage.length > 200 ? userMessage.substring(0, 200) + '...' : userMessage
                    },
                    {
                        name: `${personality.emoji} ${pet.petName} responds:`,
                        value: petResponse
                    }
                )
                .setFooter({ text: `Affection +1 ❤️ | Level ${pet.level || 1}` })
                .setTimestamp();

            // Add mood indicator if pet has low stats
            const moodInfo = getMoodInfo(pet);
            if (moodInfo) {
                embed.setDescription(moodInfo);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Pet Chat Error:', error);
            
            // Fallback response if OpenAI fails
            const personality = getPersonality(pet.type);
            const fallbackResponses = getFallbackResponses(pet.type);
            const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

            const embed = new EmbedBuilder()
                .setColor(getPetColor(pet.type))
                .setAuthor({
                    name: `${personality.emoji} ${pet.petName} (${pet.type})`
                })
                .addFields(
                    {
                        name: `💬 You said:`,
                        value: userMessage.length > 200 ? userMessage.substring(0, 200) + '...' : userMessage
                    },
                    {
                        name: `${personality.emoji} ${pet.petName} responds:`,
                        value: fallback
                    }
                )
                .setFooter({ text: '(AI temporarily unavailable - using fallback)' });

            await interaction.editReply({ embeds: [embed] });
        }
    }
};

/**
 * Get embed color based on pet type
 */
function getPetColor(petType) {
    const colors = {
        'Sonic': 0x0066FF,    // Blue
        'Tails': 0xFFAA00,    // Orange
        'Knuckles': 0xFF0000, // Red
        'Shadow': 0x1A1A1A,   // Near black
        'Amy': 0xFF69B4,      // Pink
        'Rouge': 0x9932CC     // Purple
    };
    return colors[petType] || 0x808080;
}

/**
 * Get mood info string based on pet stats
 */
function getMoodInfo(pet) {
    const stats = pet.stats || {};
    const warnings = [];

    if (stats.hunger !== undefined && stats.hunger < 30) {
        warnings.push('🍖 Hungry');
    }
    if (stats.energy !== undefined && stats.energy < 20) {
        warnings.push('😴 Tired');
    }
    if (stats.happiness !== undefined && stats.happiness < 30) {
        warnings.push('😢 Sad');
    }

    if (warnings.length > 0) {
        return `*${pet.petName} seems ${warnings.join(', ')}...*`;
    }
    return null;
}

/**
 * Fallback responses when OpenAI is unavailable
 */
function getFallbackResponses(petType) {
    const fallbacks = {
        'Sonic': [
            "Way past cool! 💨",
            "Gotta go fast! Can't stay here chatting all day!",
            "*taps foot impatiently* Yeah yeah, cool story!",
            "Let's do it to it!"
        ],
        'Tails': [
            "That's fascinating! Let me think about that...",
            "Oh! I've been working on something related to that!",
            "Sonic would love to hear about this!",
            "According to my calculations... you're pretty cool! 🦊"
        ],
        'Knuckles': [
            "Hmph. I don't have time for this. The Master Emerald needs guarding.",
            "*flexes* You talking to ME?",
            "Unlike Sonic, I don't chuckle.",
            "I'm the most powerful! 💪"
        ],
        'Shadow': [
            "...Hmph.",
            "I am the Ultimate Lifeform. Remember that.",
            "*crosses arms* ...Is that so.",
            "Chaos... Control. ⚡"
        ],
        'Amy': [
            "Oh, that's so sweet! 💕",
            "Have you seen Sonic around?? 💖",
            "You're the best! *hugs* 💗",
            "My hammer is ready for anything! 🔨💕"
        ],
        'Rouge': [
            "Well well, aren't we chatty today~ 💎",
            "I'm listening, darling. Make it worth my time.",
            "*examines nails* Fascinating.",
            "Got any jewels for me? No? Shame. 💎"
        ]
    };

    return fallbacks[petType] || [
        "*looks at you happily*",
        "*wags tail*",
        "*makes a happy sound*",
        "*tilts head curiously*"
    ];
}
