// messageCenter.js - Centre de messagerie pour les messages persistants
// Utilise le nouveau système de traductions

import { translationManager } from "../../translations/TranslationManager.js";

// Fonction utilitaire pour charger dynamiquement Feather si nécessaire
function ensureFeather() {
  return new Promise((resolve) => {
    if (window.feather) {
      resolve(window.feather);
      return;
    }

    // Vérifier si le script est déjà dans le DOM mais pas encore exécuté
    const existingScript = document.querySelector(
      'script[src*="feather-icons"]'
    );

    if (existingScript) {
      // Le script est présent mais pas encore chargé, attendre son chargement
      existingScript.addEventListener("load", () => {
        resolve(window.feather);
      });

      // En cas d'erreur ou de timeout, résoudre quand même
      setTimeout(() => resolve(window.feather || null), 2000);
    } else {
      // Le script n'est pas présent, l'ajouter dynamiquement
      const script = document.createElement("script");
      script.src = "https://unpkg.com/feather-icons";
      script.async = true;

      script.onload = () => {
        resolve(window.feather);
      };

      script.onerror = () => {
        console.error("Impossible de charger Feather Icons");
        resolve(null);
      };

      document.head.appendChild(script);
    }
  });
}

// Fonction sécurisée pour remplacer les icônes
async function safeFeatherReplace() {
  const feather = await ensureFeather();
  if (feather) {
    try {
      feather.replace();
      return true;
    } catch (error) {
      console.warn("Erreur lors du remplacement des icônes:", error);
      return false;
    }
  }
  return false;
}

// Initialisation globale
function initializeMessageCenter() {
  if (!window.messageCenter) {
    window.messageCenter = new MessageCenter();
  }
  return window.messageCenter;
}

// Gestionnaire principal du centre de messagerie
class MessageCenter {
  constructor() {
    this.messages = [];
    this.currentLang = localStorage.getItem("userLang") || "fr";
    this.init();
  }

  async init() {
    console.log("Initialisation du centre de messagerie...");
    this.loadMessages();
    this.setupEventListeners();
    await this.renderMessages();
    this.updateMessageCount();
  }

  loadMessages() {
    this.messages = JSON.parse(localStorage.getItem("userMessages")) || [];

    // Créer des messages par défaut si aucun message n'existe ou pour la démonstration
    if (this.messages.length === 0 || this.shouldResetMessages()) {
      console.log("Aucun message trouvé, création de messages par défaut");
      this.messages = [
        {
          id: 1,
          type: "info",
          title: this.getTranslation("defaultMessages.welcome.title"),
          message: this.getTranslation("defaultMessages.welcome.content"),
          date: new Date().toISOString(),
          read: false,
          category: "system",
        },
        {
          id: 2,
          type: "warning",
          title: this.getTranslation("defaultMessages.update.title"),
          message: this.getTranslation("defaultMessages.update.content"),
          date: new Date(Date.now() - 3600000).toISOString(), // 1 heure
          read: false,
          category: "update",
        },
        {
          id: 3,
          type: "success",
          title: this.getTranslation("defaultMessages.achievement.title"),
          message: this.getTranslation("defaultMessages.achievement.content"),
          date: new Date(Date.now() - 86400000).toISOString(), // 1 jour
          read: true,
          category: "achievement",
        },
        {
          id: 4,
          type: "info",
          title: this.getTranslation("defaultMessages.reminder.title"),
          message: this.getTranslation("defaultMessages.reminder.content"),
          date: new Date(Date.now() - 172800000).toISOString(), // 2 jours
          read: false,
          category: "reminder",
        },
        {
          id: 5,
          type: "info",
          title: this.getTranslation("defaultMessages.features.title"),
          message: this.getTranslation("defaultMessages.features.content"),
          date: new Date(Date.now() - 604800000).toISOString(), // 1 semaine
          read: true,
          category: "system",
        },
      ];
      this.saveMessages();
    }
  }

  // Vérifier si nous devons réinitialiser les messages (pour la démonstration)
  shouldResetMessages() {
    // Réinitialiser si on a moins de 5 messages ou si tous les messages sont anciens
    const hasOldStructure = this.messages.some(
      (msg) => !msg.category || !msg.title
    );
    const hasEnoughMessages = this.messages.length >= 5;
    return hasOldStructure || !hasEnoughMessages;
  }

  saveMessages() {
    localStorage.setItem("userMessages", JSON.stringify(this.messages));
    this.updateMessageCount();
  }

  getTranslation(key) {
    // Utiliser le nouveau translationManager
    return translationManager.t(`content.messaging.${key}`, key);
  }

  setupEventListeners() {
    const messagesList = document.getElementById("messaging-list");
    if (messagesList) {
      messagesList.addEventListener("click", (e) => this.handleMessageClick(e));
    }

    // Boutons d'action globaux
    const markAllReadBtn = document.getElementById("mark-all-read-btn");
    const deleteReadBtn = document.getElementById("delete-read-btn");

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", () => this.markAllAsRead());
    }

    if (deleteReadBtn) {
      deleteReadBtn.addEventListener("click", () => this.deleteReadMessages());
    }

