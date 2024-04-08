[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Utah Temple Challenge 
  
## Description
  
The Utah Temple Challenge is a Node.js application designed for participants of the challenge to attend every temple in Utah. This application utilizes web scraping techniques to gather up-to-date information about the temples from the official website of the Church of Jesus Christ of Latter-day Saints. It provides users with essential data such as temple locations, dedication dates, and distances from a specified city. It keeps track of which temples have been attended, and how many are left.

## Table of Contents

* [Installation](#installation)<br>
* [Usage](#usage)<br>
* [Features](#features)<br>
* [Contributing](#contributing)<br>
* [Contact Information](#contact-information)<br>
* [License](#license)

## Installation

### Prerequisites
Before installing the Utah Temple Challenge, ensure you have the following installed:
* [Node.js](https://nodejs.org/en) - JavaScript runtime environment

### Installing the Utah Temple Challenge
1. Clone the repository to your local machine: <br>
`git clone https://github.com/BenThere6/utah-temple-challenge.git`<br>

2. Navigate to the project directory:<br>
`cd utah-temple-challenge`<br>

3. Install dependencies:<br>
`npm install`<br>

## Usage

To use the Utah Temple Challenge, follow these steps:

1. **Get an API Key from DistanceMatrix.ai:**
    * Go to [DistanceMatrix.ai](DistanceMatrix.ai)
    * Create a free account or log in if you already have one.
    * Navigate to your dashboard
    * Copy the API key for 'Distancematrix accurate application'

2. **Create a .env file:**
    * In the root directory of the project, create a file named `.env`.
    * Open the .env file in a text editor.

3. **Set up environment variables:**
    * Inside the .env file, add the following line:<br>
    `API_KEY=YOUR_API_KEY`<br>
    Replace YOUR_API_KEY with the API key you obtained from DistanceMatrix.ai.

4. **Run the application:**
    * Open your terminal.
    * Navigate to the root directory of the project.
    * Execute the following command:<br>
    `node index`<br>

5. **Follow the on-screen prompts:**
    * Interact with the application as it guides you through scraping temple data, calculating distances, and selecting a temple to attend.

## Features

* Scrapes temple data from the official website of the Church of Jesus Christ of Latter-day Saints.
* Calculates distances between temples and a specified city using the Matrix Distance API.
* Allows users to select a temple to attend based on proximity.
* Supports customization of distance scale and other preferences.
* Keeps track of temples that have been attended
* Counts remaing temples to attend

## Contributing

Contributions to the Utah Temple Challenge project are welcome! To contribute, follow these steps:

1. Create a new branch (git checkout -b feature/yourfeature).
2. Make your changes.
3. Commit your changes (git commit -m 'Add new feature').
4. Push to the branch (git push origin feature/yourfeature).
5. Create a new Pull Request.

## Contact Information

For any further inquiries, please feel free to reach out to me through the following channels:
* GitHub: [My GitHub Profile](https://www.github.com/BenThere6)
* Email: benjaminbirdsall@icloud.com

I am here to assist you with any questions or feedback you may have. Thank you for your interest!

## License 

[MIT License](https://opensource.org/licenses/MIT)

This code's MIT License allows you to freely use, modify, and share it for any purpose. Please include the original license and copyright notices when sharing.