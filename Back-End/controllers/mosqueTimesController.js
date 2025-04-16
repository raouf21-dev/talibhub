// mosqueTimesController.js
const axios = require("axios");
const cheerio = require("cheerio");
const { scrapers } = require("../scrapers/indexScrapers.js");
const mosqueTimesModel = require("../models/mosqueTimesModel");

class ScrapingService {
  async scrapeMosque(mosqueId) {
    if (!scrapers[mosqueId]) {
      console.error(`No scraper found for mosque ID ${mosqueId}`);
      return null;
    }

    try {
      const data = await scrapers[mosqueId]();
      if (data && data.times) {
        return {
          date: data.dateText || new Date().toISOString().split("T")[0],
          times: {
            fajr: data.times.fajr || null,
            dhuhr: data.times.dhuhr || null,
            asr: data.times.asr || null,
            maghrib: data.times.maghrib || null,
            isha: data.times.isha || null,
            jumuah1: data.times.jumuah1 || null,
            jumuah2: data.times.jumuah2 || null,
            jumuah3: data.times.jumuah3 || null,
            tarawih: data.times.tarawih || null,
          },
        };
      }
      return null;
    } catch (error) {
      console.error(`Error scraping mosque ID ${mosqueId}:`, error);
      return null;
    }
  }

  async scrapeCity(city, mosques) {
    const results = [];
    for (const mosque of mosques) {
      const data = await this.scrapeMosque(mosque.id);
      if (data) {
        results.push({ mosqueId: mosque.id, ...data });
      }
    }
    return results;
  }
}

// Déplacer la variable à l'extérieur de la classe comme variable de module
let scrapingInProgress = false;

class MosqueTimesController {
  constructor() {
    this.scrapingService = new ScrapingService();
    this.cityLocks = new Map(); // Verrouillage par ville
    this.scrapingInProgress = new Map(); // Suivi des scrapings en cours
    this.saveLocks = new Map(); // Verrous pour éviter les sauvegardes redondantes
    this.pendingRequests = new Map(); // Pour éviter les multiples déclenchements
  }

