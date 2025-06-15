// models/userModel.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");

const getUserByUsername = async (username) => {
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  try {
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans getUserByEmail:", error);
    throw error;
  }
};

const createUser = async (
  username,
  password,
  email,
  firstName,
  lastName,
  age,
  gender,
  country
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username, password, email, first_name, last_name, age, gender, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
    [username, hashedPassword, email, firstName, lastName, age, gender, country]
  );
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query(
    "SELECT id, username, email, first_name, last_name, age, gender FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

const updateUserPassword = async (id, newPassword) => {
  await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
    newPassword,
    id,
  ]);
};

// Fonctions pour la réinitialisation du mot de passe

const setResetToken = async (userId, token, expires) => {
  await pool.query(
    "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3",
    [token, expires, userId]
  );
};

const getUserByResetToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
    [token]
  );
  return result.rows[0];
};

const clearResetToken = async (userId) => {
  await pool.query(
    "UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1",
    [userId]
  );
};

// Nouvelles fonctions OAuth
const getUserByOAuth = async (provider, oauthId) => {
  try {
    const query = {
      text: "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
      values: [provider, oauthId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans getUserByOAuth:", error);
    throw error;
  }
};

const createOAuthUser = async (userData) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (
                username, email, oauth_provider, oauth_id, oauth_email, 
                oauth_profile_data, is_oauth_user, email_verified,
                first_name, last_name, age, gender, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
      [
        userData.username,
        userData.email,
        userData.oauth_provider,
        userData.oauth_id,
        userData.oauth_email,
        JSON.stringify(userData.oauth_profile_data),
        userData.is_oauth_user,
        userData.email_verified,
        userData.first_name,
        userData.last_name,
        userData.age || null,
        userData.gender || null,
        userData.country || null,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans createOAuthUser:", error);
    throw error;
  }
};

const updateOAuthUserProfile = async (userId, profileData) => {
  try {
    const { firstName, lastName, age, gender, country, username } = profileData;
    const result = await pool.query(
      `UPDATE users 
             SET first_name = $1, last_name = $2, age = $3, gender = $4, country = $5, username = $6
             WHERE id = $7
             RETURNING *`,
      [firstName, lastName, age, gender, country, username, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans updateOAuthUserProfile:", error);
    throw error;
  }
};

const linkOAuthToExistingUser = async (userId, oauthData) => {
  try {
    const result = await pool.query(
      `UPDATE users 
             SET oauth_provider = $1, oauth_id = $2, oauth_email = $3, 
                 oauth_profile_data = $4, is_oauth_user = TRUE
             WHERE id = $5
             RETURNING *`,
      [
        oauthData.provider,
        oauthData.oauth_id,
        oauthData.oauth_email,
        JSON.stringify(oauthData.profile_data),
        userId,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans linkOAuthToExistingUser:", error);
    throw error;
  }
};

module.exports = {
  getUserByUsername,
  getUserByEmail,
  createUser,
  getUserById,
  updateUserPassword,
  setResetToken,
  getUserByResetToken,
  clearResetToken,
  // Nouvelles fonctions OAuth
  getUserByOAuth,
  createOAuthUser,
  updateOAuthUserProfile,
  linkOAuthToExistingUser,
};
