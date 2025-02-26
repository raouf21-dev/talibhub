// welcomepage.js

import { initializeTabToggle } from '../../utils/utils.js';
import { authService } from '../../services/auth/authService.js';
import { navigateTo } from '../../utils/utils.js'; 
import { notificationService } from '../../services/notifications/notificationService.js';

export async function initializeWelcomepage() {
  console.log("Initializing Welcome Page...");

  // Gestion du bouton Get Started
  const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");
  const authForms = document.getElementById("welcomepage-auth-forms");
  if (getStartedBtn && authForms) {
    getStartedBtn.addEventListener("click", () => {
      // Masquer le bouton et afficher les formulaires d'authentification
      getStartedBtn.style.display = "none";
      authForms.classList.remove("hidden");
      authForms.style.display = "block";
      console.log("Authentication forms displayed.");
      // Optionnel : vous pouvez forcer l'activation d'un onglet, par exemple "signin"
      // switchTab("signin");  // (si nécessaire, en vous assurant que switchTab est correctement importé/initialisé)
    });
  } else {
    console.warn("Welcome Page: Element(s) not found.");
  }

  // Initialisation du basculement des onglets pour le formulaire Sign In / Sign Up
  initializeTabToggle();

  // Ajout de l'écouteur pour le formulaire Sign In
  const signinForm = document.getElementById("welcomepage-signinForm");
  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Empêche le rechargement de la page

      // Récupération des valeurs saisies
      const email = document.getElementById("welcomepage-signin-email").value.trim();
      const password = document.getElementById("welcomepage-signin-password").value.trim();

      // Vérification que les champs ne sont pas vides
      if (!email || !password) {
        console.error("Veuillez remplir tous les champs.");
        return;
      }

      // Appel à votre service d'authentification
      try {
        // REMARQUE : Utilisation de "login" et non "signIn"
        const result = await authService.login(email, password);
        if (result.success) {
          // Sauvegarde du token et redirection vers le dashboard
          localStorage.setItem("token", result.token);
          await navigateTo("dashboard");
        } else {
          console.error("Authentification échouée:", result.message);
          notificationService.show('auth.signin.error', 'error');
        }
      } catch (error) {
        console.error("Erreur lors de l'authentification :", error);
      }
    });
  } else {
    console.warn("Formulaire Sign In non trouvé.");
  }

  // (Vous pouvez ajouter ici un écouteur similaire pour le formulaire Sign Up si nécessaire)
}
