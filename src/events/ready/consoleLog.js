const activities = [
    '👋Xin chào mọi người ạ',
    'Em là 1 chú bot vừa mới sinh ra, nên em chưa biết nhiều ạ 🥹',
    'Mọi người hãy dùng channel ai của em để nói chuyện trực tiếp với em nhé 😊',
    '⭐💫⭐',
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
    }, 10000);
  };
  