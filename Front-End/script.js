// Fonction principale d'initialisation de l'application
function initializeApp() {
    console.log('Initializing app');  // Ajoutez ce log
    const activePageId = document.querySelector('.page').id;
    console.log('Active page:', activePageId);  // Ajoutez ce log
    updateNavVisibility(activePageId);
    initializeEventListeners();
    initializeTabToggle();
    
    if (activePageId === 'welcomepage') {
        console.log('Initializing auth forms');  // Ajoutez ce log
        initializeAuthForms();
    } else {
        if (checkAuthOnLoad()) {
            console.log('User authenticated, loading initial page');  // Ajoutez ce log
            loadInitialPage(activePageId);
        } else {
            console.log('User not authenticated, navigating to welcome page');  // Ajoutez ce log
            navigateTo('welcomepage');
        }
    }
}

function checkAuthOnLoad() {
    const token = localStorage.getItem('token');
    return !!token;
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
        console.log('Get Started button listener added');  // Ajoutez ce log
    } else {
        console.log('Get Started button not found');  // Ajoutez ce log
    }
}

// Chargement initial de la page
function loadInitialPage(pageId) {
    const pageLoaders = {
        'profile': loadProfile,
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
        content.style.display = isActive ? 'block' : 'none';
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
    console.log('showAuthForms called');  // Ajoutez ce log
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
        welcomeHero.style.display = 'none';  // Cache le hero au lieu de le laisser visible
        authForms.classList.remove('hidden');
        authForms.style.display = 'block';
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            authForms.classList.add('visible');
        }, 10);
        
        // Assurez-vous que l'onglet de connexion est actif par défaut
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

function toggleNewPasswordVisibility() {
    const newPasswordField = document.getElementById('new-password');
    const confirmNewPasswordField = document.getElementById('confirm-new-password');
    if (newPasswordField && confirmNewPasswordField) {
        if (newPasswordField.type === "password") {
            newPasswordField.type = "text";
            confirmNewPasswordField.type = "text";
        } else {
            newPasswordField.type = "password";
            confirmNewPasswordField.type = "password";
        }
    }
}


//--------------------Tasks--------------------

function getSelectedTaskDetails() {
    const taskSelect = document.getElementById('task-select');
    const selectedTask = {
        id: taskSelect.value,
        name: taskSelect.options[taskSelect.selectedIndex].text
    };
    console.log('getSelectedTaskDetails:', selectedTask); // Ajoutez cette ligne
    return selectedTask;
}


function getSelectedTaskDetails() {
    const taskSelect = document.getElementById('task-select');
    const selectedTask = {
        id: taskSelect.value,
        name: taskSelect.options[taskSelect.selectedIndex].text
    };
    console.log('getSelectedTaskDetails:', selectedTask); // Ajoutez cette ligne
    return selectedTask;
}

async function toggleTask(taskId) {
    try {
        const taskElement = document.querySelector(`#todo-task-${taskId}`).closest('.todo-item');
        const isCompleted = taskElement.classList.toggle('completed');

        const response = await fetch(`http://localhost:3000/tasks/updateTask/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ completed: isCompleted })
        });

        if (!response.ok) {
            throw new Error(`Error updating task: ${response.status} ${response.statusText}`);
        }

        // Pas besoin de recharger toutes les tâches, l'apparence est déjà mise à jour
    } catch (error) {
        console.error('Error toggling task:', error);
        // En cas d'erreur, on recharge quand même les tâches pour s'assurer de la cohérence
        loadTasks();
    }
}


async function loadTasks() {
    try {
        const response = await fetch('http://localhost:3000/tasks/getAllTasks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            console.error('Error fetching tasks:', response.status, response.statusText);
            return;
        }

        const tasks = await response.json();
        const taskList = document.getElementById('todo-task-list');
        const taskSelect = document.getElementById('task-select');

        // Mise à jour du DOM pour afficher les tâches dans la liste
        taskList.innerHTML = '';
        tasks.forEach(task => {
            let li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div>
                    <input type="checkbox" id="todo-task-${task.id}" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
                    <label for="todo-task-${task.id}">${escapeHTML(task.name)}</label>
                </div>
                <div>
                    <button class="todo-rename-btn" onclick="renameTask(${task.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span class="sr-only">Renommer</span>
                    </button>
                    <button class="todo-delete-btn" onclick="removeTask(${task.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        <span class="sr-only">Supprimer</span>
                    </button>
                </div>
            `;
            taskList.appendChild(li);

            const checkbox = li.querySelector(`#todo-task-${task.id}`);
            checkbox.addEventListener('change', () => toggleTask(task.id));
        });

        // Mise à jour du sélecteur de tâches
        if (taskSelect) {
            // Vider les options existantes
            taskSelect.innerHTML = '<option value="">Sélectionnez une tâche</option>';

            // Ajouter les nouvelles options
            tasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                taskSelect.appendChild(option);
            });
        }

        // Sauvegarde des tâches localement
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}


