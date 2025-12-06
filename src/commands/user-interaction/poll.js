const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Poll = require('../../models/Poll');

module.exports = {
    name: 'poll',
    description: 'Create a poll (Multiple Choice or Free Response)',
    options: [
        {
            name: 'type',
            description: 'Type of poll',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Multiple choices', value: 'Multiple choices' },
                { name: 'Free response', value: 'Free response' },
            ],
        },
        {
            name: 'question',
            description: 'The question to ask',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: `option${i + 1}`,
            description: `Option ${i + 1} (Required for Multiple Choice)`,
            type: ApplicationCommandOptionType.String,
            required: false,
        })),
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            const type = interaction.options.getString('type');
            const question = interaction.options.getString('question');
            const options = [];
            for (let i = 1; i <= 10; i++) {
                const opt = interaction.options.getString(`option${i}`);
                if (opt) options.push(opt);
            }

            if (type === 'Multiple choices' && options.length < 2) {
                return interaction.reply({ content: '⚠️ Multiple choice polls require at least 2 options.', ephemeral: true });
            }

            await interaction.deferReply();

            const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
            const expiresTimestamp = Math.floor(expiresAt.getTime() / 1000);

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${question}`)
                .setDescription(`**Type:** ${type}\n**Ends:** <t:${expiresTimestamp}:R> (<t:${expiresTimestamp}:f>)`)
                .setColor('Gold')
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: 'Poll will be deleted automatically after 5 days.' });

            const components = [];

            if (type === 'Multiple choices') {
                const descriptionLines = [`**Type:** ${type}\n**Ends:** <t:${expiresTimestamp}:R> (<t:${expiresTimestamp}:f>)\n`];
                
                const rows = [];
                let currentRow = new ActionRowBuilder();

                options.forEach((opt, index) => {
                    const progressBar = '⬛'.repeat(10);
                    descriptionLines.push(`**${index + 1}.** ${opt}\n${progressBar} 0% (0 votes)`);
                    
                    const button = new ButtonBuilder()
                        .setCustomId(`poll_vote_${index}`)
                        .setLabel(`${index + 1}`)
                        .setStyle(ButtonStyle.Primary);
                    
                    currentRow.addComponents(button);

                    if (currentRow.components.length === 5) {
                        rows.push(currentRow);
                        currentRow = new ActionRowBuilder();
                    }
                });
                if (currentRow.components.length > 0) rows.push(currentRow);
                components.push(...rows);
                
                embed.setDescription(descriptionLines.join('\n'));
            } else {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('poll_answer')
                        .setLabel('Submit Answer')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📝'),
                    new ButtonBuilder()
                        .setCustomId('poll_view_answers')
                        .setLabel('View Answers (Creator Only)')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👀')
                );
                components.push(row);
                embed.addFields({ name: 'Responses', value: 'No responses yet.' });
            }

            const message = await interaction.editReply({ embeds: [embed], components });

            const newPoll = new Poll({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                messageId: message.id,
                creatorId: interaction.user.id,
                question,
                type,
                options: type === 'Multiple choices' ? options : [],
                expiresAt,
            });

            await newPoll.save();

        } catch (error) {
            console.error('Error creating poll:', error);
            if (interaction.deferred) {
                await interaction.editReply({ content: '⚠️ Failed to create poll.' });
            } else {
                await interaction.reply({ content: '⚠️ Failed to create poll.', ephemeral: true });
            }
        }
    },
};
