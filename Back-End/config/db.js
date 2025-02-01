// config/db.js

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Log des paramètres de connexion (sans les valeurs sensibles)
console.log('Configuration BD:', {
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    // Ne pas logger le mot de passe
    ssl: { rejectUnauthorized: false }
});

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test de connexion
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erreur de connexion à la BD:', err);
    } else {
        console.log('Connexion BD réussie:', res.rows[0]);
    }
});

module.exports = pool;