async function addNewTask() {
    const taskName = document.getElementById('todo-new-task').value.trim();
    if (taskName === '') return;

    try {
        const response = await fetch('http://localhost:3000/tasks/addTask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: taskName })
        });

        if (!response.ok) {
            console.error('Error adding task:', response.status, response.statusText);
            return;
        }

        // Recharger les tâches après ajout
        loadTasks();
        document.getElementById('new-task').value = '';
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

async function removeTask(taskId) {
    try {
        const response = await fetch(`http://localhost:3000/tasks/deleteTask/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            console.error('Error deleting task:', response.status, response.statusText);
            return;
        }

        // Recharger les tâches après suppression
        loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function renameTask(taskId) {
    const newName = prompt("Entrez le nouveau nom de la tâche:");
    if (!newName || newName.trim() === "") return;

    try {
        const response = await fetch(`http://localhost:3000/tasks/updateTask/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: newName.trim() })
        });

        if (!response.ok) {
            throw new Error(`Error renaming task: ${response.status} ${response.statusText}`);
        }

        // Recharger les tâches après renommage
        loadTasks();
    } catch (error) {
        console.error('Error renaming task:', error);
    }
}

//-------------------Timer--------------------
// Variables globales
let isRunning = false;
let isWorkSession = true;
let workDuration = 25 * 60;
let breakDuration = 5 * 60;
let currentTime = workDuration;
let timer;
let stopwatchInterval = null;
let timerTime = 0;
let stopwatchTime = 0;
let manualTimeInSeconds = 0;
let selectedTaskId = '';
let isSessionActive = false;
const Counter = { value: 0 };
let currentSessionId = null;
let taskLastSessionId = null;
let totalWorkTime = 0;

// Fonction pour activer/désactiver les contrôles
function enableControls() {
    const controls = document.querySelectorAll('.session-control');
    controls.forEach(control => {
        control.disabled = !isSessionActive;
    });
}

