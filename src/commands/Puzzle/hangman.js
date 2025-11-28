const { Client, Interaction, EmbedBuilder } = require('discord.js');
const economySystem = require('../../utils/EconomySystem');

const wordCategories = {
    food: [
        'pizza','burger','sushi','pasta','taco','ramen','curry','steak','salad','donut',
        'sandwich','noodles','pho','burrito','friedrice','dumplings','icecream','pancake','waffle','hotdog',
        'bbq','lasagna','steamedbun','cheesecake','brownie','cookie','soup','nachos','popcorn','smoothie',
        'fries','mashedpotato','grilledchicken','springroll','omelette','sausage','yogurt','udon','risotto',
        'shawarma','falafel','pudding','tiramisu','samosa','kimchi','bibimbap','toast','granola','cereal',
        'empanada','lobster','shrimp','clamchowder','paella','dumpling','schnitzel','gnocchi','mochi','takoyaki'
    ],

    anime: [
        'naruto','bleach','pokemon','onepiece','dragonball','deathnote','attackontitan','demonslayer','myheroacademia',
        'jujutsukaisen','tokyoghoul','chainsawman','swordartonline','blackclover','fairytail','fullmetalalchemist',
        'haikyuu','spyxfamily','rezero','steinsgate','codegeass','gintama','mobpsycho','boruto','drstone',
        'neonGenesisEvangelion','violetevergarden','bunnygirlSenpai','overlord','blueLock','kaijuNo8','soulEater',
        'noragami','fireforce','yugioh','baki','hunterxhunter','danganronpa','tokyorevengers','mushokutensei',
        'classroomOfElite','konosuba','onePunchMan','akamegakill','clannad','jojos','berserk','trigun','sailormoon'
    ],

    geography: [
        'paris','tokyo','london','egypt','brazil','canada','australia','india','mexico','spain',
        'germany','vietnam','singapore','thailand','china','japan','italy','france','sweden','norway',
        'denmark','switzerland','chile','peru','morocco','southkorea','northkorea','saudiarabia','indonesia','philippines',
        'argentina','colombia','turkey','greece','portugal','austria','ireland','poland','hungary','finland',
        'ukraine','russia','southafrica','kenya','egypt','iran','iraq','qatar','kuwait','newzealand'
    ],

    animals: [
        'lion','tiger','bear','wolf','fox','elephant','giraffe','panda','zebra','monkey',
        'kangaroo','koala','penguin','whale','dolphin','shark','eagle','falcon','owl','snake',
        'crocodile','hippopotamus','rhino','cheetah','leopard','buffalo','boar','camel','parrot','swan',
        'flamingo','ostrich','chimpanzee','gorilla','jaguar','lynx','seal','walrus','otter','hedgehog',
        'turtle','frog','toad','bison','meerkat','antelope','fox','wolfdog','mole','lemur'
    ],

    sports: [
        'basketball','football','soccer','baseball','tennis','golf','volleyball','swimming','boxing','hockey',
        'badminton','cricket','rugby','skateboarding','surfing','cycling','archery','fencing','wrestling','climbing',
        'rowing','canoeing','sailing','karate','judo','taekwondo','mma','gymnastics','snowboarding','skiing',
        'motorsport','formula1','nascar','billiards','tabletennis','bowling','handball','waterpolo','track','field',
        'marathon','triathlon','weightlifting','powerlifting','cheerleading','dance','parkour','kickboxing','pickleball'
    ],

    movies: [
        'avatar','inception','titanic','avengers','batman','superman','spiderman','matrix','frozen','minions',
        'shrek','jurassicpark','starwars','harrypotter','lordoftherings','godfather','terminator','rocky','creed','interstellar',
        'gravity','dune','oppenheimer','barbie','kungfupanda','madagascar','moana','encanto','ratatouille','toystory',
        'cars','up','wall-e','coco','bolt','lionking','aladdin','mulan','hercules','zootopia',
        'monstersinc','insideout','soul','bighero6','antman','ironman','doctorstrange','blackpanther','captainmarvel'
    ],

    videogames: [
        'minecraft','fortnite','valorant','overwatch','leagueoflegends','genshin','roblox','callofduty','halo','zelda',
        'mario','pokemon','eldenring','godofwar','apex','counterstrike','pubg','dota','rocketleague','skyrim',
        'fallguys','amongus','terraria','starfield','cyberpunk','spidermanps4','horizon','bloodborne','darkSouls','rainbowsix',
        'metalgear','streetfighter','tekken','animalcrossing','splatoon','kirby','donkeykong','fireemblem','bayonetta','massEffect',
        'bioshock','portal','left4dead','borderlands','diablo','warcraft','starcraft','fifa','nba2k','madden'
    ],

    technology: [
        'computer','smartphone','tablet','laptop','keyboard','mouse','monitor','router','internet','software',
        'hardware','battery','processor','gpu','cpu','motherboard','ssd','hdd','bluetooth','wifi',
        'ethernet','server','cloud','database','ai','robotics','nanotech','microchip','earbuds','headphones',
        'charger','satellite','drones','cybersecurity','firmware','algorithm','virtualreality','augmentedreality','machinelearning','powerbank',
        'webcam','microphone','gameconsole','smartwatch','printer','scanner','projector','oled','led','touchscreen'
    ],

    colors: [
        'red','blue','green','yellow','orange','purple','pink','white','black','brown',
        'gray','grey','turquoise','magenta','gold','silver','beige','maroon','navy','cyan',
        'teal','lavender','violet','lime','olive','salmon','coral','indigo','amber','emerald',
        'ruby','sapphire','jade','pearl','bronze','charcoal','cream','mustard','ivory','sand',
        'mint','peach','plum','brick','rust','forest','sky','seafoam','copper','khaki'
    ],

    music: [
        'guitar','piano','violin','drums','flute','saxophone','trumpet','ukulele','harp','cello',
        'rock','pop','jazz','hiphop','rap','country','edm','classical','techno','house',
        'orchestra','choir','acoustic','metal','reggae','blues','folk','opera','kpop','jpop',
        'instrumental','bass','synth','vocal','melody','harmony','rhythm','beat','timbre','lyrics',
        'microphone','amplifier','composer','dj','producer','band','solo','duet','chorus','anthem'
    ],

    mythology: [
        'zeus','thor','odin','hades','athena','poseidon','ares','apollo','hermes','hera',
        'loki','freya','anubis','ra','isis','osiris','horus','seth','bastet','sobek',
        'kratos','hercules','perseus','achilles','hector','artemis','demeter','dionysus','typhon','gaia',
        'uranus','chronos','minotaur','medusa','cyclops','fenrir','jormungandr','freyr','baldr','sif',
        'frigg','ishtar','marduk','enki','quetzalcoatl','kukulkan','amaterasu','susanoo','izanami','izanagi'
    ],

    jobs: [
        'doctor','nurse','teacher','engineer','pilot','chef','lawyer','dentist','scientist','police',
        'firefighter','mechanic','architect','designer','programmer','developer','cashier','barista','waiter','soldier',
        'paramedic','therapist','psychologist','pharmacist','biologist','chemist','physicist','astronomer','electrician','plumber',
        'carpenter','painter','driver','realtor','banker','accountant','comedian','actor','singer','dancer',
        'farmer','gardener','librarian','journalist','photographer','videographer','manager','assistant','security','coach'
    ],

    school: [
        'homework','classroom','teacher','student','backpack','notebook','exam','lunchbox','calculator','whiteboard',
        'laboratory','library','desk','chair','hallway','cafeteria','microscope','backpack','binder','folder',
        'pencil','pen','eraser','ruler','highlighter','textbook','worksheet','quiz','lecture','presentation',
        'project','labcoat','uniform','timetable','recess','playground','notepad','stickyNotes','protractor','compass',
        'chalk','markers','projector','monitor','tablet','dictionary','referencebook','assignment','deadline','syllabus'
    ],

    weather: [
        'rain','storm','snow','hurricane','tornado','fog','sunshine','cloud','wind','lightning',
        'drizzle','blizzard','heatwave','hail','mist','downpour','typhoon','cyclone','sandstorm','thunder',
        'rainbow','overcast','coldfront','warmfront','humidity','drought','flood','avalanche','frost','gale',
        'breeze','gust','monsoon','microburst','cloudburst','smog','dew','polarvortex','icefog','icestorm'
    ],

    cars: [
        'tesla','bmw','audi','mercedes','toyota','honda','ford','chevrolet','nissan','lexus',
        'porsche','lamborghini','ferrari','mclaren','bugatti','koenigsegg','rollsroyce','bentley','astonmartin','maserati',
        'kia','hyundai','volvo','jaguar','landrover','rangeRover','subaru','mazda','dodge','jeep',
        'camaro','mustang','challenger','corvette','supra','gtr','civic','accord','rav4','modelS',
        'model3','modelX','modelY','amg','rs6','urus','huracan','aventador','panamera','taycan'
    ],

    celebrities: [
        'taylorSwift','drake','beyonce','rihanna','rihanna','selenaGomez','zendaya','dualipa','kanyewest','kimkardashian',
        'arianagrande','justinbieber','shakira','theweeknd','billieeilish','oliviarodrigo','michaeljackson','elvis','madonna','brunomars',
        'jackiechan','therock','keanureeves','tomholland','zendaya','scarlettjohansson','ryanreynolds','chrishemsworth','robertdowneyjr','tomhanks',
        'leonardodicaprio','margotrobbie','angelinajolie','bradpitt','willSmith','zendaya','eminem','snoopdogg','jayz','travisscott'
    ],

    superheroes: [
        'superman','batman','spiderman','wonderwoman','flash','aquaman','cyborg','greenlantern','ironman','captainamerica',
        'thor','hulk','blackwidow','hawkeye','blackpanther','doctorstrange','antman','wolverine','deadpool','groot',
        'starLord','gamora','drax','rocket','scarletwitch','vision','thanos','ultron','loki','shazam',
        'homelander','starlight','aTrain','queenmaeve','stormfront','invincible','omniman','spawn','hellboy','kickass'
    ],

    household: [
        'table','chair','sofa','bed','pillow','blanket','lamp','mirror','carpet','curtain',
        'toothbrush','toothpaste','soap','shampoo','conditioner','towel','fridge','microwave','oven','stove',
        'television','remote','fan','heater','airconditioner','washingmachine','dryer','dishwasher','vacuum','broom',
        'mop','bucket','drawer','cabinet','shelf','clock','blender','kettle','toaster','coffeemaker',
        'trashcan','laundrybasket','sponge','laundrydetergent','hanger','ironingboard','desk','keyboard','router','modem'
    ],

    plants: [
        'rose','tulip','orchid','sunflower','lily','daisy','lavender','peony','hibiscus','lotus',
        'maple','oak','pine','birch','cedar','willow','bamboo','cactus','succulent','fern',
        'ivy','moss','palm','bananaTree','coconutTree','mangoTree','appleTree','cherryblossom','jasmine','lemongrass',
        'aloe','mint','basil','oregano','thyme','cilantro','parsley','sage','rosemary','lavender',
        'daffodil','violet','hydrangea','poinsettia','marigold','begonia','iris','geranium','poppy','camellia'
    ],

    insects: [
        'ant','bee','wasp','hornet','fly','mosquito','butterfly','moth','beetle','ladybug',
        'cockroach','locust','grasshopper','cricket','firefly','dragonfly','damselfly','spider','scorpion','centipede',
        'millipede','termite','aphid','cicada','weevil','flea','tick','earwig','silverfish','mantis',
        'katydid','stinkbug','leafhopper','waterstrider','bedbug','gnat','fruitfly','housefly','bumblebee','carpenterant'
    ]
};

