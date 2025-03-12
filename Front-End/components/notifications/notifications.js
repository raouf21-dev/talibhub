// notifications.js
import { translations } from "../../services/notifications/translatNotifications.js";

function initializeNotifications() {
  console.log("Initialisation des notifications...");
  console.log("État de feather au démarrage:", typeof window.feather);

  let notifications = loadNotifications();
  if (notifications.length === 0) {
    console.log(
      "Aucune notification trouvée, création de notifications par défaut"
    );
    notifications = [
      {
        id: 1,
        type: "info",
        message: "Votre abonnement sera bientôt renouvelé",
        date: "2024-09-01",
        read: false,
      },
      {
        id: 2,
        type: "warning",
        message: "Votre espace de stockage est presque plein",
        date: "2024-08-30",
        read: false,
      },
      {
        id: 3,
        type: "success",
        message: "Votre profil a été mis à jour",
        date: "2024-08-29",
        read: true,
      },
      {
        id: 4,
        type: "info",
        message: "Nouvelle fonctionnalité disponible : Mode sombre",
        date: "2024-08-28",
        read: false,
      },
      {
        id: 5,
        type: "warning",
        message: "Alerte de sécurité : Tentative de connexion inhabituelle",
        date: "2024-08-27",
        read: true,
      },
    ];
    saveNotifications(notifications);
  }

  const notificationsList = document.getElementById("notifications-list");
  if (notificationsList) {
    console.log(
      "Liste de notifications trouvée, ajout des écouteurs d'événements"
    );
    notificationsList.addEventListener("click", function (e) {
      const notificationItem = e.target.closest(".notification-item");
      if (!notificationItem) return;

      const notifId = parseInt(notificationItem.dataset.id);
      if (e.target.classList.contains("notification-read-btn")) {
        const notif = notifications.find((n) => n.id === notifId);
        if (notif) {
          notif.read = true;
          saveNotifications(notifications);
          renderNotifications();
        }
      } else if (e.target.closest(".notification-delete-btn")) {
        notifications = notifications.filter((n) => n.id !== notifId);
        saveNotifications(notifications);
        renderNotifications();
      }
    });
  } else {
    console.warn("Élément notifications-list non trouvé dans le DOM");
  }

  renderNotifications();
}

// Fonction pour charger les notifications
function loadNotifications() {
  console.log("Chargement des notifications depuis localStorage");
  return JSON.parse(localStorage.getItem("notifications")) || [];
}

// Fonction pour sauvegarder les notifications
function saveNotifications(notifications) {
  console.log(
    "Sauvegarde de",
    notifications.length,
    "notifications dans localStorage"
  );
  localStorage.setItem("notifications", JSON.stringify(notifications));
}

// Fonction pour afficher les notifications
function renderNotifications() {
  console.log("Rendu des notifications...");
  console.log("État de feather avant rendu:", typeof window.feather);

  const notifications = loadNotifications();
  const notificationsList = document.getElementById("notifications-list");
  const notificationTemplate = document.getElementById("notification-template");

  if (!notificationsList || !notificationTemplate) {
    console.error("Elements de notification non trouvés");
    return;
  }

  console.log("Rendu de", notifications.length, "notifications");
  notificationsList.innerHTML = "";
  notifications.forEach((notif) => {
    const notificationItem = notificationTemplate.content.cloneNode(true);
    const li = notificationItem.querySelector("li");
    li.dataset.id = notif.id;
    li.classList.toggle("read", notif.read);
    li.querySelector(".notification-message").textContent = notif.message;
    li.querySelector(".notification-date").textContent = notif.date;
    li.querySelector(".notification-icon").innerHTML = getIcon(notif.type);
    if (notif.read) {
      li.querySelector(".notification-read-btn").style.display = "none";
    }
    notificationsList.appendChild(notificationItem);
  });

  // Vérification plus robuste pour feather
  console.log("Tentative de remplacement des icônes feather...");

  // Première tentative immédiate avec vérification
  if (window.feather) {
    console.log("Feather est disponible immédiatement");
    try {
      window.feather.replace();
      console.log("Remplacement des icônes feather réussi");
    } catch (error) {
      console.warn(
        "Erreur lors du remplacement immédiat des icônes feather:",
        error
      );
    }
  } else {
    console.log(
      "Feather n'est pas disponible immédiatement, planification d'une tentative différée"
    );
  }

  // Deuxième tentative avec délai court
  setTimeout(() => {
    console.log(
      "Tentative différée (court délai) - État de feather:",
      typeof window.feather
    );
    if (window.feather) {
      try {
        window.feather.replace();
        console.log(
          "Remplacement différé (court délai) des icônes feather réussi"
        );
      } catch (error) {
        console.warn(
          "Erreur lors du remplacement différé (court délai) des icônes feather:",
          error
        );
      }
    }
  }, 0);

  // Troisième tentative avec délai plus long
  setTimeout(() => {
    console.log(
      "Tentative différée (long délai) - État de feather:",
      typeof window.feather
    );
    if (window.feather) {
      try {
        window.feather.replace();
        console.log(
          "Remplacement différé (long délai) des icônes feather réussi"
        );
      } catch (error) {
        console.warn(
          "Erreur lors du remplacement différé (long délai) des icônes feather:",
          error
        );
      }
    } else {
      console.warn(
        "Feather n'est toujours pas disponible après un délai plus long"
      );

      // Tentative de chargement dynamique de feather si nécessaire
      if (typeof window.feather === "undefined") {
        console.log("Tentative de vérification de l'élément script feather");
        const featherScript = document.querySelector(
          'script[src*="feather-icons"]'
        );
        console.log("Script feather trouvé dans le DOM:", !!featherScript);
      }
    }
  }, 500);
}

// Fonction pour obtenir l'icône appropriée
function getIcon(type) {
  console.log("Génération d'icône pour le type:", type);
  switch (type) {
    case "info":
      return '<i data-feather="info" class="text-blue-500"></i>';
    case "warning":
      return '<i data-feather="alert-triangle" class="text-yellow-500"></i>';
    case "success":
      return '<i data-feather="check-circle" class="text-green-500"></i>';
    default:
      return '<i data-feather="bell" class="text-blue-500"></i>';
  }
}

// Vérification de l'état de chargement du document
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded - État de feather:", typeof window.feather);
});

// Vérification après chargement complet de la page
window.addEventListener("load", () => {
  console.log("Window loaded - État de feather:", typeof window.feather);
});

// Exportation des fonctions nécessaires
export { initializeNotifications };
