// Fonction principale d'initialisation de l'application
function initializeApp() {
    console.log('Initializing app');
    const activePageId = document.querySelector('.page').id;
    console.log('Active page:', activePageId);
    updateNavVisibility(activePageId);
    initializeEventListeners();
    initializeAuthForms();
    
    if (activePageId === 'welcomepage') {
        console.log('Initializing auth forms');
        initializeAuthForms();
    } else {
        if (checkAuthOnLoad()) {
            console.log('User authenticated, loading initial page');
            loadInitialPage(activePageId);
        } else {
            console.log('User not authenticated, navigating to welcome page');
            navigateTo('welcomepage');
        }
    }
}

// Gestion de la visibilité de la navigation
function updateNavVisibility(pageId) {
    const navHeader = document.getElementById('nav');
    navHeader.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
}

function initializeContactForm() {
    const form = document.getElementById('contactform');
    if (!form) return;

    const interestButtons = document.querySelectorAll('.contactform-interest-button');
    const interests = new Set();

    interestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const interest = this.dataset.interest;
            this.classList.toggle('active');
            if (interests.has(interest)) {
                interests.delete(interest);
            } else {
                interests.add(interest);
            }
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            interests: Array.from(interests),
            name: document.getElementById('contactform-name').value,
            email: document.getElementById('contactform-email').value,
            message: document.getElementById('contactform-message').value
        };
        console.log('Form submitted:', formData);
        interests.clear();
        interestButtons.forEach(button => button.classList.remove('active'));
        form.reset();
    });
}

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    const eventListeners = {
        'welcomepage-signupForm': { event: 'submit', handler: handleSignup },
        'welcomepage-signinForm': { event: 'submit', handler: handleSignin },
        /*'showPasswordToggle': { event: 'click', handler: togglePasswordVisibility },*/
        'showNewPasswordToggle': { event: 'click', handler: toggleNewPasswordVisibility },
        'profileForm': { event: 'submit', handler: updateProfile },
        
    };

    Object.entries(eventListeners).forEach(([id, { event, handler }]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`Event listener added to ${id}`);  // Ajoutez ce log pour le débogage
        } else {
            console.log(`Element not found: ${id}`);  // Ajoutez ce log pour le débogage
        }
    });

    initializeContactForm();

    const getStartedBtn = document.getElementById('welcomepage-getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', showAuthForms);
        console.log('Get Started button listener added');
    } else {
        console.log('Get Started button not found');
    }
}

// Chargement initial de la page
function loadInitialPage(pageId) {
    const pageLoaders = {

        'statistics': () => { initializeCharts(); updateCharts(); },
        'todoLists': loadTasks,
        'apprentissage': () => {
            loadTasks();
            loadSessionFromCache();
            loadCounter();
            updateTaskTitle();
            enableControls();
        },
        'notifications': loadNotifications,
        'salatSurahSelector': initializeApp
    };

    const loader = pageLoaders[pageId];
    if (loader) {
        loader();
    }
}

// Fonction de navigation
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    const activePage = document.getElementById(pageId);
    activePage.style.display = 'block';
    activePage.classList.add('active');

    updateNavVisibility(pageId);
    loadInitialPage(pageId);
}

// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeApp);

// Drop Sidebar menu
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-list a');
    const body = document.body;

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        body.classList.remove('menu-open');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }

    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarCloseBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    navLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
    });
});

function initializeCalendar() {
    $('#calendar').fullCalendar({
        selectable: true,
        selectHelper: true,
        select: function(start, end) {
            // updateCharts();
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    navigateTo('signup');
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Fonction d'inscription
async function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById('welcomepage-username').value;
    const firstName = document.getElementById('welcomepage-firstName').value;
    const lastName = document.getElementById('welcomepage-lastName').value;
    const age = document.getElementById('welcomepage-age').value;
    const gender = document.getElementById('welcomepage-gender').value;
    const email = document.getElementById('welcomepage-email').value;
    const password = document.getElementById('welcomepage-password').value;
    const confirmPassword = document.getElementById('welcomepage-confirmPassword').value;

    if (!username || !firstName || !lastName || !age || !gender || !email || !password || !confirmPassword) {
        alert('Tous les champs doivent être remplis.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                firstName,
                lastName,
                age,
                gender,
                email,
                password
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'inscription');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        alert('Inscription réussie');
        navigateTo('dashboard');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription : ' + error.message);
    }
}

async function handleSignin(event) {
    event.preventDefault();
    console.log('Signin form submitted');  // Ajoutez ce log
    const email = document.getElementById('welcomepage-signin-email').value;
    const password = document.getElementById('welcomepage-signin-password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('Connexion réussie, redirection vers le tableau de bord');  // Ajoutez ce log
        alert('Connexion réussie! Redirection vers le tableau de bord...');
        setTimeout(() => navigateTo('dashboard'), 1000);  // Délai d'une seconde avant la redirection
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion : ' + error.message);
    }
}

function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    const tabs = document.querySelectorAll('.welcomepage-tab-btn');
    const contents = document.querySelectorAll('.welcomepage-tab-content');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });

    contents.forEach(content => {
        const isActive = content.id === `welcomepage-${tabId}Tab`;
        content.classList.toggle('active', isActive);
    });
}

function initializeTabToggle() {
    const tabBtns = document.querySelectorAll('.welcomepage-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function initializeAuthForms() {
    const authForms = document.getElementById('welcomepage-auth-forms');
    if (authForms) {
        initializeTabToggle();
    }
}

function showAuthForms() {
    console.log('showAuthForms called');
    const authForms = document.getElementById('welcomepage-auth-forms');
    const welcomeHero = document.getElementById('welcomepage-hero');
    const getStartedBtn = document.getElementById('welcomepage-getStartedBtn');
    const signinForm = document.getElementById('welcomepage-signinForm');
    
    if (signinForm) {
        signinForm.addEventListener('submit', function(event) {
            console.log('Signin form submitted directly');
            handleSignin(event);
        });
    }
    
    if (welcomeHero && authForms && getStartedBtn) {
        getStartedBtn.style.display = 'none';
        welcomeHero.style.display = 'none';
        authForms.classList.remove('hidden');
        authForms.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            authForms.classList.add('visible');
        }, 10);
        
        // Active l'onglet de connexion par défaut
        switchTab('signin');
    }
}

function checkToken() {
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);
    if (token) {
        console.log('Token:', token.substring(0, 20) + '...');  // Affiche les 20 premiers caractères du token
    }
}

function togglePasswordVisibility() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        if (field.type === "password") {
            field.type = "text";
        } else {
            field.type = "password";
        }
    });
}






// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    checkToken();
    updateTaskTitle();
    updateTimerDisplay();
    enableControls();
            document.getElementById('todo-add-task').addEventListener('click', addNewTask);
            document.getElementById('todo-task-list').addEventListener('click', (e) => {
                if (e.target.classList.contains('todo-delete-btn')) {
                    removeTask(e.target.dataset.taskId);
                } else if (e.target.classList.contains('todo-rename-btn')) {
                    renameTask(e.target.dataset.taskId);
                }
            });
        
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
        notificationsList.addEventListener('click', function(e) {
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
});











