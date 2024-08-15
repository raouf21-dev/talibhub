document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    updateCharts();

    const activePageId = document.querySelector('.page.active').id;
    const navHeader = document.getElementById('nav');
    if (activePageId === 'welcome' || activePageId === 'signup') {
        navHeader.style.display = 'none';
    } else {
        navHeader.style.display = 'block';
    }
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    document.getElementById('showPasswordToggle')?.addEventListener('click', togglePasswordVisibility);
    document.getElementById('passwordChangeForm')?.addEventListener('submit', handleChangePassword);
    document.getElementById('showNewPasswordToggle')?.addEventListener('click', toggleNewPasswordVisibility);
    document.getElementById('profileForm')?.addEventListener('submit', updateProfile);

    document.getElementById('task-select').addEventListener('change', updateTaskTitle);
    

    const taskSelect = document.getElementById('task-select');
    taskSelect.addEventListener('change', updateTaskTitle);
    });

function navigateTo(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageId);
        if (pageId === 'profile') {
            loadProfile();
        }
    });

    const navHeader = document.getElementById('nav');
    if (pageId === 'welcome' || pageId === 'signup') {
        navHeader.style.display = 'none';
    } else {
        navHeader.style.display = 'block';
    }

    switch(pageId) {
        case 'profile':
            break;
        case 'statistics':
            initializeCharts();
            updateCharts();
            break;
        case 'todoLists':
            loadTasks();
            break;
        case 'apprentissage':
            loadTasks();
            loadSessionFromCache();
            loadCounter();
            updateTaskTitle();
            enableControls();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'salatSurahSelector':
            initializeApp();
            break;
        default:
            break;
    }
}


// DropDown menu
$("#hamburger").click(function(event) {
    event.preventDefault();
    $("#nav").addClass("showNav");
    var winHeight = $(window).outerHeight();
    $('#menuWrapper').css('height',winHeight + 'px');
});

$("#close").click(function(event) {
    event.preventDefault();
    $("#nav").removeClass("showNav");
    $('#menuWrapper').css('height','auto');
});

$('#menuWrapper ul li').hover(function () {
    var el = $(this).children('ul');
    if (el.hasClass('hov')) {
        el.removeClass('hov');
    } else {
        el.addClass('hov');
    }
});

