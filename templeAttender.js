const fs = require('fs');

async function templeAttender() {
    const inquirer = (await import('inquirer')).default;
    
    return new Promise(async (resolve, reject) => {
        // Function to mark temples as attended
        async function markTemplesAsAttended() {
            // Load temple data from temples.json
            const templeData = JSON.parse(fs.readFileSync('temples.json'));

            // Function to prompt the user to mark a temple as attended
            async function promptMarkTemple() {
                // Filter temples where SessionAttended is empty and date is not "Announced", "Construction", or "Renovation"
                const templesToAttend = templeData.filter(temple => {
                    return temple.SessionAttended === '' && !['Announced', 'Construction', 'Renovation'].includes(temple.Date);
                });

                if (templesToAttend.length === 0) {
                    console.log('No temples available to mark as attended.');
                    return;
                }

                // Prompt user to mark temples as attended
                const selectedTemple = await inquirer.prompt({
                    type: 'list',
                    name: 'temple',
                    message: 'Select a temple to mark as attended:',
                    choices: templesToAttend.map(temple => temple.Name).concat('No more temples')
                });

                if (selectedTemple.temple === 'No more temples') {
                    console.log('Exiting temple attendance marking.');
                    return;
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
                } else {
                    console.log(`${selectedTemple.temple} not marked as attended.`);
                }
            }
            
            await promptMarkTemple();
            const markAnother = await inquirer.prompt({
                type: 'confirm',
                name: 'another',
                message: `Do you want to mark another temple as attended?`
            });

            if (markAnother.another) {
                await markTemplesAsAttended();
            } else {
                resolve(); // Resolve the promise when all prompts are complete
            }
        }

        await markTemplesAsAttended();
    });
}

module.exports = templeAttender;