const fs = require('fs');

async function selectTempleToAttend() {
    const inquirer = (await import('inquirer')).default;

    // Read temple data from JSON file
    const templeData = JSON.parse(fs.readFileSync('temples.json'));

    // Filter out temples with date as "Announced", "Construction", or "Renovation"
    const filteredTempleData = templeData.filter(temple => {
        const date = temple.Date.toLowerCase();
        return !(date.includes('announced') || date.includes('construction') || date.includes('renovation'));
    });

    // Sort filtered temples by distance
    filteredTempleData.sort((a, b) => parseFloat(a.Distance) - parseFloat(b.Distance));

    // Calculate the number of temples per group and the remainder
    const numTemples = filteredTempleData.length;
    const numGroups = 5;
    const templesPerGroup = Math.floor(numTemples / numGroups);
    const remainder = numTemples % numGroups;

    // Split filtered temples into 5 groups
    const groups = [];
    let startIndex = 0;
    for (let i = 0; i < numGroups; i++) {
        let groupSize = templesPerGroup;
        if (i < remainder) {
            groupSize++;
        }
        const group = filteredTempleData.slice(startIndex, startIndex + groupSize);
        groups.push(group);
        startIndex += groupSize;
    }

    console.log(groups)

    // Calculate the maximum distance across all temples in filtered data
    const maxMiles = Math.max(...filteredTempleData.map(temple => parseFloat(temple.Distance)));

    // Prompt user to choose a distance scale
    const answers = await inquirer.prompt({
        type: 'list',
        name: 'distanceScale',
        message: 'Choose a distance scale (1-5):',
        choices: Array.from({ length: 5 }, (_, i) => {
            return {
                name: `Scale ${i + 1} (Max miles: ${Math.max(...groups[i].map(temple => parseFloat(temple.Distance)))})`,
                value: i
            };
        })
    });

    const selectedGroup = groups[answers.distanceScale];
    const randomTemple = selectedGroup[Math.floor(Math.random() * selectedGroup.length)];

    return {
        name: randomTemple.Name,
        distance: randomTemple.Distance
    };
}

selectTempleToAttend();
module.exports = selectTempleToAttend;