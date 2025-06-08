import { MosqueTimeManager } from "../mosqueTime/mosqueTime.js";

/**
 * Classe spécialisée pour l'affichage des horaires de mosquée sur la page d'accueil
 * Hérite de MosqueTimeManager et ajoute uniquement les spécificités de la welcome page
 */
export class WelcomeMosqueTime extends MosqueTimeManager {
  constructor() {
    // Configuration spécifique à la welcome page
    const options = {
      isWelcomePage: true,
      container: document.getElementById("welcomepage-mosque-time"),
    };

    super(options);
    console.log("WelcomeMosqueTime: Specialized constructor completed");
  }

  // Spécialisation pour la welcome page si nécessaire
  // (peut être étendue avec des fonctionnalités spécifiques plus tard)
}
