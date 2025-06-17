// Script temporaire pour nettoyer les références build_hash du localStorage
// À exécuter une fois puis supprimer

console.log("🧹 Nettoyage des références build_hash...");

try {
  // Supprimer build_hash du localStorage si présent
  if (localStorage.getItem("build_hash")) {
    localStorage.removeItem("build_hash");
    console.log("✅ build_hash supprimé du localStorage");
  } else {
    console.log("ℹ️ Aucun build_hash trouvé dans localStorage");
  }
} catch (error) {
  console.error("❌ Erreur lors du nettoyage:", error);
}

console.log("🧹 Nettoyage terminé");
