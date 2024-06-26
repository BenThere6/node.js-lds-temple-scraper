const fs = require('fs');

async function selectTempleToAttend() {
    const inquirer = (await import('inquirer')).default;
    const open = (await import('open')).default;

    const response = await inquirer.prompt({
        type: 'confirm',
        name: 'selectTemple',
        message: 'Do you want to select a temple to attend?'
    });

    if (!response.selectTemple) {
        return;
    }

    // Read temple data from JSON file
    const templeData = JSON.parse(fs.readFileSync('temples.json'));

    // Filter out temples with date as "Announced", "Construction", "Opening Soon", or "Renovation" and SessionAttended is not "true"
    const filteredTempleData = templeData.filter(temple => {
        const date = temple.Date.toLowerCase();
        return !(date.includes('announced') || date.includes('construction') || date.includes('opening soon') || date.includes('renovation')) && temple.SessionAttended !== 'true';
    }).filter(temple => typeof temple.Distance === 'string' && temple.Distance.trim() !== '');

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

    // console.log(groups)

    // Determine the number of scale options based on the number of available temples
    const scaleOptions = Math.min(numTemples, 5);

    // Prompt user to choose a distance scale
    const answers = await inquirer.prompt({
        type: 'list',
        name: 'distanceScale',
        message: `Choose a distance scale (1-${scaleOptions}):`,
        choices: Array.from({ length: scaleOptions }, (_, i) => {
            return {
                name: `Scale ${i + 1} (Max miles: ${Math.max(...groups[i].map(temple => parseFloat(temple.Distance)))})`,
                value: i
            };
        })
    });

    const selectedGroup = groups[answers.distanceScale];

    // Shuffle function to randomly reorder elements in an array
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Shuffle the selected group of temples
    const shuffledGroup = shuffle(selectedGroup);

    // Select the first temple from the shuffled group
    const randomTemple = shuffledGroup[0];

    const templeNameSlug = randomTemple.Name.toLowerCase().replace(/\s+/g, '-');
    const templeDetailsUrl = `https://www.churchofjesuschrist.org/temples/details/${templeNameSlug}?lang=eng`;

    // Log the selected temple's information
    console.log(`Selected Temple:
    Name: ${randomTemple.Name}
    Address: ${randomTemple.Address}
    Distance: ${randomTemple.Distance} miles`);

    // Prompt the user to open the temple website after the temple has been selected
    inquirer.prompt({
        type: 'confirm',
        name: 'openWebsite',
        message: 'Do you want to open the temple website?'
    }).then((openWebsiteResponse) => {
        if (openWebsiteResponse.openWebsite) {
            open(templeDetailsUrl);
        }
    });
}

module.exports = selectTempleToAttend;