# Configuration Turnstile pour TalibHub

## Variables d'environnement requises

Votre système est maintenant configuré pour charger automatiquement les clés Turnstile depuis vos fichiers d'environnement.

### 📁 Fichiers d'environnement

Le système charge automatiquement le bon fichier selon l'environnement :
- **Développement** : `.env.development`
- **Production** : `.env.production`

### 🔑 Variables à configurer

Ajoutez ces variables dans vos fichiers `.env.development` et `.env.production` :

```env
# Cloudflare Turnstile Configuration
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Autres variables existantes...
COOKIE_SECRET=votre_cookie_secret_ici
NODE_ENV=development  # ou 'production'
```

## 📋 Étapes pour obtenir les clés Turnstile

### 1. Créer un site Turnstile chez Cloudflare

1. Allez sur : https://dash.cloudflare.com/
2. Connectez-vous ou créez un compte Cloudflare gratuit
3. Dans le menu latéral, cherchez "Turnstile"
4. Cliquez sur "Add Site"

### 2. Configuration du site

- **Site name** : TalibHub
- **Domain** : 
  - Pour le développement : `localhost`
  - Pour la production : `votre-domaine.com`
- **Widget mode** : Managed (recommandé)

### 3. Récupérer les clés

Après création, vous obtiendrez :
- **Site Key** (publique) → `TURNSTILE_SITE_KEY`
- **Secret Key** (privée) → `TURNSTILE_SECRET_KEY`

## ✅ Vérification de la configuration

### Backend
Pour vérifier que les clés sont bien chargées, allez sur :
```
GET /api/turnstile/config
```

Réponse attendue :
```json
{
  "configured": true,
  "secretKeyConfigured": true,
  "siteKeyConfigured": true,
  "message": "Turnstile configuré"
}
```

### Frontend
Le frontend récupère automatiquement la Site Key depuis :
```
GET /api/turnstile/site-key
```

## 🔧 Architecture du système

```
Frontend (TurnstileHandler)
    ↓ Récupère la Site Key
Backend (/api/turnstile/site-key)
    ↓ Lit process.env.TURNSTILE_SITE_KEY
Fichier .env.{environment}
```

## 🚨 Sécurité

- ✅ **Site Key** : Publique, récupérée via API
- ⚠️ **Secret Key** : Privée, reste sur le serveur
- 🔒 Ne jamais exposer la Secret Key côté client

## 🐛 Dépannage

### Erreur "Site Key non disponible"
- Vérifiez que `TURNSTILE_SITE_KEY` est dans votre fichier `.env`
- Redémarrez votre serveur après modification du `.env`

### Erreur "Configuration serveur manquante"
- Vérifiez que `TURNSTILE_SECRET_KEY` est dans votre fichier `.env`
- Assurez-vous que le fichier `.env.{environment}` correspond à votre `NODE_ENV`

### Widget Turnstile ne s'affiche pas
1. Ouvrez la console du navigateur
2. Vérifiez les erreurs JavaScript
3. Testez l'endpoint `/api/turnstile/site-key` manuellement

## 📝 Exemple complet

### `.env.development`
```env
NODE_ENV=development
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
COOKIE_SECRET=development_cookie_secret_here
```

### `.env.production`
```env
NODE_ENV=production
TURNSTILE_SITE_KEY=1x00000000000000000000BB
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000BB
COOKIE_SECRET=production_cookie_secret_here
``` 