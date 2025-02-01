// cacheMosqueTime.js

/**
 * Calcule et retourne le timestamp correspondant à minuit (début du jour suivant).
 * @returns {number} - Timestamp en millisecondes.
 */
function getMidnightTimestamp() {
  const now = new Date();
  // Création d'un objet Date pour le début du lendemain
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime();
}

const CacheService = {
  /**
   * Enregistre une donnée dans le cache avec une clé et un timestamp d'expiration.
   * @param {string} key - La clé unique pour l'entrée de cache.
   * @param {any} data - Les données à stocker.
   * @param {number} expirationTimestamp - Timestamp en millisecondes indiquant quand l'entrée expire.
   */
  setItem(key, data, expirationTimestamp) {
    const cacheEntry = {
      data,
      expiration: expirationTimestamp
    };
    try {
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans le cache pour la clé ${key}:`, error);
    }
  },

  /**
   * Récupère une donnée stockée dans le cache pour une clé donnée, si elle n'est pas expirée.
   * @param {string} key - La clé de l'entrée de cache.
   * @returns {any|null} - Les données stockées ou null si elles n'existent pas ou sont expirées.
   */
  getItem(key) {
    const cachedStr = localStorage.getItem(key);
    if (!cachedStr) return null;
    try {
      const cacheEntry = JSON.parse(cachedStr);
      if (cacheEntry.expiration && Date.now() > cacheEntry.expiration) {
        localStorage.removeItem(key);
        return null;
      }
      return cacheEntry.data;
    } catch (error) {
      console.error(`Erreur lors du parsing du cache pour la clé ${key}:`, error);
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Supprime une entrée du cache.
   * @param {string} key - La clé de l'entrée à supprimer.
   */
  removeItem(key) {
    localStorage.removeItem(key);
  },

  /**
   * Vide l'intégralité du cache.
   */
  clearAll() {
    localStorage.clear();
  }
};

// Optionnel : vous pouvez aussi attacher getMidnightTimestamp à l'objet si vous souhaitez l'utiliser via CacheService
CacheService.getMidnightTimestamp = getMidnightTimestamp;

// Export par défaut pour le service de cache
export default CacheService;

// Export nominée pour la fonction getMidnightTimestamp
export { getMidnightTimestamp };