// Fonction pour mettre à jour le titre de la tâche sélectionnée
async function updateTaskTitle(forceRefresh = false) {
    console.log('updateTaskTitle called');
    const taskSelect = document.getElementById('task-select');
    const selectedTaskTitle = document.getElementById('counter-task-title');
    const selectedTask = taskSelect.options[taskSelect.selectedIndex].text;
    selectedTaskId = taskSelect.value;

    console.log('Selected task:', selectedTask, 'Task ID:', selectedTaskId);

    if (!selectedTaskId || selectedTaskId === "") {
        console.log('No task selected');
        selectedTaskTitle.textContent = "Sélectionnez une tâche";
        document.getElementById('current-session-id').textContent = "Veuillez démarrer une nouvelle session";
        document.getElementById('previous-sessions-count').textContent = "0";
        document.getElementById('counter-value').textContent = "0";
        document.getElementById('total-work-time').textContent = "00:00:00";
        isSessionActive = false;
        enableControls();
        return;
    }

    selectedTaskTitle.textContent = selectedTask;

    try {
        console.log('Fetching last session for task:', selectedTaskId);
        const response = await fetch(`http://localhost:3000/session/last/${selectedTaskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            cache: forceRefresh ? 'no-cache' : 'default'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.message === 'No previous session found for this task') {
            console.log('No previous session found');
            Counter.value = 0;
            timerTime = 0;
            stopwatchTime = 0;
            manualTimeInSeconds = 0;
            document.getElementById('current-session-id').textContent = "Pas d'ancienne session";
            document.getElementById('previous-sessions-count').textContent = "0";
        } else {
            console.log('Previous session found');
            Counter.value = data.lastSession.counter_value || 0;
            timerTime = data.lastSession.timer_time || 0;
            stopwatchTime = data.lastSession.stopwatch_time || 0;
            document.getElementById('current-session-id').textContent = 'Dernière session trouvée';
            document.getElementById('previous-sessions-count').textContent = 
                data.sessionCount !== undefined ? data.sessionCount.toString() : "N/A";
        }

        document.getElementById('counter-value').textContent = Counter.value;
        
        // Afficher le temps total
        totalWorkTime = calculateTotalWorkTime();
        document.getElementById('total-work-time').textContent = formatTime(totalWorkTime);

        isSessionActive = false;
        document.getElementById('start-new-session').disabled = false;
        enableControls();

    } catch (error) {
        console.error('Erreur lors du chargement de la dernière session:', error);
        alert('Erreur lors du chargement de la dernière session.');
        document.getElementById('current-session-id').textContent = "Erreur de chargement";
        document.getElementById('previous-sessions-count').textContent = "N/A";
        isSessionActive = false;
        enableControls();
    }
}

// Fonction pour démarrer une nouvelle session
async function startNewSession() {
    if (!selectedTaskId) {
        alert("Veuillez sélectionner une tâche avant de créer une nouvelle session.");
        return;
    }

    if (isSessionActive) {
        alert("Une session est déjà en cours. Veuillez l'enregistrer avant d'en commencer une nouvelle.");
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        await updateTaskTitle(true);

        document.getElementById('current-session-id').textContent = 'Nouvelle Session en cours';

        timerTime = 0;
        stopwatchTime = 0;
        manualTimeInSeconds = 0;
        Counter.value = 0;
        document.getElementById('counter-value').textContent = Counter.value;
        document.getElementById('total-work-time').textContent = '00:00:00';

        isSessionActive = true;
        enableControls();
        document.getElementById('start-new-session').disabled = true;

    } catch (error) {
        console.error('Erreur détaillée:', error);
        alert('Erreur lors de l\'initialisation de la nouvelle session: ' + error.message);
    }
}

// Sauvegarder l'état actuel des outils dans le cache local
function saveSessionToCache() {
    const sessionData = {
        sessionId: currentSessionId,
        taskLastSessionId: taskLastSessionId,
        taskId: selectedTaskId,
        totalWorkTime: totalWorkTime,
        stopwatchTime: stopwatchTime,
        counterValue: Counter.value,
        manualTimeInSeconds: manualTimeInSeconds
    };
    localStorage.setItem('currentSessionData', JSON.stringify(sessionData));
}

// Charger les données de session du cache local
async function loadSessionFromCache() {
    const savedSession = JSON.parse(localStorage.getItem('currentSessionData'));
    if (savedSession) {
        currentSessionId = savedSession.sessionId;
        taskLastSessionId = savedSession.taskLastSessionId;
        selectedTaskId = savedSession.taskId;
        totalWorkTime = savedSession.totalWorkTime;
        stopwatchTime = savedSession.stopwatchTime;
        Counter.value = savedSession.counterValue;
        manualTimeInSeconds = savedSession.manualTimeInSeconds || 0;

        updateDOMIfExists('task-last-session-id', taskLastSessionId !== null ? taskLastSessionId : '0');
        updateDOMIfExists('current-session-id', currentSessionId);
        updateDOMIfExists('counter-value', Counter.value);

        updateTimerDisplay();
        isSessionActive = true;
    } else {
        isSessionActive = false;
    }
    enableControls();
}

// Enregistrer les données de session au serveur
async function saveSessionData() {
    if (!selectedTaskId || !isSessionActive) {
        alert("Aucune session active à enregistrer.");
        return;
    }

    const totalWorkTime = calculateTotalWorkTime();

    try {
        const saveResponse = await fetch('http://localhost:3000/session/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                taskId: selectedTaskId,
                totalWorkTime: totalWorkTime,
                stopwatchTime: stopwatchTime,
                timerTime: timerTime,
                counterValue: Counter.value
            })
        });

        if (!saveResponse.ok) {
            throw new Error('Erreur lors de l\'enregistrement des données de la session');
        }

        const saveData = await saveResponse.json();
        alert('Données de la session sauvegardées avec succès.');
        console.log('Session data saved:', saveData);

        // Mettre à jour l'affichage avec les nouvelles informations de session
        await updateTaskTitle(true); // Forcer le rafraîchissement des données

        // Réinitialiser les valeurs après l'enregistrement
        timerTime = 0;
        stopwatchTime = 0;
        manualTimeInSeconds = 0;
        Counter.value = 0;
        
        document.getElementById('counter-value').textContent = Counter.value;
        document.getElementById('current-session-id').textContent = 'Session terminée';
        document.getElementById('total-work-time').textContent = '00:00:00';

        isSessionActive = false;
        document.getElementById('start-new-session').disabled = false;

        // Réinitialiser les timers si nécessaire
        clearInterval(timer);
        clearInterval(stopwatchInterval);
        isRunning = false;
        document.getElementById('start_stop').textContent = 'Démarrer';
        document.getElementById('stopwatch-start').textContent = 'Démarrer';
        updateTimerDisplay();
        document.getElementById('stopwatch-time').textContent = '00:00:00';

    } catch (error) {
        console.error('Error saving session data:', error);
        alert('Erreur lors de la sauvegarde des données de la session: ' + error.message);
    }
}

function updateDOMIfExists(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Mettre à jour l'affichage du Timer
function updateTimer() {
    if (currentTime > 0) {
        currentTime--;
        timerTime++;
        updateTimerDisplay();
    } else {
        clearInterval(timer);
        if (isWorkSession) {
            isWorkSession = false;
            currentTime = breakDuration;
            document.getElementById('timer-label').textContent = 'Pause';
        } else {
            isWorkSession = true;
            currentTime = workDuration;
            document.getElementById('timer-label').textContent = 'Travail';
        }
        updateTimerDisplay();
        document.getElementById('start_stop').textContent = 'Démarrer';
        isRunning = false;
    }
    // Mettre à jour l'affichage du temps total
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

// Fonction pour mettre à jour l'affichage du timer
function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('time-left').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Fonction pour démarrer/pauser le timer
function toggleTimer() {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le timer.");
        return;
    }
    if (!selectedTaskId) {
        alert("Veuillez sélectionner une tâche avant de démarrer le Pomodoro Timer.");
        return;
    }
    if (stopwatchInterval !== null) {
        alert("Veuillez arrêter et réinitialiser le chronomètre avant de démarrer le Pomodoro Timer.");
        return;
    }

    if (isRunning) {
        clearInterval(timer);
        document.getElementById('start_stop').textContent = 'Démarrer';
    } else {
        timer = setInterval(updateTimer, 1000);
        document.getElementById('start_stop').textContent = 'Pause';
    }
    isRunning = !isRunning;
}

// Fonction pour calculer le temps total de travail
function calculateTotalWorkTime() {
    return timerTime + stopwatchTime + manualTimeInSeconds;
}

// Fonction pour réinitialiser le timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkSession = true;
    currentTime = workDuration;
    timerTime = 0;
    updateTimerDisplay();
    document.getElementById('start_stop').textContent = 'Démarrer';
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

// Fonction pour démarrer/pauser le chronomètre
function toggleStopwatch() {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le chronomètre.");
        return;
    }
    if (!stopwatchInterval) {
        stopwatchInterval = setInterval(updateStopwatch, 1000);
        document.getElementById('stopwatch-start').textContent = 'Pause';
    } else {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
        document.getElementById('stopwatch-start').textContent = 'Reprendre';
    }
}

// Fonction pour mettre à jour le chronomètre
function updateStopwatch() {
    stopwatchTime++;
    document.getElementById('stopwatch-time').textContent = formatTime(stopwatchTime);
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

// Fonction pour réinitialiser le chronomètre
function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchTime = 0;
    document.getElementById('stopwatch-time').textContent = '00:00:00';
    document.getElementById('stopwatch-start').textContent = 'Démarrer';
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

// Formater le temps pour l'affichage
function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Gérer le compteur
function loadCounter() {
    const savedCounter = JSON.parse(localStorage.getItem('currentSessionData'));
    if (savedCounter && savedCounter.counterValue !== undefined) {
        Counter.value = savedCounter.counterValue;
        document.getElementById('counter-value').textContent = Counter.value;
    } else {
        Counter.value = 0;
        document.getElementById('counter-value').textContent = Counter.value;
    }
}

// Fonction pour incrémenter le compteur
function incrementCounter(value) {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le compteur.");
        return;
    }
    Counter.value += value;
    document.getElementById('counter-value').textContent = Counter.value;
}

// Fonction pour décrémenter le compteur
function decrementCounter(amount) {
    Counter.value = Math.max(0, Counter.value - amount);
    document.getElementById('counter-value').textContent = Counter.value;
}

// Fonction pour réinitialiser le compteur
function resetCounter() {
    Counter.value = 0;
    document.getElementById('counter-value').textContent = Counter.value;
}

function changeCounter(value) {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le compteur.");
        return;
    }
    Counter.value = Math.max(0, Counter.value + value);
    document.getElementById('counter-value').textContent = Counter.value;
}

// Fonction pour ajouter manuellement du temps d'étude
function addManualTime() {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'ajouter du temps manuellement.");
        return;
    }

    const hours = parseInt(document.getElementById('manual-hours').value) || 0;
    const minutes = parseInt(document.getElementById('manual-minutes').value) || 0;

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        alert('Veuillez entrer un temps valide.');
        return;
    }

    manualTimeInSeconds += (hours * 3600) + (minutes * 60);

    document.getElementById('manual-hours').value = '';
    document.getElementById('manual-minutes').value = '';

    // Mettre à jour l'affichage du temps total
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());

    alert('Temps d\'étude ajouté manuellement.');
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




// Charger l'état initial depuis le cache local
loadSessionFromCache();
saveSessionToCache()

//--------------------Profil--------------------

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vous devez être connecté pour accéder au profil.');
            navigateTo('login');
            return;
        }

        const response = await fetch('http://localhost:3000/auth/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        console.log('Données du profil complètes:', user);

        const setAndLogValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
                console.log(`${id} set to:`, value);
            } else {
                console.error(`Element with id '${id}' not found`);
            }
        };

        setAndLogValue('usernameprofil', user.username);
        setAndLogValue('last-nameprofil', user.lastName);
        setAndLogValue('first-nameprofil', user.firstName);
        setAndLogValue('ageprofil', user.age);
        setAndLogValue('genderprofil', user.gender);
        setAndLogValue('emailprofil', user.email);

        // Vérification finale
        console.log('Final form values:');
        ['usernameprofil', 'last-nameprofil', 'first-nameprofil', 'ageprofil', 'genderprofil', 'emailprofil'].forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? element.value : 'Element not found');
        });

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        alert('Erreur lors de la récupération des informations de profil: ' + error.message);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const username = document.getElementById('usernameprofil').value;
    const lastName = document.getElementById('last-nameprofil').value;
    const firstName = document.getElementById('first-nameprofil').value;
    const age = document.getElementById('ageprofil').value;
    const gender = document.getElementById('genderprofil').value;
    const email = document.getElementById('emailprofil').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/auth/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username, lastName, firstName, age, gender, email
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du profil');
        }

        alert('Profil mis à jour avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du profil');
    }
}

function toggleNewPasswordVisibility() {
    const newPasswordField = document.getElementById('new-password');
    const confirmNewPasswordField = document.getElementById('confirm-new-password');
    if (newPasswordField.type === 'password') {
        newPasswordField.type = 'text';
        confirmNewPasswordField.type = 'text';
    } else {
        newPasswordField.type = 'password';
        confirmNewPasswordField.type = 'password';
    }
}

async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        alert('Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert('Les nouveaux mots de passe ne correspondent pas.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vous devez être connecté pour changer votre mot de passe.');
            navigateTo('login');
            return;
        }

        const response = await fetch('http://localhost:3000/auth/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
            }

            const errorMessage = errorData.message || 'Une erreur est survenue lors du changement de mot de passe.';
            alert(`Erreur: ${errorMessage}`);
            return;
        }

        alert('Mot de passe changé avec succès');
        document.getElementById('passwordChangeForm').reset();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du changement de mot de passe : ' + error.message);
    }
}

//--------------------Charts--------------------

// Variable globale pour stocker les instances de graphiques
let chartInstances = {}; 

async function fetchStatistics(period) {
    try {
        const response = await fetch(`http://localhost:3000/statistics/${period}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur HTTP pour ${period}:`, response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Données reçues pour ${period}:`, data);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques ${period}:`, error);
        return [];
    }
}

function checkAuthOnLoad() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to signup/login page');
        // Au lieu de rediriger vers une page séparée, nous allons afficher la page de connexion
        navigateTo('welcomepage');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthOnLoad()) {
        initializeCharts();
        updateCharts();
    }
});

