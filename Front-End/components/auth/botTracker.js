// Front-End/bot-tracker.js
// Ce fichier collecte les données côté client
export class BotTracker {
  constructor() {
    this.startTime = Date.now();
    this.mouseMovements = 0;
    this.keyPresses = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("mousemove", () => this.mouseMovements++);
    document.addEventListener("keypress", () => this.keyPresses++);
  }

  getMetrics() {
    return {
      fillTime: Date.now() - this.startTime,
      mouseMovements: this.mouseMovements,
      keyPresses: this.keyPresses,
    };
  }

  reset() {
    this.startTime = Date.now();
    this.mouseMovements = 0;
    this.keyPresses = 0;
  }
}