function initializeCalendar() {
    $('#calendar').fullCalendar({
        selectable: true,
        selectHelper: true,
        select: function(start, end) {
            updateCharts();
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    navigateTo('welcome');
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

    const lastName = document.getElementById('lastName').value;
    const firstName = document.getElementById('firstName').value;
    const username = document.getElementById('username').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!lastName || !firstName || !username || !age || !gender || !email || !password || !confirmPassword) {
        alert('Tous les champs doivent être remplis.');
        return;
    }

    console.log({
        lastName,
        firstName,
        username,
        age,
        gender,
        email,
        password
    });

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.');
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
                lastName,
                firstName,
                username,
                age,
                gender,
                email,
                password
            })
        });

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
            }
            throw new Error(`Erreur HTTP: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        alert('Inscription réussie');
        navigateTo('iconSelection');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription : ' + error.message);
    }
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        confirmPasswordField.type = 'text';
    } else {
        passwordField.type = 'password';
        confirmPasswordField.type = 'password';
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.querySelector('#loginForm input[placeholder="Adresse e-mail"]').value;
    const password = document.querySelector('#loginForm input[placeholder="Mot de passe"]').value;

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
        localStorage.setItem('username', data.user.username);

        alert('Connexion réussie');
        navigateTo('iconSelection');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion');
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
        const taskSelect = document.getElementById('task-select');
        const taskList = document.getElementById('task-list');

        // Mise à jour du DOM pour afficher les tâches
        taskList.innerHTML = '';
        taskSelect.innerHTML = '<option value="">Sélectionnez une tâche</option>';
        tasks.forEach(task => {
            let li = document.createElement('li');
            li.innerHTML = `<span class="task-name">${escapeHTML(task.name)}</span> 
                            <button onclick="removeTask(this, ${task.id})">Supprimer</button> 
                            <button onclick="renameTask(this, ${task.id})">Renommer</button>`;
            taskList.appendChild(li);

            let option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            taskSelect.appendChild(option);
        });

        // Sauvegarde des tâches localement
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}


async function addNewTask() {
    const taskName = document.getElementById('new-task').value.trim();
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

async function removeTask(button, taskId) {
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

        // Suppression de l'élément de la liste
        const taskItem = button.closest('li');
        taskItem.remove();

        // Recharger les tâches après suppression
        loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function renameTask(button, taskId) {
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
let isRunning = false;
let isWorkSession = true;
let workDuration = 25 * 60;
let breakDuration = 5 * 60;
let currentTime = workDuration;
let timer;
let stopwatchInterval = null;
let stopwatchTime = 0;
let totalWorkTime = 0;
let selectedTaskId = '';
let currentSessionId = 0;
let previousSessionId = 0;
let manualTimeInSeconds = 0;
const Counter = { taskId: '', value: 0 };
let currentTaskId = null;
isSessionActive = false;

// Fonction pour mettre à jour le titre de la tâche sélectionnée


async function updateTaskTitle() {
    const taskSelect = document.getElementById('task-select');
    const selectedTaskTitle = document.getElementById('counter-task-title');
    const selectedTask = taskSelect.options[taskSelect.selectedIndex].text;
    selectedTaskId = taskSelect.value;

    console.log('Tâche sélectionnée:', selectedTask, 'ID:', selectedTaskId);

    if (!selectedTaskId || selectedTaskId === "") {
        selectedTaskTitle.textContent = "Sélectionnez une tâche";
        document.getElementById('previous-session-id').textContent = "Sélectionnez une tâche";
        document.getElementById('current-session-id').textContent = "Veuillez démarrer une nouvelle session";
        document.getElementById('counter-value').textContent = "0";
        isSessionActive = false;
        enableControls();
        return;
    }

    selectedTaskTitle.textContent = selectedTask;

    try {
        console.log('Récupération de la dernière session pour la tâche:', selectedTaskId);
        const response = await fetch(`http://localhost:3000/session/last/${selectedTaskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Statut de la réponse:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Aucune session précédente trouvée pour cette tâche.');
                document.getElementById('previous-session-id').textContent = '0';
                document.getElementById('current-session-id').textContent = 'Veuillez démarrer une nouvelle session';
                document.getElementById('counter-value').textContent = '0';
                previousSessionId = 0;
                isSessionActive = false;
                enableControls();
                return;
            }
            throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        }

        const lastSession = await response.json();
        console.log('Dernière session reçue:', lastSession);

        previousSessionId = lastSession.previous_session_id || 0;
        Counter.value = lastSession.counter_value;
        totalWorkTime = lastSession.total_work_time;
        stopwatchTime = lastSession.stopwatch_time;

        console.log('ID de la session précédente:', previousSessionId);
        document.getElementById('previous-session-id').textContent = previousSessionId;
        document.getElementById('counter-value').textContent = Counter.value;
        document.getElementById('current-session-id').textContent = 'Veuillez démarrer une nouvelle session';

        isSessionActive = false;
        enableControls();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement de la dernière session.');
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

    try {
        const newSessionId = parseInt(previousSessionId) + 1;
        const response = await fetch('http://localhost:3000/session/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                id: newSessionId,
                taskId: selectedTaskId,
                previousSessionId: previousSessionId,
                totalWorkTime: 0,
                stopwatchTime: 0,
                counterValue: 0
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la création de la nouvelle session');
        }

        const data = await response.json();
        currentSessionId = data.sessionId;

        totalWorkTime = 0;
        stopwatchTime = 0;
        Counter.value = 0;

        document.getElementById('previous-session-id').textContent = previousSessionId;
        document.getElementById('current-session-id').textContent = currentSessionId;
        document.getElementById('counter-value').textContent = Counter.value;

        isSessionActive = true;
        enableControls();

        console.log('Nouvelle session démarrée avec ID:', currentSessionId);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création de la nouvelle session');
    }
}

function enableControls() {
    const startStopButton = document.getElementById('start_stop');
    const stopwatchStartButton = document.getElementById('stopwatch-start');
    const counterButtons = document.querySelectorAll('#counter-buttons button');

    startStopButton.disabled = !isSessionActive;
    stopwatchStartButton.disabled = !isSessionActive;
    counterButtons.forEach(button => button.disabled = !isSessionActive);
}


function startTimer() {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le timer.");
        return;
    }
    if (!isRunning) {
        timer = setInterval(updateTimer, 1000);
        isRunning = true;
        document.getElementById('start-timer').textContent = 'Pause';
    } else {
        clearInterval(timer);
        isRunning = false;
        document.getElementById('start-timer').textContent = 'Reprendre';
    }
}


async function updateLastSessionInfo() {
    try {
        const response = await fetch(`http://localhost:3000/session/${previousSessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${await response.text()}`);
        }

        const lastSession = await response.json();
        console.log('Session précédente mise à jour:', lastSession);

        // Mettre à jour l'affichage avec les informations de la session précédente
        document.getElementById('previous-session-id').textContent = lastSession.id;
        // Ajouter d'autres mises à jour d'affichage si nécessaire
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations de la session précédente:', error);
    }
}



