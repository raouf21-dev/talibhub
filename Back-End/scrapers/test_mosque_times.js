const axios = require("axios");
const mosqueTimesModel = require("../models/mosqueTimesModel");

const baseURL = "http://localhost:4000/mosque-times";

const testMosqueTimes = async () => {
  try {
    console.log("Testing getAllMosques...");
    const allMosquesResponse = await axios.get(`${baseURL}/all`);
    console.log("All mosques:", allMosquesResponse.data);

    console.log("\nTesting addMosque...");
    const newMosque = {
      name: "Test Mosque",
      address: "123 Test Street",
      latitude: 40.7128,
      longitude: -74.006,
    };
    const addMosqueResponse = await axios.post(`${baseURL}/add`, newMosque);
    console.log("Added mosque:", addMosqueResponse.data);

    const mosqueId = addMosqueResponse.data.mosqueId;

    console.log("\nTesting searchMosques...");
    const searchResponse = await axios.get(
      `${baseURL}/search?lat=40.7128&lon=-74.0060`
    );
    console.log("Search results:", searchResponse.data);

    console.log("\nTesting manualScrape...");
    const scrapeResponse = await axios.post(`${baseURL}/scrape`);
    console.log("Scrape result:", scrapeResponse.data);

    console.log("\nTesting getPrayerTimes...");
    const today = new Date().toISOString().split("T")[0];
    const prayerTimesResponse = await axios.get(
      `${baseURL}/${mosqueId}/${today}`
    );
    console.log("Prayer times:", prayerTimesResponse.data);
  } catch (error) {
    console.error(
      "Error during tests:",
      error.response ? error.response.data : error.message
    );
  }
};

//testMosqueTimes();
