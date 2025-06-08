#!/usr/bin/env node

/**
 * Script de vérification de la configuration Turnstile
 * Usage: node check-turnstile.js
 */

console.log("🔍 Vérification de la configuration Turnstile\n");

// Charger les variables d'environnement
require("dotenv").config();

const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV !== "production";

// Clés de test Cloudflare
const DEV_TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
const DEV_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

console.log("📋 État de l'environnement:");
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || "non défini"}`);
console.log(
  `   - Mode détecté: ${isDevelopment ? "DÉVELOPPEMENT" : "PRODUCTION"}\n`
);

console.log("🔑 Configuration des clés:");

// Vérifier les clés d'environnement
const hasEnvSecretKey = !!process.env.TURNSTILE_SECRET_KEY;
const hasEnvSiteKey = !!process.env.TURNSTILE_SITE_KEY;

console.log(
  `   - TURNSTILE_SECRET_KEY dans .env: ${hasEnvSecretKey ? "✅" : "❌"}`
);
console.log(
  `   - TURNSTILE_SITE_KEY dans .env: ${hasEnvSiteKey ? "✅" : "❌"}\n`
);

// Clés qui seront réellement utilisées
const actualSecretKey =
  isDevelopment && !process.env.TURNSTILE_SECRET_KEY
    ? DEV_TURNSTILE_SECRET_KEY
    : process.env.TURNSTILE_SECRET_KEY;

const actualSiteKey =
  isDevelopment && !process.env.TURNSTILE_SITE_KEY
    ? DEV_TURNSTILE_SITE_KEY
    : process.env.TURNSTILE_SITE_KEY;

console.log("🚀 Clés utilisées en runtime:");

if (isDevelopment && (!hasEnvSecretKey || !hasEnvSiteKey)) {
  console.log("   - Source: Clés de test Cloudflare (automatiques)");
  console.log(`   - Secret Key: ${actualSecretKey.substring(0, 10)}...`);
  console.log(`   - Site Key: ${actualSiteKey}`);
  console.log("   - Status: ✅ PRÊT (clés de test toujours valides)");
} else if (hasEnvSecretKey && hasEnvSiteKey) {
  console.log("   - Source: Variables d'environnement (.env)");
  console.log(`   - Secret Key: ${actualSecretKey.substring(0, 10)}...`);
  console.log(`   - Site Key: ${actualSiteKey}`);
  console.log("   - Status: ✅ PRÊT (clés personnalisées)");
} else {
  console.log("   - Status: ❌ CONFIGURATION INCOMPLÈTE");
}

console.log("\n📖 Instructions:");

if (isDevelopment) {
  console.log("🔧 Mode DÉVELOPPEMENT:");
  console.log(
    "   • Les clés de test sont automatiquement utilisées si aucune clé .env n'est trouvée"
  );
  console.log(
    "   • Pour utiliser vos vraies clés, créez un fichier .env avec:"
  );
  console.log("     TURNSTILE_SECRET_KEY=votre_cle_secrete");
  console.log("     TURNSTILE_SITE_KEY=votre_cle_site");
  console.log(
    '   • Ajoutez "localhost" dans votre dashboard Cloudflare si vous utilisez de vraies clés'
  );
} else {
  console.log("🚀 Mode PRODUCTION:");
  console.log("   • Variables d'environnement OBLIGATOIRES:");
  console.log("     TURNSTILE_SECRET_KEY=votre_cle_secrete_production");
  console.log("     TURNSTILE_SITE_KEY=votre_cle_site_production");
  console.log(
    "   • Configurez vos domaines de production dans le dashboard Cloudflare"
  );
}

console.log("\n🌐 Ressources utiles:");
console.log("   • Dashboard Cloudflare: https://dash.cloudflare.com/turnstile");
console.log("   • Documentation: https://developers.cloudflare.com/turnstile/");
console.log("   • Guide de configuration: ./TURNSTILE_SETUP.md");
console.log("   • Guide de développement: ./TURNSTILE_DEVELOPMENT.md");

console.log("\n✨ Démarrage recommandé pour le développement:");
console.log("   npm run dev:turnstile\n");
