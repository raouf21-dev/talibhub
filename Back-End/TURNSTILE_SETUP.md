# Configuration Cloudflare Turnstile pour TalibHub

## 1. Obtenir les clés Turnstile

### Étape 1 : Créer un compte Cloudflare

- Allez sur : https://dash.cloudflare.com/
- Créez un compte gratuit ou connectez-vous

### Étape 2 : Accéder à Turnstile

- Dans le tableau de bord Cloudflare, cherchez "Turnstile" dans le menu latéral
- Ou allez directement sur : https://dash.cloudflare.com/?to=/:account/turnstile

### Étape 3 : Créer un nouveau site

- Cliquez sur "Add Site"
- **Site name** : TalibHub
- **Domain** :
  - localhost (pour le développement)
  - votre-domaine.com (pour la production)
- **Widget mode** : Managed (recommandé)

### Étape 4 : Récupérer les clés

Vous obtiendrez :

- **Site Key** (publique) - pour le frontend
- **Secret Key** (privée) - pour le backend

## 2. Configuration Backend

### Ajouter les variables d'environnement dans `.env`

```env
# Turnstile Configuration
TURNSTILE_SECRET_KEY=votre_cle_secrete_ici
TURNSTILE_SITE_KEY=votre_cle_site_ici
```

### Ajouter les routes dans app.js

```javascript
// Dans Back-End/app.js
const turnstileRoutes = require("./routes/turnstileRoutes");
app.use("/api/turnstile", turnstileRoutes);
```

### Installer form-data si pas déjà fait

```bash
npm install form-data
```

## 3. Configuration Frontend

### Mettre à jour la clé dans turnstile.js

Dans `Front-End/components/auth/turnstile.js` :

```javascript
this.siteKey = "VOTRE_CLE_SITE_TURNSTILE"; // Remplacer par votre vraie clé
```

## 4. Utilisation dans votre application

### Remplacer l'ancien système CAPTCHA

Dans votre fichier principal (ex: main.js), remplacez :

```javascript
// Ancien import
import { initializeWelcomepageWithRecaptcha } from "./components/welcome/welcomePageRecaptcha.js";

// Nouveau import
import { initializeWelcomepageWithTurnstile } from "./components/welcome/welcomePageTurnstile.js";
```

Et dans l'initialisation :

```javascript
// Ancien appel
await initializeWelcomepageWithRecaptcha();

// Nouveau appel
await initializeWelcomepageWithTurnstile();
```

## 5. Styles CSS recommandés

Ajoutez ces styles à votre CSS :

```css
.turnstile-container {
  margin: 10px 0;
  display: flex;
  justify-content: center;
}

.captcha-info {
  margin-top: 5px;
  text-align: center;
  color: #666;
  font-size: 0.8rem;
}

.captcha-info a {
  color: #0066cc;
  text-decoration: none;
}

.captcha-info a:hover {
  text-decoration: underline;
}

/* Mode sombre */
@media (prefers-color-scheme: dark) {
  .captcha-info {
    color: #ccc;
  }

  .captcha-info a {
    color: #66b3ff;
  }
}
```

## 6. Test et débogage

### Tester en développement

1. Assurez-vous que `localhost` est dans vos domaines Turnstile
2. Vérifiez les clés dans la console réseau
3. Regardez les logs du serveur pour les réponses Turnstile

### Problèmes courants

- **Domaine non autorisé** : Ajoutez votre domaine dans la console Turnstile
- **Clé incorrecte** : Vérifiez que vous utilisez la bonne clé (site vs secrète)
- **Widget ne s'affiche pas** : Vérifiez que le container existe et que le script est chargé

### URLs de test Turnstile

Cloudflare fournit des clés de test :

- **Site Key (test)** : `1x00000000000000000000AA`
- **Secret Key (test)** : `1x0000000000000000000000000000000AA`

## 7. Avantages de Turnstile

### Comparé à reCAPTCHA

- ✅ **Gratuit et sans limite** (vs 1M requêtes/mois pour reCAPTCHA)
- ✅ **Plus respectueux de la vie privée** (pas de tracking Google)
- ✅ **Plus léger** (moins de JavaScript)
- ✅ **Meilleure performance** (CDN Cloudflare)
- ✅ **Interface moderne** et personnalisable

### Sécurité

- Protection contre les bots sophistiqués
- Analyse comportementale
- Défis adaptatifs selon le risque
- Intégration avec l'écosystème Cloudflare

## 8. Migration depuis l'ancien système

### Étapes de migration

1. Gardez l'ancien système en backup
2. Implémentez Turnstile en parallèle
3. Testez Turnstile sur un environnement de test
4. Basculez progressivement vers Turnstile
5. Supprimez l'ancien système une fois validé

### Rollback si nécessaire

Vous pouvez facilement revenir à l'ancien système en changeant l'import dans main.js.

## 9. Monitoring et maintenance

### Surveiller les performances

- Dashboard Cloudflare pour les statistiques
- Logs d'erreur côté serveur
- Métriques de conversion des formulaires

### Maintenance

- Aucune maintenance requise côté Turnstile
- Mises à jour automatiques du script
- Support 24/7 de Cloudflare
