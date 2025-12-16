const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, ApplicationCommandOptionType } = require('discord.js');
const economy = require('../../utils/EconomySystem');

// Card constants
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const SUITS = ['♠', '♣', '♦', '♥'];
const SUIT_EMOJIS = { '♠': '♠️', '♣': '♣️', '♦': '♦️', '♥': '♥️' };

// Bot names for multi-bot games
const BOT_NAMES = ['🤖 Bot 1', '🤖 Bot 2', '🤖 Bot 3'];

// Turn timer (in milliseconds) - 30 seconds per turn
const TURN_TIMER = 30000;

// Card value for comparison (rank * 4 + suit)
const getCardValue = (card) => {
    const rankIndex = RANKS.indexOf(card.rank);
    const suitIndex = SUITS.indexOf(card.suit);
    return rankIndex * 4 + suitIndex;
};

// Create a full deck (52 unique cards)
const createDeck = () => {
    const deck = [];
    let cardId = 0;
    for (const rank of RANKS) {
        for (const suit of SUITS) {
            deck.push({ 
                id: cardId++, // Unique ID for each card
                rank, 
                suit, 
                value: getCardValue({ rank, suit }) 
            });
        }
    }
    return deck;
};

// Shuffle deck
const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Format card for display
const formatCard = (card) => `${card.rank}${SUIT_EMOJIS[card.suit]}`;

// Format multiple cards
const formatCards = (cards) => cards.map(formatCard).join(' ');

// Sort cards by value
const sortCards = (cards) => [...cards].sort((a, b) => a.value - b.value);

// Get hand type and validate
const getHandType = (cards) => {
    if (cards.length === 0) return null;
    
    const sorted = sortCards(cards);
    const ranks = sorted.map(c => RANKS.indexOf(c.rank));
    
    // Single
    if (cards.length === 1) {
        return { type: 'single', highCard: sorted[0], cards: sorted };
    }
    
    // Pair
    if (cards.length === 2) {
        if (ranks[0] === ranks[1]) {
            return { type: 'pair', highCard: sorted[1], cards: sorted };
        }
        return null;
    }
    
    // Triple
    if (cards.length === 3) {
        if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
            return { type: 'triple', highCard: sorted[2], cards: sorted };
        }
        // Check for sequence
        if (isSequence(ranks)) {
            return { type: 'sequence', length: 3, highCard: sorted[2], cards: sorted };
        }
        return null;
    }
    
    // Four of a kind
    if (cards.length === 4 && ranks.every(r => r === ranks[0])) {
        return { type: 'four', highCard: sorted[3], cards: sorted };
    }
    
    // Sequence (3+ cards)
    if (cards.length >= 3 && isSequence(ranks)) {
        return { type: 'sequence', length: cards.length, highCard: sorted[sorted.length - 1], cards: sorted };
    }
    
    // Pair sequence (3+ consecutive pairs)
    if (cards.length >= 6 && cards.length % 2 === 0) {
        const pairSeq = isPairSequence(sorted);
        if (pairSeq) {
            return { type: 'pairSequence', length: cards.length / 2, highCard: sorted[sorted.length - 1], cards: sorted };
        }
    }
    
    return null;
};

// Check if ranks form a sequence (no 2s allowed)
const isSequence = (ranks) => {
    if (ranks.some(r => r === 12)) return false; // No 2s in sequences
    for (let i = 1; i < ranks.length; i++) {
        if (ranks[i] !== ranks[i - 1] + 1) return false;
    }
    return true;
};

// Check if cards form a pair sequence
const isPairSequence = (sorted) => {
    const ranks = sorted.map(c => RANKS.indexOf(c.rank));
    if (ranks.some(r => r === 12)) return false; // No 2s
    
    for (let i = 0; i < sorted.length; i += 2) {
        if (ranks[i] !== ranks[i + 1]) return false;
        if (i > 0 && ranks[i] !== ranks[i - 2] + 1) return false;
    }
    return true;
};