const hangmanStages = [
    '```\n=========\n```', // 0 - Just the base
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```', // 1 - Gallows
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```', // 2 - Head
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```', // 3 - Body
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n  |   |\n      |\n=========\n```', // 4 - Longer body
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n  |   |\n      |\n=========\n```', // 5 - Left arm
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n      |\n=========\n```', // 6 - Both arms
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n /    |\n=========\n```', // 7 - Left leg
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n  |   |\n / \\  |\n=========\n```', // 8 - Both legs
    '```\n  +---+\n  |   |\n  X   |\n /|\\  |\n  |   |\n / \\  |\n=========\n```', // 9 - Dead (X eyes)
    '```\n  +---+\n  |   |\n >X<  |\n /|\\  |\n  |   |\n / \\  |\n=========\nGAME OVER!\n```' // 10 - Final stage
];

const activeGames = new Map();

module.exports = {
    name: 'hangman',
    description: 'Play hangman with custom topics!',
    options: [
        {
            name: 'topic',
            description: 'Choose a topic',
            type: 3, // STRING
            required: true,
            choices: Object.keys(wordCategories).map(key => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: key
            }))
        }
    ],
    /**
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userId = interaction.user.id;
        const topic = interaction.options.getString('topic');

        if (activeGames.has(userId)) {
            return interaction.reply({ content: "🎮 You already have an active hangman game! Finish it first.", ephemeral: true });
        }

        const words = wordCategories[topic];
        const word = words[Math.floor(Math.random() * words.length)];
        const guessed = [];
        const wrongGuesses = 0;

        function getDisplayWord() {
            return word.split('').map(letter => guessed.includes(letter) ? letter : '▢').join(' ');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎮 Hangman Game')
            .setDescription(`**Topic:** ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\n${hangmanStages[0]}\n\n**Word:** ${getDisplayWord()}`)
            .setColor('#2ECC71')
            .addFields({ name: 'Attempts Remaining', value: '10 wrong guesses allowed', inline: false })
            .setFooter({ text: 'Type a letter to guess! (You have 3 minutes)' });

        await interaction.reply({ embeds: [embed] });

        activeGames.set(userId, {
            word: word,
            guessed: guessed,
            wrongGuesses: wrongGuesses,
            topic: topic
        });

        const filter = (m) => m.author.id === userId && m.content.length === 1 && /[a-z]/i.test(m.content);
        const collector = interaction.channel.createMessageCollector({ filter, time: 180000 }); // 3 minutes

        collector.on('collect', async (msg) => {
            const game = activeGames.get(userId);
            if (!game) return;

            const letter = msg.content.toLowerCase();

            if (game.guessed.includes(letter)) {
                await msg.reply('❌ You already guessed that letter!');
                return;
            }

            game.guessed.push(letter);

            if (game.word.includes(letter)) {
                const displayWord = game.word.split('').map(l => game.guessed.includes(l) ? l : '▢').join(' ');
                
                if (!displayWord.includes('▢')) {
                    // Won!
                    const reward = 60;
                    economySystem.addBalance(userId, reward);
                    
                    await msg.reply(`✅ **You won!** The word was: **${game.word}**\nYou earned **$${reward}**! Your balance: **$${economySystem.getBalance(userId)}**`);
                    activeGames.delete(userId);
                    collector.stop();
                } else {
                    const attemptsLeft = 10 - game.wrongGuesses;
                    await msg.reply(`✅ Correct!\n\n${hangmanStages[game.wrongGuesses]}\n\n**Word:** ${displayWord}\n**Attempts left:** ${attemptsLeft}`);
                }
            } else {
                game.wrongGuesses++;
                const wrongLetters = game.guessed.filter(l => !game.word.includes(l)).join(', ');
                const attemptsLeft = 10 - game.wrongGuesses;
                
                if (game.wrongGuesses >= 10) {
                    await msg.reply(`💀 **Game Over!** The word was: **${game.word}**\n\n${hangmanStages[10]}`);
                    activeGames.delete(userId);
                    collector.stop();
                } else {
                    const displayWord = game.word.split('').map(l => game.guessed.includes(l) ? l : '▢').join(' ');
                    await msg.reply(`❌ Wrong!\n\n${hangmanStages[game.wrongGuesses]}\n\n**Word:** ${displayWord}\n**Wrong:** ${wrongLetters}\n**Attempts left:** ${attemptsLeft}`);
                }
            }
        });

        collector.on('end', () => {
            if (activeGames.has(userId)) {
                interaction.followUp({ content: `⏰ Time's up! The word was: **${activeGames.get(userId).word}**` });
                activeGames.delete(userId);
            }
        });
    }
};
