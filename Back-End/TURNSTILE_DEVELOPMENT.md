# Configuration Turnstile pour le Développement Local

## 🔧 Options pour le développement local

### Option 1 : Clés de test Cloudflare (RECOMMANDÉE)

Cloudflare fournit des clés de test spéciales qui **fonctionnent toujours** et **passent toujours** la validation :

```env
# Dans votre fichier .env pour le développement
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**Avantages :**

- ✅ Fonctionnent immédiatement sur localhost
- ✅ Aucune configuration supplémentaire nécessaire
- ✅ Passent toujours la validation
- ✅ Parfait pour les tests automatisés

**Inconvénients :**

- ⚠️ Ne testent pas la vraie fonctionnalité Turnstile
- ⚠️ À ne PAS utiliser en production

### Option 2 : Configuration domaine localhost

Si vous voulez tester la vraie fonctionnalité Turnstile en local :

1. **Dans le dashboard Cloudflare Turnstile :**

   - Allez sur https://dash.cloudflare.com/turnstile
   - Créez un nouveau site ou modifiez un existant
   - **Domaines autorisés :**
     ```
     localhost
     127.0.0.1
     *.localhost
     localhost:3000
     localhost:8080
     ```

2. **Utilisez vos vraies clés de développement :**
   ```env
   # Dans votre fichier .env pour le développement
   TURNSTILE_SECRET_KEY=votre_vraie_cle_secrete_dev
   TURNSTILE_SITE_KEY=votre_vraie_cle_site_dev
   ```

### Option 3 : Variables d'environnement dynamiques

Configurez différentes clés selon l'environnement :

```javascript
// Dans votre config backend
const isDevelopment = process.env.NODE_ENV === "development";

const TURNSTILE_CONFIG = {
  siteKey: isDevelopment
    ? "1x00000000000000000000AA" // Clé de test
    : process.env.TURNSTILE_SITE_KEY, // Vraie clé
  secretKey: isDevelopment
    ? "1x0000000000000000000000000000000AA" // Clé de test
    : process.env.TURNSTILE_SECRET_KEY, // Vraie clé
};
```

## 🛠️ Configuration pas à pas

### 1. Backend - Variables d'environnement

Créez un fichier `.env.development` :

```env
NODE_ENV=development

# Clés de test Turnstile (toujours valides en dev)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Autres variables de développement
DATABASE_URL=mongodb://localhost:27017/talibhub_dev
PORT=3000
```

### 2. Frontend - Configuration dynamique

Modifiez `Front-End/components/auth/turnstile.js` :

```javascript
class TurnstileHandler {
  constructor() {
    // Détection automatique de l'environnement
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    this.siteKey = isDevelopment
      ? "1x00000000000000000000AA" // Clé de test
      : "VOTRE_CLE_PRODUCTION"; // Vraie clé pour production

    this.apiEndpoint = isDevelopment
      ? "http://localhost:3000" // URL locale
      : "https://votre-domaine.com"; // URL production

    console.log(
      `🔧 Turnstile en mode: ${isDevelopment ? "DÉVELOPPEMENT" : "PRODUCTION"}`
    );
  }
  // ... reste du code
}
```

### 3. Backend - Configuration dynamique

Modifiez `Back-End/controllers/turnstileController.js` :

```javascript
const verifyTurnstile = async (req, res) => {
  try {
    const { token } = req.body;

    // Configuration dynamique selon l'environnement
    const isDevelopment = process.env.NODE_ENV === "development";
    const secretKey = isDevelopment
      ? "1x0000000000000000000000000000000AA" // Clé de test
      : process.env.TURNSTILE_SECRET_KEY; // Vraie clé

    if (isDevelopment) {
      console.log(
        "🔧 Mode développement - Utilisation des clés de test Turnstile"
      );
    }

    // ... reste du code de vérification
  } catch (error) {
    // ... gestion d'erreur
  }
};
```

## 🚀 Script de démarrage développement

Créez un script `dev-setup.sh` :

```bash
#!/bin/bash
echo "🔧 Configuration développement TalibHub avec Turnstile"

# Vérifier si .env.development existe
if [ ! -f .env.development ]; then
  echo "📝 Création du fichier .env.development"
  cat > .env.development << EOF
NODE_ENV=development
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_SITE_KEY=1x00000000000000000000AA
DATABASE_URL=mongodb://localhost:27017/talibhub_dev
PORT=3000
EOF
fi

# Démarrer le serveur de développement
echo "🚀 Démarrage du serveur de développement..."
export $(cat .env.development | xargs) && npm run dev
```

## 🧪 Tests

### Test manuel

1. **Démarrez votre serveur local**
2. **Ouvrez** http://localhost:3000
3. **Accédez** au formulaire d'inscription
4. **Vérifiez** que le widget Turnstile s'affiche
5. **Testez** la soumission - elle devrait toujours réussir avec les clés de test

### Test automatisé

```javascript
// test/turnstile.test.js
describe("Turnstile Development", () => {
  it("should use test keys in development", () => {
    process.env.NODE_ENV = "development";
    const config = require("../config/turnstile");

    expect(config.siteKey).toBe("1x00000000000000000000AA");
    expect(config.secretKey).toBe("1x0000000000000000000000000000000AA");
  });
});
```

## ⚠️ Points importants

### Sécurité

- ❌ **JAMAIS** commiter les vraies clés dans Git
- ✅ Utilisez `.env.example` avec des valeurs factices
- ✅ Ajoutez `.env*` dans `.gitignore`

### Debug

```javascript
// Ajouter dans votre code frontend pour debug
if (window.location.hostname === "localhost") {
  window.turnstileDebug = true;
  console.log("🔧 Mode debug Turnstile activé");
}
```

### CORS en développement

```javascript
// Dans app.js pour éviter les erreurs CORS
if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
}
```

## 🎯 Recommandation finale

**Pour le développement quotidien** : Utilisez l'Option 1 (clés de test) car :

- ✅ Configuration zéro
- ✅ Pas de limite de requêtes
- ✅ Fonctionne hors ligne
- ✅ Tests automatisés simples

**Pour tester la vraie fonctionnalité** : Utilisez occasionnellement l'Option 2 pour valider l'intégration complète.
