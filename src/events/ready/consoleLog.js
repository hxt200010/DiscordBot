const activities = [
    '💨⚡ Gotta Go Fastt⚡️ 💨⚡',
    '💨⚡ I\'m a hedgehog. I thought that was obvious. 💨⚡',
    '💨⚡ Nobody\'s gonna take my friends from me. Except me. 💨⚡',
    '💨⚡ Uh, meow? 💨⚡',
    '💨⚡ I\'ve been living my best life on Earth! 💨⚡',
    '💨⚡ This is my power… and I\'m not using it to run away anymore. 💨⚡'
  ];
  
  module.exports = (client) => {
    console.log(`${client.user.tag} is online`);
  
    // Function to select a random activity from the activities array
    function getRandomActivity() {
      const randomIndex = Math.floor(Math.random() * activities.length);
      return activities[randomIndex];
    }
  
    // Set a random activity for the bot's presence
    function setRandomPresence() {
      const randomActivity = getRandomActivity();
      client.user.setPresence({ activities: [{ name: randomActivity }], status: 'online' });
    }
  
    // Set the initial presence when the bot is ready
    setRandomPresence();
  
    // Set a new random activity every 10 seconds (10000 milliseconds)
    setInterval(() => {
      setRandomPresence();
    }, 20000);
  };
  