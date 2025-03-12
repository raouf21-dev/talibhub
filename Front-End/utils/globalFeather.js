// Ce script doit être chargé avant tout autre script
(function() {
  // Définir feather globalement
  window.feather = window.feather || {
    replace: function() {
      console.log("Feather temporaire utilisé");
      return { icons: {} };
    },
    icons: {}
  };
  
  // Charger le vrai feather de manière asynchrone
  document.addEventListener('DOMContentLoaded', function() {
    if (!window.featherLoaded) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/feather-icons";
      script.async = true;
      script.onload = function() {
        window.featherLoaded = true;
        if (typeof window.feather.replace === 'function') {
          window.feather.replace();
        }
      };
      document.head.appendChild(script);
    }
  });
})(); 