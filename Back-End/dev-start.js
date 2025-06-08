#!/usr/bin/env node

/**
 * Script de démarrage pour le développement avec Turnstile
 * Usage: node dev-start.js
 */

console.log("🔧 Configuration TalibHub en mode développement avec Turnstile\n");

// Configurer l'environnement de développement
process.env.NODE_ENV = "development";

// Afficher les informations de configuration
console.log("📋 Configuration Turnstile:");
console.log("   - Mode: DÉVELOPPEMENT");
console.log("   - Clés de test Cloudflare: ACTIVÉES (toujours valides)");
console.log("   - Port par défaut: 3000");
console.log("   - Base de données: MongoDB local\n");

console.log("✅ Avantages des clés de test:");
console.log("   • Fonctionnent immédiatement sur localhost");
console.log("   • Aucune configuration Cloudflare requise");
console.log("   • Passent toujours la validation");
console.log("   • Parfait pour les tests automatisés");
console.log("   • Pas de limite de requêtes\n");

console.log("⚠️  Pour utiliser vos vraies clés Turnstile en développement:");
console.log("   1. Créez un fichier .env avec:");
console.log("      TURNSTILE_SECRET_KEY=votre_cle_secrete");
console.log("      TURNSTILE_SITE_KEY=votre_cle_site");
console.log('   2. Ajoutez "localhost" dans votre dashboard Cloudflare\n');

console.log("🚀 Démarrage du serveur...\n");

// Démarrer le serveur principal
require("./server.js");
