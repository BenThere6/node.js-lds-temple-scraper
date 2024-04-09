const puppeteer = require('puppeteer');
const fs = require('fs');
const { SingleBar } = require('cli-progress');
const templeAttender = require('./templeAttender.js');
const templeSelector = require('./templeSelector.js');
const distanceCalculator = require('./distanceCalculator.js');

let challengeComplete = false;

async function scrapeTempleDetails(url, existingData, temple, progressBar) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url);

        const address = await page.evaluate(() => {
            const addressElement = document.querySelector('.Details_info-item__i8iPw a');
            if (addressElement) {
                return addressElement.innerText.replace(/<br>/g, ' ');
            } else {
                return null;
            }
        });

        await browser.close();

        if (address) {
            const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);
            if (existingTempleIndex !== -1 && !existingData[existingTempleIndex].Address) {
                existingData[existingTempleIndex].Address = address.trim().replace(/\n/g, ', ');
            }
        }

        progressBar.increment();
    } catch (error) {
        console.error('An error occurred while scraping temple details:', error);
        await browser.close();
    }
}

async function scrapeTempleList(url) {
    let noExisting = false;
    let recentlyOpenedTemples = []

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url);

        await page.waitForSelector('.DataList_templeName__fb4KU', { timeout: 30000 });
        await page.waitForSelector('.DataList_templeLocation___W0oB', { timeout: 30000 });
        await page.waitForSelector('.DataList_dedicated__T01EI', { timeout: 30000 });

        const templeData = await page.evaluate(() => {
            const nameElements = Array.from(document.querySelectorAll('.DataList_templeName__fb4KU'));
            const locElements = Array.from(document.querySelectorAll('.DataList_templeLocation___W0oB'));
            const dateElements = Array.from(document.querySelectorAll('.DataList_dedicated__T01EI'));

            nameElements.shift();
            locElements.shift();
            dateElements.shift();

            const names = nameElements.map(element => element.textContent.trim());
            const locations = locElements.map(element => element.textContent.trim());
            const dates = dateElements.map(element => element.textContent.trim());
            const sessionAttended = "";
            const distance = "";

            const utahTemples = names.reduce((acc, name, index) => {
                if (locations[index] && locations[index].toLowerCase().includes('utah')) {
                    acc.push({
                        Name: name,
                        Location: locations[index] || null,
                        Date: dates[index] || null,
                        SessionAttended: sessionAttended,
                        Distance: distance
                    });
                }
                return acc;
            }, []);

            return utahTemples;
        });

        let existingData = [];

        try {
            existingData = JSON.parse(fs.readFileSync('temples.json'));
        } catch {
            console.log('No current temples.json file or file is empty');
            noExisting = true;
        }

        let newTemplesCount = 0;

        for (const temple of templeData) {
            const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);

            if (existingTempleIndex === -1) {
                newTemplesCount++;
                existingData.push(temple);
            }
        }

        if (newTemplesCount > 0) {
            console.log("New temples found:", newTemplesCount);
        }

        const progressBar = new SingleBar({
            format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        
        let progressCount = 0;

        for (const temple of templeData) {
            let recentlyOpened = false;
            if (temple.Location && temple.Location.toLowerCase().includes('utah')) {
                const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);

                if (existingTempleIndex !== -1) {
                    if ((existingData[existingTempleIndex].Date.toLowerCase() === 'announced' || existingData[existingTempleIndex].Date.toLowerCase() === 'renovation' || existingData[existingTempleIndex].Date.toLowerCase() === 'construction') &&
                        (temple.Date && temple.Date.toLowerCase() !== 'announced' && temple.Date.toLowerCase() !== 'renovation' && temple.Date.toLowerCase() !== 'construction') && temple.Address) {
                        recentlyOpened = true;
                    }

                    const existingDate = existingData[existingTempleIndex].Date.toLowerCase().trim()
                    const newDate = temple.Date.toLowerCase().trim()
                    if (existingDate != newDate) {
                        if (existingDate == 'renovation' || existingDate == 'construction') {
                            recentlyOpened = true;
                        }
                    }

                    if (!existingData[existingTempleIndex].Address || temple.Address) {
                        existingData[existingTempleIndex].Address = temple.Address;
                    }

                    if (!existingData[existingTempleIndex].Location || temple.Location) {
                        existingData[existingTempleIndex].Location = temple.Location;
                    }
                }

                let authorizeSearch = false;
                if (recentlyOpened && !existingData[existingTempleIndex].Address) {
                    authorizeSearch = true;
                }

                if (noExisting || authorizeSearch) {
                    progressCount ++;
                }
            }
        }

        if (progressCount) {
            console.log('Downloading temple addresses...')
            progressBar.start(progressCount, 0, { detail: '' });
        }

        for (const temple of templeData) {
            let recentlyOpened = false;
            if (temple.Location && temple.Location.toLowerCase().includes('utah')) {
                const existingTempleIndex = existingData.findIndex(item => item.Name === temple.Name);

                if (existingTempleIndex !== -1) {
                    if ((existingData[existingTempleIndex].Date.toLowerCase() === 'announced' || existingData[existingTempleIndex].Date.toLowerCase() === 'renovation' || existingData[existingTempleIndex].Date.toLowerCase() === 'construction') &&
                        (temple.Date && temple.Date.toLowerCase() !== 'announced' && temple.Date.toLowerCase() !== 'renovation' && temple.Date.toLowerCase() !== 'construction') && temple.Address) {
                        recentlyOpened = true;
                        recentlyOpenedTemples.push(temple.Name);
                    }

                    const existingDate = existingData[existingTempleIndex].Date.toLowerCase().trim()
                    const newDate = temple.Date.toLowerCase().trim()
                    if (existingDate != newDate) {
                        if (existingDate == 'renovation' || existingDate == 'construction') {
                            recentlyOpened = true;
                            recentlyOpenedTemples.push(temple.Name);
                            existingData[existingTempleIndex].Date = temple.Date;
                        }
                    }

                    if (!existingData[existingTempleIndex].Address || temple.Address) {
                        existingData[existingTempleIndex].Address = temple.Address;
                    }

                    if (!existingData[existingTempleIndex].Location || temple.Location) {
                        existingData[existingTempleIndex].Location = temple.Location;
                    }
                }

                let authorizeSearch = false;
                if (recentlyOpened && !existingData[existingTempleIndex].Address) {
                    authorizeSearch = true;
                }

                if (noExisting || authorizeSearch) {
                    const templeNameSlug = temple.Name.toLowerCase().replace(/\s+/g, '-');
                    const templeDetailsUrl = `https://www.churchofjesuschrist.org/temples/details/${templeNameSlug}?lang=eng`;
                    await scrapeTempleDetails(templeDetailsUrl, existingData, temple, progressBar); // Pass progressBar
                }
            }
        }

        progressBar.stop();

        if (recentlyOpenedTemples.length != 0) {
            console.log('Temples recently opened:', recentlyOpenedTemples.join(', '));
        }

        fs.writeFileSync('temples.json', JSON.stringify(existingData, null, 2));

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
        await browser.close();
    }

    return noExisting;
}

