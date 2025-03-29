// Fichier de débogage à inclure temporairement
(function() {
  const original = {
    setTimeout: window.setTimeout
  };
  
  // Créer un journal d'exécution
  window.executionLog = [];
  
  // Fonction pour enregistrer l'exécution
  function logExecution(name, args) {
    const timestamp = new Date().toISOString();
    const entry = {
      time: timestamp,
      function: name,
      args: Array.from(args || []).map(a => typeof a === 'function' ? '[Function]' : a)
    };
    console.log(`[DEBUG EXEC] ${timestamp} - ${name}`, entry);
    window.executionLog.push(entry);
  }
  
  // Remplacer temporairement des fonctions clés
  window.checkBuildHash = function() {
    logExecution('checkBuildHash', arguments);
    return false; // Ne pas déclencher de rechargement
  };
  
  window.setTimeout = function(fn, delay) {
    logExecution('setTimeout', arguments);
    return original.setTimeout.apply(this, arguments);
  };
  
  // Ajouter un bouton pour afficher le journal d'exécution
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.innerText = 'Debug Log';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.left = '10px';
    btn.style.zIndex = '99999';
    btn.addEventListener('click', () => {
      console.table(window.executionLog);
    });
    document.body.appendChild(btn);
  });
})(); 