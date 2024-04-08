const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

let templeData;
try {
    templeData = JSON.parse(fs.readFileSync('temples.json'));
} catch {
    templeData = [];
}

const apiKey = process.env.API_KEY;

async function calculateDistance(origin, destination) {
    try {
        const response = await axios.get('https://api.distancematrix.ai/maps/api/distancematrix/json', {
            params: {
                origins: `${origin}, Utah, USA`,
                destinations: destination,
                key: apiKey
            }
        });

        console.log(response.data); // Log the response data for inspection

        if (response.data.status === 'OK') {
            const distance = response.data.rows[0].elements[0].distance.text;
            return parseFloat(distance.replace(' km', '')) * 0.621371; // Convert km to miles
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

        for (const temple of templeData) {
            if (temple.Address && temple.Distance === '') {
                anyTempleNeedsDistance = true;
                break;
            }
        }

        if (anyTempleNeedsDistance) {
            const cityResponse = await inquirer.prompt({
                type: 'input',
                name: 'city',
                message: 'Enter your city:'
            });

            for (const temple of templeData) {
                if (temple.Address) {
                    const distance = await calculateDistance(cityResponse.city, temple.Address);
                    temple.Distance = `${Math.round(distance)}`;
                    // Add a delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
            }

            fs.writeFileSync('temples.json', JSON.stringify(templeData, null, 2));
            console.log('Distance data updated successfully.');
        } else {
            const response = await inquirer.prompt({
                type: 'confirm',
                name: 'recalculate',
                message: 'All temple distances are already calculated. Do you want to recalculate distances from a different city?',
                default: false
            });

            if (response.recalculate) {
                const cityResponse = await inquirer.prompt({
                    type: 'input',
                    name: 'city',
                    message: 'Enter a different city:'
                });

                for (const temple of templeData) {
                    if (temple.Address) {
                        const distance = await calculateDistance(cityResponse.city, temple.Address);
                        temple.Distance = `${distance.toFixed(2)}`;
                    }
                }

                fs.writeFileSync('temples.json', JSON.stringify(templeData, null, 2));
                console.log('Distance data updated successfully.');
            } else {
                console.log('No changes made to temple distances.');
            }
        }
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = calculateTempleDistances;