    // Écouter les changements de langue via le nouveau translationManager
    translationManager.onLanguageChange((newLang) => {
        this.currentLang = newLang;
        this.renderMessages();
      });
  }

  handleMessageClick(e) {
    const messageItem = e.target.closest(".message-item");
    if (!messageItem) return;

    const messageId = parseInt(messageItem.dataset.id);

    if (e.target.classList.contains("message-read-btn")) {
      this.markAsRead(messageId);
    } else if (e.target.closest(".message-delete-btn")) {
      this.deleteMessage(messageId);
    } else if (!e.target.closest(".message-actions")) {
      // Clic sur le message lui-même - marquer comme lu et ouvrir
      this.markAsRead(messageId);
      this.openMessage(messageId);
    }
  }

  markAsRead(messageId) {
    const message = this.messages.find((m) => m.id === messageId);
    if (message && !message.read) {
      message.read = true;
      this.saveMessages();
      this.renderMessages();
    }
  }

  deleteMessage(messageId) {
    this.messages = this.messages.filter((m) => m.id !== messageId);
    this.saveMessages();
    this.renderMessages();
  }

  openMessage(messageId) {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      // Ici vous pouvez ajouter une logique pour afficher le message complet
      console.log("Ouverture du message:", message);
    }
  }

  async renderMessages() {
    const messagesList = document.getElementById("messaging-list");
    const messageTemplate = document.getElementById("message-template");

    if (!messagesList || !messageTemplate) {
      console.error("Éléments de messagerie non trouvés");
      return;
    }

    messagesList.innerHTML = "";

    // Trier les messages par date (plus récents en premier)
    const sortedMessages = [...this.messages].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedMessages.forEach((message) => {
      const messageItem = messageTemplate.content.cloneNode(true);
      const li = messageItem.querySelector("li");

      li.dataset.id = message.id;
      li.classList.toggle("read", message.read);
      li.classList.add(`message-${message.type}`);

      // Titre du message
      const titleElement = li.querySelector(".message-title");
      if (titleElement) {
        titleElement.textContent =
          message.title || this.getTranslation("untitled");
      }

      // Corps du message
      li.querySelector(".message-body").textContent = message.message;

      // Date formatée
      const date = new Date(message.date);
      li.querySelector(".message-date").textContent = this.formatDate(date);

      // Icône selon le type
      li.querySelector(".message-icon").innerHTML = this.getIconForType(
        message.type
      );

      // Masquer le bouton "marquer comme lu" si déjà lu
      if (message.read) {
        const readBtn = li.querySelector(".message-read-btn");
        if (readBtn) readBtn.style.display = "none";
      }

      messagesList.appendChild(messageItem);
    });

    await safeFeatherReplace();
  }

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return this.getTranslation("justNow");
    } else if (minutes < 60) {
      return this.getTranslation("minutesAgo").replace("{count}", minutes);
    } else if (hours < 24) {
      return this.getTranslation("hoursAgo").replace("{count}", hours);
    } else if (days < 7) {
      return this.getTranslation("daysAgo").replace("{count}", days);
    } else if (weeks < 4) {
      return this.getTranslation("weeksAgo").replace("{count}", weeks);
    } else if (months < 12) {
      return this.getTranslation("monthsAgo").replace("{count}", months);
    } else {
      return this.getTranslation("yearsAgo").replace("{count}", years);
    }
  }

  getIconForType(type) {
    const icons = {
      info: '<i data-feather="info" class="text-blue-500"></i>',
      warning: '<i data-feather="alert-triangle" class="text-yellow-500"></i>',
      success: '<i data-feather="check-circle" class="text-green-500"></i>',
      error: '<i data-feather="alert-circle" class="text-red-500"></i>',
      system: '<i data-feather="settings" class="text-gray-500"></i>',
      user: '<i data-feather="user" class="text-purple-500"></i>',
    };
    return icons[type] || icons.info;
  }

  // Nouvelle méthode pour ajouter un message depuis l'extérieur
  addMessage(title, message, type = "info", category = "system") {
    const newMessage = {
      id: Date.now(),
      type,
      title,
      message,
      date: new Date().toISOString(),
      read: false,
      category,
    };

    this.messages.unshift(newMessage);
    this.saveMessages();

    if (document.getElementById("messaging-list")) {
      this.renderMessages();
    }

    return newMessage;
  }

  // Compter les messages non lus
  getUnreadCount() {
    return this.messages.filter((m) => !m.read).length;
  }

  // Mettre à jour le compteur dans la navigation
  updateMessageCount() {
    const unreadCount = this.getUnreadCount();
    const countBadge = document.getElementById("messaging-count");

    if (countBadge) {
      if (unreadCount > 0) {
        countBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
        countBadge.style.display = "block";
      } else {
        countBadge.style.display = "none";
      }
    }
  }

  // Marquer tous les messages comme lus
  markAllAsRead() {
    this.messages.forEach((message) => (message.read = true));
    this.saveMessages();
    this.renderMessages();
  }

  // Supprimer tous les messages lus
  deleteReadMessages() {
    this.messages = this.messages.filter((m) => !m.read);
    this.saveMessages();
    this.renderMessages();
  }
}

// Export pour utilisation dans d'autres modules
export { MessageCenter, initializeMessageCenter };

// Auto-initialisation si le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMessageCenter);
} else {
  initializeMessageCenter();
}
