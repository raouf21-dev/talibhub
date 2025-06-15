// Ce fichier est généré automatiquement - Ne pas modifier
export const BUILD_HASH = "537d9f17";
export const BUILD_DATE = "2025-06-11T11:02:57.603Z";

// Cette fonction est appelée dans main.js
export function checkBuildHash(clearDataCallback) {
  const storedHash = localStorage.getItem("build_hash");
  if (storedHash !== BUILD_HASH) {
    console.log(`Nouveau build détecté: ${BUILD_HASH}`);
    
    if (typeof clearDataCallback === 'function') {
      clearDataCallback();
    }
    
    localStorage.setItem("build_hash", BUILD_HASH);
    return true;
  }
  return false;
}
