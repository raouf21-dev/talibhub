const axios = require('axios');

async function manualScrape() {
  try {
    const response = await axios.post('http://localhost:3000/mosque-times/scrape');
    console.log(response.data);
  } catch (error) {
    console.error('Error during manual scraping:', error.response ? error.response.data : error.message);
  }
}

manualScrape();