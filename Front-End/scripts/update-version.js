// Script pour mettre à jour automatiquement version.js
const fs = require('fs');
const path = require('path');

// Incrémenter la version au format X.XX par pas de 0.01
function incrementVersion(version) {
  // Convertir en nombre, ajouter 0.01 et formater avec 2 décimales
  const currentNumber = parseFloat(version);
  const newNumber = currentNumber + 0.01;
  
  // Formater pour toujours avoir 2 chiffres après la virgule
  return newNumber.toFixed(2);
}

// Lire la version actuelle
const versionPath = path.resolve(__dirname, '../utils/version.js');
let versionContent = fs.readFileSync(versionPath, 'utf8');

// Extraire la version
const versionMatch = versionContent.match(/APP_VERSION\s*=\s*"([^"]+)"/);
if (versionMatch) {
  const currentVersion = versionMatch[1];
  const newVersion = incrementVersion(currentVersion);
  
  // Mettre à jour le fichier
  versionContent = versionContent.replace(
    /APP_VERSION\s*=\s*"([^"]+)"/,
    `APP_VERSION = "${newVersion}"`
  );
  
  fs.writeFileSync(versionPath, versionContent);
  console.log(`Version mise à jour: ${currentVersion} -> ${newVersion}`);
} 