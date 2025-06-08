// translations.js - Système de traduction dynamique moderne

// Configuration des traductions
const translations = {
  fr: {
    // Navigation principale
    "nav.dashboard": "Tableau de bord",
    "nav.todoLists": "Listes de Tâches",
    "nav.talibTimer": "TalibTimer",
    "nav.statistics": "Statistiques",
    "nav.salatSurahSelector": "Sélecteur de Sourate",
    "nav.duaTimeCalculator": "Temps de Doua",
    "nav.surahmemorization": "Mémorisation des Sourates",
    "nav.mosquetime": "Horaires de Prière à la Mosquée",

    // Menu profil
    "nav.profile": "Profil",
    "nav.notifications": "Notifications",
    "nav.contribution": "Contribution",
    "nav.contact": "Contact",
    "nav.aboutUs": "À propos de nous",
    "nav.theme": "Thème",
    "nav.logout": "Déconnexion",

    // Page d'accueil
    "welcome.title": "Bienvenue sur TalibHub",
    "welcome.subtitle":
      "Votre plateforme innovante pour l'apprentissage et la pratique islamique",
    "welcome.getStarted": "Commencer",
    "welcome.signup": "Inscription",
    "welcome.signin": "Connexion",

    // Fonctionnalités
    "features.title": "Nos Principales Fonctionnalités",
    "features.talibTimer": "TalibTimer",
    "features.talibTimerDesc": "Optimisez vos sessions d'étude et de pratique",

    // Authentification
    "auth.login": "Connexion",
    "auth.register": "Inscription",
    "auth.username": "Nom d'utilisateur",
    "auth.password": "Mot de passe",
    "auth.email": "Email",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.forgotPassword": "Mot de passe oublié ?",

    // Messages généraux
    "common.loading": "Chargement...",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.close": "Fermer",
    "common.confirm": "Confirmer",
    "common.success": "Succès",
    "common.error": "Erreur",

    // Dashboard
    "dashboard.welcomeTitle": "Bienvenue sur votre tableau de bord",
    "dashboard.mosqueTime": "Horaires de Prière à la Mosquée",
    "dashboard.surahSelector": "Sélecteur de Sourate",
    "dashboard.surahMemorisation": "Mémorisation des Sourates",
    "dashboard.duaTime": "Temps de Doua",
    "dashboard.talibTimer": "TalibTimer",

    // Apprentissage - TalibTimer
    "apprentissage.title": "Apprentissage",
    "apprentissage.taskSelection": "Sélection de tâche et session",
    "apprentissage.selectTask": "Sélectionnez une tâche",
    "apprentissage.previousSession": "Session précédente :",
    "apprentissage.currentSession": "Session actuelle :",
    "apprentissage.newSession": "Nouvelle Session",
    "apprentissage.focusTimer": "Minuteur de concentration",
    "apprentissage.stopwatch": "Chronomètre",
    "apprentissage.manualStudyTime": "Temps d'étude manuel",
    "apprentissage.hours": "Heures :",
    "apprentissage.minutes": "Minutes :",
    "apprentissage.totalTime": "Temps total de travail :",
    "apprentissage.totalWorkTime": "Temps total de travail :",
    "apprentissage.counter": "Compteur",
    "apprentissage.selectTaskCounter": "Sélectionnez une tâche",
    "apprentissage.pleaseStartNewSession":
      "Veuillez démarrer une nouvelle session",
    "apprentissage.newSessionInProgress": "Nouvelle Session en cours",
    "apprentissage.lastSessionFound": "Dernière session trouvée",
    "apprentissage.noOldSession": "Pas d'ancienne session",
    "apprentissage.loadingError": "Erreur de chargement",

    // Statistics
    "statistics.title": "Statistiques",
    "statistics.daily": "Statistiques Journalières",
    "statistics.weekly": "Statistiques Hebdomadaires",
    "statistics.monthly": "Statistiques Mensuelles",
    "statistics.yearly": "Statistiques Annuelles",
    "statistics.task": "Tâche",
    "statistics.timeMinutes": "Temps (min)",
    "statistics.counts": "Comptages",
    "statistics.viewDetails": "Voir les détails",

    // Todo Lists
    "todoLists.title": "Liste de tâches",
    "todoLists.myTasks": "Mes Tâches",
    "todoLists.selectAll": "Tout sélectionner",
    "todoLists.deleteSelected": "Supprimer la sélection",
    "todoLists.addTaskPlaceholder": "Ajouter une nouvelle tâche",
    "todoLists.addTaskBtn": "Ajouter une Tâche",

    // Mosquetime - Horaires de prière
    "mosquetime.title": "Horaires de Prière en Congrégation à la Mosquée",
    "mosquetime.subtitle":
      "Trouvez les horaires des prières en congrégation dans les mosquées près de chez vous",
    "mosquetime.singleMosque": "Mosquée Unique",
    "mosquetime.allMosques": "Toutes les Mosquées",
    "mosquetime.disclaimer":
      "Ces horaires correspondent aux prières en congrégation à la mosquée et peuvent différer des horaires de prières individuels.",
    "mosquetime.useLocation": "Utiliser ma localisation",
    "mosquetime.search": "Rechercher",
    "mosquetime.loading":
      "Chargement des horaires de prière, veuillez patienter...",
    "mosquetime.selectCity": "Sélectionnez une ville",
    "mosquetime.selectMosque": "Sélectionnez une mosquée",
    "mosquetime.aToZ": "A à Z",
    "mosquetime.zToA": "Z à A",
    "mosquetime.nearest": "Les Plus Proches",

    // Surah Memorization - Mémorisation des sourates
    "surahmemorization.title": "Mémorisation des sourates",
    "surahmemorization.selectSurah": "Sélectionner Sourate",
    "surahmemorization.revise": "Réviser",
    "surahmemorization.history": "Historique",
    "surahmemorization.levels.Strong": "Fort",
    "surahmemorization.levels.Good": "Bon",
    "surahmemorization.levels.Moderate": "Moyen",
    "surahmemorization.levels.Weak": "Faible",
    "surahmemorization.surahsSelected": "{count} sourates sélectionnées",
    "surahmemorization.selectForRevision":
      "Sélection des sourates pour révision",
    "surahmemorization.searchSurahs": "Rechercher des sourates",
    "surahmemorization.filterDefault": "Par défaut",
    "surahmemorization.filterMemorization": "Par niveau de mémorisation",
    "surahmemorization.filterAlphabetical": "Ordre alphabétique",
    "surahmemorization.filterNumerical": "Ordre numérique",
    "surahmemorization.headerSurahs": "Sourates",
    "surahmemorization.headerLevel": "Niveau",
    "surahmemorization.headerLastRevised": "Dernière révision",
    "surahmemorization.save": "Enregistrer",
    "surahmemorization.startRevision": "Commencer la révision",
    "surahmemorization.showText": "Afficher le texte",
    "surahmemorization.hideText": "Masquer le texte",
    "surahmemorization.rateMemorization":
      "Comment évaluez-vous votre mémorisation de cette sourate ?",
    "surahmemorization.strong": "Fort",
    "surahmemorization.good": "Bon",
    "surahmemorization.moderate": "Moyen",
    "surahmemorization.weak": "Faible",
    "surahmemorization.revisionHistory": "Historique des révisions",
    "surahmemorization.distributionLevels":
      "Distribution des Niveaux de Mémorisation",
    "surahmemorization.allLevels": "Tous les niveaux",
    "surahmemorization.tableHeaderName": "Nom de la sourate",
    "surahmemorization.tableHeaderNumber": "Numéro",
    "surahmemorization.tableHeaderDate": "Date de révision",
    "surahmemorization.tableHeaderLevel": "Niveau",
    "surahmemorization.tableHeaderNext": "Prochaine révision",
    "surahmemorization.export": "Exporter",
    "surahmemorization.clearHistory": "Effacer l'historique",

    // Notifications
    "notifications.title": "Notifications",
    "notifications.centerTitle": "Centre de Notifications",
    "notifications.markAsRead": "Marquer comme lu",
    "notifications.viewTitle": "Voir les notifications",

    // Profile
    "profile.title": "Profil",
    "profile.personalInfo": "Informations Personnelles",
    "profile.username": "Pseudo :",
    "profile.lastName": "Nom :",
    "profile.firstName": "Prénom :",
    "profile.age": "Âge :",
    "profile.gender": "Sexe :",
    "profile.email": "Adresse e-mail :",
    "profile.update": "Mettre à jour",
    "profile.changePassword": "Changer le mot de passe",
    "profile.currentPassword": "Mot de passe actuel :",
    "profile.newPassword": "Nouveau mot de passe :",
    "profile.confirmNewPassword": "Confirmer le nouveau mot de passe :",
    "profile.showPassword": "Afficher le mot de passe",
    "profile.selectGender": "Sélectionnez le sexe",
    "profile.male": "Masculin",
    "profile.female": "Féminin",

    // Surah Selector - Sélecteur de Sourate
    "surahselector.title": "Sélecteur de Sourate",
    "surahselector.recitationStats": "Statistiques de récitation",
    "surahselector.surahsToRecite": "Sourates à réciter :",
    "surahselector.progress": "Progrès :",
    "surahselector.surahsRecited": "sourates récitées",
    "surahselector.completeCycles": "Cycles de récitation complets :",
    "surahselector.selectionForSalat": "Sélection pour Salat",
    "surahselector.selectForSalat": "Sélectionner des sourates pour Salat",
    "surahselector.firstRaka": "1ère raka:",
    "surahselector.secondRaka": "2ème raka:",
    "surahselector.selectionToRecite": "Sélection des sourates à réciter",
    "surahselector.saveToRecite": "Sauvegarder les sourates à réciter",
    "surahselector.recitationHistory": "Historique des récitations",
    "surahselector.showHideHistory": "Afficher/Masquer l'historique",
    "surahselector.progressText":
      "Progrès : <strong>{recited} / {total}</strong> sourates récitées",
    "surahselector.cyclesText":
      "Cycles de récitation complets : <strong>{cycles}</strong>",

    // Dua Time Calculator
    "duaTimeCalculator.title": "Calculateur de Temps de Doua",
    "duaTimeCalculator.calculate":
      "Calculer le Dernier Tiers de la Nuit pour Doua",
    "duaTimeCalculator.useLocation": "Utiliser ma localisation",
    "duaTimeCalculator.enterCity": "Ou entrez une ville :",
    "duaTimeCalculator.submit": "Soumettre",
    "duaTimeCalculator.calculationMethod": "Méthode de Calcul :",
    "duaTimeCalculator.fajrAngle": "Angle de Fajr :",
    "duaTimeCalculator.ishaAngle": "Angle de Isha :",
    "duaTimeCalculator.automaticResult": "Résultat du Calcul Automatique",
    "duaTimeCalculator.manualAdjustments": "Ajustements Manuels",
    "duaTimeCalculator.fajrTime": "Heure de Fajr (HH:MM) :",
    "duaTimeCalculator.maghribTime": "Heure de Maghrib (HH:MM) :",
    "duaTimeCalculator.calculateManually": "Calculer Manuellement",
    "duaTimeCalculator.manualResult": "Résultat des Ajustements Manuels",
    // Traductions pour les résultats
    "duaTimeCalculator.results.fajr": "Fajr",
    "duaTimeCalculator.results.maghrib": "Maghrib",
    "duaTimeCalculator.results.ishaEnd": "Fin du temps d'Isha",
    "duaTimeCalculator.results.lastThird":
      "Le dernier tiers de la nuit commence à",

    // Price - Plans de contribution
    "price.title": "Choisissez Votre Contribution",
    "price.period": "/mois",
    "price.freeTitle": "Plan Gratuit",
    "price.freeDescription": "Accédez à toutes les fonctionnalités sans frais",
    "price.freePrice": "0€",
    "price.freeFeatures": "Fonctionnalités principales de la plateforme",
    "price.freeButton": "Commencer",
    "price.sustainerTitle": "Plan Soutien",
    "price.sustainerDescription":
      "Contribuez à couvrir les coûts opérationnels et assurez la disponibilité de la plateforme pour tous.",
    "price.sustainerPrice": "3€",
    "price.sustainerFeature1": "Accès à toutes les fonctionnalités",
    "price.sustainerFeature2":
      "Aide à maintenir la durabilité de la plateforme en couvrant les coûts opérationnels essentiels",
    "price.sustainerFeature3":
      "Soutenez notre mission de maintenir la plateforme gratuite et accessible à tous les utilisateurs",
    "price.sustainerFeature4":
      "Contribuez aux frais de serveur et de maintenance",
    "price.sustainerButton": "Contribuer Maintenant",
    "price.supporterTitle": "Plan Supporteur",
    "price.supporterDescription":
      "Aidez-nous à grandir, à nous améliorer et à innover en contribuant au-delà des coûts opérationnels.",
    "price.supporterPrice": "8€",
    "price.supporterFeature1": "Accès à toutes les fonctionnalités",
    "price.supporterFeature2":
      "Soutient le développement et la croissance de la plateforme, nous permettant d'ajouter de nouvelles fonctionnalités et d'améliorer l'expérience utilisateur",
    "price.supporterFeature3":
      "Contribuez à notre vision de créer une plateforme vibrante et innovante qui évolue continuellement",
    "price.supporterFeature4":
      "Votre générosité aide à financer de nouvelles initiatives et assure le succès à long terme des projets communautaires",
    "price.supporterFeature5":
      "Accès prioritaire aux nouvelles fonctionnalités et aux opportunités de test bêta",
    "price.supporterFeature6":
      "Reconnaissance en tant que supporteur clé dans notre communauté",
    "price.supporterFeature7":
      "Contenu exclusif et aperçus des développements futurs",
    "price.supporterButton": "Nous Soutenir",
    "price.footnote":
      "Merci de considérer le soutien de notre plateforme. Vos contributions aident à maintenir la plateforme ouverte et à l'améliorer continuellement.",

    // About Us
    "aboutus.title": "À propos de TalibHub",
    "aboutus.missionTitle": "Notre Mission",
    "aboutus.missionContent":
      "Chez TalibHub, notre mission est de soutenir l'apprentissage et la pratique de l'islam au quotidien. Nous offrons aux musulmans du monde entier des outils modernes et efficaces pour approfondir leur foi et améliorer leur pratique religieuse.",
    "aboutus.featuresTitle": "Nos Fonctionnalités",
    "aboutus.featureTalibTimer":
      "TalibTimer : Gestion du temps d'étude avec technique Pomodoro, chronomètre et compteur",
    "aboutus.featureSurahSelector":
      "SurahSelector : Diversification des sourates pour la prière",
    "aboutus.featureSurahMemorization":
      "Surah Memorization : Maintien de la mémorisation des sourates",
    "aboutus.featureDuaTime":
      "Dua Time Calculator : Calcul du dernier tiers de la nuit pour les invocations",
    "aboutus.featureMosquetime":
      "Mosquetime : Horaires des prières en congrégation dans les mosquées",
    "aboutus.valuesTitle": "Nos Valeurs",
    "aboutus.valueCommitment": "Engagement envers les principes islamiques",
    "aboutus.valueInnovation": "Innovation dans l'éducation religieuse",
    "aboutus.valueAccessibility": "Accessibilité universelle",
    "aboutus.valueCommunity": "Développement communautaire",
    "aboutus.valueImprovement": "Amélioration continue de nos services",
    "aboutus.futureTitle": "Notre Avenir",
    "aboutus.futureContent":
      "TalibHub est en constante évolution. In Sha Allah, nous prévoyons d'enrichir notre plateforme avec de nombreuses nouvelles fonctionnalités innovantes pour mieux servir notre communauté d'utilisateurs.",
    "aboutus.commitmentTitle": "Notre Engagement",
    "aboutus.commitmentContent":
      "TalibHub s'engage à fournir une plateforme gratuite et accessible à tous. Notre modèle unique repose sur la générosité de nos utilisateurs, avec des abonnements conçus pour les altruistes qui souhaitent contribuer au développement et à la propagation de la plateforme.",

    // Contact Form
    "contactform.title": "Contactez-nous",
    "contactform.talkAbout":
      'Discutons<br />de quelque chose de<br /><span class="contactform-highlight">génial</span><br />ensemble',

    // Titre de l'application
    "app.title": "TalibHub - Plateforme Islamique",
  },

  en: {
    // Navigation principale
    "nav.dashboard": "Dashboard",
    "nav.todoLists": "Todo Lists",
    "nav.talibTimer": "TalibTimer",
    "nav.statistics": "Statistics",
    "nav.salatSurahSelector": "Surah Selector",
    "nav.duaTimeCalculator": "Dua Time Calculator",
    "nav.surahmemorization": "Surah Memorization",
    "nav.mosquetime": "Mosque Prayer Times",

    // Menu profil
    "nav.profile": "Profile",
    "nav.notifications": "Notifications",
    "nav.contribution": "Contribution",
    "nav.contact": "Contact",
    "nav.aboutUs": "About Us",
    "nav.theme": "Theme",
    "nav.logout": "Logout",

    // Page d'accueil
    "welcome.title": "Welcome to TalibHub",
    "welcome.subtitle":
      "Your innovative platform for Islamic learning and practice",
    "welcome.getStarted": "Get Started",
    "welcome.signup": "Sign Up",
    "welcome.signin": "Sign In",

    // Fonctionnalités
    "features.title": "Our Main Features",
    "features.talibTimer": "Talib Timer",
    "features.talibTimerDesc": "Optimise your study and practice sessions",

    // Authentification
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.email": "Email",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot Password?",

    // Messages généraux
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.success": "Success",
    "common.error": "Error",

    // Dashboard
    "dashboard.welcomeTitle": "Welcome to Your Dashboard",
    "dashboard.mosqueTime": "Salat Mosque Time",
    "dashboard.surahSelector": "Surah Selector",
    "dashboard.surahMemorisation": "Surah Memorisation",
    "dashboard.duaTime": "Dua Time",
    "dashboard.talibTimer": "Talib Timer",

    // Apprentissage - TalibTimer
    "apprentissage.title": "Learning",
    "apprentissage.taskSelection": "Task Selection and Session",
    "apprentissage.selectTask": "Select a task",
    "apprentissage.previousSession": "Previous session:",
    "apprentissage.currentSession": "Current session:",
    "apprentissage.newSession": "New Session",
    "apprentissage.focusTimer": "Focus Timer",
    "apprentissage.stopwatch": "Stopwatch",
    "apprentissage.manualStudyTime": "Manual Study Time",
    "apprentissage.hours": "Hours:",
    "apprentissage.minutes": "Minutes:",
    "apprentissage.totalTime": "Total Work Time:",
    "apprentissage.totalWorkTime": "Total Work Time:",
    "apprentissage.counter": "Counter",
    "apprentissage.selectTaskCounter": "Select a task",
    "apprentissage.pleaseStartNewSession": "Please start a new session",
    "apprentissage.newSessionInProgress": "New Session in Progress",
    "apprentissage.lastSessionFound": "Last session found",
    "apprentissage.noOldSession": "No old session",
    "apprentissage.loadingError": "Loading error",

    // Statistics
    "statistics.title": "Statistics",
    "statistics.daily": "Daily Statistics",
    "statistics.weekly": "Weekly Statistics",
    "statistics.monthly": "Monthly Statistics",
    "statistics.yearly": "Yearly Statistics",
    "statistics.task": "Task",
    "statistics.timeMinutes": "Time (min)",
    "statistics.counts": "Counts",
    "statistics.viewDetails": "View details",

    // Todo Lists
    "todoLists.title": "Task List",
    "todoLists.myTasks": "My Tasks",
    "todoLists.selectAll": "Select All",
    "todoLists.deleteSelected": "Delete Selected",
    "todoLists.addTaskPlaceholder": "Add a new task",
    "todoLists.addTaskBtn": "Add a Task",

    // Mosquetime - Prayer times
    "mosquetime.title": "Congregational Prayer Times at the Mosque",
    "mosquetime.subtitle":
      "Find congregational prayer times in mosques near you",
    "mosquetime.singleMosque": "Single Mosque",
    "mosquetime.allMosques": "All Mosques",
    "mosquetime.disclaimer":
      "These times correspond to congregational prayers at the mosque and may differ from individual prayer times.",
    "mosquetime.useLocation": "Use my location",
    "mosquetime.search": "Search",
    "mosquetime.loading": "Loading prayer times, please wait...",
    "mosquetime.selectCity": "Select a city",
    "mosquetime.selectMosque": "Select a mosque",
    "mosquetime.aToZ": "A to Z",
    "mosquetime.zToA": "Z to A",
    "mosquetime.nearest": "Nearest",

    // Surah Memorization - Mémorisation des sourates
    "surahmemorization.title": "Surah Memorisation",
    "surahmemorization.selectSurah": "Select Surah",
    "surahmemorization.revise": "Revise",
    "surahmemorization.history": "History",
    "surahmemorization.levels.Strong": "Strong",
    "surahmemorization.levels.Good": "Good",
    "surahmemorization.levels.Moderate": "Moderate",
    "surahmemorization.levels.Weak": "Weak",
    "surahmemorization.surahsSelected": "{count} surahs selected",
    "surahmemorization.selectForRevision": "Select Surahs for Revision",
    "surahmemorization.searchSurahs": "Search Surahs",
    "surahmemorization.filterDefault": "Default",
    "surahmemorization.filterMemorization": "By Memorisation Level",
    "surahmemorization.filterAlphabetical": "Alphabetical Order",
    "surahmemorization.filterNumerical": "Numerical Order",
    "surahmemorization.headerSurahs": "Surahs",
    "surahmemorization.headerLevel": "Level",
    "surahmemorization.headerLastRevised": "Last Revised",
    "surahmemorization.save": "Save",
    "surahmemorization.startRevision": "Start Revision",
    "surahmemorization.showText": "Show Text",
    "surahmemorization.hideText": "Hide Text",
    "surahmemorization.rateMemorization":
      "How do you rate your memorisation of this surah?",
    "surahmemorization.strong": "Strong",
    "surahmemorization.good": "Good",
    "surahmemorization.moderate": "Moderate",
    "surahmemorization.weak": "Weak",
    "surahmemorization.revisionHistory": "Revision History",
    "surahmemorization.distributionLevels":
      "Distribution of Memorisation Levels",
    "surahmemorization.allLevels": "All levels",
    "surahmemorization.tableHeaderName": "Surah Name",
    "surahmemorization.tableHeaderNumber": "Number",
    "surahmemorization.tableHeaderDate": "Revision Date",
    "surahmemorization.tableHeaderLevel": "Level",
    "surahmemorization.tableHeaderNext": "Next Revision",
    "surahmemorization.export": "Export Data",
    "surahmemorization.clearHistory": "Clear History",

    // Notifications
    "notifications.title": "Notifications",
    "notifications.centerTitle": "Notification Center",
    "notifications.markAsRead": "Mark as Read",
    "notifications.viewTitle": "View notifications",

    // Profile
    "profile.title": "Profile",
    "profile.personalInfo": "Personal Information",
    "profile.username": "Username:",
    "profile.lastName": "Last Name:",
    "profile.firstName": "First Name:",
    "profile.age": "Age:",
    "profile.gender": "Gender:",
    "profile.email": "Email Address:",
    "profile.update": "Update",
    "profile.changePassword": "Change Password",
    "profile.currentPassword": "Current Password:",
    "profile.newPassword": "New Password:",
    "profile.confirmNewPassword": "Confirm New Password:",
    "profile.showPassword": "Show Password",
    "profile.selectGender": "Select Gender",
    "profile.male": "Male",
    "profile.female": "Female",

    // Surah Selector - Sélecteur de Sourate
    "surahselector.title": "Surah Selector",
    "surahselector.recitationStats": "Recitation Statistics",
    "surahselector.surahsToRecite": "Surahs to Recite:",
    "surahselector.progress": "Progress:",
    "surahselector.surahsRecited": "surahs recited",
    "surahselector.completeCycles": "Complete Recitation Cycles:",
    "surahselector.selectionForSalat": "Selection for Salat",
    "surahselector.selectForSalat": "Select Surahs for Salat",
    "surahselector.firstRaka": "1st raka:",
    "surahselector.secondRaka": "2nd raka:",
    "surahselector.selectionToRecite": "Selection of Surahs to Recite",
    "surahselector.saveToRecite": "Save Surahs to Recite",
    "surahselector.recitationHistory": "Recitation History",
    "surahselector.showHideHistory": "Show/Hide History",
    "surahselector.progressText":
      "Progress: <strong>{recited} / {total}</strong> surahs recited",
    "surahselector.cyclesText":
      "Complete Recitation Cycles: <strong>{cycles}</strong>",

    // Dua Time Calculator
    "duaTimeCalculator.title": "Dua Time Calculator",
    "duaTimeCalculator.calculate": "Calculate Last Third of the Night for Dua",
    "duaTimeCalculator.useLocation": "Use My Location",
    "duaTimeCalculator.enterCity": "Or enter a city:",
    "duaTimeCalculator.submit": "Submit",
    "duaTimeCalculator.calculationMethod": "Calculation Method:",
    "duaTimeCalculator.fajrAngle": "Fajr Angle:",
    "duaTimeCalculator.ishaAngle": "Isha Angle:",
    "duaTimeCalculator.automaticResult": "Automatic Calculation Result",
    "duaTimeCalculator.manualAdjustments": "Manual Adjustments",
    "duaTimeCalculator.fajrTime": "Fajr Time (HH:MM):",
    "duaTimeCalculator.maghribTime": "Maghrib Time (HH:MM):",
    "duaTimeCalculator.calculateManually": "Calculate Manually",
    "duaTimeCalculator.manualResult": "Manual Adjustments Result",
    // Traductions pour les résultats
    "duaTimeCalculator.results.fajr": "Fajr",
    "duaTimeCalculator.results.maghrib": "Maghrib",
    "duaTimeCalculator.results.ishaEnd": "End of Isha time",
    "duaTimeCalculator.results.lastThird": "Last third of the night starts at",

    // Price - Contribution plans
    "price.title": "Choose Your Contribution",
    "price.period": "/month",
    "price.freeTitle": "Free Plan",
    "price.freeDescription": "Access all features without cost",
    "price.freePrice": "$0",
    "price.freeFeatures": "Main platform features",
    "price.freeButton": "Get Started",
    "price.sustainerTitle": "Sustainer Plan",
    "price.sustainerDescription":
      "Contribute to cover operational costs and ensure the platform remains available for everyone.",
    "price.sustainerPrice": "$3",
    "price.sustainerFeature1": "Access to all the features",
    "price.sustainerFeature2":
      "Helps maintain platform sustainability by covering essential operational costs",
    "price.sustainerFeature3":
      "Support our mission to keep the platform free and accessible for all users",
    "price.sustainerFeature4": "Contribute to server and maintenance fees",
    "price.sustainerButton": "Contribute Now",
    "price.supporterTitle": "Supporter Plan",
    "price.supporterDescription":
      "Help us grow, improve, and innovate by contributing beyond operational costs.",
    "price.supporterPrice": "$8",
    "price.supporterFeature1": "Access to all the features",
    "price.supporterFeature2":
      "Supports platform development and growth, allowing us to add new features and improve user experience",
    "price.supporterFeature3":
      "Contribute to our vision of creating a vibrant, innovative platform that continuously evolves",
    "price.supporterFeature4":
      "Your generosity helps fund new initiatives and ensures the long-term success of community projects",
    "price.supporterFeature5":
      "Priority access to new features and beta testing opportunities",
    "price.supporterFeature6":
      "Recognition as a key supporter in our community",
    "price.supporterFeature7":
      "Exclusive content and insights into future developments",
    "price.supporterButton": "Support Us",
    "price.footnote":
      "Thank you for considering supporting our platform. Your contributions help keep the platform open and continuously improve.",

    // About Us
    "aboutus.title": "About TalibHub",
    "aboutus.missionTitle": "Our Mission",
    "aboutus.missionContent":
      "At TalibHub, our mission is to support the learning and practice of Islam on a daily basis. We offer Muslims worldwide modern and effective tools to deepen their faith and improve their religious practice.",
    "aboutus.featuresTitle": "Our Features",
    "aboutus.featureTalibTimer":
      "Talib Timer: Study time management with Pomodoro technique, stopwatch, and counter",
    "aboutus.featureSurahSelector":
      "Surah Selector: Diversify your prayer surahs",
    "aboutus.featureSurahMemorization":
      "Surah Memorisation: Maintain surah memorisation",
    "aboutus.featureDuaTime":
      "Dua Time Calculator: Calculate the last third of the night for invocations",
    "aboutus.featureMosquetime":
      "Mosquetime: Congregational prayer times at mosques",
    "aboutus.valuesTitle": "Our Values",
    "aboutus.valueCommitment": "Commitment to Islamic principles",
    "aboutus.valueInnovation": "Innovation in religious education",
    "aboutus.valueAccessibility": "Universal accessibility",
    "aboutus.valueCommunity": "Community development",
    "aboutus.valueImprovement": "Continuous improvement of our services",
    "aboutus.futureTitle": "Our Future",
    "aboutus.futureContent":
      "TalibHub is constantly evolving. In Sha Allah, we plan to enrich our platform with many new innovative features to better serve our user community.",
    "aboutus.commitmentTitle": "Our Commitment",
    "aboutus.commitmentContent":
      "TalibHub is committed to providing a free and accessible platform to everyone. Our unique model relies on the generosity of our users, with subscriptions designed for altruists who wish to contribute to the development and dissemination of the platform.",

    // Contact Form
    "contactform.title": "Contact Us",
    "contactform.talkAbout":
      'Let\'s talk<br />about something<br /><span class="contactform-highlight">awesome</span><br />together',

    // Titre de l'application
    "app.title": "TalibHub - Islamic Platform",
  },
};

