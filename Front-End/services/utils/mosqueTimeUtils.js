/**
 * Utilitaires partagés pour les composants liés aux horaires de mosquées
 * Ce fichier centralise les fonctions communes utilisées dans mosqueTime.js et welcomeMosqueTime.js
 */

/**
 * Formatage d'une heure de prière
 * @param {string} time - L'heure au format texte (HH:MM:SS ou autre)
 * @returns {string} - L'heure formatée (HH:MM ou --:--)
 */
export function formatPrayerTime(time) {
  if (!time || time === "--:--") return "--:--";

  // Filtrer les horaires invalides (00:00:00, 00:00, etc.)
  if (time === "00:00:00" || time === "00:00" || time === "0:00")
    return "--:--";

  // Si le format est HH:MM:SS, extraire uniquement HH:MM
  if (time.includes(":")) {
    const parts = time.split(":");
    if (parts.length >= 2) {
      // Vérifier si c'est 00:00
      if (parts[0] === "00" && parts[1] === "00") return "--:--";
      return `${parts[0]}:${parts[1]}`;
    }
  }

  return time;
}

/**
 * Crée un lien Google Maps à partir d'une adresse
 * @param {string} address - L'adresse de la mosquée
 * @param {string} name - Le nom de la mosquée
 * @returns {string} - URL complète pour Google Maps
 */
export function createMapsLink(address, name) {
  if (!address) return "";
  // Encoder l'adresse et le nom pour l'URL
  const encodedAddress = encodeURIComponent(`${name}, ${address}`);
  return `https://maps.google.com/?q=${encodedAddress}`;
}

/**
 * Création d'un élément SVG pour l'icône de navigation
 * @returns {string} - Le code HTML de l'icône SVG
 */
export function createNavigationIconSVG() {
  return `<img src="/assets/icons/navmap-icone.svg" class="navigation-icon" alt="Icône de navigation routière">`;
}

/**
 * Génère le HTML pour afficher les horaires de prière formatés
 * @param {Object} times - Objet contenant les horaires de prière
 * @returns {string} - Code HTML pour l'affichage des horaires
 */
export function formatPrayerTimesHTML(times) {
  // Logs détaillés des données reçues pour débogage
  console.log("[MOSQUE-UTILS] Formatage des horaires:", times);
  console.log("[MOSQUE-UTILS] Type de données:", typeof times);

  // Protection contre les données nulles ou non définies
  if (!times) {
    console.warn("[MOSQUE-UTILS] Données d'horaires nulles ou non définies");
    return "<p>Horaires non disponibles</p>";
  }

  // Vérifier si times est vraiment un objet (protection contre les erreurs)
  if (typeof times !== "object") {
    console.error(
      "[MOSQUE-UTILS] Format invalide - times n'est pas un objet:",
      times
    );
    return "<p>Format d'horaires invalide</p>";
  }

  // Afficher les clés disponibles
  const availableKeys = Object.keys(times);
  console.log("[MOSQUE-UTILS] Clés disponibles:", availableKeys.join(", "));

  // Vérifier la présence des prières principales
  const mainPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const additionalPrayers = [
    "jumuah1",
    "jumuah2",
    "jumuah3",
    "jumuah4",
    "tarawih",
  ];

  // Vérifier quelles prières principales sont présentes
  const foundMainPrayers = mainPrayers.filter((prayer) => times[prayer]);
  console.log(
    "[MOSQUE-UTILS] Prières principales trouvées:",
    foundMainPrayers.join(", ")
  );

  // Vérifier s'il y a des prières problématiques (zuhr au lieu de dhuhr, etc.)
  const possibleAlternatives = {
    zuhr: "dhuhr",
    dhur: "dhuhr",
    duhr: "dhuhr",
  };

  // Correction automatique des noms alternatifs
  Object.entries(possibleAlternatives).forEach(([alt, standard]) => {
    if (times[alt] && !times[standard]) {
      console.log(`[MOSQUE-UTILS] Correction de nom: ${alt} -> ${standard}`);
      times[standard] = times[alt];
    }
  });

  // Vérifier à nouveau après correction
  const correctedMainPrayers = mainPrayers.filter((prayer) => times[prayer]);
  if (correctedMainPrayers.length !== foundMainPrayers.length) {
    console.log(
      "[MOSQUE-UTILS] Prières après correction:",
      correctedMainPrayers.join(", ")
    );
  }

  // Génération du HTML pour les prières principales
  let mainPrayerTimesHTML = mainPrayers
    .map((prayer) => {
      const prayerTime = times[prayer];
      // Log pour chaque prière
      console.log(`[MOSQUE-UTILS] Formatage de ${prayer}: ${prayerTime}`);

      return `
        <div class="prayer-item">
          <div class="prayer-name">
            <span class="prayer-label">${
              prayer.charAt(0).toUpperCase() + prayer.slice(1)
            }</span>
            <span class="jamaa-time">${formatPrayerTime(prayerTime)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  // Génération du HTML pour les prières additionnelles
  let additionalPrayerTimesHTML = additionalPrayers
    .map((prayer) => {
      const prayerTime = times[prayer];
      // N'inclure que les prières additionnelles qui ont une valeur
      if (!prayerTime) return "";

      console.log(
        `[MOSQUE-UTILS] Formatage de prière additionnelle ${prayer}: ${prayerTime}`
      );

      return `
        <div class="prayer-item">
          <div class="prayer-name">
            <span class="prayer-label">${
              prayer.charAt(0).toUpperCase() + prayer.slice(1)
            }</span>
            <span class="jamaa-time">${formatPrayerTime(prayerTime)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  // Log final pour vérifier la structure
  console.log("[MOSQUE-UTILS] Génération de HTML terminée");

  // Si aucune prière n'a été trouvée, afficher un message spécifique
  if (!mainPrayerTimesHTML.trim() && !additionalPrayerTimesHTML.trim()) {
    console.warn("[MOSQUE-UTILS] Aucune prière trouvée dans les données");
    return "<p>Aucune donnée d'horaire valide trouvée</p>";
  }

  // Retourner le HTML complet
  return `
    <div class="prayer-times-grid">
      ${mainPrayerTimesHTML}
    </div>
    <div class="additional-times-grid">
      ${additionalPrayerTimesHTML}
    </div>
  `;
}

/**
 * Obtient la date courante au format YYYY-MM-DD
 * @returns {string} - Date au format YYYY-MM-DD
 */
export function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calcule la distance entre deux positions géographiques
 * @param {Object} pos1 - Position 1 {latitude, longitude}
 * @param {Object} pos2 - Position 2 {latitude, longitude}
 * @returns {number} - Distance en kilomètres
 */
export function calculateDistance(pos1, pos2) {
  if (!pos1 || !pos2 || !pos1.latitude || !pos2.latitude) return Infinity;

  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(pos2.latitude - pos1.latitude);
  const dLon = toRad(pos2.longitude - pos1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pos1.latitude)) *
      Math.cos(toRad(pos2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertit des degrés en radians
 * @param {number} value - Valeur en degrés
 * @returns {number} - Valeur en radians
 */
export function toRad(value) {
  return (value * Math.PI) / 180;
}
