// timer.js
import { updateDOMIfExists } from './utils.js';
import { loadTasks } from './tasks.js';
import { api } from './dynamicLoader.js';
import AppState from './state.js';

function initializeTimer() {
    try {
        loadTasks();
        initializeSessionState();
        updateTaskTitle();
        enableControls();

        // Event Listeners
        const apprentissageSection = document.getElementById('apprentissage');
        if (apprentissageSection) {
            apprentissageSection.addEventListener('click', handleApprentissageEvents);
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
    } catch (error) {
        console.error('Erreur dans initializeTimer:', error);
    }
}

function initializeSessionState() {
    try {
        const savedSession = localStorage.getItem('currentSessionData');
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            
            // Restaurer l'état de la session
            Object.entries({
                'session.currentSessionId': sessionData.sessionId,
                'session.taskLastSessionId': sessionData.taskLastSessionId,
                'session.selectedTaskId': sessionData.taskId,
                'session.totalWorkTime': sessionData.totalWorkTime,
                'timer.stopwatchTime': sessionData.stopwatchTime,
                'session.counter.value': sessionData.counterValue,
                'timer.manualTimeInSeconds': sessionData.manualTimeInSeconds || 0
            }).forEach(([key, value]) => AppState.set(key, value));

            // Mise à jour de l'interface
            updateDOMIfExists('current-session-id', sessionData.sessionId);
            updateDOMIfExists('counter-value', sessionData.counterValue);
            updateTimerDisplay();
            AppState.set('session.isActive', true);
        } else {
            AppState.set('session.isActive', false);
        }
        enableControls();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'état de la session:', error);
        AppState.set('session.isActive', false);
        enableControls();
    }
}

function handleApprentissageEvents(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    try {
        const action = target.getAttribute('data-action');
        const actions = {
            'toggle-timer': toggleTimer,
            'reset-timer': resetTimer,
            'toggle-stopwatch': toggleStopwatch,
            'reset-stopwatch': resetStopwatch,
            'save-session-data': saveSessionData,
            'start-new-session': startNewSession,
            'change-counter': () => {
                const value = parseInt(target.getAttribute('data-value'));
                if (!isNaN(value)) {
                    changeCounter(value);
                }
            }
        };

        if (actions[action]) {
            actions[action]();
        }
    } catch (error) {
        console.error('Erreur lors du traitement de l\'action:', error);
    }
}

