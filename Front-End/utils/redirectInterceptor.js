/**
 * Intercepteur de redirections - à charger le plus tôt possible
 */
(function() {
  console.log('[DEBUG] Initialisation de l\'intercepteur de redirections');
  
  // Sauvegarder les fonctions originales
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalFetch = window.fetch;
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  const originalHref = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
  
  // Fonction pour vérifier si une URL doit être bloquée
  function shouldBlockUrl(url) {
    if (typeof url !== 'string') return false;
    
    // Bloquer les redirections vers /login
    if (url.includes('/login')) {
      console.warn(`[DEBUG] Redirection bloquée vers: ${url}`);
      return true;
    }
    return false;
  }
  
  // Fonction pour remplacer une URL bloquée
  function replaceBlockedUrl(url) {
    if (shouldBlockUrl(url)) {
      return url.replace('/login', '/welcomepage');
    }
    return url;
  }
  
  // Intercepter XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const newUrl = replaceBlockedUrl(url);
    return originalOpen.call(this, method, newUrl, ...args);
  };
  
  // Intercepter fetch
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      url = replaceBlockedUrl(url);
    } else if (url instanceof Request) {
      url = new Request(replaceBlockedUrl(url.url), url);
    }
    return originalFetch.call(this, url, options);
  };
  
  // Intercepter location.assign
  window.location.assign = function(url) {
    if (shouldBlockUrl(url)) {
      return originalAssign.call(this, '/welcomepage');
    }
    return originalAssign.call(this, url);
  };
  
  // Intercepter location.replace
  window.location.replace = function(url) {
    if (shouldBlockUrl(url)) {
      return originalReplace.call(this, '/welcomepage');
    }
    return originalReplace.call(this, url);
  };
  
  // Intercepter location.href
  Object.defineProperty(window.Location.prototype, 'href', {
    set: function(url) {
      if (shouldBlockUrl(url)) {
        return originalHref.set.call(this, '/welcomepage');
      }
      return originalHref.set.call(this, url);
    },
    get: function() {
      return originalHref.get.call(this);
    }
  });
  
  // Intercepter window.open
  const originalWindowOpen = window.open;
  window.open = function(url, ...args) {
    if (shouldBlockUrl(url)) {
      return originalWindowOpen.call(this, '/welcomepage', ...args);
    }
    return originalWindowOpen.call(this, url, ...args);
  };
  
  console.log('[DEBUG] Intercepteur de redirections initialisé');
})(); 