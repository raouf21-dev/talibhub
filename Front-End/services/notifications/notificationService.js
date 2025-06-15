// notificationService.js - Service de notifications temporaires (toasts)
// Utilise le nouveau système de traductions

import { translationManager } from "../../translations/TranslationManager.js";

class NotificationService {
  constructor() {
    this.notifications = [];
    this.currentLang = localStorage.getItem("userLang") || "fr";
    this.injectStyles();

    // Écouter les changements de langue via le nouveau translationManager
    if (translationManager) {
      translationManager.onLanguageChange((newLang) => {
        this.currentLang = newLang;
        this.updateNotificationsLanguage();
        console.log("Mise à jour de la langue des notifications", newLang);
      });
    } else {
      console.warn(
        "⚠️ [NOTIFICATION] TranslationManager non disponible lors de l'initialisation"
      );
    }
  }

  injectStyles() {
    // Vérifier si les styles sont déjà injectés
    if (document.getElementById("notification-service-styles")) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = "notification-service-styles";
    styleElement.textContent = `
      #notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 450px;
      }

      .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transform: translateX(120%);
        transition: transform 0.3s ease, opacity 0.3s ease;
        min-width: 300px;
        max-width: 100%;
        opacity: 0;
      }

      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-grow: 1;
      }

      .notification-actions {
        display: flex;
        gap: 8px;
        margin-left: 12px;
      }

      .notification.success { border-left: 4px solid #4CAF50; }
      .notification.warning { border-left: 4px solid #FF9800; }
      .notification.error { border-left: 4px solid #F44336; }
      .notification.info { border-left: 4px solid #2196F3; }
      .notification.confirm { border-left: 4px solid #9C27B0; }

      .notification svg {
        flex-shrink: 0;
      }

      .notification.success svg { color: #4CAF50; }
      .notification.warning svg { color: #FF9800; }
      .notification.error svg { color: #F44336; }
      .notification.info svg { color: #2196F3; }
      .notification.confirm svg { color: #9C27B0; }

      .notification-message {
        flex-grow: 1;
        margin: 0 12px;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
      }

      .notification-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s ease;
      }

      .notification-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
      }

      .notification-btn.confirm {
        color: #4CAF50;
      }

      .notification-btn.cancel {
        color: #F44336;
      }

      .notification-title {
        font-weight: bold;
        color: #dc3545;
        margin-bottom: 6px;
        font-size: 14px;
      }

      .notification-content > div {
        flex-grow: 1;
      }

      @media (max-width: 480px) {
        #notification-container {
          left: 20px;
          right: 20px;
        }
        
        .notification {
          min-width: auto;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  getTranslation(messageKey, type = "info") {
    // Vérification de l'état d'initialisation
    if (!translationManager) {
      console.warn("⚠️ [NOTIFICATION] TranslationManager non disponible");
      return messageKey;
    }

    if (!translationManager.notificationManager) {
      console.warn("⚠️ [NOTIFICATION] NotificationManager non initialisé");
      return messageKey;
    }

    // Vérifier si les traductions sont chargées
    if (!translationManager.notificationManager.currentLanguage) {
      console.warn(
        "⚠️ [NOTIFICATION] Aucune langue chargée dans NotificationManager"
      );
      return messageKey;
    }

    // Utiliser le nouveau translationManager pour les notifications dynamiques
    const translation = translationManager.tn(messageKey, {}, messageKey);

    // Logs de diagnostic seulement si la traduction échoue
    if (translation === messageKey) {
      console.warn("⚠️ [NOTIFICATION] Traduction manquante pour:", messageKey);
      console.log("🔍 [DEBUG] État du translationManager:", {
        exists: !!translationManager,
        currentLanguage: translationManager?.currentLanguage,
        notificationManagerExists: !!translationManager?.notificationManager,
        notificationLanguage:
          translationManager?.notificationManager?.currentLanguage,
        hasTranslation:
          translationManager?.hasNotificationTranslation?.(messageKey),
      });
    }

    return translation;
  }

  getIconForType(type) {
    const icons = {
      success:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      warning:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      error:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      confirm:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>',
    };
    return icons[type] || icons.info;
  }

  // Notification temporaire de feedback
  show(messageId, type = "info", duration = 3000, params = {}) {
    // Récupération du message traduit
    const message = this.getTranslation(messageId);

    if (!message) return;

    // Traitement des paramètres et remplacement des placeholders
    let finalMessage = message;
    if (params && typeof params === "object") {
      Object.keys(params).forEach((key) => {
        finalMessage = finalMessage.replace(`\${${key}}`, params[key]);
        finalMessage = finalMessage.replace(`{${key}}`, params[key]);
      });
    }

    // Affichage de la notification avec le message traité
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    notification.innerHTML = `
      <div class="notification-content">
        ${this.getIconForType(type)}
        <span class="notification-message">${finalMessage}</span>
      </div>
      <button class="notification-btn cancel">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    this.appendNotification(notification);

    notification
      .querySelector(".notification-btn")
      .addEventListener("click", () => {
        this.remove(notification);
      });

    setTimeout(() => notification.classList.add("show"), 100);

    // Gestion de la durée
    const finalDuration = typeof duration === "number" ? duration : 3000;
    if (finalDuration > 0) {
      setTimeout(() => this.remove(notification), finalDuration);
    }

    return notification;
  }

  // Confirmation popup
  async confirm(messageKey, confirmText = "Confirmer", cancelText = "Annuler") {
    return new Promise((resolve) => {
      const message = this.getTranslation(messageKey);

      // Traduire les boutons s'ils sont des clés de traduction
      const translatedConfirmText = confirmText.includes(".")
        ? this.getTranslation(confirmText)
        : confirmText;
      const translatedCancelText = cancelText.includes(".")
        ? this.getTranslation(cancelText)
        : cancelText;

      const notification = document.createElement("div");
      notification.className = "notification confirm";

      notification.innerHTML = `
        <div class="notification-content">
          ${this.getIconForType("confirm")}
          <span class="notification-message">${message}</span>
        </div>
        <div class="notification-actions">
          <button class="notification-btn confirm">${translatedConfirmText}</button>
          <button class="notification-btn cancel">${translatedCancelText}</button>
        </div>
      `;

      this.appendNotification(notification);

      const handleResponse = (confirmed) => {
        this.remove(notification);
        resolve(confirmed);
      };

      notification
        .querySelector(".notification-btn.confirm")
        .addEventListener("click", () => handleResponse(true));
      notification
        .querySelector(".notification-btn.cancel")
        .addEventListener("click", () => handleResponse(false));

      setTimeout(() => notification.classList.add("show"), 100);
    });
  }

  appendNotification(notification) {
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      document.body.appendChild(container);
    }
    container.appendChild(notification);
    this.notifications.push(notification);
  }

  remove(notification) {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  updateNotificationsLanguage() {
    // Réappliquer les traductions aux notifications existantes si nécessaire
    console.log("Mise à jour de la langue des notifications");
  }
}

// Instance globale pour compatibilité
const notificationService = new NotificationService();

// Export pour ES6 modules
export { notificationService, NotificationService };

// Global pour compatibilité
window.notificationService = notificationService;

export default notificationService;
