# 🚀 Démarrage Rapide - Turnstile en Développement

## Option Simple (Recommandée)

**Aucune configuration requise !** Les clés de test Cloudflare sont automatiquement utilisées.

```bash
# 1. Démarrer le serveur en mode développement
npm run dev:turnstile

# 2. Ouvrir http://localhost:3000
# 3. Tester le formulaire d'inscription - Turnstile fonctionnera immédiatement !
```

## Vérifier la Configuration

```bash
# Voir l'état actuel de la configuration Turnstile
npm run check:turnstile
```

## Comment ça fonctionne ?

### Mode Développement Automatique

- **Détection automatique** : Si `NODE_ENV=development` ou non défini
- **Clés de test** : Utilisées automatiquement si aucun `.env` trouvé
- **Validation** : Passe toujours (parfait pour développer)
- **Domaines** : Fonctionnent sur localhost, 127.0.0.1, etc.

### Clés de Test Cloudflare

```javascript
// Ces clés sont intégrées et fonctionnent toujours
TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
```

## Configuration Avancée (Optionnelle)

Si vous voulez tester avec vos vraies clés Cloudflare :

### 1. Créer un fichier `.env`

```env
NODE_ENV=development
TURNSTILE_SECRET_KEY=votre_cle_secrete_cloudflare
TURNSTILE_SITE_KEY=votre_cle_site_cloudflare
```

### 2. Configurer Cloudflare Dashboard

- Aller sur https://dash.cloudflare.com/turnstile
- Ajouter dans "Domaines autorisés" :
  ```
  localhost
  127.0.0.1
  localhost:3000
  *.localhost
  ```

## Scripts Disponibles

```bash
# Démarrage normal
npm run dev

# Démarrage avec infos Turnstile (recommandé)
npm run dev:turnstile

# Vérifier la configuration
npm run check:turnstile

# Démarrage Windows
npm run dev:windows
```

## Debug & Logs

En mode développement, vous verrez automatiquement :

```
🔧 Turnstile en mode DÉVELOPPEMENT
📝 Utilisation des clés de test Cloudflare (toujours valides)
```

## Résolution de Problèmes

### Le widget ne s'affiche pas

1. **Vérifier la console** pour les erreurs JavaScript
2. **Vérifier la configuration** : `npm run check:turnstile`
3. **Redémarrer le serveur** : Ctrl+C puis `npm run dev:turnstile`

### Erreur "domaine non autorisé"

- Si vous utilisez de vraies clés, ajoutez `localhost` dans votre dashboard Cloudflare
- Ou utilisez les clés de test automatiques (aucune config requise)

### Le formulaire ne se soumet pas

- Les clés de test passent toujours la validation
- Vérifier les logs serveur pour d'autres erreurs
- Vérifier que l'API `/api/turnstile/verify` répond

## Avantages de cette Configuration

- ✅ **Démarrage immédiat** - Zéro configuration
- ✅ **Offline-friendly** - Fonctionne sans connexion Internet
- ✅ **Tests automatisés** - Validation toujours réussie
- ✅ **Pas de limites** - Requêtes illimitées
- ✅ **Switch facile** - Basculer vers vraies clés sans code changes

## Passage en Production

Quand vous êtes prêt pour la production :

1. **Créer des vraies clés** sur Cloudflare Dashboard
2. **Configurer les domaines** de production
3. **Variables d'environnement** :
   ```env
   NODE_ENV=production
   TURNSTILE_SECRET_KEY=cle_production
   TURNSTILE_SITE_KEY=cle_site_production
   ```

Le système basculera automatiquement ! 🎉
