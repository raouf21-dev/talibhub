// Back-End/bot-detection.js
// Ce fichier analyse les données reçues du front-end
const fs = require('fs').promises;
const path = require('path');

class BotDetection {
    constructor() {
        this.logPath = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logPath, 'suspicious_activity.log');
        this.initLogs();
    }

    async initLogs() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
        } catch (error) {
            console.error('Erreur lors de la création du dossier logs:', error);
        }
    }

    checkBotBehavior(metrics) {
        const issues = [];

        if (!metrics) return { isSuspicious: true, issues: ['Métriques manquantes'] };

        // Analyse des métriques reçues
        if (metrics.fillTime < 2000) {
            issues.push('Remplissage trop rapide');
        }

        if (metrics.mouseMovements < 2) {
            issues.push('Peu de mouvements de souris');
        }

        if (metrics.keyPresses < 3) {
            issues.push('Peu de frappes clavier');
        }

        return {
            isSuspicious: issues.length > 0,
            issues
        };
    }

    async logSuspiciousActivity(ip, reason, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip,
            reason,
            data
        };

        try {
            await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
            console.log(`Activité suspecte enregistrée pour IP: ${ip}`);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
        }
    }
}

module.exports = new BotDetection();