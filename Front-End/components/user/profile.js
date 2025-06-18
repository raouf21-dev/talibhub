// profile.js
import { navigateTo } from "../../utils/utils.js";
import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";

function initializeProfile() {
  loadProfile();

  const profileForm = document.querySelector("#profileForm form");
  if (profileForm) {
    profileForm.addEventListener("submit", updateProfile);
  }

  const passwordChangeForm = document.querySelector("#passwordChangeForm form");
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener("submit", handleChangePassword);
  }

  const showNewPasswordToggle = document.getElementById(
    "showNewPasswordToggle"
  );
  if (showNewPasswordToggle) {
    showNewPasswordToggle.addEventListener(
      "change",
      toggleNewPasswordVisibility
    );
  }
}

async function loadProfile() {
  try {
    if (!window.authService || !window.authService.isAuthenticated()) {
      console.log(
        "❌ Utilisateur non authentifié - redirection vers welcomepage"
      );
      notificationService.show("profile.auth.required", "error", 0);
      navigateTo("welcomepage");
      return;
    }

    console.log("✅ Utilisateur authentifié, chargement du profil...");
    const user = await api.get("/auth/profile");
    console.log("📋 Données profil reçues:", user);

    const setField = (id, value, isOptional = false) => {
      const element = document.getElementById(id);
      if (element) {
        if (value) {
          element.value = value;
          if (
            element.placeholder === "À compléter" ||
            element.placeholder === "To complete"
          ) {
            element.placeholder = "";
          }
        } else if (isOptional) {
          element.value = "";
          // Garder le placeholder "À compléter" pour les champs optionnels vides
        } else {
          element.value = "";
        }
      }
    };

    setField("usernameprofil", user.username, true);
    setField("last-nameprofil", user.lastName, false); // Obligatoire
    setField("first-nameprofil", user.firstName, false); // Obligatoire
    setField("ageprofil", user.age, true);
    setField("genderprofil", user.gender, true);
    setField("emailprofil", user.email, false); // Obligatoire
    setField("countryprofil", user.country, true);

    if (user.isOAuthUser) {
      // Champs en lecture seule pour OAuth (gérés par Google)
      const emailField = document.getElementById("emailprofil");
      const firstNameField = document.getElementById("first-nameprofil");
      const lastNameField = document.getElementById("last-nameprofil");

      if (emailField) {
        emailField.disabled = true;
        emailField.title = window.t(
          "profile.emailManagedByProvider",
          "Email géré par votre fournisseur OAuth"
        );
      }

      if (firstNameField) {
        firstNameField.disabled = true;
        firstNameField.title = window.t(
          "profile.firstNameSyncedWithProvider",
          "Prénom synchronisé avec votre fournisseur OAuth"
        );
      }

      if (lastNameField) {
        lastNameField.disabled = true;
        lastNameField.title = window.t(
          "profile.lastNameSyncedWithProvider",
          "Nom synchronisé avec votre fournisseur OAuth"
        );
      }

      // Masquer la section de changement de mot de passe pour les utilisateurs OAuth
      const passwordChangeForm = document.getElementById("passwordChangeForm");
      if (passwordChangeForm) {
        passwordChangeForm.style.display = "none";
      }

      // Ajouter une note explicative
      const profileForm = document.getElementById("profileForm");
      if (profileForm) {
        const oauthNote = document.createElement("div");
        oauthNote.className = "oauth-user-note";
        oauthNote.style.cssText =
          "background: #e3f2fd; padding: 10px; border-radius: 5px; margin-top: 10px; color: #1976d2;";
        const oauthTitle = window.t(
          "profile.oauthAccountTitle",
          "Compte OAuth"
        );
        const oauthMessage = window.t(
          "profile.oauthAccountMessage",
          "Connecté via Google. Email, nom et prénom sont synchronisés avec Google. Vous pouvez modifier : nom d'utilisateur, âge, genre et pays."
        );
        oauthNote.innerHTML = `<strong>${oauthTitle}:</strong> ${oauthMessage}`;
        profileForm.appendChild(oauthNote);
      }
    }

    console.log("✅ Profil chargé avec succès");
    notificationService.show("profile.load.success", "success");
  } catch (error) {
    console.error("❌ Erreur lors du chargement du profil:", error);

    if (error.response?.status === 401) {
      console.log("🔐 Erreur 401 - redirection vers welcomepage");
      notificationService.show("profile.auth.required", "error", 0);
      navigateTo("welcomepage");
      return;
    }

    notificationService.show("profile.load.error", "error", 0);
  }
}

