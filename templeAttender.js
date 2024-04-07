const fs = require('fs');

async function templeAttender() {
    const { default: inquirer } = await import('inquirer');

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

        const confirmAttendance = await inquirer.prompt({
            type: 'confirm',
            name: 'attended',
            message: `Did you attend ${selectedTemple.temple}?`
        });

        if (confirmAttendance.attended) {
            // Mark the selected temple as attended
            const templeIndex = templeData.findIndex(temple => temple.Name === selectedTemple.temple);
            templeData[templeIndex].SessionAttended = 'true';
            fs.writeFileSync('temples.json', JSON.stringify(templeData, null, 2));
            console.log(`${selectedTemple.temple} marked as attended.`);
        } else {
            console.log(`${selectedTemple.temple} not marked as attended.`);
        }
    }

    markTemplesAsAttended();
}

module.exports = templeAttender;