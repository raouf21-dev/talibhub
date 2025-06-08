// transLanguages.js - Compatibilité avec le nouveau système de traduction

console.log("[transLanguages] Fichier de compatibilité chargé");

// Au chargement du DOM, on gère la langue.
document.addEventListener("DOMContentLoaded", () => {
  // Vérifier si le nouveau système de traduction est disponible
  if (typeof window.translationManager !== "undefined") {
    console.log(
      "[transLanguages] Nouveau système de traduction détecté - mode moderne activé"
    );
    // Le nouveau système gère déjà tout, juste déclencher l'événement pour compatibilité
    const currentLang = window.translationManager.currentLang;
    const event = new CustomEvent("languageChanged", {
      detail: { language: currentLang },
    });
    document.dispatchEvent(event);
    return; // Sortir car le nouveau système gère tout
  }

  console.log(
    "[transLanguages] Mode compatibilité - ancien système avec redirections"
  );
  // 1. Gérer les clics sur les boutons de langue.
  // Avec le nouveau système, utiliser la traduction dynamique sans redirection.
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedLang = button.getAttribute("data-lang");

      // SOLUTION ROBUSTE: Sauvegarder l'état dans les cookies
      const currentToken = localStorage.getItem("token");
      const currentPage = window.location.hash || "#welcomepage";

      if (currentToken) {
        // Sauvegarder dans un cookie temporaire (expire dans 5 minutes)
        const backupData = JSON.stringify({
          token: currentToken,
          page: currentPage,
          timestamp: Date.now(),
        });

        // Créer un cookie qui expire dans 5 minutes
        const expiryDate = new Date(Date.now() + 5 * 60 * 1000);
        document.cookie = `temp_session_backup=${encodeURIComponent(
          backupData
        )}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

        console.log(
          "[LANG-CHANGE] Session sauvegardée dans cookie avant redirection"
        );
      }

      // Enregistrer la préférence de langue
      localStorage.setItem("userLang", selectedLang);

      // Utiliser le nouveau système de traduction dynamique
      if (typeof window.translationManager !== "undefined") {
        window.translationManager.changeLanguage(selectedLang);
        console.log(
          `[LANG-CHANGE] Langue changée vers ${selectedLang} sans redirection`
        );
      } else {
        // Fallback vers l'ancien système (ne devrait plus arriver)
        console.warn(
          "[LANG-CHANGE] Système de traduction non disponible, redirection vers fichier"
        );
      window.location.href = `index-${selectedLang}.html`;
      }
    });
  });

  // 2. SOLUTION ROBUSTE: Restaurer l'état depuis les cookies
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return decodeURIComponent(parts.pop().split(";").shift());
    return null;
  }

  const authBackupCookie = getCookie("temp_session_backup");
  if (authBackupCookie) {
    try {
      const backup = JSON.parse(authBackupCookie);

      // Vérifier que le backup n'est pas trop ancien (max 5 minutes)
      if (Date.now() - backup.timestamp < 300000) {
        console.log("[LANG-CHANGE] Restauration de la session depuis cookie");

        // Restaurer le token
        localStorage.setItem("token", backup.token);

        // Déclencher l'événement login pour notifier l'app
        window.dispatchEvent(new Event("login"));

        // Restaurer la page (avec un délai pour laisser l'app se charger)
        setTimeout(() => {
          if (backup.page && backup.page !== "#welcomepage") {
            window.location.hash = backup.page;
            // Déclencher la navigation
            if (typeof navigateTo === "function") {
              navigateTo(backup.page.replace("#", ""));
            }
          }
        }, 2000); // Délai plus long pour être sûr

        console.log("[LANG-CHANGE] Session restaurée avec succès");
      } else {
        console.log("[LANG-CHANGE] Backup expiré, ignoré");
      }
    } catch (e) {
      console.error("[LANG-CHANGE] Erreur lors de la restauration:", e);
    }

    // Nettoyer le cookie de backup
    document.cookie =
      "temp_session_backup=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  }

  // 3. Vérifier la langue du navigateur uniquement si c'est la première visite.
  if (!localStorage.getItem("userLang")) {
    const browserLang = navigator.language || navigator.userLanguage;
    const defaultLang = browserLang.startsWith("fr") ? "fr" : "en";
    localStorage.setItem("userLang", defaultLang);

    // Avec le nouveau système, pas besoin de redirection - la langue sera appliquée automatiquement
    console.log(`[LANG-INIT] Langue par défaut définie: ${defaultLang}`);
  }

  // 3. Déclencher un événement personnalisé indiquant le changement de langue,
  //    au cas où d'autres modules souhaiteraient adapter leur interface.
  const currentLang = localStorage.getItem("userLang");
  const event = new CustomEvent("languageChanged", {
    detail: { language: currentLang },
  });
  document.dispatchEvent(event);
});

// Exemple de mise à jour d'éléments spécifiques lors du changement de langue
document.addEventListener("languageChanged", async (event) => {
  // Si vous utilisez ChartManager ou d'autres modules dépendants de la langue, mettez-les à jour ici.
  if (typeof ChartManager !== "undefined") {
    ChartManager.updateAllChartLabels();
    ChartManager.updatePeriodTitles();
  }

  // Si d'autres modules (ex. MosqueTimeManager) doivent être réinitialisés, faites-le ici.
  if (typeof MosqueTimeManager !== "undefined") {
    const mosqueTimeManager = new MosqueTimeManager({
      isWelcomePage: false,
    });
    await mosqueTimeManager.initialize();
  }
});
