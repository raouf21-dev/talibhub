import { updateDOMIfExists } from './utils.js';
import { loadTasks } from './tasks.js';
import { api } from './dynamicLoader.js';

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

function initializeTimer() {
    loadTasks();
    loadSessionFromCache();
    loadCounter();
    updateTaskTitle();
    enableControls();

    const apprentissageSection = document.getElementById('apprentissage');
    if (apprentissageSection) {
        apprentissageSection.addEventListener('click', function(event) {
            const target = event.target.closest('[data-action]');
            if (target) {
                const action = target.getAttribute('data-action');
                switch(action) {
                    case 'toggle-timer':
                        toggleTimer();
                        break;
                    case 'reset-timer':
                        resetTimer();
                        break;
                    case 'toggle-stopwatch':
                        toggleStopwatch();
                        break;
                    case 'reset-stopwatch':
                        resetStopwatch();
                        break;
                    case 'change-counter':
                        const value = parseInt(target.getAttribute('data-value'));
                        changeCounter(value);
                        break;
                    case 'save-session-data':
                        saveSessionData();
                        break;
                    case 'start-new-session':
                        startNewSession();
                        break;
                    default:
                        console.warn('Action inconnue :', action);
                }
            }
        });
    }

    const taskSelect = document.getElementById('task-select');
    if (taskSelect) {
        taskSelect.addEventListener('change', updateTaskTitle);
    }

    const addManualTimeBtn = document.getElementById('add-manual-time-btn');
    if (addManualTimeBtn) {
        addManualTimeBtn.addEventListener('click', addManualTime);
    }

    updateTimerDisplay();
}

function enableControls() {
    const controls = document.querySelectorAll('.session-control');
    controls.forEach(control => {
        control.disabled = !isSessionActive;
    });
}

async function updateTaskTitle(forceRefresh = false) {
    const taskSelect = document.getElementById('task-select');
    const selectedTaskTitle = document.getElementById('counter-task-title');
    const selectedTask = taskSelect?.options[taskSelect.selectedIndex]?.text;
    selectedTaskId = taskSelect?.value;

    console.log('Selected task:', selectedTask, 'Task ID:', selectedTaskId);

    if (!selectedTaskId || selectedTaskId === "") {
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
        const data = await api.get(`/session/last/${selectedTaskId}`);

        if (data.message === 'No previous session found for this task') {
            Counter.value = 0;
            timerTime = 0;
            stopwatchTime = 0;
            manualTimeInSeconds = 0;
            document.getElementById('current-session-id').textContent = "Pas d'ancienne session";
            document.getElementById('previous-sessions-count').textContent = "0";
        } else {
            Counter.value = data.lastSession.counter_value || 0;
            timerTime = data.lastSession.timer_time || 0;
            stopwatchTime = data.lastSession.stopwatch_time || 0;
            document.getElementById('current-session-id').textContent = 'Dernière session trouvée';
            document.getElementById('previous-sessions-count').textContent = 
                data.sessionCount !== undefined ? data.sessionCount.toString() : "N/A";
        }

        document.getElementById('counter-value').textContent = Counter.value;
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
        console.error('Erreur lors de l\'initialisation de la nouvelle session:', error);
        alert('Erreur lors de l\'initialisation de la nouvelle session: ' + error.message);
    }
}

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

async function saveSessionData() {
    if (!selectedTaskId || !isSessionActive) {
        alert("Aucune session active à enregistrer.");
        return;
    }

    const totalWorkTime = calculateTotalWorkTime();

    try {
        await api.post('/session/save', {
            taskId: selectedTaskId,
            totalWorkTime: totalWorkTime,
            stopwatchTime: stopwatchTime,
            timerTime: timerTime,
            counterValue: Counter.value
        });

        alert('Données de la session sauvegardées avec succès.');
        await updateTaskTitle(true);

        timerTime = 0;
        stopwatchTime = 0;
        manualTimeInSeconds = 0;
        Counter.value = 0;
        
        document.getElementById('counter-value').textContent = Counter.value;
        document.getElementById('current-session-id').textContent = 'Session terminée';
        document.getElementById('total-work-time').textContent = '00:00:00';

        isSessionActive = false;
        document.getElementById('start-new-session').disabled = false;

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
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('time-left').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

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

function calculateTotalWorkTime() {
    return timerTime + stopwatchTime + manualTimeInSeconds;
}

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

function updateStopwatch() {
    stopwatchTime++;
    document.getElementById('stopwatch-time').textContent = formatTime(stopwatchTime);
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchTime = 0;
    document.getElementById('stopwatch-time').textContent = '00:00:00';
    document.getElementById('stopwatch-start').textContent = 'Démarrer';
    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
}

function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function loadCounter() {
    const savedCounter = JSON.parse(localStorage.getItem('currentSessionData'));
    if (savedCounter?.counterValue !== undefined) {
        Counter.value = savedCounter.counterValue;
        document.getElementById('counter-value').textContent = Counter.value;
    } else {
        Counter.value = 0;
        document.getElementById('counter-value').textContent = Counter.value;
    }
}

function changeCounter(value) {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le compteur.");
        return;
    }
    Counter.value = Math.max(0, Counter.value + value);
    document.getElementById('counter-value').textContent = Counter.value;
}

function addManualTime() {
    if (!isSessionActive) {
        alert("Veuillez démarrer une nouvelle session avant d'ajouter du temps manuellement.");
        return;
    }

    const hours = parseInt(document.getElementById('manual-hours')?.value) || 0;
    const minutes = parseInt(document.getElementById('manual-minutes')?.value) || 0;

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        alert('Veuillez entrer un temps valide.');
        return;
    }

    manualTimeInSeconds += (hours * 3600) + (minutes * 60);

    if (document.getElementById('manual-hours')) document.getElementById('manual-hours').value = '';
    if (document.getElementById('manual-minutes')) document.getElementById('manual-minutes').value = '';

    document.getElementById('total-work-time').textContent = formatTime(calculateTotalWorkTime());
    alert('Temps d\'étude ajouté manuellement.');
}

export { initializeTimer };