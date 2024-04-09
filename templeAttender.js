const fs = require('fs');

async function templeAttender() {
    const inquirer = (await import('inquirer')).default;

    // Load temple data from temples.json
    const templeData = JSON.parse(fs.readFileSync('temples.json'));

    // Function to prompt the user to mark a temple as attended
    async function promptMarkTemple() {
        // Filter temples where SessionAttended is empty and date is not "Announced", "Construction", or "Renovation"
        const templesToAttend = templeData.filter(temple => {
            return temple.SessionAttended === '' && !['Announced', 'Construction', 'Renovation'].includes(temple.Date);
        });

        if (templesToAttend.length === 0) {
            console.log('You have attended every available temple in Utah!');
            return 0; // Return 0 when all temples are attended
        }

        // Prompt user to mark temples as attended
        const selectedTemple = await inquirer.prompt({
            type: 'list',
            name: 'temple',
            message: 'Select a temple to mark as attended:',
            choices: templesToAttend.map(temple => temple.Name).concat('Exit')
        });

        if (selectedTemple.temple === 'Exit') {
            console.log('Exiting temple attendance marking.');
            return 0; // Return 0 when the user chooses to exit
        }

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
            return 1; // Return 1 when a temple is marked attended
        } else {
            console.log(`${selectedTemple.temple} not marked as attended.`);
            return 0; // Return 0 when the user chooses not to mark a temple attended
        }
    }

    let notAttendedCount = 0;
    let wantToMark = true;

    while (wantToMark) {
        notAttendedCount = templeData.filter(temple => temple.SessionAttended !== 'true' && temple.Date !== 'Construction' && temple.Date !== 'Renovation' && temple.Date !== 'Announced').length;

        if (notAttendedCount === 0) {
            console.log("\x1b[32mYOU HAVE ATTENDED EVERY OPEN UTAH TEMPLE!! Congrats! What's next?\x1b[0m");
            return notAttendedCount; // Return the count when all temples are attended
        } else {
            const response = await inquirer.prompt({
                type: 'confirm',
                name: 'mark',
                message: 'Do you want to mark a temple as attended?'
            });

            if (!response.mark) {
                console.log('Exiting temple attendance marking.');
                wantToMark = false;
            } else {
                const marked = await promptMarkTemple();
                if (marked === 0) return notAttendedCount; // Return the count if no temple is marked
            }
        }
    }

    return notAttendedCount; // Return the final count
}

module.exports = templeAttender;