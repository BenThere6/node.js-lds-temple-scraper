const puppeteer = require('puppeteer');
const fs = require('fs');
const templeAttender = require('./templeAttender.js');
const { countTotalTemples, countAttendedTemples, countNotAttendedTemples } = require('./templeCounter');

async function scrapeTempleDetails(url, existingData, temple) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url);

        const address = await page.evaluate(() => {
            const addressElement = document.querySelector('.Details_info-item__i8iPw a');
            if (addressElement) {
                // Extract the inner text and replace <br> tags with spaces
                return addressElement.innerText.replace(/<br>/g, ' ');
            } else {
                return null;
            }
        });

        await browser.close();

        // Format the address
        if (address) {
            // Find the corresponding temple in existing data
            const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);
            if (existingTempleIndex !== -1 && !existingData[existingTempleIndex].Address) { // Check if the address is not already updated
                console.log('Updating address for:', temple.Name);
                existingData[existingTempleIndex].Address = address.trim().replace(/\n/g, ', '); // Replace newline characters with ', '
            }
        }

    } catch (error) {
        console.error('An error occurred while scraping temple details:', error);
        await browser.close();
    }
}

async function scrapeTempleList(url) {
    let noExisting = false;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url);

        // Wait for the elements to be fully loaded
        await page.waitForSelector('.DataList_templeName__fb4KU', { timeout: 30000 });
        await page.waitForSelector('.DataList_templeLocation___W0oB', { timeout: 30000 });
        await page.waitForSelector('.DataList_dedicated__T01EI', { timeout: 30000 });

        console.log('Selectors found, scraping data...');

        const recentlyOpenedTemples = []; // Temples that were recently opened

        const templeData = await page.evaluate(() => {
            const nameElements = Array.from(document.querySelectorAll('.DataList_templeName__fb4KU'));
            const locElements = Array.from(document.querySelectorAll('.DataList_templeLocation___W0oB'));
            const dateElements = Array.from(document.querySelectorAll('.DataList_dedicated__T01EI'));

            // Exclude the first entry which represents the column titles
            nameElements.shift();
            locElements.shift();
            dateElements.shift();

            const names = nameElements.map(element => element.textContent.trim());
            const locations = locElements.map(element => element.textContent.trim());
            const dates = dateElements.map(element => element.textContent.trim());
            const sessionAttended = "";

            // Filter out only the temples located in Utah
            const utahTemples = names.reduce((acc, name, index) => {
                if (locations[index] && locations[index].toLowerCase().includes('utah')) {
                    acc.push({
                        Name: name,
                        Location: locations[index] || null,
                        Date: dates[index] || null,
                        SessionAttended: sessionAttended
                    });
                }
                return acc;
            }, []);

            return utahTemples;
        });

        // Read existing data from temples.json
        let existingData = [];

        try {
            existingData = JSON.parse(fs.readFileSync('temples.json'));
        } catch {
            console.log('No current temples.json file or file is empty');
            noExisting = true;
        }

        // Iterate through each temple in templeData
        for (const temple of templeData) {
            // Check if the temple already exists in existingData
            const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);

            // If the temple doesn't exist in existingData, add it
            if (existingTempleIndex === -1) {
                console.log('New temple found:', temple.Name);
                existingData.push(temple);
            }
        }

        // Iterate through each temple in templeData
        for (const temple of templeData) {
            if (temple.Location && temple.Location.toLowerCase().includes('utah')) {
                // Find the corresponding temple in existing data
                const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);

                if (existingTempleIndex !== -1) {
                    // If the temple previously had 'announced', 'renovation', or 'construction', and now has a valid date and address, it's opened
                    if ((existingData[existingTempleIndex].Date.toLowerCase() === 'announced' || existingData[existingTempleIndex].Date.toLowerCase() === 'renovation' || existingData[existingTempleIndex].Date.toLowerCase() === 'construction') &&
                        (temple.Date && temple.Date.toLowerCase() !== 'announced' && temple.Date.toLowerCase() !== 'renovation' && temple.Date.toLowerCase() !== 'construction') && temple.Address) {
                        recentlyOpenedTemples.push(temple.Name);
                    }

                    const existingDate = existingData[existingTempleIndex].Date.toLowerCase().trim()
                    const newDate = temple.Date.toLowerCase().trim()
                    if (existingDate != newDate) {
                        if (existingDate == 'renovation' || existingDate == 'construction') {
                            recentlyOpenedTemples.push(temple.Name);
                            // Update temple date
                            existingData[existingTempleIndex].Date = temple.Date;
                        }
                    }

                    // Update the temple data with details if it doesn't have an address in existing data or if the newly scraped data has a valid address
                    if (!existingData[existingTempleIndex].Address || temple.Address) {
                        // console.log('Updating address for:', temple.Name);
                        existingData[existingTempleIndex].Address = temple.Address;
                    }

                    // Update the temple data with details if it doesn't have a location in existing data or if the newly scraped data has a valid location
                    if (!existingData[existingTempleIndex].Location || temple.Location) {
                        // console.log('Updating address for:', temple.Name);
                        existingData[existingTempleIndex].Location = temple.Location;
                    }
                }

                // Call scrapeTempleDetails if the temple doesn't have an address
                if (noExisting || !existingData[existingTempleIndex].Address) {
                    console.log('Searching temple details for:', temple.Name);
                    const templeNameSlug = temple.Name.toLowerCase().replace(/\s+/g, '-');
                    const templeDetailsUrl = `https://www.churchofjesuschrist.org/temples/details/${templeNameSlug}?lang=eng`;
                    await scrapeTempleDetails(templeDetailsUrl, existingData, temple); // Pass temple object
                }
            }
        }

        if (recentlyOpenedTemples.length != 0) {
            console.log('Temples recently opened:', recentlyOpenedTemples.join(', ')); // Log recently opened temples
        }

        // Write updated data back to temples.json
        fs.writeFileSync('temples.json', JSON.stringify(existingData, null, 2));
        console.log('Data saved to temples.json');

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
        await browser.close(); // Close the browser in case of error
    }
    return noExisting;
}

const url = 'https://www.lds.org/temples/list?lang=eng';

const noExisting = scrapeTempleList(url)
    .then((noExistingValue) => {
        if (noExistingValue) {
            console.log("Run program again to mark temples as attended");
        } else {
            // Return the promise returned by templeAttender() so that it can be awaited
            return templeAttender();
        }
        return noExistingValue;
    })
    .then((noExistingValue) => {
        if (!noExistingValue) {
            let templeData = [];
            try {
                templeData = JSON.parse(fs.readFileSync('temples.json'));
            } catch {
                console.log("Will not count, no existing data.")
            }

            console.log('Total number of temples:', templeData.length);
            console.log('Number of temples attended:', templeData.filter(temple => temple.SessionAttended === 'true').length);
            console.log('Number of temples not attended:', templeData.filter(temple => temple.SessionAttended !== 'true').length);
        }
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });

// Ensure that templeAttender() completes before moving to the next steps
noExisting.then(() => {
    // Additional steps after templeAttender() completes
}).catch(error => {
    console.error('An error occurred:', error);
});