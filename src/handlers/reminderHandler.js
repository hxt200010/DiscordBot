const Reminder = require('../models/Reminder');
const { EmbedBuilder } = require('discord.js');
const moment = require('moment');

const checkReminders = async (client) => {
    try {
        const now = new Date();
        const reminders = await Reminder.find({
            active: true,
            time: { $lte: now },
        });

        for (const reminder of reminders) {
            try {
                const channel = await client.channels.fetch(reminder.channelId);
                if (channel) {
                    let content = `🔔 **Reminder** for <@${reminder.userId}>: ${reminder.message}`;
                    
                    if (reminder.emergency) {
                        content = `🚨 **EMERGENCY REMINDER** 🚨\n<@${reminder.userId}> **${reminder.message}**`;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(reminder.emergency ? '🚨 Emergency Reminder' : '🔔 Reminder')
                        .setDescription(reminder.message)
                        .setColor(reminder.emergency ? '#FF0000' : '#0099FF')
                        .setTimestamp(reminder.time);

                    await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
                }

                if (reminder.repeat !== 'no') {
                    let nextTime = moment(reminder.time);
                    if (reminder.repeat === 'daily') nextTime.add(1, 'days');
                    else if (reminder.repeat === 'weekly') nextTime.add(1, 'weeks');
                    else if (reminder.repeat === 'monthly') nextTime.add(1, 'months');
                    
                    reminder.time = nextTime.toDate();
                    await reminder.save();
                } else {
                    reminder.active = false;
                    await reminder.save();
                }
            } catch (err) {
                console.error(`Failed to process reminder ${reminder._id}:`, err);
                // If channel not found or other error, maybe deactivate to stop loop?
                // For now, just log.
            }
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
};

module.exports = (client) => {
    // Check every minute
    setInterval(() => checkReminders(client), 60 * 1000);
    
    // Initial check
    checkReminders(client);
};