async function updateTaskTitle(forceRefresh = false, skipDataLoad = false) {
    const taskSelect = document.getElementById('task-select');
    const selectedTaskTitle = document.getElementById('counter-task-title');
    const selectedTask = taskSelect?.options[taskSelect.selectedIndex]?.text;
    
    AppState.set('session.selectedTaskId', taskSelect?.value || '');
    const selectedTaskId = AppState.get('session.selectedTaskId');

    if (!selectedTaskId) {
        resetUIState();
        return;
    }

    selectedTaskTitle.textContent = selectedTask;

    // Si skipDataLoad est true, on ne charge pas les données de la dernière session
    if (!skipDataLoad) {
        try {
            const data = await api.get(`/session/last/${selectedTaskId}`);
            if (data.message === 'No previous session found for this task') {
                resetSessionState();
                updateDOMIfExists('current-session-id', "Pas d'ancienne session");
                updateDOMIfExists('previous-sessions-count', "0");
            } else {
                updateSessionWithLastData(data.lastSession, data.sessionCount);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la dernière session:', error);
            handleSessionError();
        }
    }

    AppState.set('session.isActive', false);
    document.getElementById('start-new-session').disabled = false;
    enableControls();
}

async function saveSessionData() {
    if (!AppState.get('session.selectedTaskId') || !AppState.get('session.isActive')) {
        alert("Aucune session active à enregistrer.");
        return;
    }

    try {
        const dataToSave = {
            taskId: AppState.get('session.selectedTaskId'),
            totalWorkTime: calculateTotalWorkTime(),
            stopwatchTime: AppState.get('timer.stopwatchTime'),
            timerTime: AppState.get('timer.timerTime'),
            counterValue: AppState.get('session.counter.value'),
            manualTimeInSeconds: AppState.get('timer.manualTimeInSeconds')
        };

        // 1. Sauvegarde des données
        await api.post('/session/save', dataToSave);

        // 2. Réinitialisation complète de l'état
        resetAllTimers();
        resetAllCounters();
        resetAllInputs();
        clearAllIntervals();
        
        // 3. Mise à jour de l'interface sans charger les données
        updateDOMIfExists('time-left', '25:00');
        updateDOMIfExists('stopwatch-time', '00:00:00');
        updateDOMIfExists('counter-value', '0');
        updateDOMIfExists('total-work-time', '00:00:00');
        updateDOMIfExists('current-session-id', 'Session terminée');

        // 4. Réinitialisation des boutons
        const startStopBtn = document.getElementById('start_stop');
        const stopwatchStartBtn = document.getElementById('stopwatch-start');
        if (startStopBtn) {
            startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
        }
        if (stopwatchStartBtn) {
            stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
        }

        // 5. Mise à jour de l'état de la session
        AppState.set('session.isActive', false);
        localStorage.removeItem('currentSessionData');

        // 6. Réactiver le bouton nouvelle session
        const newSessionBtn = document.getElementById('start-new-session');
        if (newSessionBtn) {
            newSessionBtn.disabled = false;
        }

        // 7. Mettre à jour le titre de la tâche sans recharger les données
        await updateTaskTitle(true, true);

        alert('Session sauvegardée avec succès.');

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
    }
}

function resetAllTimers() {
    // Timer principal
    AppState.set('timer.currentTime', AppState.get('timer.workDuration'));
    AppState.set('timer.timerTime', 0);
    AppState.set('timer.isRunning', false);
    AppState.set('timer.isWorkSession', true);
    
    // Chronomètre
    AppState.set('timer.stopwatchTime', 0);
    AppState.set('timer.stopwatchInterval', null);
    
    // Temps manuel
    AppState.set('timer.manualTimeInSeconds', 0);
}

function resetAllCounters() {
    AppState.set('session.counter.value', 0);
}

function resetAllInputs() {
    const hoursInput = document.getElementById('manual-hours');
    const minutesInput = document.getElementById('manual-minutes');
    if (hoursInput) hoursInput.value = '';
    if (minutesInput) minutesInput.value = '';
}

function clearAllIntervals() {
    if (AppState.get('timer.timer')) {
        clearInterval(AppState.get('timer.timer'));
        AppState.set('timer.timer', null);
    }
    
    if (AppState.get('timer.stopwatchInterval')) {
        clearInterval(AppState.get('timer.stopwatchInterval'));
        AppState.set('timer.stopwatchInterval', null);
    }
}

function updateUIAfterSave() {
    // Mise à jour des affichages
    updateDOMIfExists('time-left', '25:00');
    updateDOMIfExists('stopwatch-time', '00:00:00');
    updateDOMIfExists('counter-value', '0');
    updateDOMIfExists('total-work-time', '00:00:00');
    updateDOMIfExists('current-session-id', 'Session terminée');
    
    // Réinitialisation des boutons
    const startStopBtn = document.getElementById('start_stop');
    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    
    if (startStopBtn) {
        startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
    
    if (stopwatchStartBtn) {
        stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }

    // Réactivation du bouton nouvelle session
    const newSessionBtn = document.getElementById('start-new-session');
    if (newSessionBtn) {
        newSessionBtn.disabled = false;
    }
}

function startNewSession() {
    if (!AppState.get('session.selectedTaskId')) {
        alert("Veuillez sélectionner une tâche avant de créer une nouvelle session.");
        return;
    }

    if (AppState.get('session.isActive')) {
        alert("Une session est déjà en cours. Veuillez l'enregistrer avant d'en commencer une nouvelle.");
        return;
    }

    try {
        resetSessionState();
        
        // Mise à jour de l'interface
        updateDOMIfExists('current-session-id', 'Nouvelle Session en cours');
        updateDOMIfExists('counter-value', '0');
        updateDOMIfExists('total-work-time', '00:00:00');
        updateDOMIfExists('stopwatch-time', '00:00:00');

        // Réinitialisation des boutons
        const startStopBtn = document.getElementById('start_stop');
        const stopwatchStartBtn = document.getElementById('stopwatch-start');
        
        if (startStopBtn) {
            startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
        }
        if (stopwatchStartBtn) {
            stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
        }
        
        AppState.set('session.isActive', true);
        enableControls();
        document.getElementById('start-new-session').disabled = true;
        
        saveSessionToCache();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la nouvelle session:', error);
        alert('Erreur lors de l\'initialisation de la nouvelle session: ' + error.message);
    }
}

function toggleTimer() {
    if (!AppState.get('session.isActive')) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le timer.");
        return;
    }

    if (!AppState.get('session.selectedTaskId')) {
        alert("Veuillez sélectionner une tâche avant de démarrer le timer.");
        return;
    }

    const startStopBtn = document.getElementById('start_stop');
    if (!startStopBtn) return;

    if (AppState.get('timer.isRunning')) {
        clearInterval(AppState.get('timer.timer'));
        startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    } else {
        const timer = setInterval(updateTimer, 1000);
        AppState.set('timer.timer', timer);
        startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
    }

    AppState.set('timer.isRunning', !AppState.get('timer.isRunning'));
}

function toggleStopwatch() {
    if (!AppState.get('session.isActive')) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le chronomètre.");
        return;
    }

    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    if (!stopwatchStartBtn) return;

    if (!AppState.get('timer.stopwatchInterval')) {
        const interval = setInterval(updateStopwatch, 1000);
        AppState.set('timer.stopwatchInterval', interval);
        stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
    } else {
        clearInterval(AppState.get('timer.stopwatchInterval'));
        AppState.set('timer.stopwatchInterval', null);
        stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
}

function updateTimer() {
    let currentTime = AppState.get('timer.currentTime');
    if (currentTime > 0) {
        currentTime--;
        AppState.set('timer.currentTime', currentTime);
        AppState.set('timer.timerTime', AppState.get('timer.timerTime') + 1);
        updateTimerDisplay();
    } else {
        clearInterval(AppState.get('timer.timer'));
        toggleWorkBreakSession();
    }
    updateTotalWorkTimeDisplay();
}

function updateStopwatch() {
    AppState.set('timer.stopwatchTime', AppState.get('timer.stopwatchTime') + 1);
    updateDOMIfExists('stopwatch-time', formatTime(AppState.get('timer.stopwatchTime')));
    updateTotalWorkTimeDisplay();
}

function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}

