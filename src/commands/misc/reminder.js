const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Reminder = require('../../models/Reminder');
const moment = require('moment');

module.exports = {
    name: 'reminder',
    description: 'Set a reminder',
    options: [
        {
            name: 'message',
            description: 'What do you want to be reminded about?',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'time',
            description: 'When? (e.g., "10:30 PM", "in 10m", "tomorrow")',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'date',
            description: 'Specific date (e.g., "2023-12-25"). If omitted, defaults to today/tomorrow based on time.',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'channel',
            description: 'Channel to send the reminder in (default: this channel)',
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
        {
            name: 'repeat',
            description: 'Repeat this reminder?',
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: 'No', value: 'no' },
                { name: 'Daily', value: 'daily' },
                { name: 'Weekly', value: 'weekly' },
                { name: 'Monthly', value: 'monthly' },
            ],
            required: false,
        },
        {
            name: 'emergency',
            description: 'Is this an emergency reminder?',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],

    callback: async (client, interaction) => {
        const message = interaction.options.getString('message');
        const timeInput = interaction.options.getString('time');
        const dateInput = interaction.options.getString('date');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const repeat = interaction.options.getString('repeat') || 'no';
        const emergency = interaction.options.getBoolean('emergency') || false;

        try {
            // Parse time
            let reminderTime;
            
            // Check for relative time first (e.g., "in 10m", "in 1 hour")
            const relativeMatch = timeInput.match(/^in\s+(\d+)\s*(m|min|minutes?|h|hours?|d|days?|s|seconds?)$/i);
            if (relativeMatch) {
                const amount = parseInt(relativeMatch[1]);
                const unit = relativeMatch[2].toLowerCase();
                reminderTime = moment().add(amount, unit.startsWith('m') ? 'minutes' : unit.startsWith('h') ? 'hours' : unit.startsWith('d') ? 'days' : 'seconds');
            } else {
                // Parse absolute time
                let dateTimeString = timeInput;
                if (dateInput) {
                    dateTimeString = `${dateInput} ${timeInput}`;
                }
                
                // Try multiple formats
                const formats = [
                    'YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A', 'YYYY-MM-DD HH:mm:ss',
                    'HH:mm', 'h:mm A', 'h:mmA'
                ];
                
                let parsed = moment(dateTimeString, formats);
                
                // If date wasn't provided and time is in the past, assume tomorrow
                if (!dateInput && parsed.isValid() && parsed.isBefore(moment())) {
                    parsed.add(1, 'days');
                }
                
                if (parsed.isValid()) {
                    reminderTime = parsed;
                }
            }

            if (!reminderTime || !reminderTime.isValid()) {
                return interaction.reply({
                    content: 'Invalid time/date format. Please use formats like "10:30 PM", "in 10m", "2023-12-25 14:00".',
                    ephemeral: true,
                });
            }

            const newReminder = new Reminder({
                userId: interaction.user.id,
                channelId: channel.id,
                message: message,
                time: reminderTime.toDate(),
                repeat: repeat,
                emergency: emergency,
            });

            await newReminder.save();

            const embed = new EmbedBuilder()
                .setTitle('Reminder Set!')
                .setDescription(`I will remind you about: **${message}**`)
                .addFields(
                    { name: 'Time', value: `<t:${Math.floor(reminderTime.valueOf() / 1000)}:F> (<t:${Math.floor(reminderTime.valueOf() / 1000)}:R>)`, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Repeat', value: repeat, inline: true },
                    { name: 'Emergency', value: emergency ? 'Yes' : 'No', inline: true }
                )
                .setColor(emergency ? '#FF0000' : '#00FF00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error setting reminder:', error);
            await interaction.reply({ content: 'There was an error setting your reminder.', ephemeral: true });
        }
    },
};