// Gestionnaire de traductions moderne
class TranslationManager {
  constructor() {
    this.currentLang = this.getStoredLanguage() || this.getBrowserLanguage();
    this.observers = [];
    this.isInitialized = false;
  }

  // Obtenir la langue stockée
  getStoredLanguage() {
    return localStorage.getItem("userLang");
  }

  // Détecter la langue du navigateur
  getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith("fr") ? "fr" : "en";
  }

  // Changer la langue SANS redirection
  changeLanguage(lang) {
    if (lang !== this.currentLang && translations[lang]) {
      console.log(
        `[TRANSLATION] Changement de langue: ${this.currentLang} → ${lang}`
      );

      this.currentLang = lang;
      localStorage.setItem("userLang", lang);

      // Nettoyer les données accumulées pour éviter les problèmes après plusieurs changements
      this.cleanupTranslationData();

      // Mettre à jour l'attribut HTML
      document.documentElement.lang = lang;

      // Appliquer les traductions immédiatement
      this.applyTranslations();

      // Mettre à jour les boutons de langue
      this.updateLanguageButtons();

      // Notifier les observateurs
      this.notifyObservers(lang);

      // Déclencher l'événement personnalisé pour compatibilité
      const event = new CustomEvent("languageChanged", {
        detail: { language: lang },
      });
      document.dispatchEvent(event);

      console.log(`[TRANSLATION] Langue changée avec succès vers: ${lang}`);
    }
  }

  // Nettoyer les données de traduction accumulées
  cleanupTranslationData() {
    // Nettoyer les attributs temporaires qui pourraient s'accumuler
    document
      .querySelectorAll("[data-original-structure]")
      .forEach((element) => {
        // Garder seulement la structure la plus récente
        const currentStructure = element.getAttribute(
          "data-original-structure"
        );
        if (currentStructure && currentStructure !== element.innerHTML) {
          // Si la structure a changé, mettre à jour l'attribut
          element.setAttribute("data-original-structure", element.innerHTML);
        }
      });

    // Nettoyer les ID de préservation qui pourraient trainer
    document.querySelectorAll("[data-preserve-id]").forEach((element) => {
      element.removeAttribute("data-preserve-id");
    });

    console.log("[TRANSLATION] Nettoyage des données temporaires effectué");
  }

  // Obtenir une traduction
  t(key, fallback = key) {
    return (
      translations[this.currentLang]?.[key] ||
      translations.en?.[key] ||
      fallback
    );
  }

  // Appliquer les traductions à tous les éléments
  applyTranslations() {
    console.log(
      `[TRANSLATION] Application des traductions en ${this.currentLang}`
    );

    // Éléments avec attribut data-translate
    document.querySelectorAll("[data-translate]").forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translation = this.t(key);

      if (
        element.tagName === "INPUT" &&
        (element.type === "text" ||
          element.type === "email" ||
          element.type === "password")
      ) {
        element.placeholder = translation;
      } else if (element.tagName === "OPTION") {
        // Traitement spécial pour les options
        element.textContent = translation;
      } else {
        // Cas spéciaux pour certains éléments
        if (element.classList.contains("total-time")) {
          // Pour total-time, remplacer seulement le texte avant le span
          const span = element.querySelector("span");
          if (span) {
            // Reconstruit le contenu avec la traduction
            element.innerHTML = `${translation} ${span.outerHTML}`;
          } else {
            element.textContent = translation;
          }
        } else if (element.id === "counter-task-title") {
          // Pour counter-task-title, traduction directe
          element.textContent = translation;
        } else {
          // Vérifier si l'élément contient des icônes ou éléments HTML
          const hasIcons = element.querySelector(
            "i, svg, .icon, [data-feather]"
          );
          const hasSpecialContent = element.querySelector(
            "span.icon, .fas, .far, .fab"
          );
          const hasHTMLContent = element.children.length > 0;
          const hasComplexContent = element.innerHTML !== element.textContent;

          if (
            hasIcons ||
            hasSpecialContent ||
            hasHTMLContent ||
            hasComplexContent ||
            element.innerHTML.includes("<") ||
            element.innerHTML.includes("&")
          ) {
            // Pour les éléments avec contenu HTML complexe, utiliser la méthode robuste
            this.translateElementWithIcons(element, translation);
          } else {
            // Pour les éléments avec seulement du texte, utiliser textContent
            element.textContent = translation;
          }
        }
      }
    });

    // Éléments avec attribut data-translate-title
    document.querySelectorAll("[data-translate-title]").forEach((element) => {
      const key = element.getAttribute("data-translate-title");
      element.title = this.t(key);
    });

    // Éléments avec attribut data-translate-placeholder
    document
      .querySelectorAll("[data-translate-placeholder]")
      .forEach((element) => {
        const key = element.getAttribute("data-translate-placeholder");
        element.placeholder = this.t(key);
      });

    // Mettre à jour le titre de la page
    const titleKey = document.documentElement.getAttribute(
      "data-translate-title-page"
    );
    if (titleKey) {
      document.title = this.t(titleKey, "TalibHub");
    }
  }

  // Traduire un élément contenant des icônes en préservant le HTML
  translateElementWithIcons(element, translation) {
    // Cas spécial pour les éléments avec traductions HTML complètes (contactform-title, etc.)
    if (translation.includes("<br") || translation.includes("<span")) {
      // Pour les traductions avec HTML, remplacer directement
      element.innerHTML = translation;
    } else {
      // Approche robuste pour les autres cas : utiliser un cache de la structure originale
      if (!element.hasAttribute("data-original-structure")) {
        element.setAttribute("data-original-structure", element.innerHTML);
      }

      // Obtenir la structure originale
      const originalHTML = element.getAttribute("data-original-structure");

      // Créer un élément temporaire pour analyser la structure
      const tempElement = document.createElement("div");
      tempElement.innerHTML = originalHTML;

      // Extraire le texte original (sans les balises HTML)
      const originalText =
        tempElement.textContent || tempElement.innerText || "";

      // Si on trouve du texte original, le remplacer par la traduction
      if (originalText.trim()) {
        // Remplacer le texte dans la structure HTML originale
        const translatedHTML = originalHTML.replace(
          originalText.trim(),
          translation
        );
        element.innerHTML = translatedHTML;
      } else {
        // Fallback simple si pas de texte détecté
        element.innerHTML = `${translation}`;
      }
    }

    // Re-initialiser Feather icons de manière sécurisée
    this.reinitializeFeatherIcons(element);
  }

  // Méthode sécurisée pour réinitialiser les icônes Feather
  reinitializeFeatherIcons(container = document) {
    try {
      if (window.feather && typeof window.feather.replace === "function") {
        // Réinitialiser seulement dans le conteneur spécifique
        const featherElements = container.querySelectorAll("[data-feather]");
        featherElements.forEach((el) => {
          if (!el.innerHTML || el.innerHTML.trim() === "") {
            window.feather.replace({ elements: [el] });
          }
        });

        // Fallback: réinitialiser tout si nécessaire
        if (featherElements.length === 0) {
          window.feather.replace();
        }
      }
    } catch (error) {
      console.warn(
        "[TRANSLATION] Erreur lors de la réinitialisation des icônes Feather:",
        error
      );
    }
  }

  // Traduire un contenu dynamique avec des variables
  translateDynamic(key, variables = {}) {
    let translation = this.t(key);

    // Remplacer les variables dans la traduction
    Object.keys(variables).forEach((varKey) => {
      const placeholder = `{${varKey}}`;
      translation = translation.replace(
        new RegExp(placeholder, "g"),
        variables[varKey]
      );
    });

    return translation;
  }

  // Mettre à jour un élément avec du contenu dynamique traduit
  updateDynamicElement(elementId, key, variables = {}) {
    const element = document.getElementById(elementId);
    if (element) {
      const translation = this.translateDynamic(key, variables);
      element.innerHTML = translation;
    }
  }

  // Ajouter un observateur pour les changements de langue
  addObserver(callback) {
    this.observers.push(callback);
  }

  // Alias pour addObserver (compatibilité)
  onLanguageChange(callback) {
    this.addObserver(callback);
  }

  // Notifier tous les observateurs
  notifyObservers(lang) {
    this.observers.forEach((callback) => {
      try {
        callback(lang);
      } catch (error) {
        console.error("Erreur dans un observateur de traduction:", error);
      }
    });
  }

  // Initialiser le système de traductions
  initialize() {
    if (this.isInitialized) return;

    console.log("[TRANSLATION] Initialisation du système de traductions");

    // Appliquer les traductions initiales
    this.applyTranslations();

    // Configurer les boutons de langue
    this.setupLanguageButtons();

    // Observer les changements DOM pour les nouveaux éléments
    this.setupDOMObserver();

    this.isInitialized = true;
    console.log(
      `[TRANSLATION] Système initialisé avec la langue: ${this.currentLang}`
    );
  }

  // Configurer les boutons de changement de langue
  setupLanguageButtons() {
    document.querySelectorAll(".lang-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const lang = button.getAttribute("data-lang");
        if (lang) {
          this.changeLanguage(lang);
        }
      });
    });

    // Mettre à jour l'état visuel des boutons
    this.updateLanguageButtons();
  }

  // Mettre à jour l'état visuel des boutons de langue
  updateLanguageButtons() {
    document.querySelectorAll(".lang-btn").forEach((button) => {
      const lang = button.getAttribute("data-lang");
      if (lang === this.currentLang) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  // Observer les changements DOM pour appliquer les traductions aux nouveaux éléments
  setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node.hasAttribute("data-translate") ||
                node.querySelector("[data-translate]"))
            ) {
              shouldUpdate = true;
            }
          });
        }
      });
      if (shouldUpdate) {
        this.applyTranslations();
        this.updateLanguageButtons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Créer une instance globale
const translationManager = new TranslationManager();

// Initialiser automatiquement quand le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    translationManager.initialize();
  });
} else {
  translationManager.initialize();
}

// Exposer globalement pour compatibilité
window.translationManager = translationManager;

// Exports pour les modules ES6
export { translationManager, TranslationManager, translations };
export default translationManager;
