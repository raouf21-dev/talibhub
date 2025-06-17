const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { cookieManager } = require("../middlewares/cookieManager");
const { authenticateToken } = require("../middlewares/authenticateToken");
const userModel = require("../models/userModel");

const router = express.Router();

// Helper function pour créer et envoyer le token JWT
const createAndSendToken = (user, res) => {
  console.log("🔐 createAndSendToken appelé pour utilisateur:", user.id);

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

  console.log("✅ Token JWT créé:", token.substring(0, 20) + "...");

  // Définir les cookies avec le token
  console.log("🍪 Définition des cookies avec cookieManager...");
  cookieManager.setAuthCookies(res, token);
  console.log("✅ Cookies définis via cookieManager");

  return token;
};

// Helper function pour rediriger après authentification
const redirectAfterAuth = (res, success, user = null, error = null) => {
  const frontendURL =
    process.env.NODE_ENV === "production"
      ? "https://talibhub.com"
      : "http://localhost:4000";

  console.log("🔄 redirectAfterAuth appelé:", {
    success,
    user: user ? { id: user.id, email: user.email } : null,
    error,
    frontendURL,
    environment: process.env.NODE_ENV,
  });

  if (success && user) {
    console.log("✅ Redirection OAuth pour utilisateur:", {
      id: user.id,
      email: user.email,
      has_profile: !!(
        user.age &&
        user.gender &&
        user.first_name &&
        user.last_name
      ),
      country: user.country || "non renseigné (optionnel)",
    });

    // Vérifier si l'utilisateur a rempli son profil OAuth
    // Pour OAuth, on considère le profil comme valide s'il y a first_name ET last_name
    // Les champs age, gender, country et username sont optionnels pour OAuth
    const needsProfileCompletion = !user.first_name || !user.last_name;

    if (needsProfileCompletion) {
      console.log(
        "📝 Profil OAuth incomplet (manque nom/prénom), redirection vers complétion"
      );
      const redirectUrl = `${frontendURL}/?auth=success&action=complete_profile&user_id=${
        user.id
      }&timestamp=${Date.now()}`;
      console.log("🔗 URL de redirection (profil):", redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      console.log(
        "✅ Profil OAuth valide (nom/prénom présents), redirection vers dashboard"
      );
      console.log("👤 Profil utilisateur:", {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        age: user.age,
        gender: user.gender,
        country: user.country,
        provider: user.provider,
      });
      const redirectUrl = `${frontendURL}/?auth=success&redirect=dashboard&timestamp=${Date.now()}`;
      console.log("🔗 URL de redirection (dashboard):", redirectUrl);
      return res.redirect(redirectUrl);
    }
  } else {
    console.error("❌ Échec de l'authentification OAuth:", error);
    // Rediriger vers la page d'accueil avec un message d'erreur
    const errorMessage = error || "authentication_failed";
    const redirectUrl = `${frontendURL}/?auth=error&message=${errorMessage}&timestamp=${Date.now()}`;
    console.log("🔗 URL de redirection (erreur):", redirectUrl);
    return res.redirect(redirectUrl);
  }
};

// Routes Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    try {
      if (req.user) {
        const token = createAndSendToken(req.user, res);
        console.log("Google OAuth réussi pour utilisateur:", req.user.id);
        redirectAfterAuth(res, true, req.user);
      } else {
        console.error("Aucun utilisateur dans req.user après Google OAuth");
        redirectAfterAuth(res, false, null, "no_user_data");
      }
    } catch (error) {
      console.error("Erreur dans callback Google:", error);
      redirectAfterAuth(res, false, null, "callback_error");
    }
  }
);

// Routes Microsoft OAuth
router.get(
  "/microsoft",
  passport.authenticate("microsoft", { scope: ["user.read"] })
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", { session: false, failureRedirect: "/" }),
  (req, res) => {
    try {
      if (req.user) {
        const token = createAndSendToken(req.user, res);
        console.log("Microsoft OAuth réussi pour utilisateur:", req.user.id);
        redirectAfterAuth(res, true, req.user);
      } else {
        console.error("Aucun utilisateur dans req.user après Microsoft OAuth");
        redirectAfterAuth(res, false, null, "no_user_data");
      }
    } catch (error) {
      console.error("Erreur dans callback Microsoft:", error);
      redirectAfterAuth(res, false, null, "callback_error");
    }
  }
);

// Routes GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/" }),
  (req, res) => {
    try {
      if (req.user) {
        const token = createAndSendToken(req.user, res);
        console.log("GitHub OAuth réussi pour utilisateur:", req.user.id);
        redirectAfterAuth(res, true, req.user);
      } else {
        console.error("Aucun utilisateur dans req.user après GitHub OAuth");
        redirectAfterAuth(res, false, null, "no_user_data");
      }
    } catch (error) {
      console.error("Erreur dans callback GitHub:", error);
      redirectAfterAuth(res, false, null, "callback_error");
    }
  }
);

// Routes Facebook OAuth
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "/" }),
  (req, res) => {
    try {
      if (req.user) {
        const token = createAndSendToken(req.user, res);
        console.log("Facebook OAuth réussi pour utilisateur:", req.user.id);
        redirectAfterAuth(res, true, req.user);
      } else {
        console.error("Aucun utilisateur dans req.user après Facebook OAuth");
        redirectAfterAuth(res, false, null, "no_user_data");
      }
    } catch (error) {
      console.error("Erreur dans callback Facebook:", error);
      redirectAfterAuth(res, false, null, "callback_error");
    }
  }
);

// Route pour compléter le profil après OAuth
router.post("/complete-profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, age, gender, country, username } = req.body;
    const userId = req.user.id;

    console.log("📋 Données reçues pour complétion profil:", {
      firstName,
      lastName,
      age,
      gender,
      country,
      username,
      countryType: typeof country,
      countryValue: country,
    });

    // Validation des données obligatoires
    if (!firstName || !lastName || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: "Les champs nom, prénom, âge et genre sont obligatoires",
      });
    }

    // Vérifier si le username est disponible
    if (username) {
      const existingUser = await userModel.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Ce nom d'utilisateur est déjà pris",
        });
      }
    }

    // Traiter le pays : null si vide ou null, sinon la valeur
    const processedCountry =
      country && country.trim() !== "" ? country.trim() : null;

    console.log("🌍 Pays traité:", {
      original: country,
      processed: processedCountry,
      willBeNull: processedCountry === null,
    });

    // Mettre à jour le profil
    const updatedUser = await userModel.updateOAuthUserProfile(userId, {
      firstName,
      lastName,
      age: parseInt(age),
      gender,
      country: processedCountry, // null ou valeur
      username: username || `user_${userId}_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      message: "Profil complété avec succès",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la complétion du profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la complétion du profil",
    });
  }
});

// Route pour obtenir le statut du profil utilisateur
router.get("/profile-status", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Le pays n'est pas obligatoire pour la complétion du profil
    const needsProfileCompletion =
      !user.age || !user.gender || !user.first_name || !user.last_name;

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isOAuthUser: user.is_oauth_user,
        needsProfileCompletion,
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          age: user.age,
          gender: user.gender,
          country: user.country,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut du profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

module.exports = router;
