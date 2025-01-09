// scraperQueue.js
class ScraperQueue {
    constructor() {
        this.queue = new Map(); // Map des tâches en cours par mosquée
        this.cache = new Map(); // Cache des résultats récents
        this.CACHE_TTL = 60000; // 1 minute en millisecondes
        this.processing = new Set(); // Set des mosquées en cours de traitement
    }

    /**
     * Ajoute une tâche à la file d'attente
     * @param {number} mosqueId - ID de la mosquée
     * @param {Function} task - Fonction à exécuter
     * @returns {Promise} - Résultat de la tâche
     */
    async enqueue(mosqueId, task) {
        // Vérifier le cache d'abord
        const cached = this.cache.get(mosqueId);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log(`Using cached result for mosque ${mosqueId}`);
            return cached.data;
        }

        // Si une tâche est déjà en cours pour cette mosquée, retourner sa promesse
        if (this.queue.has(mosqueId)) {
            console.log(`Waiting for existing task for mosque ${mosqueId}`);
            return this.queue.get(mosqueId);
        }

        // Créer une nouvelle promesse pour cette tâche
        const taskPromise = new Promise(async (resolve, reject) => {
            try {
                // Marquer comme en cours de traitement
                this.processing.add(mosqueId);

                // Exécuter la tâche
                const result = await task();

                // Mettre en cache le résultat valide
                if (result) {
                    this.cache.set(mosqueId, {
                        data: result,
                        timestamp: Date.now()
                    });
                }

                resolve(result);
            } catch (error) {
                console.error(`Error in queue for mosque ${mosqueId}:`, error);
                reject(error);
            } finally {
                // Nettoyage
                this.queue.delete(mosqueId);
                this.processing.delete(mosqueId);
                this.cleanCache(); // Nettoyer le cache après chaque tâche
            }
        });

        // Stocker la promesse dans la queue
        this.queue.set(mosqueId, taskPromise);

        return taskPromise;
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    cleanCache() {
        const now = Date.now();
        for (const [mosqueId, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.cache.delete(mosqueId);
            }
        }
    }

    /**
     * Retourne le statut actuel de la queue
     */
    getStatus() {
        return {
            activeScrapers: [...this.processing],
            queueSize: this.queue.size,
            cachedResults: [...this.cache.keys()],
            totalTasks: this.queue.size + this.processing.size
        };
    }

    /**
     * Vérifie si une mosquée est en cours de traitement
     */
    isProcessing(mosqueId) {
        return this.processing.has(mosqueId) || this.queue.has(mosqueId);
    }

    /**
     * Attend que toutes les tâches en cours soient terminées
     */
    async waitForAll() {
        if (this.queue.size === 0) return;
        
        const promises = Array.from(this.queue.values());
        await Promise.all(promises);
    }

    /**
     * Vide le cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Retourne une tâche en cours si elle existe
     */
    getActiveTask(mosqueId) {
        return this.queue.get(mosqueId);
    }
}

// Exporter une instance unique de la queue
module.exports = new ScraperQueue();