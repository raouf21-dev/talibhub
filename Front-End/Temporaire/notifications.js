//--------------------Notifications--------------------

function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function loadNotifications() {
    return JSON.parse(localStorage.getItem('notifications')) || [];
}

function addNotification(content, type = 'info') {
    const notifications = loadNotifications();
    const newNotification = {
        id: Date.now(),
        type: type,
        message: content,
        date: new Date().toISOString().split('T')[0],
        read: false
    };
    notifications.push(newNotification);
    saveNotifications(notifications);
    renderNotifications();
}

// Ajoutez ces nouvelles fonctions :
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

function getIcon(type) {
    switch(type) {
        case 'info': return '<i data-feather="info" class="text-blue-500"></i>';
        case 'warning': return '<i data-feather="alert-triangle" class="text-yellow-500"></i>';
        case 'success': return '<i data-feather="check-circle" class="text-green-500"></i>';
        default: return '<i data-feather="bell" class="text-blue-500"></i>';
    }
}

