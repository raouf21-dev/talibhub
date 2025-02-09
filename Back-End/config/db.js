const { Pool } = require('pg');

// Configuration en fonction de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

let pool;

const createPool = () => {
    // Configuration commune pour dev et prod
    if (process.env.DATABASE_URL) {
        // Utilisation de l'URL de connexion (fonctionne en dev et prod)
        return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: isProduction ? {
                rejectUnauthorized: false
            } : false
        });
    } else {
        // Utilisation des variables individuelles (fonctionne en dev et prod)
        return new Pool({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: process.env.PGPORT || 5432,
            ssl: isProduction ? {
                rejectUnauthorized: false
            } : false
        });
    }
};

// Création du pool avec la configuration appropriée
pool = createPool();

// Log de la configuration actuelle
console.log('Configuration BD:', {
    environment: process.env.NODE_ENV,
    usingConnectionString: !!process.env.DATABASE_URL,
    host: process.env.PGHOST || 'Non défini',
    database: process.env.PGDATABASE || 'Non défini',
    user: process.env.PGUSER || 'Non défini',
    port: process.env.PGPORT || 5432,
    ssl: isProduction
});

// Test de connexion
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error(`Erreur de connexion à la BD (${process.env.NODE_ENV}):`, err.message);
    } else {
        console.log(`Connexion BD réussie (${process.env.NODE_ENV}):`, res.rows[0]);
    }
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
    console.error(`Erreur inattendue du pool PostgreSQL (${process.env.NODE_ENV}):`, err.message);
});

module.exports = pool;