const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: true }); // Run browser in headless mode
    const page = await browser.newPage();
    
    try {
        await page.goto(url);
        
        // Wait for the elements to be fully loaded
        await page.waitForSelector('.DataList_templeName__fb4KU', { timeout: 60000 });
        await page.waitForSelector('.DataList_templeLocation___W0oB', { timeout: 60000 });
        await page.waitForSelector('.DataList_dedicated__T01EI', { timeout: 60000 });

        console.log('Selectors found, scraping data...');
        
        const newData = await page.evaluate(() => {
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

        // Check if temples.json file exists
        const fileExists = fs.existsSync('temples.json');

        let existingData = [];
        if (fileExists) {
            // Read existing data from temples.json file
            const existingJson = fs.readFileSync('temples.json', 'utf8');
            existingData = JSON.parse(existingJson);
        }

        // Filter out temples that already exist in the existingData array
        const filteredData = newData.filter(temp => {
            return !existingData.some(existingTemp => existingTemp.Name === temp.Name);
        });

        if (filteredData.length > 0) {
            // If there are new temples to add, append them to the existingData array
            existingData = existingData.concat(filteredData);

            // Write the combined data to temples.json file
            const json = JSON.stringify(existingData, null, 2);
            fs.writeFileSync('temples.json', json);
            console.log('New temples added to temples.json');
        } else {
            console.log('No new temples found');
        }

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
        await browser.close(); // Close the browser in case of error
    }
}

const url = 'https://www.lds.org/temples/list?lang=eng';
scrape(url);