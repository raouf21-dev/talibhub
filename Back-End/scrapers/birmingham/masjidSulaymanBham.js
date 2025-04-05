// Back-End/scrapers/birmingham/masjidSulaymanBham.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const {
  normalizeTime,
  dateUtils,
  prayerUtils,
  userAgents,
} = require("../scraperUtils");
const humanBehavior = require("../humanBehaviorUtils");

const stealth = StealthPlugin();
stealth.enabledEvasions.delete("webgl.vendor");
stealth.enabledEvasions.delete("webgl.renderer");
puppeteer.use(stealth);

const scrapeMasjidSulayman = async () => {
  let browser;
  let page;

  try {
    console.log("Démarrage du scraping Masjid Sulayman...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
      ignoreHTTPSErrors: true,
      executablePath: await executablePath(),
    });

    page = await browser.newPage();
    await humanBehavior.setupPageOptimized(page);
    await page.setViewport({ width: 1920, height: 1080 });
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "stylesheet", "font"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto("https://masjidsulayman.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("table.customStyles", { timeout: 15000 });

    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const prayers = ["fajr", "zuhr", "asr", "maghrib", "isha"];

      // Trouver la rangée qui contient "Jamat" dans l'en-tête
      const jamatRow = Array.from(document.querySelectorAll("tr")).find(
        (row) => {
          const headingCell = row.querySelector("th.tableHeading");
          return headingCell && headingCell.textContent.includes("Jamat");
        }
      );

      if (jamatRow) {
        // Extraire toutes les cellules TD dans la rangée, indépendamment de leur classe
        const allCells = Array.from(jamatRow.querySelectorAll("td"));

        // Associer chaque cellule à sa prière correspondante par ordre
        prayers.forEach((prayer, index) => {
          if (index < allCells.length) {
            const time = allCells[index].textContent.trim();
            if (time && !time.includes("-")) {
              prayerTimes[prayer] = time;
            }
          }
        });
      }

      return prayerTimes;
    });

    console.log("Données brutes extraites:", rawTimes);

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        const normalizedTime = normalizeTime(time);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Sulayman bin Dawud Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
  } catch (error) {
    console.error("Erreur lors du scraping de Masjid Sulayman:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Navigateur fermé");
    }
  }
};

module.exports = scrapeMasjidSulayman;
