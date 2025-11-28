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
    }
];
