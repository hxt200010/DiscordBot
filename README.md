# Discord Bot

## Overview

This Discord bot provides a collection of utility commands for server members. It is built using the Discord.js library and organized into modular command files.

## Features

- **Algorithm Commands**: Perform various algorithmic operations such as finding the biggest number in a list (`biggest.js`).
- **Utility Commands**: Provide helpful tools like ping, help, and server information.
- **Modular Structure**: Each command resides in its own file under `src/commands/`, making it easy to extend.

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Start the bot with `npm start`.

## Usage

Invite the bot to your server and use the prefix `!` (configurable) followed by a command name. For example:

- `!ping` – Checks the bot's responsiveness.
- `!biggest 3 9 2 7` – Returns the largest number from the provided list.

## Contributing

Feel free to open issues or submit pull requests to add new commands or improve existing ones.