// Check if hand can beat another
const canBeat = (playedHand, lastHand) => {
    if (!lastHand) return true; // First play of round
    
    // Special chops
    if (playedHand.type === 'four') {
        if (lastHand.type === 'single' && lastHand.highCard.rank === '2') return true;
        if (lastHand.type === 'pair' && lastHand.highCard.rank === '2') return true;
    }
    
    if (playedHand.type === 'pairSequence' && playedHand.length >= 3) {
        if (lastHand.type === 'single' && lastHand.highCard.rank === '2') return true;
        if (playedHand.length >= 4 && lastHand.type === 'pair' && lastHand.highCard.rank === '2') return true;
    }
    
    // Must be same type
    if (playedHand.type !== lastHand.type) return false;
    
    // Same length for sequences
    if (playedHand.type === 'sequence' && playedHand.length !== lastHand.length) return false;
    if (playedHand.type === 'pairSequence' && playedHand.length !== lastHand.length) return false;
    
    // Compare high cards
    return playedHand.highCard.value > lastHand.highCard.value;
};

// Get valid plays from hand
const getValidPlays = (hand, lastHand) => {
    const validPlays = [];
    
    // Group cards by rank for easier combo finding
    const rankGroups = {};
    hand.forEach(c => {
        if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
        rankGroups[c.rank].push(c);
    });
    
    // If no last hand, can play anything valid
    if (!lastHand) {
        // Singles
        for (const card of hand) {
            validPlays.push([card]);
        }
        
        // Pairs, Triples, Four of a Kind
        for (const cards of Object.values(rankGroups)) {
            if (cards.length >= 2) {
                validPlays.push([cards[0], cards[1]]); // Pair
            }
            if (cards.length >= 3) {
                validPlays.push([cards[0], cards[1], cards[2]]); // Triple
            }
            if (cards.length === 4) {
                validPlays.push([cards[0], cards[1], cards[2], cards[3]]); // Four of a kind
            }
        }
        
        // Sequences (3+ consecutive cards, no 2s)
        const sortedHand = sortCards(hand.filter(c => c.rank !== '2'));
        for (let len = 3; len <= sortedHand.length; len++) {
            for (let start = 0; start <= sortedHand.length - len; start++) {
                const seq = sortedHand.slice(start, start + len);
                const ranks = seq.map(c => RANKS.indexOf(c.rank));
                // Check if consecutive
                let isSeq = true;
                for (let i = 1; i < ranks.length; i++) {
                    if (ranks[i] !== ranks[i-1] + 1) {
                        isSeq = false;
                        break;
                    }
                }
                if (isSeq) {
                    validPlays.push(seq);
                }
            }
        }
        
        return validPlays;
    }
    
    // Must beat last hand
    if (lastHand.type === 'single') {
        for (const card of hand) {
            if (card.value > lastHand.highCard.value) {
                validPlays.push([card]);
            }
        }
        // Check for chops against 2
        if (lastHand.highCard.rank === '2') {
            const rankGroups = {};
            hand.forEach(c => {
                if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
                rankGroups[c.rank].push(c);
            });
            for (const cards of Object.values(rankGroups)) {
                if (cards.length === 4) validPlays.push(cards);
            }
        }
    } else if (lastHand.type === 'pair') {
        const rankGroups = {};
        hand.forEach(c => {
            if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
            rankGroups[c.rank].push(c);
        });
        for (const cards of Object.values(rankGroups)) {
            if (cards.length >= 2) {
                const pair = [cards[0], cards[1]];
                const pairHand = getHandType(pair);
                if (pairHand && canBeat(pairHand, lastHand)) {
                    validPlays.push(pair);
                }
            }
        }
    } else if (lastHand.type === 'triple') {
        const rankGroups = {};
        hand.forEach(c => {
            if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
            rankGroups[c.rank].push(c);
        });
        for (const cards of Object.values(rankGroups)) {
            if (cards.length >= 3) {
                const triple = [cards[0], cards[1], cards[2]];
                const tripleHand = getHandType(triple);
                if (tripleHand && canBeat(tripleHand, lastHand)) {
                    validPlays.push(triple);
                }
            }
        }
    }
    
    return validPlays;
};

