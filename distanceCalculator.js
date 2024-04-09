const axios = require('axios');
const fs = require('fs');
const { SingleBar } = require('cli-progress');
require('dotenv').config();

let templeData;
try {
    templeData = JSON.parse(fs.readFileSync('temples.json'));
} catch {
    templeData = [];
}

const apiKey = process.env.API_KEY;

async function calculateDistance(origin, destination, progressBar) {
    try {
        const response = await axios.get('https://api.distancematrix.ai/maps/api/distancematrix/json', {
            params: {
                origins: `${origin}, Utah, USA`,
                destinations: destination,
                key: apiKey
            }
        });

        if (response.data.status === 'OK') {
            const elements = response.data.rows[0].elements;
            if (elements && elements.length > 0 && elements[0].distance && elements[0].distance.text) {
                const distance = elements[0].distance.text;
                return parseFloat(distance.replace(' km', '')) * 0.621371; // Convert km to miles
            } else {
                throw new Error('No distance information found in the response');
            }
        } else {
            throw new Error('Error calculating distance: ' + response.data.error_message);
        }
    } catch (error) {
        throw new Error('Error calculating distance: ' + error.message);
    }
}

async function calculateTempleDistances() {
    const inquirer = (await import('inquirer')).default;
    try {
        let anyTempleNeedsDistance = false;
        let totalRequests = 0;
        let completedRequests = 0;

        for (const temple of templeData) {
            if (temple.Address && temple.Distance === '') {
                anyTempleNeedsDistance = true;
                totalRequests++; // Increment total number of requests
            }
        }

        if (anyTempleNeedsDistance) {
            const cityResponse = await inquirer.prompt({
                type: 'input',
                name: 'city',
                message: 'Enter your city:'
            });

            const progressBar = new SingleBar({
                format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total}',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            });
            console.log("Downloading distance data...")
            progressBar.start(totalRequests, 0); // Start progress bar with total number of requests

            for (const temple of templeData) {
                if (temple.Address) {
                    const distance = await calculateDistance(cityResponse.city, temple.Address);
                    temple.Distance = `${Math.round(distance)}`;
                    completedRequests++; // Increment completed requests
                    progressBar.update(completedRequests); // Update progress bar
                    // Add a delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            }

            progressBar.stop();
            fs.writeFileSync('temples.json', JSON.stringify(templeData, null, 2));
            console.log('Distance data updated successfully.');
        } else {
            console.log('No changes made to temple distances.');
        }
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = calculateTempleDistances;