function initializeCharts() {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    periods.forEach(period => {
        const ctx = document.getElementById(`${period}Chart`).getContext('2d');
        
        // Détruire le graphique existant s'il existe
        if (chartInstances[period]) {
            chartInstances[period].destroy();
        }
        
        chartInstances[period] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temps de Travail (minutes)',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Nombre de Comptages',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            font: {
                                size: 24, // Augmentez cette valeur pour des dates plus grandes
                                weight: 'bold'
                            },

                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    },
                    title: {
                        display: true,
                        font: {
                            size: 20,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        titleFont: {
                            size: 16,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });

        // Ajouter un gestionnaire d'événement de redimensionnement
        window.addEventListener('resize', resizeAllCharts);
    
        // Appeler resizeAllCharts une fois pour définir la taille initiale
        resizeAllCharts();
}

function resizeAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        resizeChart(chart);
    });

    function resizeChart(chart) {
        const wrapper = chart.canvas.parentNode;
        const padding = 40; // 20px de chaque côté
        const wrapperWidth = wrapper.clientWidth - padding;
        const wrapperHeight = wrapper.clientHeight - padding;
        
        chart.canvas.width = wrapperWidth;
        chart.canvas.height = wrapperHeight;
        chart.resize();
    }
}

async function updateCharts() {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];

    for (const period of periods) {
        try {
            const stats = await fetchStatistics(period);
            if (stats.length === 0) {
                console.log(`No data available for ${period} statistics`);
                // Optionally, update the chart to show "No data available"
                continue;
            }
            updateChart(chartInstances[period], stats, period);
        } catch (error) {
            console.error(`Error updating ${period} chart:`, error);
            // Optionally, update the chart to show an error message
        }
    }
}

