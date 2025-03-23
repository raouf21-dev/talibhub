// controllers/authController.js
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/nodemailer");
const { cookieManager } = require("../middlewares/cookieManager");
const crypto = require("crypto");

exports.register = async (req, res) => {
  const {
    username,
    password,
    email,
    firstName,
    lastName,
    age,
    gender,
    country,
  } = req.body;

  if (
    !username ||
    !password ||
    !email ||
    !firstName ||
    !lastName ||
    !age ||
    !gender ||
    !country
  ) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const userByUsername = await userModel.getUserByUsername(username);
    if (userByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const userByEmail = await userModel.getUserByEmail(email);
    if (userByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await userModel.createUser(
      username,
      password,
      email,
      firstName,
      lastName,
      age,
      gender,
      country
    );
    // On utilise la durée définie dans la variable d'environnement ou 24h par défaut
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    // Définir les cookies avec le token
    cookieManager.setAuthCookies(res, token);

    res.status(201).json({ token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Définir les cookies avec le token
    cookieManager.setAuthCookies(res, token);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Effacer les cookies d'authentification
    cookieManager.clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const oldToken = cookieManager.getAuthToken(req);

    if (!oldToken) {
      return res.status(401).json({ message: "Aucun token à rafraîchir" });
    }

    // Vérifier le token actuel
    jwt.verify(oldToken, process.env.JWT_SECRET);
    // Si le token est encore valide, on le décode et on en signe un nouveau
    const decoded = jwt.decode(oldToken);
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    cookieManager.setAuthCookies(res, newToken);

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token:", error);
    // En cas d'erreur (par exemple token expiré), on efface les cookies pour forcer la reconnexion
    cookieManager.clearAuthCookies(res);
    res.status(401).json({
      success: false,
      message: "Token invalide ou expiré. Veuillez vous reconnecter.",
    });
  }
};

exports.verify = async (req, res) => {
  try {
    const token = cookieManager.getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Aucun token trouvé",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      age: user.age,
      gender: user.gender,
    };
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await userModel.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updateUserPassword(req.user.id, hashedPassword);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   Fonctions pour la réinitialisation du mot de passe
   ============================ */

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.getUserByEmail(email);
    // Pour des raisons de sécurité, renvoyer toujours le même message
    if (!user) {
      return res.status(200).json({
        message:
          "Si l'adresse existe, un email de réinitialisation vous a été envoyé.",
      });
    }

    crypto.randomBytes(20, async (err, buffer) => {
      if (err) {
        console.error("Erreur lors de la génération du token:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }
      const token = buffer.toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 heure

      await userModel.setResetToken(user.id, token, expires);

      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/auth/reset-password/${token}`;

      const mailOptions = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: "Réinitialisation de votre mot de passe",
        text: `Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe de votre compte.\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n\n${resetURL}\n\nCe lien expirera dans 1 heure.\n\nSi vous n'avez pas demandé cela, merci d'ignorer cet email.`,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error("Erreur lors de l'envoi de l'email:", err);
          return res
            .status(500)
            .json({ error: "Erreur lors de l'envoi de l'email" });
        }
        res.status(200).json({
          message:
            "Si l'adresse existe, un email de réinitialisation vous a été envoyé.",
        });
      });
    });
  } catch (error) {
    console.error("Erreur dans forgotPassword:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getResetPassword = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await userModel.getUserByResetToken(token);
    if (!user) {
      return res.status(400).send("Le token est invalide ou a expiré.");
    }
    // Redirige vers le formulaire HTML de réinitialisation en passant le token dans l'URL
    res.redirect(`/reset-password.html?token=${token}`);
  } catch (error) {
    console.error("Erreur dans getResetPassword:", error);
    res.status(500).send("Erreur serveur");
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirm } = req.body;
  try {
    if (password !== confirm) {
      return res
        .status(400)
        .json({ error: "Les mots de passe ne correspondent pas." });
    }
    const user = await userModel.getUserByResetToken(token);
    if (!user) {
      return res
        .status(400)
        .json({ error: "Le token est invalide ou a expiré." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.updateUserPassword(user.id, hashedPassword);
    await userModel.clearResetToken(user.id);

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Votre mot de passe a été modifié",
      text: `Bonjour,\n\nCeci est une confirmation que le mot de passe de votre compte ${user.email} a été modifié.\n`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err)
        console.error(
          "Erreur lors de l'envoi de l'email de confirmation:",
          err
        );
    });
    res
      .status(200)
      .json({ message: "Votre mot de passe a été mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur dans resetPassword:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Ajouter cette fonction pour gérer les cookies d'horaires de mosquée
exports.storeMosqueTimesInCookie = async (req, res) => {
  try {
    const { city, data } = req.body;

    if (!city || !data) {
      return res.status(400).json({
        success: false,
        message: "La ville et les données sont requises",
      });
    }

    // Utiliser le cookieManager pour stocker les données
    res.cookieManager.setMosqueTimesData(res, city, data);

    res.status(200).json({
      success: true,
      message: "Données stockées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du stockage des données de mosquée:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du stockage des données",
    });
  }
};

// Fonction pour stocker les horaires des mosquées dans un cookie public
exports.storePublicMosqueTimesInCookie = async (req, res) => {
  try {
    // Définir directement le cookie sans passer par cookieManager
    const cookieName = "mosque_times_data";
    let cookieData = {};

    // Récupérer les données existantes du cookie
    try {
      const existingCookie = req.cookies[cookieName];
      if (existingCookie) {
        console.log("Cookies:", { [cookieName]: existingCookie });
        cookieData = JSON.parse(existingCookie);
      }
    } catch (e) {
      console.error("Erreur lors de la lecture du cookie existant:", e);
    }

    console.log("Body:", req.body);

    // Normaliser le nom de la ville (en minuscules)
    const cityKey = req.body.city.toLowerCase().trim();

    // Ajouter/mettre à jour les données pour cette ville
    cookieData[cityKey] = {
      date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
      data: req.body.data,
      timestamp: Date.now(),
    };

    // Créer le cookie avec une date d'expiration à minuit
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);

    // Créer le cookie
    res.cookie(cookieName, JSON.stringify(cookieData), {
      expires: midnight,
      httpOnly: false,
      path: "/",
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors du stockage des données dans le cookie:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

module.exports = {
  register: exports.register,
  login: exports.login,
  refreshToken: exports.refreshToken,
  logout: exports.logout,
  verify: exports.verify,
  getProfile: exports.getProfile,
  changePassword: exports.changePassword,
  forgotPassword: exports.forgotPassword,
  getResetPassword: exports.getResetPassword,
  resetPassword: exports.resetPassword,
  storeMosqueTimesInCookie: exports.storeMosqueTimesInCookie,
  storePublicMosqueTimesInCookie: exports.storePublicMosqueTimesInCookie,
};
