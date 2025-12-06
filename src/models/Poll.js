const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
    },
    creatorId: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Multiple choices', 'Free response'],
        required: true,
    },
    options: {
        type: [String], // Array of option strings for multiple choice
        default: [],
    },
    votes: {
        type: Map,
        of: String, // userId -> option
        default: {},
    },
    answers: [{
        userId: String,
        answer: String,
        repliedAt: { type: Date, default: Date.now }
    }],
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: documents expire at this time
    }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
