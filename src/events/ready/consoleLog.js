// const sonicQuotes = [
//     'I have a small business to do!',
//     'Gotta Go Fastt',
//     'I\'m a hedgehog. I thought that was obvious.',
//     'Nobody\'s gonna take my friends from me. Except me.',
//     'Uh, meow?',
//     'I\'ve been living my best life on Earth!',
//     'This is my power… and I\'m not using it to run away anymore.'
//   ];
  
  module.exports = (client) => {
    console.log(`${client.user.tag} is online`);
  
    // Function to select a random quote from the sonicQuotes array
    // function getRandomQuote() {
    //   const randomIndex = Math.floor(Math.random() * sonicQuotes.length);
    //   return sonicQuotes[randomIndex];
    // }
  
    // Set Rich Presence
    function setRichPresence() {
      // const randomQuote = getRandomQuote();
      
      client.user.setPresence({
        activities: [{
          name: 'Sonic the Hedgehog',
          type: 0, // Playing
          details: 'Sonic The Hedgehog',
          state: 'Playing Solo',
          timestamps: {
            start: Date.now() // Shows "elapsed" time since bot started
          },
          assets: {
            large_image: 'sonic_knuckle_tail', // Large image: Sonic, Knuckles, and Tails
            large_text: 'Numbani',
            small_image: 'christmas_sonic', // Small image: Christmas Sonic
            small_text: 'Rogue - Level 100',
          }
        }],
        status: 'online'
      });
    }
  
    // Set the initial Rich Presence when the bot is ready
    setRichPresence();
  
    // Update Rich Presence with a new random quote every 20 seconds
    // setInterval(() => {
    //   setRichPresence();
    // }, 20000);
  };
  