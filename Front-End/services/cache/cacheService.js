    // Services/Caches/cacheService.js
    
// Cache en mémoire pour un accès ultra-rapide
const memoryCache = new Map();

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
      // Stocker en mémoire pour un accès rapide
      memoryCache.set(key, data);
      
      const cacheEntry = { data, expiration: expirationTimestamp };
      try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
      } catch (error) {
        // En cas d'erreur (stockage plein), nettoyer le cache
        console.error(`Erreur lors de la sauvegarde dans le cache pour la clé ${key}:`, error);
        this.cleanOldEntries();
        try {
          localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (e) {
          console.error("Impossible de sauvegarder même après nettoyage:", e);
        }
      }
    },
  
    /**
     * Récupère les données pour une clé, si elles existent et ne sont pas expirées.
     * @param {string} key - La clé de l'entrée.
     * @returns {any|null} - Les données ou null si absentes/expirées.
     */
    getItem(key) {
      // Vérifier d'abord dans le cache mémoire (plus rapide)
      if (memoryCache.has(key)) {
        return memoryCache.get(key);
      }
      
      // Sinon, vérifier dans le localStorage
      const cachedStr = localStorage.getItem(key);
      if (!cachedStr) return null;
      
      try {
        const cacheEntry = JSON.parse(cachedStr);
        if (cacheEntry.expiration && Date.now() > cacheEntry.expiration) {
          localStorage.removeItem(key);
          return null;
        }
        
        // Mettre en cache mémoire pour les prochains accès
        memoryCache.set(key, cacheEntry.data);
        
        return cacheEntry.data;
      } catch (error) {
        console.error(`Erreur lors du parsing du cache pour la clé ${key}:`, error);
        localStorage.removeItem(key);
        return null;
      }
    },
  
    removeItem(key) {
      memoryCache.delete(key);
      localStorage.removeItem(key);
    },
  
    clearAll() {
      memoryCache.clear();
      localStorage.clear();
    },
    
    /**
     * Nettoie les entrées les plus anciennes du cache.
     */
    cleanOldEntries() {
      try {
        // Récupérer toutes les clés liées aux mosquées
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('mosqueData_')) {
            keys.push(key);
          }
        }
        
        // Trier par date d'expiration
        keys.sort((a, b) => {
          try {
            const aEntry = JSON.parse(localStorage.getItem(a));
            const bEntry = JSON.parse(localStorage.getItem(b));
            return (aEntry.expiration || 0) - (bEntry.expiration || 0);
          } catch (e) {
            return 0;
          }
        });
        
        // Supprimer les 50% les plus anciens
        const toRemove = Math.floor(keys.length / 2);
        for (let i = 0; i < toRemove; i++) {
          this.removeItem(keys[i]);
        }
      } catch (e) {
        console.error("Erreur lors du nettoyage des caches:", e);
      }
    }
  };
  
  // On attache également la fonction pour simplifier son accès.
  CacheService.getMidnightTimestamp = getMidnightTimestamp;
  
  export default CacheService;
  export { getMidnightTimestamp };
  