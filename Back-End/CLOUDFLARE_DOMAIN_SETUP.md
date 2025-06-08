# 🌐 Configuration Domaines Cloudflare pour Développement Local

## Quand avez-vous besoin de configurer les domaines ?

### ❌ **PAS BESOIN avec les clés de test**

Si vous utilisez les clés de test automatiques :

```
TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"
TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
```

→ **Aucune configuration requise**, ça marche partout !

### ✅ **REQUIS avec vos vraies clés Cloudflare**

Si vous voulez utiliser vos propres clés Cloudflare en développement.

## 🛠️ Configuration Étape par Étape

### 1. Accéder au Dashboard Cloudflare

1. **Aller sur** : https://dash.cloudflare.com/
2. **Se connecter** avec votre compte
3. **Naviguer** vers "Turnstile" dans le menu latéral
4. **Sélectionner** votre site Turnstile

### 2. Ajouter les Domaines de Développement

Dans la section **"Domains"** de votre site Turnstile, ajoutez :

```
localhost
127.0.0.1
localhost:3000
localhost:8080
*.localhost
*.test
*.dev
```

**Pourquoi ces domaines ?**

- `localhost` - Standard pour développement local
- `127.0.0.1` - Adresse IP locale
- `localhost:3000` - Avec port spécifique (si votre app utilise le port 3000)
- `localhost:8080` - Port alternatif commun
- `*.localhost` - Sous-domaines (ex: api.localhost)
- `*.test` - Convention pour sites de test
- `*.dev` - Convention pour développement

### 3. Capture d'écran de la Configuration

```
┌─────────────────────────────────────────┐
│ Site Configuration - Turnstile         │
├─────────────────────────────────────────┤
│ Site Name: TalibHub Development         │
│ Widget Mode: Managed                    │
│                                         │
│ Domains:                                │
│ ┌─────────────────────────────────────┐ │
│ │ localhost                           │ │
│ │ 127.0.0.1                          │ │
│ │ localhost:3000                     │ │
│ │ localhost:8080                     │ │
│ │ *.localhost                        │ │
│ │ *.test                             │ │
│ │ *.dev                              │ │
│ │ votre-domaine-production.com       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4. Récupérer les Clés

Une fois configuré, récupérez :

- **Site Key** (publique) - pour le frontend
- **Secret Key** (privée) - pour le backend

### 5. Configuration .env

Créez un fichier `.env` dans `/Back-End/` :

```env
NODE_ENV=development

# Vos vraies clés Cloudflare
TURNSTILE_SECRET_KEY=0x1234567890abcdef...
TURNSTILE_SITE_KEY=0x1234567890abcdef...

# Autres variables
DATABASE_URL=mongodb://localhost:27017/talibhub_dev
PORT=3000
```

## 🧪 Test de la Configuration

### 1. Vérifier la configuration

```bash
npm run check:turnstile
```

Vous devriez voir :

```
🔑 Configuration des clés:
   - TURNSTILE_SECRET_KEY dans .env: ✅
   - TURNSTILE_SITE_KEY dans .env: ✅

🚀 Clés utilisées en runtime:
   - Source: Variables d'environnement (.env)
   - Status: ✅ PRÊT (clés personnalisées)
```

### 2. Démarrer l'application

```bash
npm run dev:turnstile
```

### 3. Tester dans le navigateur

1. Ouvrir http://localhost:3000
2. Aller au formulaire d'inscription
3. Le widget Turnstile devrait s'afficher
4. Soumettre le formulaire - vérification réelle avec Cloudflare

## ⚠️ Dépannage Domaines

### Erreur "Domain not allowed"

**Symptômes :**

- Widget ne s'affiche pas
- Console montre "domain not allowed"
- Erreur 403 dans les requêtes réseau

**Solutions :**

1. **Vérifier les domaines** dans le dashboard Cloudflare
2. **Attendre 5-10 minutes** pour la propagation
3. **Vider le cache** du navigateur
4. **Redémarrer le serveur**

### Test avec curl

```bash
# Tester l'API directement
curl -X POST https://challenges.cloudflare.com/turnstile/v0/siteverify \
  -d "secret=VOTRE_SECRET_KEY" \
  -d "response=test_token" \
  -d "remoteip=127.0.0.1"
```

## 🎯 Recommandations

### Pour le Développement Quotidien

**Utilisez les clés de test** (configuration par défaut) :

- ✅ Aucune config domaine requise
- ✅ Fonctionne hors ligne
- ✅ Pas de limite de requêtes
- ✅ Setup instantané

### Pour Tester la Vraie Intégration

**Utilisez vos vraies clés** occasionnellement :

- ✅ Test avec vraie API Cloudflare
- ✅ Validation des domaines
- ✅ Test des erreurs réelles
- ⚠️ Limite de requêtes possible

## 🔄 Basculer Entre Les Deux

### Vers clés de test

```bash
# Renommer ou supprimer .env temporairement
mv .env .env.backup
npm run dev:turnstile
```

### Vers vraies clés

```bash
# Remettre .env
mv .env.backup .env
npm run dev:turnstile
```

## 📝 Exemple Complet

### Structure recommandée

```
Back-End/
├── .env                    # Vraies clés (optionnel)
├── .env.example           # Template
├── .env.test              # Clés de test (optionnel)
└── package.json
```

### Script de bascule

```bash
#!/bin/bash
# switch-turnstile.sh

case "$1" in
  "test")
    echo "🧪 Basculer vers clés de test"
    mv .env .env.real 2>/dev/null
    ;;
  "real")
    echo "🔑 Basculer vers vraies clés"
    mv .env.real .env 2>/dev/null
    ;;
  *)
    echo "Usage: $0 {test|real}"
    ;;
esac

npm run check:turnstile
```
