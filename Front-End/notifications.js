// notifications.js
import {adressIPP} from './utils.js'

function initializeNotifications() {
    let notifications = loadNotifications();
    if (notifications.length === 0) {
        notifications = [
            { id: 1, type: 'info', message: 'Votre abonnement sera bientôt renouvelé', date: '2024-09-01', read: false },
            { id: 2, type: 'warning', message: 'Votre espace de stockage est presque plein', date: '2024-08-30', read: false },
            { id: 3, type: 'success', message: 'Votre profil a été mis à jour', date: '2024-08-29', read: true },
            { id: 4, type: 'info', message: 'Nouvelle fonctionnalité disponible : Mode sombre', date: '2024-08-28', read: false },
            { id: 5, type: 'warning', message: 'Alerte de sécurité : Tentative de connexion inhabituelle', date: '2024-08-27', read: true }
        ];
        saveNotifications(notifications);
    }

    const notificationsList = document.getElementById('notifications-list');
    if (notificationsList) {
        notificationsList.addEventListener('click', function (e) {
            const notificationItem = e.target.closest('.notification-item');
            if (!notificationItem) return;

            const notifId = parseInt(notificationItem.dataset.id);
            if (e.target.classList.contains('notification-read-btn')) {
                const notif = notifications.find(n => n.id === notifId);
                if (notif) {
                    notif.read = true;
                    saveNotifications(notifications);
                    renderNotifications();
                }
            } else if (e.target.closest('.notification-delete-btn')) {
                notifications = notifications.filter(n => n.id !== notifId);
                saveNotifications(notifications);
                renderNotifications();
            }
        });
    }

    renderNotifications();
}

// Fonction pour charger les notifications
function loadNotifications() {
    return JSON.parse(localStorage.getItem('notifications')) || [];
}

// Fonction pour sauvegarder les notifications
function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Fonction pour afficher les notifications
function renderNotifications() {
    const notifications = loadNotifications();
    const notificationsList = document.getElementById('notifications-list');
    const notificationTemplate = document.getElementById('notification-template');

    if (!notificationsList || !notificationTemplate) {
        console.error('Elements de notification non trouvés');
        return;
    }

    notificationsList.innerHTML = '';
    notifications.forEach(notif => {
        const notificationItem = notificationTemplate.content.cloneNode(true);
        const li = notificationItem.querySelector('li');
        li.dataset.id = notif.id;
        li.classList.toggle('read', notif.read);
        li.querySelector('.notification-message').textContent = notif.message;
        li.querySelector('.notification-date').textContent = notif.date;
        li.querySelector('.notification-icon').innerHTML = getIcon(notif.type);
        if (notif.read) {
            li.querySelector('.notification-read-btn').style.display = 'none';
        }
        notificationsList.appendChild(notificationItem);
    });
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Fonction pour obtenir l'icône appropriée
function getIcon(type) {
    switch(type) {
        case 'info': return '<i data-feather="info" class="text-blue-500"></i>';
        case 'warning': return '<i data-feather="alert-triangle" class="text-yellow-500"></i>';
        case 'success': return '<i data-feather="check-circle" class="text-green-500"></i>';
        default: return '<i data-feather="bell" class="text-blue-500"></i>';
    }
}

// Exportation des fonctions nécessaires
export { initializeNotifications };
