// mosqueTimesController.js

const { scrapePrayerTimes } = require('../scrapers/scrapePrayerTimes');

exports.manualScrape = async (req, res) => {
  try {
    await scrapePrayerTimes();
    res.status(200).json({ message: 'Scraping completed successfully' });
  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ error: 'An error occurred during scraping' });
  }
};
