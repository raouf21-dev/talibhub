// Services/Caches/cacheService.js

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
     * Stocke une donnée dans le localStorage avec une clé et une expiration.
     * @param {string} key - La clé de l'entrée.
     * @param {any} data - Les données à stocker.
     * @param {number} expirationTimestamp - Timestamp d'expiration en millisecondes.
     */
    setItem(key, data, expirationTimestamp) {
      const cacheEntry = { data, expiration: expirationTimestamp };
      try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans le cache pour la clé ${key}:`, error);
      }
    },
  
    /**
     * Récupère les données pour une clé, si elles existent et ne sont pas expirées.
     * @param {string} key - La clé de l'entrée.
     * @returns {any|null} - Les données ou null si absentes/expirées.
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
  
    removeItem(key) {
      localStorage.removeItem(key);
    },
  
    clearAll() {
      localStorage.clear();
    }
  };
  
  // On attache également la fonction pour simplifier son accès.
  CacheService.getMidnightTimestamp = getMidnightTimestamp;
  
  export default CacheService;
  export { getMidnightTimestamp };
  