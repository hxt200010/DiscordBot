# Discord Bot

## Overview

This is a feature-rich Discord bot built with Discord.js that provides a variety of commands including algorithmic operations, mathematical calculations, utility functions, entertainment features, and a complete economy system with casino games. The bot uses slash commands and is organized with a modular architecture for easy maintenance and extensibility.

## Features

### Algorithm Commands

- **Binary Search**: Search for elements in sorted arrays
- **Depth-First Search**: Traverse graph structures
- **Exponential Search**: Efficient searching in sorted arrays
- **Sorting Algorithms**: Sort arrays in ascending order
- **Array Operations**: Find biggest/smallest numbers, remove duplicates
- **Stock Analysis**: Basic stock price analysis

### Mathematical Commands

- **Basic Operations**: Add, subtract, multiply, divide
- **Advanced Functions**: Square root, logarithm, integration
- **Trigonometry**: Sine, cosine, tangent calculations
- **Expression Evaluation**: Calculate complex mathematical expressions

### Economy System

- **Balance**: Check your current balance or another user's balance
- **Daily Rewards**: Collect 1000 coins every 24 hours
- **Blackjack**: Play high-stakes blackjack with betting (minimum bet: 10 coins)

### Fun Commands

- **Meme**: Get random memes from Giphy
- **Say**: Make the bot repeat your message
- **Blackjack**: Casino-style blackjack game with enhanced UI

### Utility Commands

- **Avatar**: Display user avatars
- **Calories**: Get nutritional information for food items
- **Help**: Display all available commands
- **Owner**: Show bot owner information
- **Ping**: Check bot latency and response time
- **Time**: Get current time for any location
- **Translate**: Translate text between languages
- **User Info**: Display detailed user information
- **Weather**: Get weather information for any city

### Moderation Commands

- **Ban**: Ban users from the server (requires permissions)

### AI Integration

- **ChatGPT**: The bot includes OpenAI integration for conversational AI in designated channels

## Installation

### Prerequisites

- Node.js version 20.17.0 or higher
- A Discord Bot Token
- API Keys for various services (optional, depending on features used)

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

   - Navigate to the `src` directory
   - Create a `.env` file with the following variables:

   ```
   TOKEN=your_discord_bot_token
   API_KEY=your_openai_api_key
   CHANNEL_ID=your_primary_channel_id
   CHANNEL_ID_2=your_secondary_channel_id
   MEME_API=your_giphy_api_key
   WEATHER_API=your_openweather_api_key
   FOOD_API=your_nutritionix_api_key
   FOOD_APPID=your_nutritionix_app_id
   ```

4. Configure server settings:
   - Edit `config.json` in the root directory:
   ```json
   {
     "testServer": "your_test_server_id",
     "devs": ["your_discord_user_id"]
   }
   ```

## Running the Bot

### Standard Mode

To run the bot normally:

```bash
cd src
node index.js
```

### Development Mode with Auto-Restart

For development, use nodemon to automatically restart the bot when you make changes to files:

**Option 1: From the root directory**

```bash
npm run dev
```

**Option 2: From the src directory**

```bash
cd src
npx nodemon index.js
```

With nodemon running, any changes you save to your code files will automatically restart the bot, making development much faster and more convenient.

## Project Structure

```
DiscordBot/
├── src/
│   ├── commands/
│   │   ├── Algorithm/      # Algorithmic operation commands
│   │   ├── Economy/        # Currency and economy commands
│   │   ├── Education/      # Educational commands
│   │   ├── Fun/            # Entertainment commands
│   │   │   └── Blackjack/  # Card game utilities (Card, Deck classes)
│   │   ├── Game/           # Game-related utilities
│   │   ├── mathematic/     # Mathematical operation commands
│   │   ├── misc/           # Miscellaneous utility commands
│   │   └── moderation/     # Server moderation commands
│   ├── events/
│   │   ├── interactionCreate/  # Command interaction handlers
│   │   └── ready/              # Bot startup events
│   ├── handlers/
│   │   └── eventHandler.js     # Event registration system
│   ├── utils/
│   │   ├── EconomySystem.js    # Economy and currency management
│   │   ├── getAllFiles.js      # File system utilities
│   │   ├── getLocalCommands.js # Command loader
│   │   └── areCommandsDifferent.js  # Command comparison
│   ├── data/
│   │   └── economy.json        # User balance storage
│   ├── .env                    # Environment variables
│   └── index.js                # Main bot entry point
├── config.json                 # Bot configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Usage

All commands use Discord's slash command system. Simply type `/` in any channel where the bot has access to see all available commands.

### Example Commands

**Economy:**

- `/daily` - Collect your daily reward of 1000 coins
- `/balance` - Check your current balance
- `/balance @user` - Check another user's balance
- `/blackjack bet:100` - Play blackjack with a 100 coin bet

**Utility:**

- `/ping` - Check bot response time
- `/weather city:London` - Get weather for London
- `/translate` - Translate text between languages
- `/userinfo @user` - Get information about a user

**Math:**

- `/calculate expression:2+2*5` - Calculate mathematical expressions
- `/sqrt number:144` - Calculate square root
- `/sin angle:90` - Calculate sine of an angle

**Fun:**

- `/meme` - Get a random meme
- `/say message:Hello World` - Make the bot say something

## Economy System

The bot includes a complete economy system:

- **Starting Balance**: New users start with 0 coins
- **Daily Rewards**: Collect 1000 coins every 24 hours with `/daily`
- **Blackjack**: Bet coins in a casino-style blackjack game
  - Minimum bet: 10 coins
  - Win: Get 2x your bet back
  - Tie (Push): Get your bet back
  - Lose: Lose your bet
- **Balance Persistence**: All balances are saved in `src/data/economy.json`

## API Keys Required

Some commands require API keys to function:

- **OpenAI API**: For ChatGPT integration
- **Giphy API**: For meme commands
- **OpenWeather API**: For weather commands
- **Nutritionix API**: For calorie/food information commands

These are optional and the bot will work without them, but the respective commands will not function.

## Development

### Adding New Commands

1. Create a new file in the appropriate `src/commands/` subdirectory
2. Export an object with the following structure:
   ```javascript
   module.exports = {
     name: "commandname",
     description: "Command description",
     options: [], // Optional command options
     callback: async (client, interaction) => {
       // Command logic here
     },
   };
   ```
3. The command will be automatically registered on bot restart

### Command Categories

Commands are organized by category in separate folders. Create new folders for new categories as needed.

## Troubleshooting

**Bot not responding:**

- Ensure the bot has proper permissions in your Discord server
- Check that the bot token in `.env` is correct
- Verify the bot is online in Discord

**Commands not registering:**

- Check console for error messages during startup
- Ensure `testServer` in `config.json` is set correctly
- Try restarting the bot

**Economy data lost:**

- Check that `src/data/economy.json` exists and is not corrupted
- Ensure the bot has write permissions in the `src/data/` directory

**Interaction timeout errors:**

- These occur when commands take too long to respond
- The bot uses `deferReply` to prevent most timeout issues
- If issues persist, check your internet connection and Discord API status

## Contributing

Contributions are welcome. Please follow these guidelines:

- Keep code organized in the appropriate command category folders
- Use async/await for asynchronous operations
- Include proper error handling
- Test commands thoroughly before submitting
- Follow the existing code style and structure

## License

ISC

## Support

For issues or questions, please open an issue on the repository.
