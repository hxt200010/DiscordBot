const fs = require('fs');
const { checkLevelUp, applyWorkGains } = require('../src/utils/petUtils');

function runTests() {
    let output = "Running Level Up Tests...\n";

    // Test 1: No Level Up
    let pet1 = {
        xp: 10,
        level: 1,
        maxHp: 100,
        hp: 100,
        stats: { attack: 10, defense: 10 }
    };
    output += "Test 1 (No Level Up): Initial XP: 10, Level: 1\n";
    let leveled1 = checkLevelUp(pet1);
    if (!leveled1 && pet1.level === 1 && pet1.xp === 10) {
        output += "PASS: Did not level up.\n";
    } else {
        output += "FAIL: Unexpected level up or XP change. " + JSON.stringify(pet1) + "\n";
    }

    // Test 2: Level Up
    let pet2 = {
        xp: 25, // Threshold is 20
        level: 1,
        maxHp: 100,
        hp: 50,
        stats: { attack: 10, defense: 10 }
    };
    output += "\nTest 2 (Level Up): Initial XP: 25, Level: 1\n";
    let leveled2 = checkLevelUp(pet2);
    if (leveled2 && pet2.level === 2 && pet2.xp === 5 && pet2.maxHp === 110 && pet2.hp === 110 && pet2.stats.attack === 12) {
        output += "PASS: Leveled up correctly.\n";
    } else {
        output += "FAIL: Incorrect level up stats. " + JSON.stringify(pet2) + "\n";
    }

    // Test 3: Multiple Level Ups
    let pet3 = {
        xp: 100, // Level 1 (20) -> Level 2 (40) -> Level 3 (60) -> Level 4 (80) -> Level 5
        // 1->2 costs 20. Remaining: 80. Level 2.
        // 2->3 costs 40. Remaining: 40. Level 3.
        // 3->4 costs 60. Remaining: -20. Wait.
        // Let's trace:
        // 100 >= 20. xp=80, level=2.
        // 80 >= 40. xp=40, level=3.
        // 40 >= 60. No.
        // Result: Level 3, XP 40.
        level: 1,
        maxHp: 100,
        hp: 100,
        stats: { attack: 10, defense: 10 }
    };
    output += "\nTest 3 (Multiple Level Ups): Initial XP: 100, Level: 1\n";
    let leveled3 = checkLevelUp(pet3);
    if (leveled3 && pet3.level === 3 && pet3.xp === 40) {
        output += "PASS: Multiple level ups correct.\n";
    } else {
        output += "FAIL: Incorrect multiple level ups. " + JSON.stringify(pet3) + "\n";
    }

    // Test 4: applyWorkGains integration
    let pet4 = {
        isWorking: true,
        lastWorkUpdate: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        xp: 18,
        level: 1,
        maxHp: 100,
        hp: 100,
        stats: { hunger: 100, attack: 10, defense: 10 }
    };
    output += "\nTest 4 (applyWorkGains): Initial XP: 18, Level: 1, Working 2 hours (+5 XP)\n";
    applyWorkGains(pet4);
    if (pet4.level === 2 && pet4.xp === 3) {
        output += "PASS: applyWorkGains triggered level up.\n";
    } else {
        output += "FAIL: applyWorkGains did not trigger level up correctly. " + JSON.stringify(pet4) + "\n";
    }

    fs.writeFileSync('tests/test_results.txt', output);
    console.log("Tests completed. Results written to tests/test_results.txt");
}

runTests();
