/**
 * Utilitaire pour charger et gérer Feather Icons de manière fiable
 */

// Créer un objet feather temporaire global s'il n'existe pas déjà
if (typeof window.feather === "undefined") {
  window.feather = {
    replace: function () {
      console.log(
        "Feather temporaire utilisé - le vrai script n'est pas encore chargé"
      );
    },
  };
}

/**
 * Charge Feather Icons de manière asynchrone et sécurisée
 * @returns {Promise} Une promesse résolue quand Feather est chargé
 */
export function loadFeather() {
  return new Promise((resolve) => {
    // Si Feather est déjà complètement chargé, résoudre immédiatement
    if (
      window.feather &&
      typeof window.feather.replace === "function" &&
      window.feather !== window.featherTemp
    ) {
      resolve(window.feather);
      return;
    }

    // Vérifier si le script est déjà en cours de chargement
    const existingScript = document.querySelector(
      'script[src*="feather-icons"]'
    );

    if (existingScript) {
      // Le script est présent mais pas encore chargé, attendre son chargement
      existingScript.addEventListener("load", () => {
        console.log("Script Feather existant chargé");
        resolve(window.feather);
      });

      // En cas d'erreur ou de timeout, résoudre quand même après un délai
      setTimeout(() => resolve(window.feather), 2000);
    } else {
      // Le script n'est pas présent, l'ajouter dynamiquement
      console.log("Chargement dynamique de Feather Icons");
      const script = document.createElement("script");
      script.src = "https://unpkg.com/feather-icons";
      script.async = true;

      script.onload = () => {
        console.log("Feather Icons chargé avec succès");
        resolve(window.feather);
      };

      script.onerror = () => {
        console.error("Impossible de charger Feather Icons");
        resolve(window.feather); // Résoudre avec le feather temporaire
      };

      document.head.appendChild(script);
    }
  });
}

/**
 * Remplace les icônes Feather de manière sécurisée
 * @returns {Promise<boolean>} Succès ou échec du remplacement
 */
export async function safeReplace() {
  try {
    const feather = await loadFeather();
    if (feather && typeof feather.replace === "function") {
      feather.replace();
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Erreur lors du remplacement des icônes:", error);
    return false;
  }
}

// Exécuter automatiquement au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  safeReplace();
});

// Exécuter à nouveau après le chargement complet
window.addEventListener("load", () => {
  safeReplace();
});

// Patch global pour éviter les erreurs
(function patchFeatherGlobally() {
  // Vérifier si le script est déjà chargé
  const existingScript = document.querySelector('script[src*="feather-icons"]');
  if (!existingScript) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/feather-icons@4.29.2/dist/feather.min.js";
    document.head.appendChild(script);
  }

  // Sauvegarder l'original pour référence
  window.featherTemp = window.feather;

  // Créer un proxy pour intercepter les appels à feather
  const featherProxy = new Proxy(window.feather || {}, {
    get: function (target, prop) {
      // Si la propriété existe, la retourner
      if (prop in target && typeof target[prop] === "function") {
        return function () {
          try {
            return target[prop].apply(target, arguments);
          } catch (e) {
            console.warn(`Erreur lors de l'appel à feather.${prop}:`, e);
            return null;
          }
        };
      } else if (prop in target) {
        return target[prop];
      }

      // Sinon, retourner une fonction vide
      return function () {
        console.log(
          `Appel à feather.${prop} ignoré - feather n'est pas complètement chargé`
        );
      };
    },
  });

  // Remplacer l'objet global
  window.feather = featherProxy;
})();

// Exporter l'objet feather pour utilisation dans d'autres modules
export default window.feather;

/**
 * Solution d'urgence pour le problème de Feather Icons
 */

// Exécuter immédiatement avant tout autre code
(function () {
  // Définir feather globalement avant tout
  window.feather = window.feather || {
    replace: function () {
      console.log("Feather temporaire utilisé");
      return {
        icons: {},
      };
    },
    icons: {},
  };

  // Intercepter toutes les redirections vers /login
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Fonction pour vérifier si une URL pointe vers /login
  function isLoginUrl(url) {
    if (typeof url !== "string") return false;
    return url.includes("/login");
  }

  // Remplacer pushState
  history.pushState = function () {
    if (arguments.length > 2 && isLoginUrl(arguments[2])) {
      console.warn(
        "Redirection vers /login bloquée, redirection vers /welcomepage à la place"
      );
      arguments[2] = "/welcomepage";
    }
    return originalPushState.apply(this, arguments);
  };

  // Remplacer replaceState
  history.replaceState = function () {
    if (arguments.length > 2 && isLoginUrl(arguments[2])) {
      console.warn(
        "Redirection vers /login bloquée, redirection vers /welcomepage à la place"
      );
      arguments[2] = "/welcomepage";
    }
    return originalReplaceState.apply(this, arguments);
  };

  // Intercepter les redirections via window.location
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "location"
  );
  if (originalLocationDescriptor && originalLocationDescriptor.configurable) {
    Object.defineProperty(window, "location", {
      get: function () {
        return originalLocationDescriptor.get.call(this);
      },
      set: function (value) {
        if (isLoginUrl(value)) {
          console.warn(
            "Redirection vers /login bloquée, redirection vers /welcomepage à la place"
          );
          originalLocationDescriptor.set.call(this, "/welcomepage");
        } else {
          originalLocationDescriptor.set.call(this, value);
        }
      },
      configurable: true,
    });
  }

  // Ajouter un script inline au début du document pour définir feather globalement
  const script = document.createElement("script");
  script.textContent = `
    // Définir feather globalement avant tout autre script
    window.feather = window.feather || {
      replace: function() {
        console.log("Feather temporaire utilisé (script inline)");
        return {
          icons: {}
        };
      },
      icons: {}
    };
  `;

  // Insérer au début du document
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  // Charger Feather de manière asynchrone
  const featherScript = document.createElement("script");
  featherScript.src = "https://unpkg.com/feather-icons";
  featherScript.async = true;
  document.head.appendChild(featherScript);
})();
