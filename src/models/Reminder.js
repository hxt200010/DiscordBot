const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true,
    },
    repeat: {
        type: String,
        enum: ['no', 'daily', 'weekly', 'monthly'],
        default: 'no',
    },
    emergency: {
        type: Boolean,
        default: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
});

module.exports = mongoose.model('Reminder', reminderSchema);
