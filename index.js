const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Telegram Bot Token
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Array of WAV file paths
const wavFiles = [
    '/path/to/wav/file1.wav',
    '/path/to/wav/file2.wav',
    // Add more file paths as needed
];

// Create Telegram bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user transcriptions
const transcriptions = {};

// Handler for when the bot receives a message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!transcriptions.hasOwnProperty(chatId)) {
        // If there is no transcription for this user, send the first WAV file
        sendWavFile(chatId);
        return;
    }

    const currentTranscription = transcriptions[chatId];

    if (currentTranscription.isConfirming) {
        if (messageText === 'confirm') {
            // User confirmed the transcription
            transcriptions[chatId].isConfirming = false;
            sendWavFile(chatId);
        } else if (messageText === 'undo') {
            // User wants to undo and rewrite the transcription
            transcriptions[chatId].transcription = '';
            bot.sendMessage(chatId, 'Please rewrite the transcription:');
        } else {
            // User is rewriting the transcription
            transcriptions[chatId].transcription = messageText;
            bot.sendMessage(chatId, 'Transcription updated. Please confirm or undo:');
        }
    } else {
        // User is providing the transcription
        transcriptions[chatId].transcription = messageText;
        bot.sendMessage(chatId, 'Please confirm or undo the transcription:', {
            reply_markup: {
                keyboard: [
                    ['Confirm'],
                    ['Undo']
                ],
            },
        });
        transcriptions[chatId].isConfirming = true;
    }
});

// Function to send a WAV file to a user
function sendWavFile(chatId) {
    if (wavFiles.length === 0) {
        // No more files to send
        bot.sendMessage(chatId, 'No more files to transcribe.');
        return;
    }

    const wavFilePath = wavFiles.shift();
    const wavFile = fs.readFileSync(wavFilePath);

    bot.sendAudio(chatId, wavFile);
    transcriptions[chatId] = { transcription: '', isConfirming: false };
    bot.sendMessage(chatId, 'Please transcribe the audio:');
}

// Start the bot
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to the transcription bot! Sending the first audio file...');
    sendWavFile(chatId);
});