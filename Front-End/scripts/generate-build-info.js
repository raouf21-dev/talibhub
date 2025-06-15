// Script Node.js pour générer le fichier build-info.js
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// Générer un hash basé sur le contenu des fichiers JS principaux
function generateHash() {
  const files = [
    // Liste des fichiers principaux à surveiller pour les changements
    "./main.js",
    "./services/notifications/notificationService.js",
    "./components/messaging/messageCenter.js",
    "./translations/TranslationManager.js",
    // Ajoutez d'autres fichiers importants
  ];

  let content = "";
  files.forEach((file) => {
    try {
      content += fs.readFileSync(path.resolve(__dirname, "..", file), "utf8");
    } catch (err) {
      console.error(`Erreur lors de la lecture du fichier ${file}:`, err);
    }
  });

  return crypto.createHash("md5").update(content).digest("hex").substring(0, 8);
}

// Générer le contenu du fichier
const hash = generateHash();
const buildDate = new Date().toISOString();

const fileContent = `// Ce fichier est généré automatiquement - Ne pas modifier
export const BUILD_HASH = "${hash}";
export const BUILD_DATE = "${buildDate}";

// Cette fonction est appelée dans main.js
export function checkBuildHash(clearDataCallback) {
  const storedHash = localStorage.getItem("build_hash");
  if (storedHash !== BUILD_HASH) {
    console.log(\`Nouveau build détecté: \${BUILD_HASH}\`);
    
    if (typeof clearDataCallback === 'function') {
      clearDataCallback();
    }
    
    localStorage.setItem("build_hash", BUILD_HASH);
    return true;
  }
  return false;
}
`;

// Écrire le fichier
const outputPath = path.resolve(__dirname, "../build/build-info.js");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContent);

console.log(`Fichier build-info.js généré avec succès. Hash: ${hash}`);
