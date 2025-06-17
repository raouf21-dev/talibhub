# Guide de débogage OAuth - Problème de redirection après connexion Google

## Problèmes identifiés

### 1. **Conflit entre systèmes d'authentification**

- L'application gère 2 types d'auth : tokens JWT (localStorage) + cookies OAuth (httpOnly)
- La fonction `checkAuthStatus()` dans `main.js` ne vérifiait que les tokens localStorage
- Les cookies httpOnly d'OAuth n'étaient pas pris en compte

### 2. **Configuration API incorrecte**

- URL de base en production pointait vers `www.talibhub.com` au lieu de `talibhub.com`
- Problème de domaine pour les cookies cross-subdomain

### 3. **Gestion des cookies OAuth défaillante**

- La fonction `hasAuthCookie()` utilisait une vérification trop simple
- Pas de gestion robuste des cookies httpOnly

### 4. **Timing de redirection OAuth**

- Redirection trop rapide après OAuth sans attendre la propagation des cookies
- Nettoyage d'URL mal synchronisé

## Solutions appliquées

### ✅ **Correction 1: main.js - checkAuthStatus()**

```javascript
// Avant: vérifiait seulement localStorage
const token = localStorage.getItem("token");
if (!token) return null;

// Après: vérifie aussi les cookies OAuth
const hasAuthCookie = document.cookie
  .split(";")
  .some((cookie) => cookie.trim().startsWith("auth=true"));
if (hasAuthCookie) {
  // Vérification via API avec cookies
}
```

### ✅ **Correction 2: apiConfig.js - URL de base**

```javascript
// Avant
return "https://www.talibhub.com/api";

// Après
return "https://talibhub.com/api";
```

### ✅ **Correction 3: authService.js - hasAuthCookie()**

```javascript
// Avant
return document.cookie.includes("auth=true");

// Après
const cookies = document.cookie.split(";");
return cookies.some((cookie) => cookie.trim().startsWith("auth=true"));
```

### ✅ **Correction 4: oauth.js - checkAuthCallback()**

```javascript
// Ajout de délais et synchronisation
await new Promise((resolve) => setTimeout(resolve, 500)); // Attendre cookies
window.history.replaceState({}, document.title, window.location.pathname); // Nettoyer URL immédiatement
await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre événement login
```

### ✅ **Correction 5: oauthRoutes.js - redirectAfterAuth()**

```javascript
// Avant
`${frontendURL}/welcomepage?auth=success&redirect=dashboard`// Après
`${frontendURL}/?auth=success&redirect=dashboard&timestamp=${Date.now()}`;
```

### ✅ **Correction 6: cookieManager.js - Configuration domaine**

```javascript
// En production
domain: '.talibhub.com', // Permet usage sur talibhub.com et sous-domaines
```

## Flux OAuth corrigé

1. **Utilisateur clique sur "Se connecter avec Google"**
2. **Redirection vers Google OAuth**
3. **Google redirige vers `/api/auth/google/callback`**
4. **Backend crée token JWT et cookies httpOnly**
5. **Redirection vers `/?auth=success&redirect=dashboard`**
6. **Front-end détecte le callback OAuth**
7. **Nettoyage immédiat de l'URL**
8. **Attente propagation des cookies (500ms)**
9. **Vérification auth via API avec cookies**
10. **Déclenchement événement 'login'**
11. **Attente traitement de l'événement (1000ms)**
12. **Redirection vers dashboard**

## Débogage

### Vérifications à faire:

1. **Console navigateur** : chercher les logs `🔧 DEBUG OAuth`
2. **Cookies** : vérifier `auth=true` et `auth_token` (httpOnly)
3. **Réseau** : contrôler les requêtes vers `/api/auth/verify`
4. **URL** : s'assurer que `auth=success&redirect=dashboard` apparaît

### Commandes utiles:

```javascript
// Dans la console navigateur
console.log("Cookies:", document.cookie);
console.log("Token:", localStorage.getItem("token"));

// Test manuel API
fetch("/api/auth/verify", { credentials: "include" })
  .then((r) => r.json())
  .then(console.log);
```

## Points d'attention

- Les cookies httpOnly ne sont pas lisibles via JavaScript côté client
- L'authentification OAuth nécessite `credentials: 'include'` sur les requêtes
- Le domaine des cookies doit correspondre exactement
- Les redirections OAuth doivent éviter les boucles avec un timing approprié