// Sauvegarder l'état actuel des outils dans le cache local
function saveSessionToCache() {
    const sessionData = {
        sessionId: currentSessionId,
        previousSessionId: previousSessionId,
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
        previousSessionId = savedSession.previousSessionId;
        selectedTaskId = savedSession.taskId;
        totalWorkTime = savedSession.totalWorkTime;
        stopwatchTime = savedSession.stopwatchTime;
        Counter.value = savedSession.counterValue;
        manualTimeInSeconds = savedSession.manualTimeInSeconds || 0;

        document.getElementById('previous-session-id').textContent = previousSessionId;
        document.getElementById('current-session-id').textContent = currentSessionId;
        document.getElementById('counter-value').textContent = Counter.value;

        updateTimerDisplay();
        updateBreakTimeDisplay();
        isSessionActive = true;
    } else {
        // Si pas de données dans le cache, on pourrait charger depuis le serveur
        // mais pour l'instant, on va juste initialiser une nouvelle session
        await startNewSession();
        isSessionActive = false;
    }
    enableControls();
}

// Mettre à jour l'affichage du Timer
function updateTimer() {
    if (currentTime > 0) {
        currentTime--;
        updateTimerDisplay();
    } else {
        clearInterval(timer);
        if (isWorkSession) {
            totalWorkTime += workDuration;
            isWorkSession = false;
            currentTime = breakDuration;
            document.getElementById('timer-label').textContent = 'Pause';
            updateBreakTimeDisplay();
            timer = setInterval(updateTimer, 1000);
        } else {
            isWorkSession = true;
            currentTime = workDuration;
            document.getElementById('timer-label').textContent = 'Travail';
            document.getElementById('start_stop').textContent = 'Démarrer';
        }
    }
}

// Mettre à jour l'affichage du temps de pause
function updateBreakTimeDisplay() {
    const breakMinutes = Math.floor(breakDuration / 60);
    const breakSeconds = breakDuration % 60;
    document.getElementById('break-time-left').textContent = `Pause: ${breakMinutes}:${breakSeconds < 10 ? '0' : ''}${breakSeconds}`;
}

// Mettre à jour l'affichage du temps de travail
function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('time-left').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Gestion du démarrage et de la pause du Timer
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

// Réinitialisation du Timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkSession = true;
    currentTime = workDuration;
    updateTimerDisplay();
    document.getElementById('start_stop').textContent = 'Démarrer';
    saveSessionToCache(); // Sauvegarder l'état après réinitialisation
}

// Arrêter le Timer
function stopTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('start_stop').textContent = 'Démarrer';
    saveSessionToCache(); // Sauvegarder l'état après arrêt
}

// Démarrer le chronomètre
function startStopwatch() {
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

// Arrêter le chronomètre
function stopStopwatch() {
    clearInterval(stopwatchInterval);
    document.getElementById('stopwatch-start').disabled = false;
    document.getElementById('stopwatch-stop').disabled = true;
    saveSessionToCache(); // Sauvegarder l'état du chronomètre après arrêt
}

// Réinitialiser le chronomètre
function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchTime = 0;
    document.getElementById('stopwatch-time').textContent = formatTime(stopwatchTime);
    document.getElementById('stopwatch-start').disabled = false;
    document.getElementById('stopwatch-stop').disabled = true;
    saveSessionToCache(); // Sauvegarder l'état après réinitialisation
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

function incrementCounter(value) {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le compteur.");
        return;
    }
    Counter.value += value;
    document.getElementById('counter-value').textContent = Counter.value;
}

function decrementCounter(amount) {
    Counter.value = Math.max(0, Counter.value - amount);
    document.getElementById('counter-value').textContent = Counter.value;
}

// Réinitialiser le compteur
function resetCounter() {
    Counter.value = 0;
    document.getElementById('counter-value').textContent = Counter.value;
    saveSessionToCache(); // Sauvegarder l'état après réinitialisation
}

// Fonction pour ajouter manuellement du temps d'étude
function addManualTime() {
    const hours = parseInt(document.getElementById('manual-hours').value) || 0;
    const minutes = parseInt(document.getElementById('manual-minutes').value) || 0;

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        alert('Veuillez entrer un temps valide.');
        return;
    }

    manualTimeInSeconds = (hours * 60 * 60) + (minutes * 60);

    if (manualTimeInSeconds > 0) {
        alert('Temps d\'étude ajouté manuellement.');
    } else {
        alert('Veuillez entrer un temps supérieur à 0.');
    }

    document.getElementById('manual-hours').value = '';
    document.getElementById('manual-minutes').value = '';
}

