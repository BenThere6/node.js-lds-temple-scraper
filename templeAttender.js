const fs = require('fs');
const inquirer = require('inquirer');

// Function to mark temples as attended
async function markTemplesAsAttended() {
    // Load temple data from temples.json
    const templeData = JSON.parse(fs.readFileSync('temples.json'));

    // Filter temples where SessionAttended is empty
    const templesToAttend = templeData.filter(temple => temple.SessionAttended === '');

    // Prompt user to mark temples as attended
    const selectedTemple = await inquirer.prompt({
        type: 'list',
        name: 'temple',
        message: 'Select a temple to mark as attended:',
        choices: templesToAttend.map(temple => temple.Name)
    });

    const templeIndex = templesToAttend.findIndex(temple => temple.Name === selectedTemple.temple);
    const confirmAttendance = await inquirer.prompt({
        type: 'confirm',
        name: 'attended',
        message: `Did you attend ${selectedTemple.temple}?`
    });

    if (confirmAttendance.attended) {
        templeData[templeData.findIndex(temple => temple.Name === selectedTemple.temple)].SessionAttended = 'true';
        fs.writeFileSync('temples.json', JSON.stringify(templeData, null, 2));
        console.log(`${selectedTemple.temple} marked as attended.`);
    } else {
        console.log(`${selectedTemple.temple} not marked as attended.`);
    }
}

module.exports = markTemplesAsAttended;