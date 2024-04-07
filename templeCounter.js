const fs = require('fs');

// Read the JSON data from temples.json
let templeData = [];
try {
    templeData = JSON.parse(fs.readFileSync('temples.json'));
} catch {
    console.log("Will not count, no existing data.")
}


// Function to count the total number of temples
function countTotalTemples() {
    return templeData.length;
}

// Function to count the number of temples that have been attended
function countAttendedTemples() {
    return templeData.filter(temple => temple.SessionAttended === 'true').length;
}

// Function to count the number of temples that have not been attended
function countNotAttendedTemples() {
    return templeData.filter(temple => temple.SessionAttended !== 'true').length;
}

// Export the functions
module.exports = {
    countTotalTemples,
    countAttendedTemples,
    countNotAttendedTemples
};