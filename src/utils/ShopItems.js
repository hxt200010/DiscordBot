module.exports = [
    {
        name: 'Gun',
        price: 150,
        description: 'Shoot other users to steal money. Durability: 5 uses.',
        durability: 5,
        type: 'weapon'
    },
    {
        name: 'Shield',
        price: 120,
        description: 'Protect yourself from one steal or shoot attempt. Disappears after use.',
        durability: 1,
        type: 'defense'
    },
    {
        name: 'Health Pack',
        price: 50,
        description: 'Repair your Gun by +1 durability.',
        type: 'utility'
    },
    {
        name: 'Lucky Charm',
        price: 80,
        description: '+10% success chance for stealing or shooting. Passive effect.',
        type: 'passive'
    },
    {
        name: 'Pet Food',
        price: 5,
        description: 'Restores 20 Hunger for your pet.',
        type: 'consumable'
    },
    {
        name: 'Health Pack',
        price: 50,
        description: 'Restores 50 HP for your pet (or repairs Gun +1).',
        type: 'consumable'
    },
    {
        name: 'Health Kit',
        price: 300,
        description: 'Revives a dead pet with 50% HP.',
        type: 'consumable'
    },
    {
        name: 'Pet Armor',
        price: 150,
        description: 'Reduces HP loss from starvation by 50%. (Passive)',
        type: 'passive'
    },
    {
        name: 'Pet Weapon',
        price: 150,
        description: 'Increases coins earned from grinding by 10%. (Passive)',
        type: 'passive'
    }
];