// Enregistrer les données de session au serveur
async function saveSessionData() {
    if (!selectedTaskId) {
        alert("Veuillez sélectionner une tâche avant d'enregistrer.");
        return;
    }

    const totalWorkTimeWithManual = totalWorkTime + manualTimeInSeconds;
    const stopwatchTimeWithManual = stopwatchTime + manualTimeInSeconds;

    try {
        const response = await fetch('http://localhost:3000/session/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                taskId: selectedTaskId,
                totalWorkTime: totalWorkTimeWithManual,
                stopwatchTime: stopwatchTimeWithManual,
                counterValue: Counter.value
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement des données de la session');
        }

        const data = await response.json();
        alert('Données de la session sauvegardées avec succès.');
        console.log('Session data saved:', data);

        // Réinitialiser les valeurs après l'enregistrement
        manualTimeInSeconds = 0;
        document.getElementById('manual-hours').value = '';
        document.getElementById('manual-minutes').value = '';

    } catch (error) {
        console.error('Error saving session data:', error);
        alert('Erreur lors de la sauvegarde des données de la session');
    }
}


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

        setAndLogValue('username', user.username);
        setAndLogValue('last-name', user.last_name);
        setAndLogValue('first-name', user.first_name);
        setAndLogValue('age', user.age);
        setAndLogValue('gender', user.gender);
        setAndLogValue('email', user.email);

        // Vérification finale
        console.log('Final form values:');
        ['username', 'last-name', 'first-name', 'age', 'gender', 'email'].forEach(id => {
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

    const username = document.getElementById('username').value;
    const lastName = document.getElementById('last-name').value;
    const firstName = document.getElementById('first-name').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const email = document.getElementById('email').value;

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

function initializeCharts() {
    const ctxDaily = document.getElementById('dailyChart').getContext('2d');
    const ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
    const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
    const ctxYearly = document.getElementById('yearlyChart').getContext('2d');

    const dailyChart = new Chart(ctxDaily, {
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
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });

    const weeklyChart = new Chart(ctxWeekly, {
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
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });

    const monthlyChart = new Chart(ctxMonthly, {
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
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });

    const yearlyChart = new Chart(ctxYearly, {
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
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });

    return { dailyChart, weeklyChart, monthlyChart, yearlyChart };
}

const { dailyChart, weeklyChart, monthlyChart, yearlyChart } = initializeCharts();



function updateCharts() {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

    const chartData = completedTasks.reduce((acc, task) => {
        const taskDate = new Date(task.date);
        const day = taskDate.toISOString().split('T')[0];
        const week = `${taskDate.getFullYear()}-W${getWeekNumber(taskDate)}`;
        const month = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const year = taskDate.getFullYear().toString();

        if (!acc.daily[day]) acc.daily[day] = { units: 0, duration: 0 };
        if (!acc.weekly[week]) acc.weekly[week] = { units: 0, duration: 0 };
        if (!acc.monthly[month]) acc.monthly[month] = { units: 0, duration: 0 };
        if (!acc.yearly[year]) acc.yearly[year] = { units: 0, duration: 0 };

        acc.daily[day].units += task.duration;
        acc.daily[day].duration += task.duration / 60;

        acc.weekly[week].units += task.duration;
        acc.weekly[week].duration += task.duration / 60;

        acc.monthly[month].units += task.duration;
        acc.monthly[month].duration += task.duration / 60;

        acc.yearly[year].units += task.duration;
        acc.yearly[year].duration += task.duration / 60;

        return acc;
    }, { daily: {}, weekly: {}, monthly: {}, yearly: {} });

    updateChart(dailyChart, chartData.daily);
    updateChart(weeklyChart, chartData.weekly);
    updateChart(monthlyChart, chartData.monthly);
    updateChart(yearlyChart, chartData.yearly);
}

function updateChart(chart, data) {
    const labels = Object.keys(data);
    const durations = labels.map(label => data[label].duration);
    const units = labels.map(label => data[label].units);

    chart.data.labels = labels;
    chart.data.datasets[0].data = durations;
    chart.data.datasets[1].data = units;
    chart.update();
}

document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    loadSessionFromCache(); 
    if (document.getElementById('statistics').classList.contains('active')) {
        loadProfile();
    }

    initializeCalendar();
    updateCharts();
});

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
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';
    notifications.forEach(notification => {
        let message = document.createElement('div');
        message.classList.add('message');
        message.innerHTML = `<div class="message-content">${escapeHTML(notification.content)}</div><div class="message-time">${new Date(notification.time).toLocaleString()}</div>`;
        messageList.appendChild(message);
    });
}

function addNotification(content) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const newNotification = {
        content: content,
        time: new Date().toISOString()
    };
    notifications.push(newNotification);
    saveNotifications(notifications);
    loadNotifications();
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('notifications').classList.contains('active')) {
        loadNotifications();
    }
});

addNotification("Bienvenue sur TalibTimer! Voici votre première notification.");
