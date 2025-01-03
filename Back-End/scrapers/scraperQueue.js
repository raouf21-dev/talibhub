// scraperQueue.js
class ScraperQueue {
    constructor() {
        this.queue = new Map(); // Map des tâches en cours par mosquée
        this.cache = new Map();
        this.CACHE_TTL = 60000; // 1 minute
        this.processing = new Set(); // Set des mosquées en cours de traitement
    }

    async enqueue(mosqueId, task) {
        // Vérifier le cache d'abord
        const cached = this.cache.get(mosqueId);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log(`Using cached result for mosque ${mosqueId}`);
            return cached.data;
        }

        // Si déjà une tâche en cours pour cette mosquée, l'attendre
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

                // Mettre en cache le résultat
                if (result) {
                    this.cache.set(mosqueId, {
                        data: result,
                        timestamp: Date.now()
                    });
                }

                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                // Nettoyage
                this.queue.delete(mosqueId);
                this.processing.delete(mosqueId);
            }
        });

        // Stocker la promesse dans la queue
        this.queue.set(mosqueId, taskPromise);

        return taskPromise;
    }

    clearCache() {
        const now = Date.now();
        for (const [mosqueId, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.cache.delete(mosqueId);
            }
        }
    }

    getStatus() {
        return {
            activeScrapers: [...this.processing],
            queueSize: this.queue.size,
            cachedResults: [...this.cache.keys()],
            totalTasks: this.queue.size + this.processing.size
        };
    }

    isProcessing(mosqueId) {
        return this.processing.has(mosqueId);
    }

    async waitForAll() {
        if (this.queue.size === 0) return;

        const promises = Array.from(this.queue.values());
        await Promise.all(promises);
    }
}

module.exports = new ScraperQueue();