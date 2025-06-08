const express = require("express");
const router = express.Router();
const turnstileController = require("../controllers/turnstileController");

// Route pour obtenir la Site Key (publique)
router.get("/site-key", turnstileController.getTurnstileSiteKey);

// Route pour vérifier le token Turnstile
router.post("/verify", turnstileController.verifyTurnstile);

// Route pour vérifier la configuration (utile pour le debug)
router.get("/config", turnstileController.checkTurnstileConfig);

module.exports = router;
 