function calculateTotalWorkTime() {
    return AppState.get('timer.timerTime') + 
           AppState.get('timer.stopwatchTime') + 
           AppState.get('timer.manualTimeInSeconds');
}

function addManualTime() {
    if (!AppState.get('session.isActive')) {
        alert("Veuillez démarrer une nouvelle session avant d'ajouter du temps manuellement.");
        return;
    }

    const hours = parseInt(document.getElementById('manual-hours')?.value) || 0;
    const minutes = parseInt(document.getElementById('manual-minutes')?.value) || 0;

    if (hours < 0 || minutes < 0 || minutes >= 60) {
        alert('Veuillez entrer un temps valide.');
        return;
    }

    const newManualTime = AppState.get('timer.manualTimeInSeconds') + (hours * 3600) + (minutes * 60);
    AppState.set('timer.manualTimeInSeconds', newManualTime);

    resetManualTimeInputs();
    updateTotalWorkTimeDisplay();
    alert('Temps d\'étude ajouté manuellement.');
}

function updateTimerDisplay() {
    const currentTime = AppState.get('timer.currentTime');
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    updateDOMIfExists('time-left', `${minutes}:${seconds.toString().padStart(2, '0')}`);
}

function updateTotalWorkTimeDisplay() {
    updateDOMIfExists('total-work-time', formatTime(calculateTotalWorkTime()));
}

function changeCounter(value) {
    if (!AppState.get('session.isActive')) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le compteur.");
        return;
    }
    
    const currentValue = parseInt(AppState.get('session.counter.value') || 0);
    const newValue = Math.max(0, currentValue + value);
    AppState.set('session.counter.value', newValue);
    updateDOMIfExists('counter-value', newValue.toString());
}

function enableControls() {
    const controls = document.querySelectorAll('.session-control');
    controls.forEach(control => {
        control.disabled = !AppState.get('session.isActive');
    });
}