  async manualScrape(req, res) {
    try {
      console.log("Starting manual scrape...");
      const mosques = await mosqueTimesModel.getAllMosques();
      for (const mosque of mosques) {
        const data = await this.scrapingService.scrapeMosque(mosque.id);
        if (data) {
          await mosqueTimesModel.savePrayerTimes(
            mosque.id,
            data.date,
            data.times
          );
        }
      }
      res.json({ message: "Scraping completed successfully" });
    } catch (error) {
      console.error("Error during manual scraping:", error);
      res.status(500).json({
        message: "Error during scraping",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async scrapeAllCities(req, res) {
    try {
      const requestId = Date.now().toString();
      let isHttpRequest = req && res;
      let responseAlreadySent = false;

      // Un verrou global simple pour éviter les scrapings simultanés
      if (global.isScrapingAll) {
        console.log("Un scraping global est déjà en cours, ignoré");
        return isHttpRequest
          ? res.json({
              message: "Un scraping est déjà en cours",
              status: "processing",
            })
          : false;
      }
      global.isScrapingAll = true;

      // Vérifier si un scraping global est déjà en cours
      const activeGlobalScraping = Array.from(
        this.scrapingInProgress.entries()
      ).find(([_, v]) => v.type === "global" && v.status === "processing");

      if (activeGlobalScraping && isHttpRequest) {
        return res.json({
          message: "Un scraping est déjà en cours, redirection",
          status: "processing",
          requestId: activeGlobalScraping[0],
          redirected: true,
        });
      }

      // Réponse immédiate pour les requêtes HTTP
      if (isHttpRequest) {
        res.json({
          message: "Scraping démarré avec succès",
          status: "processing",
          requestId: requestId,
        });
        responseAlreadySent = true;
      }

      // Initialiser les résultats
      const scrapingResults = {
        cities: {},
        completedAt: null,
        status: "processing",
        type: "global",
        progress: { total: 0, completed: 0, failed: 0 },
      };

      // Enregistrer ce scraping
      this.scrapingInProgress.set(requestId, scrapingResults);
      global.activeScrapings = global.activeScrapings || {};
      global.activeScrapings[requestId] = scrapingResults;

      try {
        // Récupérer toutes les villes et toutes les mosquées en une seule fois
        const cities = await mosqueTimesModel.getAllCities();
        scrapingResults.progress.total = cities.length;

        // Récupérer toutes les mosquées d'un coup
        const allMosques = await mosqueTimesModel.getAllMosques();

        // Organiser les mosquées par ville
        const mosquesByCity = cities.reduce((acc, city) => {
          acc[city] = allMosques.filter(
            (m) => m.city.toLowerCase() === city.toLowerCase()
          );
          return acc;
        }, {});

        // Créer un ensemble plat de toutes les mosquées pour le traitement par lots
        const allMosqueIds = allMosques.map((m) => m.id);
        console.log(
          `Traitement global de ${allMosqueIds.length} mosquées dans ${cities.length} villes`
        );

        // Initialiser le suivi pour chaque ville
        for (const city of cities) {
          scrapingResults.cities[city] = {
            status: "pending",
            mosqueCount: mosquesByCity[city].length,
            completedCount: 0,
            startedAt: new Date().toISOString(),
          };
        }

        // Traiter toutes les mosquées par lots
        const BATCH_SIZE = 10; // Plus grand pour traitement global
        for (let i = 0; i < allMosqueIds.length; i += BATCH_SIZE) {
          const batch = allMosqueIds.slice(i, i + BATCH_SIZE);
          console.log(
            `Traitement du lot global ${
              Math.floor(i / BATCH_SIZE) + 1
            }/${Math.ceil(allMosqueIds.length / BATCH_SIZE)}`
          );

          // Exécuter les scrapers de ce lot en parallèle
          await Promise.allSettled(
            batch.map(async (mosqueId) => {
              try {
                // Ne pas traiter si déjà en cours ou récemment exécuté
                if (
                  scraperQueue.isProcessing(mosqueId) ||
                  scraperQueue.hasRecentExecution(mosqueId)
                ) {
                  return;
                }

                // Trouver la ville de cette mosquée
                const mosque = allMosques.find((m) => m.id === mosqueId);
                if (!mosque) return;
                const city = mosque.city;

                // Marquer la ville comme en cours
                if (scrapingResults.cities[city]) {
                  scrapingResults.cities[city].status = "processing";
                }

                // Exécuter le scraper
                const data = await this.scrapingService.scrapeMosque(mosqueId);
                if (data) {
                  await this.savePrayerTimesSafely(
                    mosqueId,
                    data.date,
                    data.times
                  );

                  // Incrémenter le compteur de cette ville
                  if (scrapingResults.cities[city]) {
                    scrapingResults.cities[city].completedCount++;
                  }
                }
              } catch (error) {
                console.error(
                  `Erreur lors du scraping de mosquée ${mosqueId}:`,
                  error
                );
              }
            })
          );
        }

        // Finaliser les résultats de chaque ville
        for (const city of cities) {
          if (scrapingResults.cities[city]) {
            scrapingResults.cities[city].status = "completed";
            scrapingResults.cities[city].completedAt = new Date().toISOString();
            scrapingResults.progress.completed++;

            // Récupérer les données fraîches pour cette ville
            const date = new Date().toISOString().split("T")[0];
            scrapingResults.cities[city].prayerTimesData =
              await this.getPrayerTimesForCityAndDateInternal(city, date);
          }
        }

        // Marquer le scraping comme terminé
        scrapingResults.completedAt = new Date().toISOString();
        scrapingResults.status = "completed";
        console.log("Scraping global terminé avec succès");

        // Nettoyage après 10 minutes
        setTimeout(() => {
          if (this.scrapingInProgress.has(requestId)) {
            this.scrapingInProgress.delete(requestId);
          }
          if (global.activeScrapings && global.activeScrapings[requestId]) {
            delete global.activeScrapings[requestId];
          }
        }, 10 * 60 * 1000);

        return scrapingResults;
      } catch (error) {
        console.error("Erreur lors du scraping global:", error);
        scrapingResults.status = "failed";
        scrapingResults.error = error.message;
        throw error;
      } finally {
        // Libérer le verrou global
        global.isScrapingAll = false;
      }
    } catch (error) {
      console.error("Erreur lors du scraping pour toutes les villes:", error);
      if (req && res && !responseAlreadySent) {
        res
          .status(500)
          .json({ message: "Erreur lors du scraping", error: error.message });
      }
      return false;
    }
  }

  // Nouvelle méthode pour le scraping avec verrouillage
  async scrapeCityWithLock(city, requestId, scrapingResults) {
    try {
      console.log(`Début du scraping pour ${city}`);
      const mosques = await mosqueTimesModel.getMosquesByCity(city);

      if (!mosques.length) {
        console.log(`Aucune mosquée pour ${city}, ignoré`);
        return true;
      }

      // Initialiser le suivi
      if (!scrapingResults.cities[city]) {
        scrapingResults.cities[city] = {
          status: "processing",
          mosqueCount: mosques.length,
          completedCount: 0,
          startedAt: new Date().toISOString(),
        };
      }

      // Traiter par lots
      const BATCH_SIZE = 5;
      for (let i = 0; i < mosques.length; i += BATCH_SIZE) {
        const batch = mosques.slice(i, i + BATCH_SIZE);

        // Créer une seule promesse par mosquée
        const uniqueMosqueIds = new Set(batch.map((m) => m.id));
        const scrapePromises = [];

        for (const id of uniqueMosqueIds) {
          // Vérifier si déjà en cours de scraping
          if (
            !scraperQueue.isProcessing(id) &&
            !scraperQueue.hasRecentExecution(id)
          ) {
            const mosque = batch.find((m) => m.id === id);
            const promise = this.scrapingService
              .scrapeMosque(id)
              .then(async (result) => {
                if (result) {
                  // Sauvegarde uniquement si données modifiées
                  await this.savePrayerTimesSafely(
                    id,
                    result.date,
                    result.times
                  );
                  scrapingResults.cities[city].completedCount++;
                }
                return result;
              });
            scrapePromises.push(promise);
          }
        }

        // Attendre la fin du lot
        if (scrapePromises.length > 0) {
          await Promise.allSettled(scrapePromises);
        }
      }

      // Finaliser les résultats
      scrapingResults.cities[city].status = "completed";
      scrapingResults.cities[city].completedAt = new Date().toISOString();

      console.log(
        `Scraping terminé pour ${city}: ${scrapingResults.cities[city].completedCount}/${mosques.length} mosquées`
      );
      return true;
    } catch (error) {
      console.error(`Erreur lors du scraping pour ${city}:`, error);
      if (scrapingResults.cities[city]) {
        scrapingResults.cities[city].status = "failed";
        scrapingResults.cities[city].error = error.message;
      }
      throw error;
    }
  }

  // Optimisation pour éviter les sauvegardes redondantes
  // Remplacer cette méthode dans mosqueTimesController.js
  async savePrayerTimesSafely(mosqueId, date, times) {
    // Clé unique de verrouillage
    const saveKey = `${mosqueId}_${date}`;

    // Initialiser la structure globale si nécessaire
    if (!global.savingMosques) global.savingMosques = new Set();

    // Vérifier si déjà en cours de sauvegarde
    if (global.savingMosques.has(saveKey)) return;

    global.savingMosques.add(saveKey);

    try {
      // Vérifier si la mosquée existe
      const mosques = await mosqueTimesModel.getAllMosques();
      if (!mosques.some((m) => m.id === parseInt(mosqueId))) {
        console.log(`Mosquée ${mosqueId} inexistante, sauvegarde ignorée`);
        return;
      }

      // Vérifier si les données sont différentes
      const savedTimes = await mosqueTimesModel.getPrayerTimes(mosqueId, date);
      if (savedTimes) {
        let hasChanges = false;
        for (const prayer of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
          const existing =
            savedTimes[prayer] instanceof Date
              ? savedTimes[prayer].toTimeString().slice(0, 5)
              : savedTimes[prayer];

          if (existing !== times[prayer]) {
            hasChanges = true;
            break;
          }
        }

        if (!hasChanges) return;
      }

      // Sauvegarder uniquement si nécessaire
      await mosqueTimesModel.savePrayerTimes(mosqueId, date, times);
    } catch (error) {
      console.error(`Erreur sauvegarde mosquée ${mosqueId}:`, error);
    } finally {
      global.savingMosques.delete(saveKey);
    }
  }

  // Méthode interne pour récupérer les horaires par ville et date (sans réponse HTTP)
  async getPrayerTimesForCityAndDateInternal(city, date) {
    try {
      const mosques = await mosqueTimesModel.getMosquesByCity(city);

      if (mosques.length === 0) {
        return { message: "Aucune mosquée trouvée dans cette ville." };
      }

      const prayerTimesPromises = mosques.map((mosque) =>
        mosqueTimesModel.getPrayerTimes(mosque.id, date)
      );

      const prayerTimesResults = await Promise.all(prayerTimesPromises);
      const formattedPrayerTimes = prayerTimesResults
        .filter((times) => times !== null && times !== undefined)
        .map((times, index) => {
          // Formater les horaires et créer un objet complet avec l'ID de la mosquée
          const formattedTimes = { ...times };
          Object.keys(formattedTimes).forEach((key) => {
            if (formattedTimes[key] instanceof Date) {
              formattedTimes[key] = formattedTimes[key]
                .toTimeString()
                .slice(0, 5);
            }
          });
          return {
            mosque_id: mosques[index].id,
            ...formattedTimes,
          };
        });

      return {
        cityName: city,
        date: date,
        prayerTimes: formattedPrayerTimes,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des horaires de prière :",
        error
      );
      throw error;
    }
  }

  // Nouvel endpoint pour vérifier le statut d'un scraping
  async checkScrapingStatus(req, res) {
    const { requestId } = req.params;
    console.log(
      `Vérification du statut de scraping pour requestId: ${requestId}`
    );

    // Initialiser global.activeScrapings s'il n'existe pas encore
    if (!global.activeScrapings) {
      global.activeScrapings = {};
    }

    // Si aucun scraping n'est trouvé pour cet ID
    if (!global.activeScrapings[requestId]) {
      // Vérifier si des scrapings sont en cours
      const activeScrapings = Object.keys(global.activeScrapings);
      if (activeScrapings.length > 0) {
        // Prendre le scraping actif le plus récent
        const latestRequestId = activeScrapings[activeScrapings.length - 1];

        // Rediriger la requête vers le scraping le plus récent
        return res.json({
          ...global.activeScrapings[latestRequestId],
          requestId: latestRequestId,
          redirected: true,
          originalRequestId: requestId,
        });
      }

      // Si aucun scraping n'est en cours, retourner une erreur
      return res.status(404).json({
        message: "Aucun scraping en cours",
        status: "not_found",
        error: "Scraping non trouvé",
      });
    }

    const scrapingResult = global.activeScrapings[requestId];

    // Si le scraping est terminé, supprimer la référence après un certain temps
    if (
      scrapingResult.status === "completed" ||
      scrapingResult.status === "failed"
    ) {
      // Programmer la suppression après 10 minutes
      setTimeout(() => {
        if (global.activeScrapings && global.activeScrapings[requestId]) {
          delete global.activeScrapings[requestId];
        }
      }, 10 * 60 * 1000);
    }

    return res.json(scrapingResult);
  }

  async scrapeByCity(req, res) {
    try {
      const city = req.params.city;
      if (!city) {
        return res
          .status(400)
          .json({ message: "Le paramètre 'ville' est requis" });
      }
      const mosques = await mosqueTimesModel.getMosquesByCity(city);
      const data = await this.scrapingService.scrapeCity(city, mosques);
      for (const item of data) {
        await mosqueTimesModel.savePrayerTimes(
          item.mosqueId,
          item.date,
          item.times
        );
      }
      res.json({
        message: `Scraping terminé avec succès pour la ville ${city}`,
      });
    } catch (error) {
      console.error(`Erreur lors du scraping pour la ville:`, error);
      res.status(500).json({
        message: "Erreur lors du scraping",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async getPrayerTimes(req, res) {
    try {
      const { mosqueId, date } = req.params;
      const times = await mosqueTimesModel.getPrayerTimes(mosqueId, date);
      if (times) {
        Object.keys(times).forEach((key) => {
          if (times[key] instanceof Date) {
            times[key] = times[key].toTimeString().slice(0, 5);
          }
        });
        res.json(times);
      } else {
        res.status(404).json({ message: "Prayer times not found" });
      }
    } catch (error) {
      console.error("Error getting prayer times:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getAllMosques(req, res) {
    try {
      const mosques = await mosqueTimesModel.getAllMosques();
      res.json(mosques);
    } catch (error) {
      console.error("Error fetching all mosques:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async searchCities(req, res) {
    try {
      const query = req.query.query || "";
      const cities = await mosqueTimesModel.searchCities(query);
      res.json(cities);
    } catch (error) {
      console.error("Erreur lors de la recherche des villes :", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }

  async getMosquesByCity(req, res) {
    try {
      const city = req.params.city;
      if (!city) {
        return res
          .status(400)
          .json({ message: "Le paramètre ville est requis." });
      }
      const mosques = await mosqueTimesModel.getMosquesByCity(city);
      res.json(mosques);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des mosquées par ville :",
        error
      );
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }

  async searchMosques(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }
      const mosques = await mosqueTimesModel.searchMosques(
        parseFloat(lat),
        parseFloat(lon)
      );
      res.json(mosques);
    } catch (error) {
      console.error("Error searching mosques:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async addMosque(req, res) {
    try {
      const { name, address, latitude, longitude } = req.body;
      if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const mosqueId = await mosqueTimesModel.addMosque(
        name,
        address,
        parseFloat(latitude),
        parseFloat(longitude)
      );
      res.status(201).json({ message: "Mosque added successfully", mosqueId });
    } catch (error) {
      console.error("Error adding mosque:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async triggerScrapingByRunAllScrapers() {
    // Vérifier atomiquement si un scraping est déjà en cours
    if (scrapingInProgress) {
      console.log("Scraping déjà en cours, ignoré");
      return false;
    }

    // Marquer comme en cours
    scrapingInProgress = true;

    try {
      const { runAllScrapers } = require("../scrapers/indexScrapers.js");
      const result = await runAllScrapers();

      if (result && result.results && result.results.length > 0) {
        const date = new Date().toISOString().split("T")[0];
        const batchSize = 20; // Traiter plus de résultats à la fois

        for (let i = 0; i < result.results.length; i += batchSize) {
          const batch = result.results.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map((data) => {
              if (data && data.mosqueId && data.times) {
                return this.savePrayerTimesSafely(
                  data.mosqueId,
                  date,
                  data.times
                );
              }
              return Promise.resolve();
            })
          );
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur scraping global:", error.message);
      return false;
    } finally {
      // Assurer que le verrou est toujours relâché
      scrapingInProgress = false;
    }
  }

  async checkDataExists(req, res) {
    try {
      const date = req.params.date;
      const dataExists = await mosqueTimesModel.checkDataExists(date);

      // Déclencher scraping si besoin sans attendre la fin
      if (!dataExists) {
        setImmediate(() => this.triggerScrapingByRunAllScrapers());
      }

      res.json({ exists: dataExists });
    } catch (error) {
      console.error("Erreur vérification données:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  async reportMissingData(req, res) {
    res.status(200).json({
      success: true,
      message: "Données manquantes signalées",
    });

    // Déclencher scraping en arrière-plan
    this.triggerScrapingByRunAllScrapers();
  }

  async getPrayerTimesForCityAndDate(req, res) {
    try {
      const { city, date } = req.params;

      // Utiliser une clé unique pour le traitement de cette ville/date
      const requestKey = `${city}_${date}`;

      // Vérifier si un traitement est déjà en cours pour cette ville/date
      if (!this.pendingRequests) {
        this.pendingRequests = new Map();
      }

      if (this.pendingRequests.has(requestKey)) {
        console.log(
          `Requête déjà en cours pour ${city}/${date}, réutilisation du résultat`
        );
        const result = await this.pendingRequests.get(requestKey);
        return res.json(result);
      }

      // Créer une promesse pour cette requête
      const requestPromise = (async () => {
        try {
          console.log(
            `Traitement de la requête pour ville=${city}, date=${date}`
          );
          const mosques = await mosqueTimesModel.getMosquesByCity(city);

          if (mosques.length === 0) {
            return { message: "Aucune mosquée trouvée dans cette ville." };
          }

          const prayerTimesPromises = mosques.map((mosque) =>
            mosqueTimesModel.getPrayerTimes(mosque.id, date)
          );
          const prayerTimesResults = await Promise.all(prayerTimesPromises);

          const formattedPrayerTimes = prayerTimesResults
            .filter((times) => times !== null && times !== undefined)
            .map((times, index) => {
              if (!times || !times.mosque_id) return null;

              // Formater les horaires
              return {
                mosque_id: mosques[index].id,
                date: times.date,
                fajr: times.fajr || null,
                dhuhr: times.dhuhr || null,
                asr: times.asr || null,
                maghrib: times.maghrib || null,
                isha: times.isha || null,
                jumuah1: times.jumuah1 || null,
                jumuah2: times.jumuah2 || null,
                jumuah3: times.jumuah3 || null,
                tarawih: times.tarawih || null,
              };
            })
            .filter((times) => times !== null);

          // Si aucun horaire trouvé, déclencher UN SEUL scraping en arrière-plan
          if (formattedPrayerTimes.length === 0) {
            console.log(
              `Aucun horaire trouvé pour ${city}, déclenchement unique du scraping`
            );

            // Vérifier si un scraping est déjà en cours pour cette ville
            const isScrapingActive = this.cityLocks.has(city);

            if (!isScrapingActive) {
              // Lancer un scraping en arrière-plan sans attendre le résultat
              setImmediate(() => {
                const scrapeCityPromise = (async () => {
                  try {
                    // Créer un verrou pour cette ville
                    this.cityLocks.set(city, true);

                    console.log(`Démarrage du scraping pour ${city}`);
                    const cityMosques = await mosqueTimesModel.getMosquesByCity(
                      city
                    );

                    // Appeler directement le service de scraping pour éviter les problèmes de contexte
                    const scrapeService = new ScrapingService();
                    const data = await scrapeService.scrapeCity(
                      city,
                      cityMosques
                    );

                    // Sauvegarder les résultats
                    for (const item of data) {
                      await this.savePrayerTimesSafely(
                        item.mosqueId,
                        item.date,
                        item.times
                      );
                    }

                    console.log(`Scraping terminé pour ${city}`);
                  } catch (err) {
                    console.error(`Erreur lors du scraping pour ${city}:`, err);
                  } finally {
                    // Libérer le verrou
                    this.cityLocks.delete(city);
                  }
                })();
              });
            } else {
              console.log(
                `Un scraping est déjà en cours pour ${city}, pas de nouveau déclenchement`
              );
            }
          }

          return {
            prayerTimes: formattedPrayerTimes,
            message:
              formattedPrayerTimes.length === 0
                ? "Aucun horaire trouvé pour cette date"
                : undefined,
          };
        } finally {
          // Supprimer la référence dans tous les cas après un délai
          setTimeout(() => {
            this.pendingRequests.delete(requestKey);
          }, 5000); // 5 secondes pour éviter les requêtes multiples rapprochées
        }
      })();

      // Stocker la promesse
      this.pendingRequests.set(requestKey, requestPromise);

      // Attendre le résultat et l'envoyer
      const result = await requestPromise;
      return res.json(result);
    } catch (error) {
      console.error(`Erreur lors de la récupération des horaires:`, error);
      return res
        .status(500)
        .json({ message: "Erreur du serveur", error: error.message });
    }
  }

  async setSelectedCity(req, res) {
    try {
      const { city } = req.body;
      if (!city) {
        return res.status(400).json({ message: "La ville est requise" });
      }

      // Utiliser le cookieManager attaché par le middleware
      res.cookieManager.setSelectedCity(res, city);

      res.status(200).json({
        message: "Ville sauvegardée avec succès",
        city: city,
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la ville:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  async getSelectedCity(req, res) {
    try {
      const city = res.cookieManager.getSelectedCity(req);
      res.status(200).json({ city });
    } catch (error) {
      console.error("Erreur lors de la récupération de la ville:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  // Ajout d'une fonction de nettoyage périodique
  initializeCleanupTask() {
    // Nettoyer les scrapings inactifs toutes les 5 minutes
    setInterval(() => {
      console.log("Nettoyage des scrapings inactifs...");

      // Nettoyer les verrous de ville inactifs
      for (const [city, lockPromise] of this.cityLocks.entries()) {
        if (
          lockPromise.status === "fulfilled" ||
          lockPromise.status === "rejected"
        ) {
          this.cityLocks.delete(city);
          console.log(`Verrou nettoyé pour la ville ${city}`);
        }
      }

      // Nettoyer les résultats de scraping obsolètes
      const now = Date.now();
      for (const [requestId, result] of this.scrapingInProgress.entries()) {
        if (result.status === "completed" || result.status === "failed") {
          const completedAt = new Date(result.completedAt).getTime();
          if (now - completedAt > 10 * 60 * 1000) {
            // 10 minutes
            this.scrapingInProgress.delete(requestId);
            if (global.activeScrapings && global.activeScrapings[requestId]) {
              delete global.activeScrapings[requestId];
            }
            console.log(`Scraping ${requestId} nettoyé`);
          }
        }
      }

      // Supprimer l'appel à forceCleanAllStuckTasks qui n'existe pas
      // Optionnellement, vous pouvez supprimer les verrous de sauvegarde
      if (global.savingMosques) {
        const count = global.savingMosques.size;
        if (count > 0) {
          global.savingMosques.clear();
          console.log(`Nettoyage de ${count} verrous de sauvegarde bloqués`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Créer une instance du contrôleur
const controller = new MosqueTimesController();

// Exporter les méthodes liées aux routes
module.exports = {
  manualScrape: controller.manualScrape.bind(controller),
  scrapeAllCities: controller.scrapeAllCities.bind(controller),
  scrapeByCity: controller.scrapeByCity.bind(controller),
  getPrayerTimes: controller.getPrayerTimes.bind(controller),
  getAllMosques: controller.getAllMosques.bind(controller),
  searchCities: controller.searchCities.bind(controller),
  getMosquesByCity: controller.getMosquesByCity.bind(controller),
  searchMosques: controller.searchMosques.bind(controller),
  addMosque: controller.addMosque.bind(controller),
  checkDataExists: controller.checkDataExists.bind(controller),
  getPrayerTimesForCityAndDate:
    controller.getPrayerTimesForCityAndDate.bind(controller),
  setSelectedCity: controller.setSelectedCity.bind(controller),
  getSelectedCity: controller.getSelectedCity.bind(controller),
  reportMissingData: controller.reportMissingData.bind(controller),
  checkScrapingStatus: controller.checkScrapingStatus.bind(controller),
  initializeCleanupTask: controller.initializeCleanupTask.bind(controller),
  triggerScrapingByRunAllScrapers:
    controller.triggerScrapingByRunAllScrapers.bind(controller),
};
