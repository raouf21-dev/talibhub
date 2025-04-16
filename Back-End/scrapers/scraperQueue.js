// scraperQueue.js
const TIMEOUT_DURATION = 90000; // 1.5 minutes
const RECENT_EXECUTION_TTL = 60000; // 1 minute

class ScraperQueue {
  constructor() {
    this.processing = new Map(); // Tâches en cours {id -> Promise}
    this.results = new Map(); // Résultats récents {id -> {result, timestamp}}
  }

  // Vérifier si une tâche est en cours pour un ID
  isProcessing(id) {
    return this.processing.has(id);
  }

  // Récupérer une tâche en cours
  getActiveTask(id) {
    return this.processing.get(id);
  }

  // Récupérer un résultat récent (moins de 30 secondes)
  hasRecentExecution(id) {
    const entry = this.results.get(id);
    if (!entry) return false;

    const ageMs = Date.now() - entry.timestamp;
    return ageMs < 30000; // 30 secondes
  }

  // Ajouter une tâche à la queue
  async enqueue(id, taskFn) {
    // Nettoyer les résultats périmés
    this.cleanup();

    // Si déjà en cours, retourner la promesse existante
    if (this.isProcessing(id)) {
      return this.getActiveTask(id);
    }

    // Si un résultat récent existe, le retourner directement
    if (this.hasRecentExecution(id)) {
      return this.results.get(id).result;
    }

    // Créer une nouvelle promesse avec timeout
    const taskPromise = Promise.race([
      taskFn(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout pour la tâche ${id}`)),
          TIMEOUT_DURATION
        )
      ),
    ]);

    // Enregistrer la promesse
    this.processing.set(id, taskPromise);

    try {
      // Exécuter la tâche et stocker le résultat
      const result = await taskPromise;
      this.results.set(id, {
        result,
        timestamp: Date.now(),
      });
      return result;
    } catch (error) {
      console.error(`Erreur pour la tâche ${id}:`, error.message);
      throw error;
    } finally {
      this.processing.delete(id);
    }
  }

  // Attendre que toutes les tâches soient terminées
  async waitForAll() {
    if (this.processing.size === 0) return;

    // Attendre toutes les tâches actives
    await Promise.allSettled(Array.from(this.processing.values()));
  }

  // Statut actuel de la queue
  getStatus() {
    return {
      active: this.processing.size,
      recentResults: this.results.size,
    };
  }

  // Ajouter une méthode pour nettoyer les résultats périmés
  cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.results.entries()) {
      if (now - entry.timestamp > RECENT_EXECUTION_TTL) {
        this.results.delete(id);
      }
    }
  }
}

module.exports = new ScraperQueue();
