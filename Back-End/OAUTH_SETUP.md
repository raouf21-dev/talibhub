# 🔐 Configuration OAuth pour TalibHub

Ce guide vous explique comment configurer l'authentification OAuth avec Google, Microsoft, GitHub et Facebook.

## 📋 Prérequis

1. **Base de données mise à jour** : Exécutez le script de migration dans DBeaver :

   ```sql
   -- Exécuter le contenu de migrations/oauth_migration.sql
   ```

2. **Dépendances installées** :

   ```bash
   cd Back-End
   npm install
   ```

3. **Variables d'environnement** : Créez un fichier `.env.development` avec :
   ```env
   # Configuration OAuth
   GOOGLE_CLIENT_ID=votre_google_client_id
   GOOGLE_CLIENT_SECRET=votre_google_client_secret
   MICROSOFT_CLIENT_ID=votre_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=votre_microsoft_client_secret
   GITHUB_CLIENT_ID=votre_github_client_id
   GITHUB_CLIENT_SECRET=votre_github_client_secret
   FACEBOOK_APP_ID=votre_facebook_app_id
   FACEBOOK_APP_SECRET=votre_facebook_app_secret
   ```

## 🔧 Configuration par Provider

### 1. 🌟 Google OAuth

#### Étape 1 : Créer un projet Google

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ dans "APIs & Services"

#### Étape 2 : Configurer OAuth 2.0

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configurez l'écran de consentement OAuth si nécessaire
4. Type d'application : "Web application"
5. Nom : "TalibHub Authentication"
6. URIs de redirection autorisés :
   - **Développement** : `http://localhost:4000/api/auth/google/callback`
   - **Production** : `https://talibhub.com/api/auth/google/callback`

#### Étape 3 : Récupérer les identifiants

```env
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
```

---

### 2. 🏢 Microsoft OAuth

#### Étape 1 : Créer une application Azure

