const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

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
}

const url = 'https://www.lds.org/temples/list?lang=eng';
scrape(url);