async function updateProfile(event) {
  event.preventDefault();

  try {
    if (!window.authService || !window.authService.isAuthenticated()) {
      notificationService.show("profile.auth.required", "error", 0);
      navigateTo("welcomepage");
      return;
    }

    // Récupérer seulement les champs qui ont une valeur (pour mise à jour partielle)
    const profileData = {};

    const username = document.getElementById("usernameprofil").value.trim();
    const lastName = document.getElementById("last-nameprofil").value.trim();
    const firstName = document.getElementById("first-nameprofil").value.trim();
    const age = document.getElementById("ageprofil").value.trim();
    const gender = document.getElementById("genderprofil").value;
    const email = document.getElementById("emailprofil").value.trim();
    const country = document.getElementById("countryprofil").value.trim();

    // Ajouter seulement les champs non-vides
    if (username) profileData.username = username;
    if (lastName) profileData.lastName = lastName;
    if (firstName) profileData.firstName = firstName;
    if (age) profileData.age = parseInt(age) || null;
    if (gender) profileData.gender = gender;
    if (email) profileData.email = email;
    if (country) profileData.country = country;

    console.log("📤 Mise à jour du profil:", profileData);
    await api.post("/auth/updateProfile", profileData);

    console.log("✅ Profil mis à jour avec succès");
    notificationService.show("profile.update.success", "success");
  } catch (error) {
    console.error("❌ Erreur mise à jour profil:", error);

    if (error.response?.status === 401) {
      notificationService.show("profile.auth.required", "error", 0);
      navigateTo("welcomepage");
      return;
    }

    notificationService.show("profile.update.error", "error", 0);
  }
}

async function handleChangePassword(event) {
  event.preventDefault();

  if (!window.authService || !window.authService.isAuthenticated()) {
    notificationService.show("profile.auth.required", "error", 0);
    navigateTo("welcomepage");
    return;
  }

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmNewPassword = document.getElementById(
    "confirm-new-password"
  ).value;

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    notificationService.show("profile.password.weak", "warning");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    notificationService.show("profile.password.mismatch", "warning");
    return;
  }

  try {
    await api.post("/auth/changePassword", {
      currentPassword,
      newPassword,
    });

    console.log("✅ Mot de passe changé avec succès");
    notificationService.show("profile.password.success", "success");
    document.getElementById("passwordChangeForm").reset();
  } catch (error) {
    console.error("❌ Erreur changement mot de passe:", error);

    if (error.response?.status === 401) {
      notificationService.show("profile.auth.required", "error", 0);
      navigateTo("welcomepage");
      return;
    }

    if (error.response?.message?.includes("incorrect")) {
      notificationService.show("profile.password.incorrect", "error", 0);
    } else {
      notificationService.show("profile.password.error", "error", 0);
    }
  }
}

function toggleNewPasswordVisibility() {
  const newPasswordField = document.getElementById("new-password");
  const confirmNewPasswordField = document.getElementById(
    "confirm-new-password"
  );
  if (newPasswordField && confirmNewPasswordField) {
    const newType = newPasswordField.type === "password" ? "text" : "password";
    newPasswordField.type = newType;
    confirmNewPasswordField.type = newType;
  }
}

export { initializeProfile };
