const { Interaction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const Poll = require('../../models/Poll');

/**
 * @param {Client} client
 * @param {Interaction} interaction
 */
module.exports = async (client, interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    const { customId } = interaction;

    // Handle Voting (Multiple Choice)
    if (interaction.isButton() && customId.startsWith('poll_vote_')) {
        const optionIndex = parseInt(customId.split('_')[2]);
        
        try {
            const poll = await Poll.findOne({ messageId: interaction.message.id });
            if (!poll) return interaction.reply({ content: '⚠️ Poll not found.', ephemeral: true });

            if (poll.type !== 'Multiple choices') return;

            // Update vote
            const userId = interaction.user.id;
            const previousVote = poll.votes.get(userId);
            
            if (previousVote === String(optionIndex)) {
                return interaction.reply({ content: 'You already voted for this option.', ephemeral: true });
            }

            poll.votes.set(userId, String(optionIndex));
            await poll.save();

            // Calculate new counts
            const voteCounts = new Array(poll.options.length).fill(0);
            let totalVotes = 0;
            for (const vote of poll.votes.values()) {
                voteCounts[parseInt(vote)]++;
                totalVotes++;
            }

            // Update Embed
            const embed = interaction.message.embeds[0];
            const newDescriptionLines = [`**Type:** ${poll.type}\n**Ends:** <t:${Math.floor(poll.expiresAt.getTime() / 1000)}:R> (<t:${Math.floor(poll.expiresAt.getTime() / 1000)}:f>)\n`];
            
            const progressBarEmojis = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬜', '🔴', '🟠'];

            poll.options.forEach((opt, index) => {
                const count = voteCounts[index];
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const filled = Math.round((percentage / 100) * 10);
                const empty = 10 - filled;
                const fillChar = progressBarEmojis[index % progressBarEmojis.length];
                const progressBar = fillChar.repeat(filled) + '⬛'.repeat(empty);
                
                newDescriptionLines.push(`**${index + 1}.** ${opt}\n${progressBar} ${percentage}% (${count} votes)`);
            });

            const newEmbed = EmbedBuilder.from(embed).setDescription(newDescriptionLines.join('\n'));
            
            await interaction.update({ embeds: [newEmbed] });

        } catch (error) {
            console.error('Error handling poll vote:', error);
            interaction.reply({ content: '⚠️ Error recording vote.', ephemeral: true });
        }
    }

    // Handle "Submit Answer" Button (Free Response)
    if (interaction.isButton() && customId === 'poll_answer') {
        const modal = new ModalBuilder()
            .setCustomId('poll_modal_answer')
            .setTitle('Submit Answer');

        const answerInput = new TextInputBuilder()
            .setCustomId('answer_input')
            .setLabel('Your Answer')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const row = new ActionRowBuilder().addComponents(answerInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Handle Modal Submission (Free Response)
    if (interaction.isModalSubmit() && customId === 'poll_modal_answer') {
        const answer = interaction.fields.getTextInputValue('answer_input');

        try {
            const poll = await Poll.findOne({ messageId: interaction.message.id });
            if (!poll) return interaction.reply({ content: '⚠️ Poll not found.', ephemeral: true });

            poll.answers.push({
                userId: interaction.user.id,
                answer: answer,
                repliedAt: new Date()
            });
            await poll.save();

            // Update Embed to show count of responses
            const embed = interaction.message.embeds[0];
            const newEmbed = EmbedBuilder.from(embed);
            
            // Find the "Responses" field and update it
            const fields = newEmbed.data.fields || [];
            const responseField = fields.find(f => f.name === 'Responses');
            if (responseField) {
                responseField.value = `${poll.answers.length} response(s) received.`;
            } else {
                newEmbed.addFields({ name: 'Responses', value: `${poll.answers.length} response(s) received.` });
            }

            await interaction.update({ embeds: [newEmbed] });
            await interaction.followUp({ content: '✅ Answer recorded!', ephemeral: true });

        } catch (error) {
            console.error('Error saving poll answer:', error);
            interaction.reply({ content: '⚠️ Error saving answer.', ephemeral: true });
        }
    }

    // Handle "View Answers" Button (Free Response)
    if (interaction.isButton() && customId === 'poll_view_answers') {
        try {
            const poll = await Poll.findOne({ messageId: interaction.message.id });
            if (!poll) return interaction.reply({ content: '⚠️ Poll not found.', ephemeral: true });

            if (interaction.user.id !== poll.creatorId) {
                return interaction.reply({ content: '⚠️ Only the poll creator can view answers.', ephemeral: true });
            }

            if (poll.answers.length === 0) {
                return interaction.reply({ content: 'No answers yet.', ephemeral: true });
            }

            const answerList = poll.answers.map((a, i) => `**${i + 1}.** <@${a.userId}>: ${a.answer}`).join('\n\n');
            
            // Split into chunks if too long (simple check)
            if (answerList.length > 2000) {
                 // Basic truncation for now
                 return interaction.reply({ content: `**Responses:**\n\n${answerList.substring(0, 1900)}...\n*(Truncated)*`, ephemeral: true });
            }

            interaction.reply({ content: `**Responses:**\n\n${answerList}`, ephemeral: true });

        } catch (error) {
            console.error('Error viewing poll answers:', error);
            interaction.reply({ content: '⚠️ Error retrieving answers.', ephemeral: true });
        }
    }
};
