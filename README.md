# Discord Bot

## Overview

<img width="1632" height="640" alt="Image" src="https://github.com/user-attachments/assets/0edd9ffe-557e-4a8e-9d3e-92912d312f52" />

My name is Sonic, and this is the me version of the bot — fast, fearless, and packed with more features than rings in a bonus stage! This Discord bot is way past cool! Built with Discord.js at lightning speed, it delivers a whole bundle of awesome — algorithm tricks, number-crunching math moves, handy utilities, fun entertainment commands, and even a full-on economy with casino-style games. It’s sleek, speedy, and organized with a modular design that keeps everything running smoother than one of my loop-de-loops. Whether you're sorting data, cracking codes, or rolling dice, this bot’s built for max performance and ultimate extensibility. Just plug in, play, and let the good times zoom! 💙⚡️

## Features

### 🐾 Virtual Pet System (NEW!)
Adopt and raise your own virtual companions!
- **Adopt**: Choose from various characters like Sonic, Shadow, and Tails (`/adopt`)
- **Care**: Feed, play, pat, and put your pets to sleep (`/pet-action`)
- **Level Up**: Earn XP and level up your pets to increase their stats
- **Grind**: Send your pets to work to earn coins for you (`/pet-action grind`)
- **Battle**: Pets have Attack and Defense stats for future battles
- **Manage**: View your collection (`/pet-list`) or sell pets (`/sell-pet`)

### 💰 Economy & Shop
Become the richest hedgehog in the server!
- **Balance**: Check your wallet (`/balance`)
- **Daily**: Claim free coins every 24 hours (`/daily`)
- **Work**: Earn coins by answering trivia questions (`/work`)
- **Give**: Transfer coins to friends (`/give`)
- **Shop**: Buy items like Shields, Repair Kits, and Pet Food (`/shop`, `/buy`)
- **Inventory**: Manage your items (`/inventory`)
- **Item Usage**: 
    - **Shield**: Protect yourself from robbery (`/shield`)
    - **Shoot**: Attack other users (requires a gun) (`/shoot`)
    - **Repair**: Fix your broken shield (`/repair`)

### 🎮 Fun & Games
- **Blackjack**: High-stakes casino game with a rich UI (`/blackjack`)
- **Mining**: Dig for gems and resources (`/mine`)
- **Hangman**: Classic word guessing game (`/hangman`)
- **Sudoku**: Solve Sudoku puzzles (`/sudoku`)
- **Riddles**: Solve brain teasers (`/riddle`)
- **Cipher**: Encode and decode secret messages (`/cipher`)
- **Meme**: Get random memes from Giphy (`/meme`)
- **Shadow**: Special Shadow the Hedgehog interactions (`/shadow`)
- **Say**: Make the bot repeat your message (`/say`)
- **Steal**: Attempt to steal coins from other users (`/steal`)

### 🤖 AI & Education
- **ChatGPT**: Chat with an AI assistant (`/learnai`)
- **Learn**: Get detailed explanations for various topics (`/learn`)
- **Data Structures**: Learn about Computer Science concepts (`/datastructure`)
- **Trivia**: Test your knowledge (`/trivia`)

### 🧮 Mathematics
- **Basic**: Add, Subtract, Multiply, Divide
- **Advanced**: Square Root, Logarithms, Integration (`/functionntergrate`)
- **Trigonometry**: Sine, Cosine, Tangent
- **Calculate**: Evaluate complex expressions (`/calculate`)

### 🛠️ Utilities
- **Weather**: Get real-time weather for any city (`/weather`)
- **Translate**: Translate text between languages (`/translate`)
- **Food**: Get nutrition info for food items (`/food`)
- **Time**: Check current time in any timezone (`/time`)
- **User Info**: Get details about a user (`/userinfo`)
- **Avatar**: View user avatars (`/avatar`)
- **Ping**: Check bot latency (`/ping`)

### 🛡️ Moderation
- **Ban/Unban**: Manage server bans
- **Kick**: Kick users from the server
- **Timeout/Untimeout**: Mute and unmute users
- **Purge**: Bulk delete messages

## Installation

### Prerequisites
- Node.js version 20.17.0 or higher
- A Discord Bot Token
- API Keys (Optional): OpenAI, Giphy, OpenWeather, Nutritionix

### Setup Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DiscordBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `src` directory:
   ```
   TOKEN=your_discord_bot_token
   API_KEY=your_openai_api_key
   MEME_API=your_giphy_api_key
   WEATHER_API=your_openweather_api_key
   FOOD_API=your_nutritionix_api_key
   FOOD_APPID=your_nutritionix_app_id
   ```

4. Configure server settings:
   Edit `config.json`:
   ```json
   {
     "testServer": "your_test_server_id",
     "devs": ["your_discord_user_id"]
   }
   ```

## Running the Bot

### Standard Mode
```bash
cd src
node index.js
```

### Development Mode
```bash
cd src
npx nodemon index.js
```

## Project Structure
```
DiscordBot/
├── src/
│   ├── commands/       # All bot commands organized by category
│   ├── events/         # Event handlers (ready, interactionCreate)
│   ├── utils/          # Utility classes (Database, Economy, Pets)
│   ├── data/           # Backup JSON files (migrated to SQLite)
│   └── index.js        # Entry point
├── database.sqlite     # SQLite Database (Users, Economy, Pets)
├── config.json         # Configuration
└── README.md           # Documentation
```

## Troubleshooting

**Bot not responding:**
- Check permissions and token.
- Ensure the bot is online.

**Database Issues:**
- The bot now uses `database.sqlite`. Ensure this file is writable.
- If you see errors, check the terminal logs.

Invite my bot using this link:
https://discord.com/oauth2/authorize?client_id=1130301590146916435&permissions=8&integration_type=0&scope=bot

https://github.com/user-attachments/assets/8db0a6f5-c72e-4ecf-b7d0-f9b14050c379