// Bot AI: Choose best play
const getBotPlay = (hand, lastHand) => {
    const validPlays = getValidPlays(hand, lastHand);
    
    if (validPlays.length === 0) return null; // Must pass
    
    // Filter out plays with 2s (save them for later)
    const nonTwoPlays = validPlays.filter(play => !play.some(c => c.rank === '2'));
    const playsToConsider = nonTwoPlays.length > 0 ? nonTwoPlays : validPlays;
    
    // Find the lowest card in hand (to prioritize getting rid of low cards)
    const lowestCard = hand.reduce((min, c) => c.value < min.value ? c : min, hand[0]);
    
    // Prefer plays that include the lowest card
    const playsWithLowest = playsToConsider.filter(play => 
        play.some(c => c.id === lowestCard.id)
    );
    
    // If we have plays with the lowest card, pick from those
    const candidatePlays = playsWithLowest.length > 0 ? playsWithLowest : playsToConsider;
    
    // Sort all plays by:
    // 1. Lowest minimum card value (get rid of low cards first)
    // 2. Then by total value
    candidatePlays.sort((a, b) => {
        const aMin = Math.min(...a.map(c => c.value));
        const bMin = Math.min(...b.map(c => c.value));
        if (aMin !== bMin) return aMin - bMin;
        
        // Same min, prefer more cards (to reduce hand faster)
        if (a.length !== b.length) return b.length - a.length;
        
        // Same size, prefer lower total value
        const aVal = a.reduce((sum, c) => sum + c.value, 0);
        const bVal = b.reduce((sum, c) => sum + c.value, 0);
        return aVal - bVal;
    });
    
    return candidatePlays[0];
};

