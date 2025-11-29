const sonicQuotes = [
    '⚡️I have a small business to do!',
    '⚡️Gotta Go Fastt',
    'I\'m a hedgehog. I thought that was obvious.',
    '⚡️Nobody\'s gonna take my friends from me. Except me.',
    'Uh, meow?',
    '⚡️I\'ve been living my best life on Earth!',
    '⚡️This is my power… and I\'m not using it to run away anymore.'
  ];
  
  module.exports = (client) => {
    console.log(`${client.user.tag} is online`);
  
    // Function to select a random quote from the sonicQuotes array
    function getRandomQuote() {
      const randomIndex = Math.floor(Math.random() * sonicQuotes.length);
      return sonicQuotes[randomIndex];
    }
  
    // Set bot presence (bots cannot use Rich Presence features)
    function setBotPresence() {
      const randomQuote = getRandomQuote();
      
      client.user.setPresence({
        activities: [{
          name: randomQuote, // This is what will show as "Playing [quote]"
          type: 0, // 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 5 = Competing
        }],
        status: 'online' // online, idle, dnd, invisible
      });
    }
  
    // Set the initial presence when the bot is ready
    setBotPresence();
  
    // Update presence with a new random quote every 20 seconds
    setInterval(() => {
      setBotPresence();
    }, 20000);
  };
  