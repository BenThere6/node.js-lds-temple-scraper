const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: false }); // Open browser in non-headless mode for debugging
    const page = await browser.newPage();
    
    try {
        await page.goto(url);
        
        // Wait for the elements to be fully loaded
        await page.waitForSelector('.templeName-2MBmf', { timeout: 60000 });
        await page.waitForSelector('.templeLocation-27z9P', { timeout: 60000 });
        await page.waitForSelector('.dedicated-2xVdg', { timeout: 60000 });

        console.log('Selectors found, scraping data...');
        
        const data = await page.evaluate(() => {
            const nameElements = Array.from(document.querySelectorAll('.templeName-2MBmf'));
            const locElements = Array.from(document.querySelectorAll('.templeLocation-27z9P'));
            const dateElements = Array.from(document.querySelectorAll('.dedicated-2xVdg'));

            const names = nameElements.map(element => element.textContent.trim());
            const locations = locElements.map(element => element.textContent.trim());
            const dates = dateElements.map(element => element.textContent.trim());

            return names.map((name, index) => ({
                Name: name,
                Location: locations[index] || null,
                Date: dates[index] || null
            }));
        });

        await browser.close();

        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync('temples.json', json);
        console.log('Data saved to temples.json');
    } catch (error) {
        console.error('An error occurred:', error);
        await browser.close(); // Close the browser in case of error
    }
}

const url = 'https://www.lds.org/temples/list?lang=eng';
scrape(url);