function updateChart(chart, data, period) {
    if (!chart) {
        console.error(`Chart for ${period} not found`);
        return;
    }

    console.log(`Données reçues pour ${period}:`, data);

    if (!Array.isArray(data) || data.length === 0) {
        console.log(`Aucune donnée disponible pour ${period}`);
        chart.data.labels = [];
        chart.data.datasets.forEach((dataset) => {
            dataset.data = [];
        });
        chart.update();
        resizeChart(chart); 


        const labels = data.map(item => formatDate(item.date, period));

        chart.data.labels = labels;
        chart.options.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y;
                    }
                    return `<strong>${label}</strong>`;
                }
            }
        };
        chart.update();
        return;
    }

    const labels = data.map(item => {
        if (!item.date) {
            console.error('Date manquante pour l\'élément:', item);
            return 'Date invalide';
        }
        const formattedDate = formatDate(item.date, period);
        console.log(`Date originale: ${item.date}, Formattée: ${formattedDate}`);
        return formattedDate;
    });
    const totalTime = data.map(item => Math.round(Number(item.total_time) / 60)); // Convertir en minutes
    const totalCount = data.map(item => Number(item.total_count));

    chart.data.labels = labels;
    chart.data.datasets[0].data = totalTime;
    chart.data.datasets[1].data = totalCount;
    chart.update();
}

function formatDate(dateString, period) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return 'Date invalide';
    }

    let formattedDate;
    switch (period) {
        case 'daily':
            formattedDate = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
            break;
        case 'weekly':
            formattedDate = `Semaine du ${date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}`;
            break;
        case 'monthly':
            formattedDate = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
            break;
        case 'yearly':
            formattedDate = date.getFullYear().toString();
            break;
        default:
            formattedDate = date.toLocaleDateString('fr-FR');
    }

    return `${formattedDate}`;
}

function getWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}





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