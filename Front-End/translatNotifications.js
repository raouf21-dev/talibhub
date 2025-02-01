//translatNotifications.js

export const translations = {
  fr: {
    notifications: {
      success: {
        // --- Tâches ---
        'task.added': 'Tâche ajoutée avec succès',
        'task.updated': 'Tâche mise à jour avec succès',
        'task.deleted': 'Tâche supprimée avec succès',
        'tasks.deleted': '{count} tâches supprimées avec succès',

        // --- Timer et Sessions ---
        'timer.manual_time_added': 'Temps manuel ajouté avec succès',
        'timer.duration_updated': 'Durée du timer mise à jour avec succès',
        'timer.work_complete': 'Session de travail terminée !',
        'timer.break_complete': 'Pause terminée !',
        'stopwatch.reset.success': 'Chronomètre réinitialisé',
        'session.restored': 'Session restaurée avec succès',
        'session.started': 'Nouvelle session démarrée',
        'session.saved': 'Session sauvegardée avec succès',
        'timer.settings.saved': 'Paramètres du timer sauvegardés',

        // --- Sourates ---
        'surah.memorization.saved': 'Sourates connues enregistrées avec succès',
        'surah.update.success': 'Sourate mise à jour avec succès',
        'surah.revision.complete': 'Révision terminée avec succès !',
        'surah.history.cleared': 'Historique réinitialisé avec succès',
        'surah.export.success': 'Données exportées avec succès',
        'surah.revision.congratulations': 'Félicitations, tu as terminé ta session de révision !',

        // --- Mosquées ---
        'mosque.city.selected': 'Ville sélectionnée avec succès',
        'mosque.location.found': 'Ville la plus proche trouvée',
        'mosque.data.updated': 'Horaires mis à jour avec succès',

        // --- Duas ---
        'dua.times.loaded': 'Horaires chargés avec succès',
        'dua.calculation.success': 'Calcul effectué avec succès',

        // --- Authentification ---
        'auth.signup.success': 'Inscription réussie! Redirection...',
        'auth.signin.success': 'Connexion réussie! Redirection...',
        'auth.countries.loaded': 'Liste des pays chargée avec succès',

        // --- Profil ---
        'profile.load.success': 'Profil chargé avec succès',
        'profile.update.success': 'Profil mis à jour avec succès',
        'profile.password.success': 'Mot de passe changé avec succès'
      },
      
      warning: {
        // --- Timer et Sessions ---
        'timer.invalid_duration': 'Durée invalide. Elle doit être entre 1 et 120 minutes',
        'session.required': 'Une session active est requise',
        'session.required_timer': 'Session active requise pour utiliser le timer',
        'session.required_stopwatch': 'Session active requise pour utiliser le chronomètre',
        'session.required_manual': 'Session active requise pour ajouter du temps manuel',
        'session.required_counter': 'Session active requise pour utiliser le compteur',
        'session.already_active': 'Une session est déjà active',
        'session.select_task': 'Veuillez sélectionner une tâche',
        'time.invalid': 'Durée invalide',

        // --- Tâches ---
        'task.exists': 'Une tâche avec ce nom existe déjà',
        'task.empty': 'Le nom de la tâche ne peut pas être vide',

        // --- Sourates ---
        'surah.memorization.select': 'Veuillez sélectionner au moins une sourate à réviser',
        'surah.memorization.save': 'Veuillez sélectionner au moins une sourate à enregistrer',

        // --- Mosquées ---
        'mosque.no_city': 'Veuillez sélectionner une ville',
        'mosque.no_mosques': 'Aucune mosquée trouvée dans cette ville',
        'mosque.no_times': 'Aucun horaire disponible pour cette date',

        // --- Duas ---
        'dua.city.empty': 'Veuillez entrer un nom de ville',
        'dua.angles.required': 'Veuillez saisir les angles de Fajr et Isha pour la méthode personnalisée',

        // --- Authentification ---
        'auth.terms.required': 'Veuillez accepter les Conditions Générales d\'Utilisation',
        'auth.captcha.required': 'Veuillez valider le captcha',
        'auth.required.fields': 'Veuillez remplir tous les champs obligatoires',
        'auth.email.mismatch': 'Les adresses email ne correspondent pas',
        'auth.password.mismatch': 'Les mots de passe ne correspondent pas',
        'auth.country.notfound': 'Aucun pays trouvé',

        // --- Profil ---
        'profile.password.mismatch': 'Les nouveaux mots de passe ne correspondent pas',
        'profile.password.weak': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial'
      },
      
      info: {
        // --- Timer et Sessions ---
        'timer.work_session_started': 'Session de travail démarrée',
        'timer.break_session_started': 'Pause démarrée',
        'timer.settings_loading': 'Chargement des paramètres du timer...',
        'session.loading': 'Chargement de la session...',

        // --- Mosquées ---
        'mosque.geolocation.searching': 'Recherche de votre position...',
        'mosque.data.updating': 'Mise à jour des horaires en cours...',

        // --- Duas ---
        'dua.geolocation.searching': 'Recherche de votre position...',
        'dua.times.calculating': 'Calcul des horaires en cours...',

        // --- Authentification ---
        'auth.email.checking': 'Vérification des emails...',
        'auth.form.validating': 'Validation du formulaire...'
        // La clé 'auth.countries.loading' a été supprimée pour ne plus afficher la notification de chargement
      },
      
      error: {
        // --- Timer et Sessions ---
        'session.init_error': 'Erreur lors de l\'initialisation de la session',
        'session.load_error': 'Erreur lors du chargement de la session',
        'session.save_error': 'Erreur lors de la sauvegarde de la session',
        'session.cache_save_error': 'Erreur lors de la sauvegarde en cache',
        'timer.settings_load_error': 'Erreur lors du chargement des paramètres du timer',
        'timer.settings_save_error': 'Erreur lors de la sauvegarde des paramètres du timer',
        'timer.start_error': 'Erreur lors du démarrage du timer',
        'timer.save.error': 'Erreur lors de la sauvegarde du timer',

        // --- Tâches ---
        'task.add.error': 'Erreur lors de l\'ajout de la tâche',
        'task.update.error': 'Erreur lors de la mise à jour de la tâche',
        'task.delete.error': 'Erreur lors de la suppression de la tâche',
        'tasks.delete.error': 'Erreur lors de la suppression des tâches',
        'tasks.load.error': 'Erreur lors du chargement des tâches',

        // --- Sourates ---
        'surah.load.error': 'Erreur lors du chargement des sourates',
        'surah.update.error': 'Erreur lors de la mise à jour de la sourate',
        'surah.save.error': 'Erreur lors de l\'enregistrement des sourates connues',
        'surah.history.error': 'Erreur lors du chargement de l\'historique',
        'surah.history.clear.error': 'Erreur lors de la réinitialisation de l\'historique',
        'surah.export.error': 'Erreur lors de l\'exportation des données',

        // --- Mosquées ---
        'mosque.load.error': 'Erreur lors du chargement des mosquées',
        'mosque.geolocation.unsupported': 'La géolocalisation n\'est pas supportée par votre navigateur',
        'mosque.geolocation.error': 'Erreur lors de la géolocalisation',
        'mosque.data.error': 'Erreur lors de la récupération des horaires',
        'mosque.city.error': 'Erreur lors de la sélection de la ville',
        'mosque.nearest.error': 'Aucune ville trouvée près de votre position',

        // --- Duas ---
        'dua.geolocation.unsupported': 'La géolocalisation n\'est pas supportée par votre navigateur',
        'dua.geolocation.denied': 'Accès à la géolocalisation refusé',
        'dua.geolocation.unavailable': 'Information de localisation indisponible',
        'dua.geolocation.timeout': 'Délai dépassé pour la géolocalisation',
        'dua.geolocation.error': 'Erreur lors de la géolocalisation',
        'dua.city.notfound': 'Ville non trouvée ou données indisponibles',
        'dua.times.error': 'Erreur lors du chargement des horaires',

        // --- Authentification ---
        'auth.signup.error': 'Erreur lors de l\'inscription',
        'auth.signin.error': 'Email ou mot de passe incorrect',
        'auth.token.error': 'Erreur de connexion : token non reçu',
        'auth.countries.error': 'Erreur lors du chargement de la liste des pays',

        // --- Profil ---
        'profile.auth.required': 'Vous devez être connecté pour accéder au profil',
        'profile.load.error': 'Erreur lors du chargement du profil',
        'profile.update.error': 'Erreur lors de la mise à jour du profil',
        'profile.password.error': 'Erreur lors du changement de mot de passe',
        'profile.password.incorrect': 'Mot de passe actuel incorrect'
      },
      
      confirm: {
        // --- Timer et Sessions ---
        'stopwatch.reset.confirm': 'Voulez-vous réinitialiser le chronomètre ?',
        'timer.reset.confirm': 'Voulez-vous réinitialiser le timer ?',
        'session.save.confirm': 'Voulez-vous sauvegarder la session en cours ?',
        'session.end.confirm': 'Voulez-vous terminer la session en cours ?',

        // --- Tâches ---
        'task.delete.confirm': 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
        'tasks.delete.confirm': 'Êtes-vous sûr de vouloir supprimer les tâches sélectionnées ?',

        // --- Sourates ---
        'surah.history.clear': 'Êtes-vous sûr de vouloir effacer tout l\'historique de révision ? Cette action est irréversible.'
      },
      
      buttons: {
        'yes': 'Oui',
        'no': 'Non'
      }
    }
  },

  en: {
    notifications: {
      success: {
        // --- Tasks ---
        'task.added': 'Task added successfully',
        'task.updated': 'Task updated successfully',
        'task.deleted': 'Task deleted successfully',
        'tasks.deleted': '{count} tasks deleted successfully',

        // --- Timer and Sessions ---
        'timer.manual_time_added': 'Manual time added successfully',
        'timer.duration_updated': 'Timer duration updated successfully',
        'timer.work_complete': 'Work session complete!',
        'timer.break_complete': 'Break time is over!',
        'stopwatch.reset.success': 'Stopwatch reset',
        'session.restored': 'Session restored successfully',
        'session.started': 'New session started',
        'session.saved': 'Session saved successfully',
        'timer.settings.saved': 'Timer settings saved',

        // --- Surahs ---
        'surah.memorization.saved': 'Known surahs saved successfully',
        'surah.update.success': 'Surah updated successfully',
        'surah.revision.complete': 'Revision completed successfully!',
        'surah.history.cleared': 'History cleared successfully',
        'surah.export.success': 'Data exported successfully',
        'surah.revision.congratulations': 'Congratulations, you have completed your revision session!',

        // --- Mosques ---
        'mosque.city.selected': 'City selected successfully',
        'mosque.location.found': 'Nearest city found',
        'mosque.data.updated': 'Prayer times updated successfully',

        // --- Duas ---
        'dua.times.loaded': 'Prayer times loaded successfully',
        'dua.calculation.success': 'Calculation completed successfully',

        // --- Authentication ---
        'auth.signup.success': 'Registration successful! Redirecting...',
        'auth.signin.success': 'Login successful! Redirecting...',
        'auth.countries.loaded': 'Countries list loaded successfully',

        // --- Profile ---
        'profile.load.success': 'Profile loaded successfully',
        'profile.update.success': 'Profile updated successfully',
        'profile.password.success': 'Password changed successfully'
      },
      
      warning: {
        // --- Timer and Sessions ---
        'timer.invalid_duration': 'Invalid duration. Must be between 1 and 120 minutes',
        'session.required': 'An active session is required',
        'session.required_timer': 'Active session required to use timer',
        'session.required_stopwatch': 'Active session required to use stopwatch',
        'session.required_manual': 'Active session required to add manual time',
        'session.required_counter': 'Active session required to use counter',
        'session.already_active': 'A session is already active',
        'session.select_task': 'Please select a task',
        'time.invalid': 'Invalid duration',

        // --- Tasks ---
        'task.exists': 'A task with this name already exists',
        'task.empty': 'Task name cannot be empty',

        // --- Surahs ---
        'surah.memorization.select': 'Please select at least one surah to revise',
        'surah.memorization.save': 'Please select at least one surah to save',

        // --- Mosques ---
        'mosque.no_city': 'Please select a city',
        'mosque.no_mosques': 'No mosques found in this city',
        'mosque.no_times': 'No prayer times available for this date',

        // --- Duas ---
        'dua.city.empty': 'Please enter a city name',
        'dua.angles.required': 'Please enter Fajr and Isha angles for custom method',

        // --- Authentication ---
        'auth.terms.required': 'Please accept the Terms of Service',
        'auth.captcha.required': 'Please validate the captcha',
        'auth.required.fields': 'Please fill in all required fields',
        'auth.email.mismatch': 'Email addresses do not match',
        'auth.password.mismatch': 'Passwords do not match',
        'auth.country.notfound': 'No country found',

        // --- Profile ---
        'profile.password.mismatch': 'New passwords do not match',
        'profile.password.weak': 'Password must contain at least 8 characters, one uppercase letter, one number and one special character'
      },
      
      info: {
        // --- Timer and Sessions ---
        'timer.work_session_started': 'Work session started',
        'timer.break_session_started': 'Break started',
        'timer.settings_loading': 'Loading timer settings...',
        'session.loading': 'Loading session...',

        // --- Mosques ---
        'mosque.geolocation.searching': 'Searching for your location...',
        'mosque.data.updating': 'Updating prayer times...',

        // --- Duas ---
        'dua.geolocation.searching': 'Searching for your location...',
        'dua.times.calculating': 'Calculating prayer times...',

        // --- Authentication ---
        'auth.email.checking': 'Checking emails...',
        'auth.form.validating': 'Validating form...'
        // La clé 'auth.countries.loading' a été supprimée pour ne plus afficher la notification de chargement
      },
      
      error: {
        // --- Timer and Sessions ---
        'session.init_error': 'Error initializing session',
        'session.load_error': 'Error loading session',
        'session.save_error': 'Error saving session',
        'session.cache_save_error': 'Error saving to cache',
        'timer.settings_load_error': 'Error loading timer settings',
        'timer.settings_save_error': 'Error saving timer settings',
        'timer.start_error': 'Error starting timer',
        'timer.save.error': 'Error saving timer',

        // --- Tasks ---
        'task.add.error': 'Error adding task',
        'task.update.error': 'Error updating task',
        'task.delete.error': 'Error deleting task',
        'tasks.delete.error': 'Error deleting tasks',
        'tasks.load.error': 'Error loading tasks',

        // --- Surahs ---
        'surah.load.error': 'Error loading surahs',
        'surah.update.error': 'Error updating surah',
        'surah.save.error': 'Error saving known surahs',
        'surah.history.error': 'Error loading history',
        'surah.history.clear.error': 'Error clearing history',
        'surah.export.error': 'Error exporting data',

        // --- Mosques ---
        'mosque.load.error': 'Error loading mosques',
        'mosque.geolocation.unsupported': 'Geolocation is not supported by your browser',
        'mosque.geolocation.error': 'Error getting your location',
        'mosque.data.error': 'Error retrieving prayer times',
        'mosque.city.error': 'Error selecting city',
        'mosque.nearest.error': 'No city found near your location',

        // --- Duas ---
        'dua.geolocation.unsupported': 'Geolocation is not supported by your browser',
        'dua.geolocation.denied': 'User denied the request for geolocation',
        'dua.geolocation.unavailable': 'Location information is unavailable',
        'dua.geolocation.timeout': 'The request to get user location timed out',
        'dua.geolocation.error': 'Error getting location',
        'dua.city.notfound': 'City not found or data unavailable',
        'dua.times.error': 'Error loading prayer times',

        // --- Authentication ---
        'auth.signup.error': 'Error during registration',
        'auth.signin.error': 'Incorrect email or password',
        'auth.token.error': 'Connection error: token not received',
        'auth.countries.error': 'Error loading countries list',

        // --- Profile ---
        'profile.auth.required': 'You must be logged in to access the profile',
        'profile.load.error': 'Error loading profile',
        'profile.update.error': 'Error updating profile',
        'profile.password.error': 'Error changing password',
        'profile.password.incorrect': 'Current password is incorrect'
      },
      
      confirm: {
        // --- Timer and Sessions ---
        'stopwatch.reset.confirm': 'Do you want to reset the stopwatch?',
        'timer.reset.confirm': 'Do you want to reset the timer?',
        'session.save.confirm': 'Do you want to save the current session?',
        'session.end.confirm': 'Do you want to end the current session?',

        // --- Tasks ---
        'task.delete.confirm': 'Are you sure you want to delete this task?',
        'tasks.delete.confirm': 'Are you sure you want to delete the selected tasks?',

        // --- Surahs ---
        'surah.history.clear': 'Are you sure you want to clear all revision history? This action cannot be undone.'
      },
      
      buttons: {
        'yes': 'Yes',
        'no': 'No'
      }
    }
  }
};
