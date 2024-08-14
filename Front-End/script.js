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

    document.getElementById('task-select').addEventListener('change', updateCounterTaskTitle);
    
});

function navigateTo(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageId);
    });

    const navHeader = document.getElementById('nav');
    if (pageId === 'welcome' || pageId === 'signup') {
        navHeader.style.display = 'none';
    } else {
        navHeader.style.display = 'block';
    }

    switch(pageId) {
        case 'profile':
            loadProfile();
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
            loadTimerStateFromCache();
            loadCounter();
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
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
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
        const taskList = document.getElementById('task-list');
        const taskSelect = document.getElementById('task-select');

        taskList.innerHTML = '';
        taskSelect.innerHTML = '<option value="">Sélectionnez une tâche</option>';
        tasks.forEach(task => {
            let li = document.createElement('li');
            li.innerHTML = `<span class="task-name">${escapeHTML(task.name)}</span> <button onclick="removeTask(this, ${task.id})">Supprimer</button> <button onclick="renameTask(this, ${task.id})">Renommer</button>`;
            taskList.appendChild(li);

            let option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            taskSelect.appendChild(option);
        });
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

        const taskItem = button.closest('li');
        taskItem.remove();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function renameTask(button, taskId) {
    const newName = prompt("Entrez le nouveau nom de la tâche:");
    if (!newName) return;

    try {
        const response = await fetch(`http://localhost:3000/tasks/updateTask/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: newName })
        });

        if (!response.ok) {
            throw new Error(`Error renaming task: ${response.status} ${response.statusText}`);
        }

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
const sessions = [];
let selectedTaskId = '';
let currentSessionId = 0;
let previousSessionId = 0;

function updateTaskTitle() {
    const taskSelect = document.getElementById('task-select');
    const selectedTaskTitle = document.getElementById('counter-task-title');
    const selectedTask = taskSelect.options[taskSelect.selectedIndex].text;
    selectedTaskTitle.textContent = selectedTask !== "" ? selectedTask : "Sélectionnez une tâche";
    selectedTaskId = taskSelect.value;
}

function startNewSession() {
    previousSessionId = currentSessionId;
    currentSessionId = 0; // Le back-end générera un ID unique
    document.getElementById('previous-session-id').textContent = previousSessionId;
    document.getElementById('current-session-id').textContent = '[ID généré automatiquement]';
    totalWorkTime = 0;
    stopwatchTime = 0;
    console.log('New session started.');
}

async function loadTimerState() {
    try {
        const response = await fetch('http://localhost:3000/timer/loadState', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load timer state: ' + response.statusText);
        }

        const savedState = await response.json();
        if (savedState) {
            isRunning = savedState.isRunning;
            isWorkSession = savedState.isWorkSession;
            workDuration = savedState.workDuration;
            breakDuration = savedState.breakDuration;
            currentTime = savedState.currentTime;
            updateTimerDisplay();
            updateBreakTimeDisplay();
            if (isRunning) {
                timer = setInterval(updateTimer, 1000);
                document.getElementById('start_stop').textContent = 'Pause';
            }
        }
    } catch (error) {
        console.error('Error loading timer state:', error);
    }
}

function updateTimer() {
    if (currentTime > 0) {
        currentTime--;
        updateTimerDisplay();
    } else {
        clearInterval(timer);
        if (isWorkSession) {
            totalWorkTime += workDuration; // Ajout au totalWorkTime
            console.log('Total Work Time incremented:', totalWorkTime);
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

function saveSessionData() {
    if (!selectedTaskId) {
        alert("Veuillez sélectionner une tâche avant d'enregistrer.");
        return;
    }

    const sessionData = {
        sessionId: currentSessionId,
        previousSessionId: previousSessionId || null,
        taskId: selectedTaskId,
        totalWorkTime: totalWorkTime,
        stopwatchTime: stopwatchTime,
        counterValue: Counter.value
    };

    fetch('http://localhost:3000/session/save', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(sessionData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement des données de la session.');
        }
        return response.json();
    })
    .then(data => {
        alert('Données de la session sauvegardées avec succès.');
        console.log('Session data saved:', sessionData);
    })
    .catch(error => {
        console.error('Error saving session data:', error);
        alert('Erreur lors de la sauvegarde des données.');
    });
}


function saveTimerStateToCache() {
    const state = { isRunning, isWorkSession, workDuration, breakDuration, currentTime, timestamp: new Date().getTime() };
    localStorage.setItem('timerState', JSON.stringify(state));
}

function saveSessionToCache(session) {
    let cachedSessions = JSON.parse(localStorage.getItem('sessions')) || [];
    cachedSessions.push({ ...session, timestamp: new Date().getTime() });
    localStorage.setItem('sessions', JSON.stringify(cachedSessions));
    console.log('Session added to cache:', session); // Vérifiez cette ligne
    console.log('All cached sessions:', cachedSessions); // Vérifiez cette ligne
}

function loadTimerStateFromCache() {
    const savedState = JSON.parse(localStorage.getItem('timerState'));
    if (savedState) {
        const now = new Date().getTime();
        if (now - savedState.timestamp < 6 * 3600 * 1000) {  // 6 heures de validité
            isRunning = savedState.isRunning;
            isWorkSession = savedState.isWorkSession;
            workDuration = savedState.workDuration;
            breakDuration = savedState.breakDuration;
            currentTime = savedState.currentTime;

            // Ne plus charger les identifiants de session ici
            previousSessionId = savedState.previousSessionId || 0;
            currentSessionId = 0; // Le back-end gérera cet identifiant lors de la prochaine session

            stopwatchTime = 0; // Réinitialiser le chronomètre
            updateTimerDisplay();
            updateBreakTimeDisplay();
        } else {
            localStorage.removeItem('timerState');
        }
    }
}

async function saveDataToServer(state, sessions) {
    const selectedTask = getSelectedTaskDetails();

    if (!selectedTask.id) {
        alert('Veuillez sélectionner une tâche avant d\'enregistrer.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Votre session a expiré, veuillez vous reconnecter.');
            navigateTo('login');
            return;
        }

        state.taskId = selectedTask.id;

        await fetch('http://localhost:3000/timer/saveState', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ state, sessions })
        });

        localStorage.removeItem('timerState');
        localStorage.removeItem('sessions');
        alert('Données sauvegardées avec succès.');
    } catch (error) {
        console.error('Error saving data to server:', error);
        alert('Erreur lors de la sauvegarde des données.');
    }
}



function updateBreakTimeDisplay() {
    const breakMinutes = Math.floor(breakDuration / 60);
    const breakSeconds = breakDuration % 60;
    document.getElementById('break-time-left').textContent = `Pause: ${breakMinutes}:${breakSeconds < 10 ? '0' : ''}${breakSeconds}`;
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('time-left').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function toggleTimer() {
    const selectedTask = getSelectedTaskDetails();

    if (!selectedTask.id) {
        alert("Veuillez sélectionner une tâche avant de démarrer le Pomodoro Timer.");
        return;
    }

    if (stopwatchTime > 0 && stopwatchInterval !== null) {
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


function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkSession = true;
    currentTime = workDuration;
    updateTimerDisplay();
    document.getElementById('start_stop').textContent = 'Démarrer';
    document.getElementById('stopwatch-start').disabled = false;
    document.getElementById('stopwatch-stop').disabled = true;
    saveTimerState();
}

function stopTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('start_stop').textContent = 'Démarrer';
    saveTimerState();
}

function startStopwatch() {
    if (isRunning) {
        alert("Veuillez arrêter le Pomodoro Timer avant de démarrer le Chronomètre.");
        return;
    }
    clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
        stopwatchTime++;
        document.getElementById('stopwatch-time').textContent = formatTime(stopwatchTime);
    }, 1000);
    document.getElementById('stopwatch-start').disabled = true;
    document.getElementById('stopwatch-stop').disabled = false;
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
    document.getElementById('stopwatch-start').disabled = false;
    document.getElementById('stopwatch-stop').disabled = true;
}

function resetStopwatch() {
    clearInterval(stopwatchInterval); // Arrêter l'intervalle
    stopwatchInterval = null; // Réinitialiser l'intervalle
    stopwatchTime = 0;
    document.getElementById('stopwatch-time').textContent = formatTime(stopwatchTime);
    document.getElementById('stopwatch-start').disabled = false;
    document.getElementById('stopwatch-stop').disabled = true;
}

function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function addCompletedTask(taskId, duration, type) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
    const newTask = {
        taskId: taskId,
        duration: duration,
        type: type,
        date: new Date().toISOString()
    };
    completedTasks.push(newTask);
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
}

function saveTimerData() {
    const selectedTask = getSelectedTaskDetails();
    console.log('Selected Task:', selectedTask); // Ajoutez cette ligne

    if (selectedTask.id && totalWorkTime > 0) {
        console.log('Total Work Time:', totalWorkTime); // Ajoutez cette ligne
        addCompletedTask(selectedTask.id, totalWorkTime, 'duration');
        alert('Données du Pomodoro Timer enregistrées pour la tâche : ' + selectedTask.name);
        totalWorkTime = 0;
        updateCharts();
    } else {
        alert('Veuillez sélectionner une tâche pour enregistrer les données.');
        console.log('No task selected or totalWorkTime is 0'); // Ajoutez cette ligne
    }
}

function saveStopwatchData() {
    const selectedTask = document.getElementById('task-select').value;
    if (selectedTask && stopwatchTime > 0) {
        addCompletedTask(selectedTask, stopwatchTime, 'duration');
        alert('Données du chronomètre enregistrées.');
        updateCharts();
    } else {
        alert('Veuillez sélectionner une tâche et vous assurer que le temps est supérieur à 0 pour enregistrer les données.');
    }
}

const Counter = { taskId: '', value: 0 };

function updateCounterTaskTitle() {
    const selectedTask = getSelectedTaskDetails();
    const selectedTaskTitle = document.getElementById('counter-task-title');
    selectedTaskTitle.textContent = selectedTask.name !== "" ? selectedTask.name : "Sélectionnez une tâche";
    Counter.taskId = selectedTask.id;
}


function incrementCounter(amount) {
    Counter.value += amount;
    document.getElementById('counter-value').textContent = Counter.value;
}

function decrementCounter(amount) {
    Counter.value -= amount;
    if (Counter.value < 0) Counter.value = 0;
    document.getElementById('counter-value').textContent = Counter.value;
}

async function saveCounter() {
    const selectedTask = getSelectedTaskDetails();

    if (!selectedTask.id) {
        alert('Veuillez sélectionner une tâche avant d\'enregistrer.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/counter', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ value: Counter.value, taskId: selectedTask.id }) // Utilisation de l'ID de la tâche sélectionnée
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des données du compteur');
        }

        alert('Données du compteur sauvegardées avec succès.');
    } catch (error) {
        console.error('Error saving counter value:', error);
        alert('Erreur lors de la sauvegarde des données du compteur.');
    }
}

async function loadCounter() {
    try {
        const response = await fetch('http://localhost:3000/counter');
        const data = await response.json();
        Counter.value = data.value;
        document.getElementById('counter-value').textContent = Counter.value;
    } catch (error) {
        console.error('Error loading counter value:', error);
    }
}

function resetCounter() {
    Counter.value = 0;
    document.getElementById('counter-value').textContent = Counter.value;
}

function addManualTime() {
    const hours = parseInt(document.getElementById('manual-hours').value) || 0;
    const minutes = parseInt(document.getElementById('manual-minutes').value) || 0;
    const selectedTask = document.getElementById('task-select').value;

    if (!selectedTask) {
        alert('Veuillez sélectionner une tâche pour enregistrer le temps.');
        return;
    }

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        alert('Veuillez entrer un temps valide.');
        return;
    }

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 0) {
        addCompletedTask(selectedTask, totalMinutes, 'duration');
        alert('Temps d\'étude ajouté manuellement.');
        updateCharts();
    } else {
        alert('Veuillez entrer un temps supérieur à 0.');
    }

    document.getElementById('manual-hours').value = '';
    document.getElementById('manual-minutes').value = '';
}

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
            throw new Error('Erreur lors de la récupération des informations de profil');
        }

        const user = await response.json();
        console.log('Données du profil:', user);

        // Vérifications
        console.log('Username field:', document.getElementById('username')); 
        console.log('Setting value for username:', user.username);
        document.getElementById('username').value = escapeHTML(user.username || '');

        document.getElementById('last-name').value = escapeHTML(user.last_name || '');
        document.getElementById('first-name').value = escapeHTML(user.first_name || '');
        document.getElementById('age').value = escapeHTML(user.age || '');
        document.getElementById('gender').value = user.gender || '';
        document.getElementById('email').value = escapeHTML(user.email || '');

        // Vérification finale dans le DOM
        console.log('Username value in DOM:', document.getElementById('username').value);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des informations de profil');
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
    loadTimerStateFromCache(); 
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