const url = 'https://www.lds.org/temples/list?lang=eng';

const noExisting = scrapeTempleList(url)
    .then((noExistingValue) => {
        if (noExistingValue) {
            console.log("Run program again to mark temples as attended, or to choose next temple");
            return noExistingValue;
        } else {
            return templeAttender().then(notAttendedCount => {
                if (notAttendedCount === 0) {
                    challengeComplete = true;
                } else {
                    return Promise.resolve(noExistingValue);
                }
            }).catch(error => {
                console.error('An error occurred:', error);
                return Promise.reject(error);
            });
        }
    })
    .then((noExistingValue) => {
        if (!noExistingValue) {
            let templeData;
            try {
                templeData = JSON.parse(fs.readFileSync('temples.json'));
            } catch {
                templeData = [];
            }

            console.log('Total number of temples:', templeData.length);
            console.log('Number of temples attended:', templeData.filter(temple => temple.SessionAttended === 'true').length);
            console.log('Number of temples not attended:', templeData.filter(temple => temple.SessionAttended !== 'true').length);
            console.log(`Total number of open temples not attended:`, templeData.filter(temple => temple.SessionAttended !== 'true' && temple.Date !== 'Construction' && temple.Date !== 'Renovation' && temple.Date !== 'Announced').length);

            if (challengeComplete) {
                process.exit(0);
            }

            distanceCalculator()
                .then(() => {
                    return templeSelector();
                })
                .catch(error => {
                    console.error('An error occurred:', error);
                });
        }
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });

noExisting.then(() => {}).catch(error => {
    console.error('An error occurred:', error);
});