function saveSessionToCache() {
    const sessionData = {
        sessionId: AppState.get('session.currentSessionId'),
        taskLastSessionId: AppState.get('session.taskLastSessionId'),
        taskId: AppState.get('session.selectedTaskId'),
        totalWorkTime: AppState.get('session.totalWorkTime'),
        stopwatchTime: AppState.get('timer.stopwatchTime'),
        counterValue: AppState.get('session.counter.value'),
        manualTimeInSeconds: AppState.get('timer.manualTimeInSeconds')
    };
    localStorage.setItem('currentSessionData', JSON.stringify(sessionData));
}

function resetSessionState() {
    AppState.set('session.counter.value', 0);
    AppState.set('timer.timerTime', 0);
    AppState.set('timer.stopwatchTime', 0);
    AppState.set('timer.manualTimeInSeconds', 0);
    AppState.set('timer.isRunning', false);
    AppState.set('timer.currentTime', AppState.get('timer.workDuration'));
    
    clearAllIntervals();
}

function resetTimer() {
    if (AppState.get('timer.timer')) {
        clearInterval(AppState.get('timer.timer'));
        AppState.set('timer.timer', null);
    }
    
    AppState.set('timer.isRunning', false);
    AppState.set('timer.isWorkSession', true);
    AppState.set('timer.currentTime', AppState.get('timer.workDuration'));
    AppState.set('timer.timerTime', 0);
    
    updateTimerDisplay();
    const startStopBtn = document.getElementById('start_stop');
    if (startStopBtn) {
        startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
    updateTotalWorkTimeDisplay();
}

function resetStopwatch() {
    if (!AppState.get('session.isActive')) {
        alert("Veuillez démarrer une nouvelle session avant d'utiliser le chronomètre.");
        return;
    }

    clearInterval(AppState.get('timer.stopwatchInterval'));
    AppState.set('timer.stopwatchInterval', null);
    AppState.set('timer.stopwatchTime', 0);
    
    updateDOMIfExists('stopwatch-time', '00:00:00');
    
    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    if (stopwatchStartBtn) {
        stopwatchStartBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
    
    updateTotalWorkTimeDisplay();
}

function toggleWorkBreakSession() {
    const isWorkSession = AppState.get('timer.isWorkSession');
    AppState.set('timer.isWorkSession', !isWorkSession);
    
    if (!isWorkSession) {
        AppState.set('timer.currentTime', AppState.get('timer.workDuration'));
        updateDOMIfExists('timer-label', 'Travail');
    } else {
        AppState.set('timer.currentTime', AppState.get('timer.breakDuration'));
        updateDOMIfExists('timer-label', 'Pause');
    }

    updateTimerDisplay();
    AppState.set('timer.isRunning', false);
    
    const startStopBtn = document.getElementById('start_stop');
    if (startStopBtn) {
        startStopBtn.innerHTML = '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
}

function updateSessionWithLastData(lastSession, sessionCount) {
    AppState.set('session.counter.value', lastSession.counter_value || 0);
    AppState.set('timer.timerTime', lastSession.timer_time || 0);
    AppState.set('timer.stopwatchTime', lastSession.stopwatch_time || 0);
    
    updateDOMIfExists('current-session-id', 'Dernière session trouvée');
    updateDOMIfExists('previous-sessions-count', sessionCount?.toString() || "N/A");
    updateDOMIfExists('counter-value', AppState.get('session.counter.value'));
    updateDOMIfExists('total-work-time', formatTime(calculateTotalWorkTime()));
}

function resetUIState() {
    updateDOMIfExists('current-session-id', "Veuillez démarrer une nouvelle session");
    updateDOMIfExists('previous-sessions-count', "0");
    updateDOMIfExists('counter-value', "0");
    updateDOMIfExists('total-work-time', "00:00:00");
    AppState.set('session.isActive', false);
    enableControls();
}

function handleSessionError() {
    updateDOMIfExists('current-session-id', "Erreur de chargement");
    updateDOMIfExists('previous-sessions-count', "N/A");
    AppState.set('session.isActive', false);
    enableControls();
}

export { 
    initializeTimer,
    saveSessionToCache,
    resetTimer,
    handleApprentissageEvents,
};