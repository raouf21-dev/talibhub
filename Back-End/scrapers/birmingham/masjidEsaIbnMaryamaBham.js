// Back-End/scrapers/birmingham/masjidEsaIbnMaryamaBham.js
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

const scrapeEsaIbnMaryama = async () => {
  let browser;
  let page;

  try {
    console.log("Démarrage du scraping Esa ibn Maryama...");

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

    await page.goto("https://arrahma.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("table.dptTimetable", { timeout: 15000 });

    // Prendre une capture d'écran pour débogage
    await page.screenshot({ path: "debug_esa_page.png" });

    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};

      // Méthode directe basée sur la structure du tableau observée
      const rows = document.querySelectorAll("table.dptTimetable tbody tr");

      rows.forEach((row) => {
        // Ignorer les lignes d'en-tête
        const prayerNameElement = row.querySelector("th.prayerName");
        if (!prayerNameElement) return;

        const prayerName = prayerNameElement.textContent.trim().toLowerCase();

        // Rechercher la cellule jamah dans cette ligne
        const jamaahCell = row.querySelector("td.jamah");
        if (!jamaahCell) return;

        const jamaahTime = jamaahCell.textContent.trim();

        if (jamaahTime && !jamaahTime.includes("-")) {
          prayerTimes[prayerName] = jamaahTime;
        }
      });

      // Si la méthode directe échoue, on utilise la méthode alternative
      if (Object.keys(prayerTimes).length < 5) {
        // Méthode alternative: trouver tous les éléments par classe
        const prayerNameElements = document.querySelectorAll("th.prayerName");
        const jamahElements = document.querySelectorAll("td.jamah");

        prayerNameElements.forEach((element, index) => {
          if (index < jamahElements.length) {
            const name = element.textContent.trim().toLowerCase();
            const time = jamahElements[index].textContent.trim();

            if (time && !time.includes("-")) {
              prayerTimes[name] = time;
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
      source: "Masjid Esa ibn Maryama Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
  } catch (error) {
    console.error("Erreur lors du scraping de Esa ibn Maryama:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Navigateur fermé");
    }
  }
};

module.exports = scrapeEsaIbnMaryama;
