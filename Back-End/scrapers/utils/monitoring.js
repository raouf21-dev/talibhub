// monitoring.js - Système de monitoring pour les scrapers
// Surveillance des performances et de la santé des scrapers

class ScrapingMonitoring {
  constructor() {
    this.executions = new Map();
    this.globalStats = {
      totalExecutions: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalFallbacks: 0,
      fallbackStrategies: new Map(),
      averageExecutionTime: 0,
      lastResetTime: Date.now(),
    };
  }

  startExecution(mosqueId) {
    const execution = {
      id: `${mosqueId}_${Date.now()}`,
      mosqueId,
      startTime: Date.now(),
      endTime: null,
      success: false,
      error: null,
      retryCount: 0,
      fallbackUsed: null,
      executionTime: null,
    };

    this.executions.set(execution.id, execution);
    this.globalStats.totalExecutions++;

    return execution;
  }

  recordSuccess(execution, result) {
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;
    execution.success = true;

    // Détecter si un fallback a été utilisé
    if (result.fallbackUsed) {
      execution.fallbackUsed = result.fallbackUsed;
      this.globalStats.totalFallbacks++;

      // Comptabiliser la stratégie de fallback utilisée
      const strategyName = result.fallbackUsed.strategyName;
      const currentCount =
        this.globalStats.fallbackStrategies.get(strategyName) || 0;
      this.globalStats.fallbackStrategies.set(strategyName, currentCount + 1);

      console.log(
        `📈 Monitoring: Fallback "${strategyName}" utilisé avec succès`
      );
      console.log(
        `   🎯 Qualité des données: ${result.fallbackUsed.dataQuality}`
      );
      console.log(`   ⏱️  Durée extraction: ${result.fallbackUsed.duration}ms`);
    }

    this.globalStats.totalSuccesses++;
    this.updateAverageTime(execution.executionTime);
  }

  recordFailure(execution, error) {
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;
    execution.success = false;
    execution.error = error.message;

    this.globalStats.totalFailures++;
    this.updateAverageTime(execution.executionTime);
  }

  recordRetry(execution) {
    execution.retryCount++;
  }

  updateAverageTime(executionTime) {
    const totalTime =
      this.globalStats.averageExecutionTime *
      (this.globalStats.totalExecutions - 1);
    this.globalStats.averageExecutionTime =
      (totalTime + executionTime) / this.globalStats.totalExecutions;
  }

  getStats() {
    return {
      ...this.globalStats,
      successRate:
        this.globalStats.totalExecutions > 0
          ? (
              (this.globalStats.totalSuccesses /
                this.globalStats.totalExecutions) *
              100
            ).toFixed(2)
          : 0,
      fallbackRate:
        this.globalStats.totalSuccesses > 0
          ? (
              (this.globalStats.totalFallbacks /
                this.globalStats.totalSuccesses) *
              100
            ).toFixed(2)
          : 0,
      fallbackStrategiesArray: Array.from(
        this.globalStats.fallbackStrategies.entries()
      )
        .map(([strategy, count]) => ({ strategy, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  generateReport() {
    const stats = this.getStats();
    const uptimeHours = (Date.now() - stats.lastResetTime) / (1000 * 60 * 60);

    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT DE MONITORING DÉTAILLÉ");
    console.log("=".repeat(60));

    console.log(`📈 Statistiques globales:`);
    console.log(`   Total exécutions: ${stats.totalExecutions}`);
    console.log(
      `   ✅ Succès: ${stats.totalSuccesses} (${stats.successRate}%)`
    );
    console.log(`   ❌ Échecs: ${stats.totalFailures}`);
    console.log(
      `   ⏱️  Temps moyen: ${Math.round(stats.averageExecutionTime)}ms`
    );
    console.log(`   🕐 Uptime: ${uptimeHours.toFixed(1)}h`);

    if (stats.totalFallbacks > 0) {
      console.log(`\n🔄 Analyse des fallbacks:`);
      console.log(
        `   Total fallbacks: ${stats.totalFallbacks} (${stats.fallbackRate}% des succès)`
      );

      if (stats.fallbackStrategiesArray.length > 0) {
        console.log(`   📊 Stratégies utilisées:`);
        stats.fallbackStrategiesArray.forEach((item, index) => {
          const percentage = (
            (item.count / stats.totalFallbacks) *
            100
          ).toFixed(1);
          console.log(
            `      ${index + 1}. ${item.strategy}: ${
              item.count
            } fois (${percentage}%)`
          );
        });

        // Recommandations basées sur l'usage des fallbacks
        console.log(`\n💡 Recommandations:`);
        const topStrategy = stats.fallbackStrategiesArray[0];
        if (topStrategy && topStrategy.count > stats.totalFallbacks * 0.5) {
          console.log(
            `   ⚠️  "${topStrategy.strategy}" très utilisée - considérer l'amélioration des scrapers principaux`
          );
        }

        if (stats.fallbackRate > 20) {
          console.log(
            `   🔧 Taux de fallback élevé (${stats.fallbackRate}%) - révision des scrapers recommandée`
          );
        } else if (stats.fallbackRate > 0) {
          console.log(
            `   ✅ Taux de fallback acceptable (${stats.fallbackRate}%) - système robuste`
          );
        }
      }
    } else {
      console.log(
        `\n🎯 Aucun fallback utilisé - tous les scrapers principaux fonctionnent parfaitement`
      );
    }

    return stats;
  }

  // Nouvelle méthode pour afficher un résumé après runAllScrapers
  generateRunAllScrapersReport(results) {
    console.log("\n" + "=".repeat(70));
    console.log("📊 RÉSUMÉ POST-SCRAPING COMPLET");
    console.log("=".repeat(70));

    const fallbackResults = results.results.filter((r) => r.fallbackUsed);
    const principalResults = results.results.filter((r) => !r.fallbackUsed);

    console.log(
      `⚡ Méthodes principales: ${principalResults.length}/${results.results.length}`
    );
    console.log(
      `🔄 Fallbacks utilisés: ${fallbackResults.length}/${results.results.length}`
    );

    if (fallbackResults.length > 0) {
      console.log(`\n🔍 Détails des fallbacks utilisés:`);

      // Grouper par stratégie
      const strategyGroups = {};
      fallbackResults.forEach((result) => {
        const strategy = result.fallbackUsed.strategyName;
        if (!strategyGroups[strategy]) {
          strategyGroups[strategy] = [];
        }
        strategyGroups[strategy].push(result);
      });

      Object.entries(strategyGroups).forEach(([strategy, results]) => {
        console.log(`\n   📋 ${strategy} (${results.length} mosquée(s)):`);
        results.forEach((result) => {
          console.log(
            `      ID${result.mosqueId}: ${result.source.replace(
              " (Fallback)",
              ""
            )}`
          );
          console.log(
            `         Qualité: ${result.fallbackUsed.dataQuality} | Durée: ${result.fallbackUsed.duration}ms`
          );
        });
      });
    }

    return {
      totalMosques: results.results.length,
      principalMethods: principalResults.length,
      fallbackMethods: fallbackResults.length,
      fallbacksByStrategy: fallbackResults.reduce((acc, result) => {
        const strategy = result.fallbackUsed.strategyName;
        acc[strategy] = (acc[strategy] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  reset() {
    this.executions.clear();
    this.globalStats = {
      totalExecutions: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalFallbacks: 0,
      fallbackStrategies: new Map(),
      averageExecutionTime: 0,
      lastResetTime: Date.now(),
    };
  }
}

const monitoring = new ScrapingMonitoring();

module.exports = { monitoring };
