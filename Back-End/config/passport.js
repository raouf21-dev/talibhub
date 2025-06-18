// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const userModel = require("../models/userModel");

// URLs de callback selon l'environnement
const getCallbackURL = (provider) => {
  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://talibhub.com"
      : "http://localhost:4000";
  return `${baseURL}/api/auth/${provider}/callback`;
};

// Sérialisation des utilisateurs pour les sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configuration Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: getCallbackURL("google"),
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth - Profil reçu:", {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
          });

          // Vérifier si l'utilisateur existe déjà avec cet OAuth ID
          let user = await userModel.getUserByOAuth("google", profile.id);

          if (user) {
            // Utilisateur existant trouvé
            return done(null, user);
          }

          // Vérifier si un utilisateur avec cet email existe déjà
          const existingUser = await userModel.getUserByEmail(
            profile.emails[0].value
          );
          if (existingUser && !existingUser.is_oauth_user) {
            // Un utilisateur avec email/mot de passe existe déjà
            // Pour l'instant, on retourne une erreur - vous pourrez implémenter la liaison plus tard
            return done(new Error("EMAIL_ALREADY_EXISTS"), null);
          }

          // Créer un nouvel utilisateur OAuth
          const userData = {
            email: profile.emails[0].value,
            oauth_provider: "google",
            oauth_id: profile.id,
            oauth_email: profile.emails[0].value,
            oauth_profile_data: {
              displayName: profile.displayName,
              photos: profile.photos,
              accessToken: accessToken,
            },
            is_oauth_user: true,
            email_verified: true,
            // Données à compléter lors de la première connexion
            first_name: profile.name?.givenName || "",
            last_name: profile.name?.familyName || "",
            username: profile.emails[0].value.split("@")[0] + "_" + Date.now(), // Username temporaire
          };

          user = await userModel.createOAuthUser(userData);
          done(null, user);
        } catch (error) {
          console.error("Erreur Google OAuth:", error);
          done(error, null);
        }
      }
    )
  );
}

// Configuration Microsoft OAuth
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: getCallbackURL("microsoft"),
        scope: ["user.read"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Microsoft OAuth - Profil reçu:", {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
          });

          let user = await userModel.getUserByOAuth("microsoft", profile.id);

          if (user) {
            return done(null, user);
          }

          const existingUser = await userModel.getUserByEmail(
            profile.emails[0].value
          );
          if (existingUser && !existingUser.is_oauth_user) {
            return done(new Error("EMAIL_ALREADY_EXISTS"), null);
          }

          const userData = {
            email: profile.emails[0].value,
            oauth_provider: "microsoft",
            oauth_id: profile.id,
            oauth_email: profile.emails[0].value,
            oauth_profile_data: {
              displayName: profile.displayName,
              photos: profile.photos,
              accessToken: accessToken,
            },
            is_oauth_user: true,
            email_verified: true,
            first_name: profile.name?.givenName || "",
            last_name: profile.name?.familyName || "",
            username: profile.emails[0].value.split("@")[0] + "_" + Date.now(),
          };

          user = await userModel.createOAuthUser(userData);
          done(null, user);
        } catch (error) {
          console.error("Erreur Microsoft OAuth:", error);
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
