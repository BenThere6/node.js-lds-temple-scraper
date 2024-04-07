const puppeteer = require('puppeteer');
const fs = require('fs');

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
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url);

        // Wait for the elements to be fully loaded
        await page.waitForSelector('.DataList_templeName__fb4KU', { timeout: 30000 });
        await page.waitForSelector('.DataList_templeLocation___W0oB', { timeout: 30000 });
        await page.waitForSelector('.DataList_dedicated__T01EI', { timeout: 30000 });

        console.log('Selectors found, scraping data...');

        let utahTempleCount = 0; // Counter for Utah temples
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

            return names.map((name, index) => ({
                Name: name,
                Location: locations[index] || null,
                Date: dates[index] || null
            }));
        });

        // Read existing data from temples.json
        const existingData = JSON.parse(fs.readFileSync('temples.json'));

        // Iterate through each temple
        for (const temple of templeData) {
            if (temple.Location && temple.Location.toLowerCase().includes('utah')) {
                utahTempleCount++; // Increment the counter for Utah temples
        
                // Find the corresponding temple in existing data
                const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);
        
                if (existingTempleIndex !== -1) {
                    // If the temple previously had 'announced', 'renovation', or 'construction', and now has a valid date and address, it's opened
                    if ((existingData[existingTempleIndex].Date.toLowerCase() === 'announced' || existingData[existingTempleIndex].Date.toLowerCase() === 'renovation' || existingData[existingTempleIndex].Date.toLowerCase() === 'construction') &&
                        (temple.Date && temple.Date.toLowerCase() !== 'announced' && temple.Date.toLowerCase() !== 'renovation' && temple.Date.toLowerCase() !== 'construction') && temple.Address) {
                            recentlyOpenedTemples.push(temple.Name);
                    } else {
                        // console.log(temple.Name, existingData[existingTempleIndex].Date.toLowerCase(), temple.Date)
                    }

                    const existingDate = existingData[existingTempleIndex].Date.toLowerCase().trim()
                    const newDate = temple.Date.toLowerCase().trim()
                    if (existingDate != newDate) {
                        if (existingDate == 'renovation' || existingDate == 'construction') {
                            recentlyOpenedTemples.push(temple.Name);
                        }
                    }
                
                    // Update the temple data with details if it doesn't have an address in existing data or if the newly scraped data has a valid address
                    if (!existingData[existingTempleIndex].Address || temple.Address) {
                        // console.log('Updating address for:', temple.Name);
                        existingData[existingTempleIndex].Address = temple.Address;
                    }
                
                    // Update the temple date if templeData has a valid date
                    if (temple.Date && temple.Date.toLowerCase() !== 'announced' && temple.Date.toLowerCase() !== 'renovation' && temple.Date.toLowerCase() !== 'construction') {
                        existingData[existingTempleIndex].Date = temple.Date;
                    }
                }
                
                // Call scrapeTempleDetails if the temple doesn't have an address
                if (!existingData[existingTempleIndex].Address) {
                    console.log('Searching temple details for:', temple.Name);
                    const templeNameSlug = temple.Name.toLowerCase().replace(/\s+/g, '-');
                    const templeDetailsUrl = `https://www.churchofjesuschrist.org/temples/details/${templeNameSlug}?lang=eng`;
                    await scrapeTempleDetails(templeDetailsUrl, existingData, temple); // Pass temple object
                }
            } else {
                // console.log('Skipping temple:', temple.Name);
            }
        }        

        console.log('Number of Utah temples:', utahTempleCount); // Log the number of Utah temples
        console.log('Temples recently opened:', recentlyOpenedTemples.join(', ')); // Log recently opened temples

        // Write updated data back to temples.json
        fs.writeFileSync('temples.json', JSON.stringify(existingData, null, 2));
        console.log('Data saved to temples.json');

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
        await browser.close(); // Close the browser in case of error
    }
}

const url = 'https://www.lds.org/temples/list?lang=eng';
scrapeTempleList(url);