module.exports = {
    name: 'tienlen',
    description: 'Play Tiến Lên (Vietnamese card game) with 2-4 players!',
    options: [
        {
            name: 'players',
            description: 'Number of players (2-4, default: 2)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 2,
            maxValue: 4,
        },
        {
            name: 'bet',
            description: 'Amount to bet - winner takes all!',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 10,
        }
    ],

    callback: async (client, interaction) => {
        const playerCount = interaction.options.getInteger('players') || 2;
        const bet = interaction.options.getInteger('bet') || 0;
        const challenger = interaction.user;
        
        // Check balance if betting
        if (bet > 0) {
            const balance = await economy.getBalance(challenger.id);
            if (balance < bet) {
                return interaction.reply({ 
                    content: `You don't have enough money! Your balance is $${balance}.`, 
                    ephemeral: true 
                });
            }
            // Take bet from player
            await economy.removeBalance(challenger.id, bet);
        }

        // Create players array (player + bots)
        const players = [
            { id: challenger.id, name: challenger.username, isBot: false, isPlayer: true }
        ];
        
        for (let i = 0; i < playerCount - 1; i++) {
            players.push({
                id: `BOT_${i + 1}`,
                name: BOT_NAMES[i],
                isBot: true,
                isPlayer: false
            });
        }

        // Game state
        const deck = shuffleDeck(createDeck());
        const cardsPerPlayer = 13; // Always 13 cards per player in Tiến Lên
        const hands = {};
        
        // Deal cards (13 each, remaining cards not used)
        players.forEach((player, idx) => {
            const start = idx * cardsPerPlayer;
            hands[player.id] = sortCards(deck.slice(start, start + cardsPerPlayer));
        });
        
        // Find who has 3♠ (goes first)
        let currentPlayerIdx = 0;
        for (let i = 0; i < players.length; i++) {
            if (hands[players[i].id].some(c => c.rank === '3' && c.suit === '♠')) {
                currentPlayerIdx = i;
                break;
            }
        }
        
        let lastHand = null;
        let lastPlayerIdx = null;
        let gameOver = false;
        let selectedCards = [];
        let winner = null;
        let passedPlayers = new Set(); // Track who has passed this round (locked until round reset)
        let turnTimerId = null; // Timer for auto-pass
        let turnStartTime = null; // When the turn started (for countdown display)
        
        // Base reward for winning
        const WIN_REWARD = 100;
        const totalPot = bet * playerCount; // Winner takes all

        const getNextPlayerIdx = (fromIdx) => {
            let next = (fromIdx + 1) % players.length;
            let attempts = 0;
            // Skip players with no cards OR who have passed this round
            while (attempts < players.length) {
                if (hands[players[next].id].length > 0 && !passedPlayers.has(players[next].id)) {
                    return next;
                }
                next = (next + 1) % players.length;
                attempts++;
            }
            // If we've gone full circle, return the last player who played
            return lastPlayerIdx !== null ? lastPlayerIdx : fromIdx;
        };

        const startNewRound = () => {
            lastHand = null;
            lastPlayerIdx = null;
            passedPlayers.clear();
        };

        const getActivePlayersCount = () => {
            return players.filter(p => hands[p.id].length > 0 && !passedPlayers.has(p.id)).length;
        };

        const createEmbed = (status = 'playing', message = '') => {
            switch (status) {
                case 'playing':
                    const currentPlayer = players[currentPlayerIdx];
                    const isYourTurn = currentPlayer.isPlayer;
                    
                    // Build clean player list with card bars and pass status
                    const playerList = players.map((p, idx) => {
                        const cards = hands[p.id].length;
                        const bar = '█'.repeat(Math.min(cards, 13)) + '░'.repeat(Math.max(0, 13 - cards));
                        const icon = p.isPlayer ? '👤' : '🤖';
                        const turn = idx === currentPlayerIdx ? '▶' : ' ';
                        const passStatus = passedPlayers.has(p.id) ? ' 🚫' : '';
                        return `${turn} ${icon} ${p.name.padEnd(12)} \`${bar}\` ${cards}${passStatus}`;
                    }).join('\n');
                    
                    // Build description
                    let desc = '';
                    
                    // Last play
                    if (lastHand && lastPlayerIdx !== null) {
                        desc += `**Last Play:** ${formatCards(lastHand.cards)} *(${players[lastPlayerIdx].name})*\n\n`;
                    }
                    
                    // Message or status
                    if (message) {
                        desc += `📢 ${message}\n\n`;
                    }
                    
                    // Player list
                    desc += `**Players:**\n${playerList}`;
                    
                    // Pot
                    if (bet > 0) {
                        desc += `\n\n💰 **Pot: $${totalPot}** *(Winner takes all!)*`;
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🎴 Tiến Lên`)
                        .setColor(isYourTurn ? 0x00D166 : 0x5865F2)
                        .setDescription(desc);
                    
                    // Show hand only on your turn
                    if (isYourTurn) {
                        let handText = formatCards(hands[challenger.id]);
                        
                        if (selectedCards.length > 0) {
                            const handType = getHandType(selectedCards);
                            const typeLabel = handType ? handType.type.toUpperCase() : 'INVALID';
                            handText += `\n\n📌 **${typeLabel}:** ${formatCards(sortCards(selectedCards))}`;
                        }
                        
                        embed.addFields({ 
                            name: '🎯 YOUR TURN — ' + (lastHand ? 'Beat it or Pass!' : 'Play anything!'), 
                            value: handText
                        });
                        // Show timer countdown
                        if (turnStartTime) {
                            const elapsed = Date.now() - turnStartTime;
                            const remaining = Math.max(0, Math.ceil((TURN_TIMER - elapsed) / 1000));
                            embed.setFooter({ text: `⏱️ ${remaining}s remaining | 🚫 = passed (locked until round reset)` });
                        }
                    } else {
                        embed.setFooter({ text: `⏳ Waiting for ${currentPlayer.name}... | 🚫 = passed (locked until round reset)` });
                    }
                    
                    return embed;
                
                case 'win':
                    const winnerPlayer = winner;
                    const isPlayerWin = winnerPlayer.isPlayer;
                    
                    let rewardText = '';
                    if (isPlayerWin) {
                        const totalReward = WIN_REWARD + totalPot;
                        rewardText = `\n\n💰 **+$${totalReward}** earned!`;
                    } else if (bet > 0) {
                        rewardText = `\n\n💸 Lost **$${bet}**`;
                    }
                    
                    return new EmbedBuilder()
                        .setTitle(isPlayerWin ? '🏆 VICTORY!' : '💔 DEFEAT')
                        .setColor(isPlayerWin ? 0x00D166 : 0xED4245)
                        .setDescription(`**${winnerPlayer.name}** emptied their hand first!${rewardText}`)
                        .setFooter({ text: 'GG! Use /tienlen to play again' });
                
                case 'timeout':
                    return new EmbedBuilder()
                        .setTitle('⏰ Game Expired')
                        .setColor(0x99AAB5)
                        .setDescription('Game timed out. Your bet was refunded.');
            }
        };

        const createCardSelectMenu = () => {
            const hand = hands[challenger.id];
            if (hand.length === 0) return null;
            
            const options = hand.slice(0, 25).map((card, idx) => ({
                label: formatCard(card),
                value: `card_${idx}`,
                description: `${card.rank} of ${card.suit === '♠' ? 'Spades' : card.suit === '♣' ? 'Clubs' : card.suit === '♦' ? 'Diamonds' : 'Hearts'}`
            }));
            
            return new StringSelectMenuBuilder()
                .setCustomId('tl_select')
                .setPlaceholder('Select 1+ cards (Ctrl/Cmd+click for multiple)')
                .setMinValues(1)
                .setMaxValues(Math.min(hand.length, 25))
                .addOptions(options);
        };

        const createGameButtons = (canPass = true) => {
            const buttons = [
                new ButtonBuilder()
                    .setCustomId('tl_play')
                    .setLabel('Play Selected')
                    .setEmoji('🎴')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('tl_clear')
                    .setLabel('Clear')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary)
            ];
            
            if (canPass) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('tl_pass')
                        .setLabel('Pass')
                        .setEmoji('⏭️')
                        .setStyle(ButtonStyle.Danger)
                );
            }
            
            return new ActionRowBuilder().addComponents(buttons);
        };

        const updateGameState = async (inter, message = '') => {
            const components = [];
            
            if (players[currentPlayerIdx].isPlayer && !gameOver) {
                const selectMenu = createCardSelectMenu();
                if (selectMenu) {
                    components.push(new ActionRowBuilder().addComponents(selectMenu));
                }
                components.push(createGameButtons(lastHand !== null));
            }
            
            try {
                await inter.editReply({ embeds: [createEmbed('playing', message)], components });
            } catch (e) {
                console.error('Failed to update game:', e);
            }
        };

        // Clear any existing turn timer
        const clearTurnTimer = () => {
            if (turnTimerId) {
                clearTimeout(turnTimerId);
                turnTimerId = null;
            }
            turnStartTime = null;
        };

        // Handle auto-pass when timer expires
        const handleAutoPass = async () => {
            if (gameOver) return;
            
            const currentPlayer = players[currentPlayerIdx];
            if (!currentPlayer.isPlayer) return; // Only auto-pass for human players
            
            // Can't auto-pass on first play of a round (must play something)
            if (!lastHand) {
                // If it's the first play and timer expires, just restart timer
                // This shouldn't normally happen, but adds safety
                startTurnTimer();
                return;
            }
            
            // Auto-pass the player
            passedPlayers.add(challenger.id);
            selectedCards = [];
            
            // Check if only one active player left (they win the round)
            if (getActivePlayersCount() <= 1 && lastPlayerIdx !== null) {
                const roundWinnerIdx = lastPlayerIdx;
                startNewRound();
                currentPlayerIdx = roundWinnerIdx;
                await updateGameState(interaction, `⏰ Time's up! You auto-passed. 🔄 **New round!** ${players[roundWinnerIdx].name} won the round!`);
            } else {
                currentPlayerIdx = getNextPlayerIdx(currentPlayerIdx);
                await updateGameState(interaction, `⏰ Time's up! You auto-passed.`);
            }
            
            // Continue with next player
            if (currentPlayerIdx >= 0 && currentPlayerIdx < players.length) {
                if (players[currentPlayerIdx].isBot && !gameOver) {
                    await doBotTurn();
                } else if (players[currentPlayerIdx].isPlayer && !gameOver) {
                    startTurnTimer();
                }
            }
        };

        // Start turn timer for human player
        const startTurnTimer = () => {
            clearTurnTimer();
            
            if (gameOver) return;
            if (!players[currentPlayerIdx].isPlayer) return; // Don't start timer for bots
            
            turnStartTime = Date.now();
            turnTimerId = setTimeout(async () => {
                await handleAutoPass();
            }, TURN_TIMER);
        };

        const doBotTurn = async () => {
            if (gameOver) return;
            
            const currentPlayer = players[currentPlayerIdx];
            if (!currentPlayer.isBot) return;
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const botHand = hands[currentPlayer.id];
            const botPlay = getBotPlay(botHand, lastHand);
            
            if (!botPlay) {
                // Bot passes - add to passed set (locked until round reset)
                passedPlayers.add(currentPlayer.id);
                
                // Check if only one active player left (they win the round)
                if (getActivePlayersCount() <= 1 && lastPlayerIdx !== null) {
                    const roundWinnerIdx = lastPlayerIdx;
                    startNewRound();
                    currentPlayerIdx = roundWinnerIdx;
                    
                    try {
                        await updateGameState(interaction, `${currentPlayer.name} passed! 🔄 **New round!** ${players[roundWinnerIdx].name} won the round!`);
                    } catch (e) {
                        console.error('Bot pass error:', e);
                    }
                } else {
                    currentPlayerIdx = getNextPlayerIdx(currentPlayerIdx);
                    
                    try {
                        await updateGameState(interaction, `${currentPlayer.name} passed!`);
                    } catch (e) {
                        console.error('Bot pass error:', e);
                    }
                }
                
                // Continue with next bot or wait for player (with safety check)
                if (currentPlayerIdx >= 0 && currentPlayerIdx < players.length && 
                    players[currentPlayerIdx].isBot && !gameOver) {
                    await doBotTurn();
                }
                return;
            }
            
            // Bot plays
            const playedHand = getHandType(botPlay);
            
            // Remove cards from bot hand (use unique ID to prevent duplicates)
            for (const card of botPlay) {
                const idx = hands[currentPlayer.id].findIndex(c => c.id === card.id);
                if (idx !== -1) hands[currentPlayer.id].splice(idx, 1);
            }
            
            lastHand = playedHand;
            lastPlayerIdx = currentPlayerIdx;
            passedPlayers.clear(); // New play, everyone can play again
            
            // Check win
            if (hands[currentPlayer.id].length === 0) {
                gameOver = true;
                winner = currentPlayer;
                try {
                    await interaction.editReply({ embeds: [createEmbed('win')], components: [] });
                } catch (e) {
                    console.error('Bot win error:', e);
                }
                return;
            }
            
            currentPlayerIdx = getNextPlayerIdx(currentPlayerIdx);
            
            try {
                await updateGameState(interaction, `${currentPlayer.name} played: **${formatCards(botPlay)}**`);
            } catch (e) {
                console.error('Bot play error:', e);
            }
            
            // Continue with next bot or wait for player (with safety check)
            if (currentPlayerIdx >= 0 && currentPlayerIdx < players.length &&
                players[currentPlayerIdx].isBot) {
                await doBotTurn();
            } else if (players[currentPlayerIdx].isPlayer && !gameOver) {
                // Next player is human - start their timer
                startTurnTimer();
            }
        };

        // Start game - show initial state
        const components = [];
        if (players[currentPlayerIdx].isPlayer) {
            const selectMenu = createCardSelectMenu();
            if (selectMenu) {
                components.push(new ActionRowBuilder().addComponents(selectMenu));
            }
            components.push(createGameButtons(false)); // Can't pass on first turn
        }
        
        await interaction.reply({ embeds: [createEmbed('playing')], components });
        
        // If bot goes first, start bot turns
        if (players[currentPlayerIdx].isBot) {
            await doBotTurn();
        } else {
            // Player goes first - start the turn timer
            startTurnTimer();
        }

        const reply = await interaction.fetchReply();
        
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600000
        });

        const selectCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 600000
        });

        selectCollector.on('collect', async (i) => {
            try {
                if (i.user.id !== challenger.id) {
                    return i.reply({ content: "This isn't your game!", ephemeral: true });
                }
                
                selectedCards = i.values.map(v => {
                    const idx = parseInt(v.split('_')[1]);
                    return hands[challenger.id][idx];
                });
                
                const components = [];
                const selectMenu = createCardSelectMenu();
                if (selectMenu) {
                    components.push(new ActionRowBuilder().addComponents(selectMenu));
                }
                components.push(createGameButtons(lastHand !== null));
                
                await i.update({ embeds: [createEmbed('playing')], components });
            } catch (e) {
                console.error('Select error:', e);
            }
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== challenger.id) {
                return i.reply({ content: "This isn't your game!", ephemeral: true });
            }
            
            if (!players[currentPlayerIdx].isPlayer) {
                return i.reply({ content: "Wait for the bots to play!", ephemeral: true });
            }

            if (i.customId === 'tl_clear') {
                selectedCards = [];
                await i.reply({ content: 'Selection cleared!', ephemeral: true });
                return;
            }

            if (i.customId === 'tl_pass') {
                if (!lastHand) {
                    return i.reply({ content: "You can't pass on a new round!", ephemeral: true });
                }
                
                // Clear the turn timer since player acted
                clearTurnTimer();
                
                // Add player to passed set (locked until round reset)
                passedPlayers.add(challenger.id);
                
                // Check if only one active player left (they win the round)
                if (getActivePlayersCount() <= 1 && lastPlayerIdx !== null) {
                    const roundWinnerIdx = lastPlayerIdx;
                    startNewRound();
                    currentPlayerIdx = roundWinnerIdx;
                    
                    await i.deferUpdate();
                    await updateGameState(interaction, `You passed! 🔄 **New round!** ${players[roundWinnerIdx].name} won the round and plays next!`);
                } else {
                    currentPlayerIdx = getNextPlayerIdx(currentPlayerIdx);
                    await i.deferUpdate();
                    await updateGameState(interaction, 'You passed! (Locked until round reset)');
                }
                
                // Safety check before accessing players array
                if (currentPlayerIdx >= 0 && currentPlayerIdx < players.length &&
                    players[currentPlayerIdx].isBot && !gameOver) {
                    await doBotTurn();
                } else if (players[currentPlayerIdx].isPlayer && !gameOver) {
                    startTurnTimer();
                }
                return;
            }

            if (i.customId === 'tl_play') {
                if (selectedCards.length === 0) {
                    return i.reply({ content: 'Please select cards first!', ephemeral: true });
                }
                
                const playedHand = getHandType(selectedCards);
                
                if (!playedHand) {
                    return i.reply({ content: 'Invalid combination! Try singles, pairs, triples, or sequences.', ephemeral: true });
                }
                
                if (lastHand && !canBeat(playedHand, lastHand)) {
                    return i.reply({ content: `Your ${playedHand.type} doesn't beat the last play!`, ephemeral: true });
                }
                
                // Clear the turn timer since player acted
                clearTurnTimer();
                
                // Remove cards from hand (use unique ID to prevent duplicates)
                for (const card of selectedCards) {
                    const idx = hands[challenger.id].findIndex(c => c.id === card.id);
                    if (idx !== -1) hands[challenger.id].splice(idx, 1);
                }
                
                lastHand = playedHand;
                lastPlayerIdx = currentPlayerIdx;
                passedPlayers.clear(); // New play, everyone can play again
                const playedCardsFormatted = formatCards(playedHand.cards);
                selectedCards = [];
                
                // Check win
                if (hands[challenger.id].length === 0) {
                    gameOver = true;
                    winner = players[currentPlayerIdx];
                    clearTurnTimer(); // Clear timer on game end
                    
                    // Award winnings
                    const totalReward = WIN_REWARD + totalPot;
                    await economy.addBalance(challenger.id, totalReward);
                    
                    await i.update({ embeds: [createEmbed('win')], components: [] });
                    collector.stop('win');
                    return;
                }
                
                currentPlayerIdx = getNextPlayerIdx(currentPlayerIdx);
                await i.deferUpdate();
                
                await updateGameState(interaction, `You played: **${playedCardsFormatted}**`);
                
                if (currentPlayerIdx >= 0 && currentPlayerIdx < players.length &&
                    players[currentPlayerIdx].isBot) {
                    await doBotTurn();
                } else if (players[currentPlayerIdx].isPlayer && !gameOver) {
                    startTurnTimer();
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            // Clear timer when collector ends
            clearTurnTimer();
            
            if (reason === 'time') {
                gameOver = true;
                // Refund bet on timeout
                if (bet > 0) {
                    await economy.addBalance(challenger.id, bet);
                }
                try {
                    await interaction.editReply({ embeds: [createEmbed('timeout')], components: [] });
                } catch (e) {}
            }
        });
    }
};
