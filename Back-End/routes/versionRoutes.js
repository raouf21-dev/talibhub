const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Route pour obtenir la version actuelle de l'application
router.get("/", (req, res) => {
  try {
    // Lire le fichier de version (peut être généré lors du déploiement)
    const versionFilePath = path.join(__dirname, "../version.json");
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, "utf8"));

    res.json({
      version: versionData.version,
      buildDate: versionData.buildDate,
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier de version:", error);
    res.status(500).json({ error: "Impossible de récupérer la version" });
  }
});

module.exports = router;
