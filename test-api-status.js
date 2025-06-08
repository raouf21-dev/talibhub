// Test simple pour vérifier l'API de statut de scraping
const http = require("http");

console.log("🔍 Test de l'API de statut de scraping...");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/mosque-times/scraping-status-realtime/2025-06-05",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      console.log("✅ Réponse API reçue:");
      console.log(JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log("🎯 Structure de l'API correcte");
        console.log("Statut du scraping:", response.data.scraping_status);

        if (response.data.scraping_status === "in_progress") {
          console.log("🔄 Scraping en cours détecté!");
        } else if (response.data.scraping_status === "completed") {
          console.log("✅ Scraping terminé");
        } else if (response.data.scraping_status === "not_started") {
          console.log("⏸️ Scraping pas encore démarré");
        }
      } else {
        console.log("❌ Structure de l'API incorrecte");
      }
    } catch (error) {
      console.error("❌ Erreur de parsing JSON:", error);
      console.log("Réponse brute:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Erreur de requête:", e.message);
  console.log("Vérifiez que le serveur backend est démarré sur le port 3000");
});

req.end();