1. Allez sur [Azure Portal](https://portal.azure.com/)
2. Recherchez "Azure Active Directory"
3. Allez dans "App registrations" > "New registration"

#### Étape 2 : Configurer l'application

1. Nom : "TalibHub Authentication"
2. Types de comptes pris en charge : "Accounts in any organizational directory and personal Microsoft accounts"
3. URI de redirection :
   - Type : "Web"
   - **Développement** : `http://localhost:4000/api/auth/microsoft/callback`
   - **Production** : `https://talibhub.com/api/auth/microsoft/callback`

#### Étape 3 : Configurer les autorisations

1. Allez dans "API permissions"
2. Ajoutez "Microsoft Graph" > "Delegated permissions"
3. Sélectionnez : `User.Read`, `email`, `profile`

#### Étape 4 : Créer un secret client

1. Allez dans "Certificates & secrets"
2. Cliquez sur "New client secret"
3. Description : "TalibHub OAuth Secret"
4. Expiration : 24 mois

#### Étape 5 : Récupérer les identifiants

```env
MICROSOFT_CLIENT_ID=votre_application_id
MICROSOFT_CLIENT_SECRET=votre_client_secret_value
```

---

### 3. 🐙 GitHub OAuth

#### Étape 1 : Créer une OAuth App

1. Allez dans [GitHub Developer Settings](https://github.com/settings/developers)
2. Cliquez sur "OAuth Apps" > "New OAuth App"

#### Étape 2 : Configurer l'application

1. Application name : "TalibHub Authentication"
2. Homepage URL :
   - **Développement** : `http://localhost:4000`
   - **Production** : `https://talibhub.com`
3. Authorization callback URL :
   - **Développement** : `http://localhost:4000/api/auth/github/callback`
   - **Production** : `https://talibhub.com/api/auth/github/callback`

#### Étape 3 : Récupérer les identifiants

```env
GITHUB_CLIENT_ID=votre_client_id
GITHUB_CLIENT_SECRET=votre_client_secret
```

---

### 4. 📘 Facebook OAuth

#### Étape 1 : Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur "My Apps" > "Create App"
3. Type : "Consumer" ou "Business"

#### Étape 2 : Ajouter Facebook Login

1. Dans le dashboard de votre app, cliquez sur "Add Product"
2. Trouvez "Facebook Login" et cliquez sur "Set Up"
3. Sélectionnez "Web"

#### Étape 3 : Configurer les URLs

1. Allez dans "Facebook Login" > "Settings"
2. Valid OAuth Redirect URIs :
   - **Développement** : `http://localhost:4000/api/auth/facebook/callback`
   - **Production** : `https://talibhub.com/api/auth/facebook/callback`

#### Étape 4 : Configurer les domaines

1. Allez dans "Settings" > "Basic"
2. App Domains :
   - **Développement** : `localhost`
   - **Production** : `talibhub.com`

#### Étape 5 : Récupérer les identifiants

```env
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
```

---

## 🚀 Lancement et Tests

### 1. Installer les dépendances

```bash
cd Back-End
npm install passport passport-google-oauth20 passport-microsoft passport-github2 passport-facebook
```

### 2. Appliquer les migrations

Exécutez dans DBeaver :

```sql
-- Contenu de Back-End/migrations/oauth_migration.sql
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

### 4. Tester l'authentification

1. Allez sur `http://localhost:4000`
2. Cliquez sur "Get Started"
3. Vous devriez voir les boutons OAuth sous les formulaires
4. Testez chaque provider

---

## 🔧 Configuration pour la Production

### Variables d'environnement de production

Créez `.env.production` avec :

```env
NODE_ENV=production
GOOGLE_CLIENT_ID=votre_prod_google_client_id
GOOGLE_CLIENT_SECRET=votre_prod_google_client_secret
MICROSOFT_CLIENT_ID=votre_prod_microsoft_client_id
MICROSOFT_CLIENT_SECRET=votre_prod_microsoft_client_secret
GITHUB_CLIENT_ID=votre_prod_github_client_id
GITHUB_CLIENT_SECRET=votre_prod_github_client_secret
FACEBOOK_APP_ID=votre_prod_facebook_app_id
FACEBOOK_APP_SECRET=votre_prod_facebook_app_secret
```

### URLs de callback en production

Tous les providers doivent avoir :

- URL de base : `https://talibhub.com`
- Callback : `https://talibhub.com/api/auth/{provider}/callback`

---

## 🛠️ Dépannage

### Erreur "redirect_uri_mismatch"

- Vérifiez que les URLs de callback correspondent exactement
- Assurez-vous d'utiliser HTTP en dev et HTTPS en prod

### Erreur "invalid_client"

- Vérifiez vos CLIENT_ID et CLIENT_SECRET
- Assurez-vous que l'application est bien configurée sur la console du provider

### Erreur "scope not authorized"

- Vérifiez les permissions accordées à votre application
- Pour Microsoft : assurez-vous d'avoir les permissions User.Read

### Utilisateur non créé après OAuth

- Vérifiez les logs du serveur
- Assurez-vous que la migration de base de données a été appliquée

---

## 📱 Utilisation

### Pour les utilisateurs

1. **Inscription OAuth** : Cliquez sur un bouton provider → Complétez le profil
2. **Connexion OAuth** : Cliquez sur un bouton provider → Redirection automatique

### Flux de données

1. Utilisateur clique sur un bouton OAuth
2. Redirection vers le provider
3. Autorisation par l'utilisateur
4. Callback avec les données utilisateur
5. Création/connexion automatique
6. Complétion du profil si nécessaire
7. Redirection vers le dashboard

---

## 🔒 Sécurité

### Recommandations

1. **Secrets** : Ne jamais exposer les CLIENT_SECRET
2. **HTTPS** : Obligatoire en production
3. **CORS** : Configuré uniquement pour vos domaines
4. **Validation** : Toutes les données OAuth sont validées côté serveur

### Variables sensibles

```env
# À garder SECRET
GOOGLE_CLIENT_SECRET=secret
MICROSOFT_CLIENT_SECRET=secret
GITHUB_CLIENT_SECRET=secret
FACEBOOK_APP_SECRET=secret
JWT_SECRET=secret
COOKIE_SECRET=secret
```

---

## 📚 Ressources supplémentaires

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
