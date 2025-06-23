// Import des dépendances et services
import { updateDOMIfExists } from "../../utils/utils.js";
import { loadTasks } from "./tasks.js";
import { api } from "../../services/api/dynamicLoader.js";
import AppState from "../../services/state/state.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { translationManager } from "../../translations/TranslationManager.js";

// Fonction utilitaire pour créer le contrôle d'un chiffre
function createDigitControl(value, position) {
  const digitControl = document.createElement("div");
  digitControl.className = "digit-control";
  digitControl.setAttribute("data-position", position);

  const upArrow = document.createElement("button");
  upArrow.className = "time-arrow up";
  upArrow.innerHTML = "▲";
  upArrow.setAttribute("data-position", position);

  const digit = document.createElement("span");
  digit.className = "time-digit";
  digit.textContent = value;

  const downArrow = document.createElement("button");
  downArrow.className = "time-arrow down";
  downArrow.innerHTML = "▼";
  downArrow.setAttribute("data-position", position);

  digitControl.appendChild(upArrow);
  digitControl.appendChild(digit);
  digitControl.appendChild(downArrow);

  return digitControl;
}

// Configuration de la structure du timer
function setupTimerStructure(wrapper, h, m1, m2, s1, s2) {
  // Heures => un seul digit-control
  const hourControl = createDigitControl(h, "h");

  // Séparateur (entre h et mm)
  const sep1 = document.createElement("span");
  sep1.className = "time-separator";
  sep1.textContent = ":"; // plus grand

  // Minutes => deux digit-control
  const m1Control = createDigitControl(m1, "m1");
  const m2Control = createDigitControl(m2, "m2");

  // Séparateur (entre mm et ss) => plus petit
  const sep2 = document.createElement("span");
  sep2.className = "time-separator-second";
  sep2.textContent = ":";

  // Secondes => juste un <span> (pas de flèches)
  const secondsSpan = document.createElement("span");
  secondsSpan.className = "time-digit-second";
  secondsSpan.textContent = `${s1}${s2}`;

  // Assembler tout
  wrapper.appendChild(hourControl);
  wrapper.appendChild(sep1);
  wrapper.appendChild(m1Control);
  wrapper.appendChild(m2Control);
  wrapper.appendChild(sep2);
  wrapper.appendChild(secondsSpan);
}

// Création des contrôles UI du timer
function createTimerControlUI(container) {
  // Nettoyer l'ancien wrapper
  const existingWrapper = container.querySelector(".time-control-wrapper");
  if (existingWrapper) {
    existingWrapper.remove();
  }

  // Valeur par défaut : 25 minutes, si rien n'est défini
  let currentTime = AppState.get("timer.currentTime");
  if (currentTime == null) {
    currentTime = 25 * 60; // 25 minutes en secondes
    AppState.set("timer.currentTime", currentTime);
  }

  // Créer le wrapper principal
  const timeControlWrapper = document.createElement("div");
  timeControlWrapper.className = "time-control-wrapper";

  // Convertir currentTime en h, m, s
  let hours = Math.floor(currentTime / 3600);
  // On limite déjà à 9 si besoin
  if (hours > 9) hours = 9;

  const remainingForMinutes = currentTime % 3600;
  const minutes = Math.floor(remainingForMinutes / 60);
  const seconds = remainingForMinutes % 60;

  // Séparer en digits
  const h = hours; // un seul digit pour l'heure
  const m1 = Math.floor(minutes / 10);
  const m2 = minutes % 10;
  const s1 = Math.floor(seconds / 10);
  const s2 = seconds % 10;

  // Injecter le CSS si pas déjà présent
  if (!document.getElementById("timer-digit-styles")) {
    const style = document.createElement("style");
    style.id = "timer-digit-styles";
    style.textContent = `
            .time-control-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.25rem;
                margin: 1rem 0;
            }
            .digit-control {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
            }
            .time-digit {
                font-size: 2.5rem;
                font-weight: bold;
                color: var(--primary-color);
                height: 3rem;
                line-height: 3rem;
                min-width: 1.5ch;
                text-align: center;
                position: relative;
            }
            /* On garde un format un peu plus grand pour le ":" entre h et mm */
            .time-separator {
                font-size: 2.5rem;
                font-weight: bold;
                color: var(--primary-color);
                margin: 0 0.25rem;
                line-height: 3rem;
            }
            /* Entre mm et ss, on peut rétrécir si souhaité */
            .time-separator-second {
                font-size: 2rem; 
                font-weight: bold;
                color: var(--primary-color);
                margin: 0 0.25rem;
                line-height: 2rem;
            }
            /* Flèches de la même couleur que l'heure/minute */
            .time-arrow {
                background: none;
                border: none;
                color: var(--primary-color); /* Même couleur que .time-digit */
                font-size: 1rem;
                cursor: pointer;
                padding: 0;
                height: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
                transition: all 0.2s ease;
            }
            .time-arrow:hover {
                opacity: 1;
                transform: scale(1.1);
            }
            .time-arrow:active {
                transform: scale(0.95);
            }
            .time-digit-second {
                font-size: 2rem;
                font-weight: bold;
                color: var(--primary-color);
                height: 2rem;
                line-height: 2rem;
                min-width: 2ch;
                text-align: center;
                position: relative;
            }
        `;
    document.head.appendChild(style);
  }

  // Construire la structure h:mm:ss (sans flèches pour s)
  setupTimerStructure(timeControlWrapper, h, m1, m2, s1, s2);

  // L'insérer dans container
  container.appendChild(timeControlWrapper);

  return timeControlWrapper;
}

// Initialisation des contrôles du timer
function initializeTimerControls(container) {
  const timeControlWrapper = createTimerControlUI(container);
  if (!timeControlWrapper) return;

  timeControlWrapper.addEventListener("click", (e) => {
    const button = e.target.closest(".time-arrow");
    if (!button) return;

    if (!AppState.get("session.selectedTaskId")) {
      notificationService.show("session.select_task_before_start", "warning");
      return;
    }

    const isUp = button.classList.contains("up");
    const position = button.getAttribute("data-position");
    updateTimeByPosition(position, isUp);
  });
}

// Met à jour le temps en fonction de la position modifiée
function updateTimeByPosition(position, isUp) {
  // 1) Récupérer la valeur actuelle en secondes
  const currentTime = AppState.get("timer.currentTime") || 0;

  // 2) Extraire heure, minutes, secondes
  let hours = Math.floor(currentTime / 3600);
  let remainder = currentTime % 3600;
  let minutes = Math.floor(remainder / 60);
  let seconds = remainder % 60;

  // 3) Calculer le changement (+1 ou -1)
  const change = isUp ? 1 : -1;

  // 4) En fonction de la position, on modifie l'heure ou les minutes
  switch (position) {
    case "h": {
      // Heure : clampée entre 0 et 9
      hours += change;
      if (hours < 0) hours = 0;
      if (hours > 9) hours = 9;
      break;
    }
    case "m1": {
      // m1 => dizaine des minutes
      // Ex. minutes=47 => m1=4, m2=7
      const tens = Math.floor(minutes / 10); // 4 ici
      let newTens = tens + change; // 4 ± 1
      // On peut choisir de boucler (ex. 9→0) ou de clamp (ex. 9→9).
      // Pour un minuteur, il est plus sympa de boucler. Mais au besoin, on peut clamp.
      if (newTens < 0) newTens = 5; // boucler ex. -1 => 5
      if (newTens > 5) newTens = 0; // boucler ex. 6 => 0
      // On reconstruit minutes = newTens*10 + (unité existante)
      minutes = newTens * 10 + (minutes % 10);
      break;
    }
    case "m2": {
      // m2 => unité des minutes
      const ones = minutes % 10;
      let newOnes = ones + change;
      if (newOnes < 0) newOnes = 9; // boucler
      if (newOnes > 9) newOnes = 0; // boucler
      minutes = Math.floor(minutes / 10) * 10 + newOnes;
      break;
    }
    // Pas de case 's1' ou 's2' puisque vous ne modifiez pas les secondes
    default:
      return; // On ne fait rien
  }

  // 5) Recomposer le nouveau total en secondes
  let newTotal = hours * 3600 + minutes * 60 + seconds;

  // 6) S'assurer de ne pas dépasser le max (9:59:59 => 35999)
  if (newTotal > 9 * 3600 + 59 * 60 + 59) {
    newTotal = 9 * 3600 + 59 * 60 + 59; // clamp si besoin
  }
  if (newTotal < 0) {
    newTotal = 0; // ou on peut le laisser à 0
  }

  // 7) Stocker le nouveau temps
  AppState.set("timer.currentTime", newTotal);

  // 8) Si le timer n'est pas en cours de fonctionnement, on rafraîchit l'affichage
  if (!AppState.get("timer.isRunning")) {
    updateTimerDisplay();
  }

  // 9) Au besoin, on enregistre l'état du timer (optionnel)
  saveTimerState();
}

// Flag pour éviter les initialisations complètes multiples
let timerInitialized = false;

// Initialiser les valeurs de session stockées
function initializeSessionValues() {
  // Récupérer les valeurs actuelles des éléments s'ils existent
  const currentSessionElement = document.getElementById("current-session-id");
  const previousSessionElement = document.getElementById(
    "previous-sessions-count"
  );

  if (currentSessionElement) {
    sessionValues.currentSessionId = currentSessionElement.textContent || "0";
  }

  if (previousSessionElement) {
    sessionValues.previousSessionsCount =
      previousSessionElement.textContent || "0";
  }
}

// Initialisation du Timer
function initializeTimer() {
  try {
    // Éviter les initialisations complètes multiples
    if (timerInitialized) {
      return;
    }
    timerInitialized = true;

    // Diagnostic immédiat de l'état de la page
    setTimeout(() => fullDOMDiagnosis(), 100);

    // Attendre que la page soit visible et accessible avant d'initialiser
    waitForPageVisible(async () => {
      try {
        // Attendre que les éléments de session soient disponibles
        await ensureSessionElementsExist();

        // Maintenant procéder à l'initialisation normale
        loadTasks();
        initializeSessionState();
        loadTimerState();

        const focusTimerContainer = document.getElementById(
          "focus-timer-control"
        );
        if (focusTimerContainer) {
          initializeTimerControls(focusTimerContainer);
        }

        updateTaskTitle();
        enableControls();

        const apprentissageSection = document.getElementById("apprentissage");
        if (apprentissageSection) {
          apprentissageSection.addEventListener(
            "click",
            handleApprentissageEvents
          );
        }

        const taskSelect = document.getElementById("task-select");
        if (taskSelect) {
          taskSelect.addEventListener("change", () =>
            updateTaskTitle(false, false, true)
          );
        }

        const addManualTimeBtn = document.getElementById("add-manual-time-btn");
        if (addManualTimeBtn) {
          addManualTimeBtn.addEventListener("click", addManualTime);
        }

        updateTimerDisplay();

        // Vérifier la synchronisation des éléments de session après initialisation
        setTimeout(() => verifySessionElementsSync(), 300);
      } catch (error) {
        // Continuer quand même avec l'initialisation de base
        loadTasks();
        initializeSessionState();
        loadTimerState();
        updateTaskTitle();
        enableControls();
      }
    });
  } catch (error) {
    // Erreur dans initializeTimer ignorée
  }
}

// Met à jour l'affichage des chiffres
function updateDigitDisplay(position, change) {
  const digitContainer = document.querySelector(
    `.digit-control[data-position="${position}"]`
  );
  if (!digitContainer) return;

  const digit = digitContainer.querySelector(".time-digit");
  if (!digit) return;

  let value = parseInt(digit.textContent);
  const max = position === "m1" ? 5 : 9;
  value = (value + change + (max + 1)) % (max + 1);
  digit.textContent = value;
}

// Fonction pour formater le temps
function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
}

// Calcul du temps total de travail
function calculateTotalWorkTime() {
  return (
    AppState.get("timer.timerTime") +
    AppState.get("timer.stopwatchTime") +
    AppState.get("timer.manualTimeInSeconds")
  );
}

// Mise à jour de l'affichage du timer
function updateTimerDisplay() {
  const currentTime = AppState.get("timer.currentTime");
  let hours = Math.floor(currentTime / 3600);
  if (hours > 9) hours = 9; // On ne dépasse pas 9

  const remainingForMinutes = currentTime % 3600;
  const minutes = Math.floor(remainingForMinutes / 60);
  const seconds = remainingForMinutes % 60;

  // Extraire digits
  const h = hours; // Single digit
  const m1 = Math.floor(minutes / 10);
  const m2 = minutes % 10;
  const s1 = Math.floor(seconds / 10);
  const s2 = seconds % 10;

  // Mettre à jour l'affichage de h
  const hourElem = document.querySelector(
    `.digit-control[data-position="h"] .time-digit`
  );
  if (hourElem) {
    hourElem.textContent = h; // "0", "5", "9"
  }

  // Mettre à jour m1, m2
  const minuteMap = { m1, m2 };
  for (const [pos, val] of Object.entries(minuteMap)) {
    const elem = document.querySelector(
      `.digit-control[data-position="${pos}"] .time-digit`
    );
    if (elem) {
      elem.textContent = val;
    }
  }

  // Mettre à jour les secondes
  const secondsSpan = document.querySelector(".time-digit-second");
  if (secondsSpan) {
    secondsSpan.textContent = `${s1}${s2}`; // "05", "27", etc.
  }
}

// Mise à jour de l'affichage du temps total
function updateTotalWorkTimeDisplay() {
  updateDOMIfExists("total-work-time", formatTime(calculateTotalWorkTime()));
}

// Gestion des événements
function handleApprentissageEvents(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  try {
    const action = target.getAttribute("data-action");
    const actions = {
      "toggle-timer": toggleTimer,
      "reset-timer": resetTimer,
      "toggle-stopwatch": toggleStopwatch,
      "reset-stopwatch": resetStopwatch,
      "save-session-data": saveSessionData,
      "apply-timer-duration": applyTimerDuration,
      "change-counter": () => {
        const value = parseInt(target.getAttribute("data-value"));
        if (!isNaN(value)) {
          changeCounter(value);
        }
      },
    };

    if (actions[action]) {
      actions[action]();
    }
  } catch (error) {
    // Erreur lors du traitement de l'action ignorée
  }
}

// Activation/désactivation des contrôles
function enableControls() {
  const controls = document.querySelectorAll(".session-control");
  const hasTaskSelected = !!AppState.get("session.selectedTaskId");

  controls.forEach((control) => {
    // Les contrôles sont activés si une tâche est sélectionnée
    control.disabled = !hasTaskSelected;
  });
}

// Réinitialisation du timer
function resetTimer() {
  if (AppState.get("timer.timer")) {
    clearInterval(AppState.get("timer.timer"));
    AppState.set("timer.timer", null);
  }

  AppState.set("timer.isRunning", false);
  AppState.set("timer.isWorkSession", true);
  AppState.set("timer.currentTime", AppState.get("timer.workDuration"));
  AppState.set("timer.timerTime", 0);

  updateTimerDisplay();

  const startStopBtn = document.getElementById("start_stop");
  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }

  updateTotalWorkTimeDisplay();
  saveTimerState();
}

// Sauvegarde de session dans le cache
function saveSessionToCache() {
  try {
    const sessionData = {
      sessionId: AppState.get("session.currentSessionId"),
      taskLastSessionId: AppState.get("session.taskLastSessionId"),
      taskId: AppState.get("session.selectedTaskId"),
      totalWorkTime: AppState.get("session.totalWorkTime"),
      stopwatchTime: AppState.get("timer.stopwatchTime"),
      counterValue: AppState.get("session.counter.value"),
      manualTimeInSeconds: AppState.get("timer.manualTimeInSeconds"),
    };
    localStorage.setItem("currentSessionData", JSON.stringify(sessionData));
  } catch (error) {
    notificationService.show("session.cache_save_error", "error", 0);
  }
}

// ... (suite du code précédent)

// Initialisation du timer personnalisé
function initializeCustomTimer() {
  const customTimerInput = document.getElementById("custom-timer");
  if (customTimerInput) {
    const currentDuration = Math.floor(AppState.get("timer.workDuration") / 60);
    customTimerInput.value = currentDuration;
    customTimerInput.addEventListener("change", validateTimerInput);
    customTimerInput.addEventListener("input", validateTimerInput);
  }
}

// Validation de l'input du timer
function validateTimerInput(event) {
  const input = event.target;
  let value = parseInt(input.value);

  if (isNaN(value) || value < 1) {
    value = 1;
  } else if (value > 120) {
    value = 120;
  }

  input.value = value;
}

// Flag pour éviter les initialisations multiples
let sessionInitialized = false;

// Initialisation de l'état de session
async function initializeSessionState() {
  // Éviter les initialisations multiples
  if (sessionInitialized) {
    return;
  }
  sessionInitialized = true;

  try {
    const savedSession = localStorage.getItem("currentSessionData");
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      restoreSessionFromCache(sessionData);
      notificationService.show("session.restored", "success");
    } else {
      AppState.set("session.isActive", false);
    }
    enableControls();
  } catch (error) {
    notificationService.show("session.init_error", "error", 0);
    AppState.set("session.isActive", false);
    enableControls();
  }
}

// Chargement de l'état du timer
async function loadTimerState() {
  try {
    const response = await api.get("/timer/loadState");
    if (response) {
      AppState.set("timer.isRunning", response.isRunning);
      AppState.set("timer.isWorkSession", response.isWorkSession);
      AppState.set("timer.workDuration", response.workDuration);
      AppState.set("timer.breakDuration", response.breakDuration);
      AppState.set("timer.currentTime", response.currentTime);

      updateTimerDisplay();
    }

    const savedSettings = localStorage.getItem("timerSettings");
    if (savedSettings && !response) {
      const settings = JSON.parse(savedSettings);
      Object.entries(settings).forEach(([key, value]) => {
        AppState.set(`timer.${key}`, value);
      });
    }
  } catch (error) {
    notificationService.show("timer.settings_load_error", "error");

    const savedSettings = localStorage.getItem("timerSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      Object.entries(settings).forEach(([key, value]) => {
        AppState.set(`timer.${key}`, value);
      });
    }
  }
}

// Toggle du timer
function toggleTimer() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  // Créer automatiquement une session si pas encore active
  if (!AppState.get("session.isActive")) {
    createAutomaticSession();
  }

  const startStopBtn = document.getElementById("start_stop");
  if (!startStopBtn) return;

  if (AppState.get("timer.isRunning")) {
    clearInterval(AppState.get("timer.timer"));
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  } else {
    const timer = setInterval(updateTimer, 1000);
    AppState.set("timer.timer", timer);
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
  }

  AppState.set("timer.isRunning", !AppState.get("timer.isRunning"));
  saveTimerState();
}

// Toggle du chronomètre
function toggleStopwatch() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  // Créer automatiquement une session si pas encore active
  if (!AppState.get("session.isActive")) {
    createAutomaticSession();
  }

  const stopwatchStartBtn = document.getElementById("stopwatch-start");
  if (!stopwatchStartBtn) return;

  if (!AppState.get("timer.stopwatchInterval")) {
    const interval = setInterval(updateStopwatch, 1000);
    AppState.set("timer.stopwatchInterval", interval);
    stopwatchStartBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
  } else {
    clearInterval(AppState.get("timer.stopwatchInterval"));
    AppState.set("timer.stopwatchInterval", null);
    stopwatchStartBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Mise à jour du timer
function updateTimer() {
  let currentTime = AppState.get("timer.currentTime");
  if (currentTime > 0) {
    currentTime--;
    AppState.set("timer.currentTime", currentTime);
    AppState.set("timer.timerTime", AppState.get("timer.timerTime") + 1);
    updateTimerDisplay();
  } else {
    clearInterval(AppState.get("timer.timer"));
    handleTimerCompletion();
    toggleWorkBreakSession();
  }
  updateTotalWorkTimeDisplay();
}

// Gestion de la fin du timer
function handleTimerCompletion() {
  const isWorkSession = AppState.get("timer.isWorkSession");
  notificationService.show(
    isWorkSession ? "timer.work.complete" : "timer.break.complete",
    "success",
    0
  );
  playTimerCompleteSound();
}

// Lecture du son de fin de timer
function playTimerCompleteSound() {
  const audio = new Audio("./assets/sounds/timer-complete.mp3");
  audio.play().catch(() => {});
}

// Reset du chronomètre
async function resetStopwatch() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  const confirmed = await notificationService.confirm(
    "stopwatch.reset.confirm"
  );
  if (!confirmed) return;

  clearInterval(AppState.get("timer.stopwatchInterval"));
  AppState.set("timer.stopwatchInterval", null);
  AppState.set("timer.stopwatchTime", 0);

  updateDOMIfExists("stopwatch-time", "00:00:00");

  const stopwatchStartBtn = document.getElementById("stopwatch-start");
  if (stopwatchStartBtn) {
    stopwatchStartBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }

  updateTotalWorkTimeDisplay();
  notificationService.show("stopwatch.reset.success", "success");
}

// Mise à jour du chronomètre
function updateStopwatch() {
  AppState.set("timer.stopwatchTime", AppState.get("timer.stopwatchTime") + 1);
  updateDOMIfExists(
    "stopwatch-time",
    formatTime(AppState.get("timer.stopwatchTime"))
  );
  updateTotalWorkTimeDisplay();
}

// Ajout de temps manuel
function addManualTime() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  // Créer automatiquement une session si pas encore active
  if (!AppState.get("session.isActive")) {
    createAutomaticSession();
  }

  const hours = parseInt(document.getElementById("manual-hours")?.value) || 0;
  const minutes =
    parseInt(document.getElementById("manual-minutes")?.value) || 0;

  if (hours < 0 || minutes < 0 || minutes >= 60) {
    notificationService.show("time.invalid", "warning");
    return;
  }

  const newManualTime =
    AppState.get("timer.manualTimeInSeconds") + hours * 3600 + minutes * 60;
  AppState.set("timer.manualTimeInSeconds", newManualTime);

  resetManualTimeInputs();
  updateTotalWorkTimeDisplay();
  notificationService.show("timer.manual.time_added", "success");
}

// Reset des inputs de temps manuel
function resetManualTimeInputs() {
  const hoursInput = document.getElementById("manual-hours");
  const minutesInput = document.getElementById("manual-minutes");
  if (hoursInput) hoursInput.value = "";
  if (minutesInput) minutesInput.value = "";
}

// Toggle entre session de travail et pause
function toggleWorkBreakSession() {
  const isWorkSession = AppState.get("timer.isWorkSession");
  AppState.set("timer.isWorkSession", !isWorkSession);

  if (!isWorkSession) {
    AppState.set("timer.currentTime", AppState.get("timer.workDuration"));
    updateDOMIfExists("timer-label", "Travail");
    notificationService.show("timer.work.session_started", "info");
  } else {
    AppState.set("timer.currentTime", AppState.get("timer.breakDuration"));
    updateDOMIfExists("timer-label", "Pause");
    notificationService.show("timer.break.session_started", "info");
  }

  updateTimerDisplay();
  AppState.set("timer.isRunning", false);

  const startStopBtn = document.getElementById("start_stop");
  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Création automatique d'une session
function createAutomaticSession() {
  try {
    const taskSelect = document.getElementById("task-select");
    const selectedTaskName =
      taskSelect?.options[taskSelect.selectedIndex]?.text ||
      "Tâche sélectionnée";

    resetSessionState();
    updateUIForNewSession();
    AppState.set("session.isActive", true);
    enableControls();

    saveSessionToCache();
    notificationService.show("session.started_for_task", "success");
  } catch (error) {
    notificationService.show("session.init_error", "error");
  }
}

// Sauvegarde des données de session
async function saveSessionData() {
  if (
    !AppState.get("session.selectedTaskId") ||
    !AppState.get("session.isActive")
  ) {
    notificationService.show("session.required", "warning");
    return;
  }

  // Vérification de la durée minimum (1 minute) sauf si c'est seulement du comptage
  const totalWorkTime = calculateTotalWorkTime();
  const counterValue = AppState.get("session.counter.value") || 0;

  if (totalWorkTime > 0 && totalWorkTime < 60) {
    notificationService.show("session.minimum_duration", "warning");
    return;
  }

  if (totalWorkTime === 0 && counterValue === 0) {
    notificationService.show("session.no_data", "warning");
    return;
  }

  try {
    // 1. D'abord, arrêter tous les timers/chronomètres en cours
    stopAllActiveTimers();

    // 2. Préparer les données à sauvegarder avec les valeurs actuelles
    const dataToSave = {
      taskId: AppState.get("session.selectedTaskId"),
      totalWorkTime: totalWorkTime,
      stopwatchTime: AppState.get("timer.stopwatchTime"),
      timerTime: AppState.get("timer.timerTime"),
      counterValue: counterValue,
      manualTimeInSeconds: AppState.get("timer.manualTimeInSeconds"),
    };

    // 3. Sauvegarder les données
    await api.post("/session/save", dataToSave);

    // 4. Maintenant, réinitialiser tout pour une nouvelle session
    resetAllTimers();
    resetAllCounters();
    resetAllInputs();
    clearAllIntervals();

    // Fermer la session
    AppState.set("session.isActive", false);

    // Supprimer le cache de session
    localStorage.removeItem("currentSessionData");

    updateUIAfterSave();
    await updateTaskTitle(true, true);

    notificationService.show("session.saved", "success");
  } catch (error) {
    notificationService.show("session.save_error", "error", 0);
  }
}

// Reset de tous les timers
function resetAllTimers() {
  AppState.set("timer.currentTime", AppState.get("timer.workDuration"));
  AppState.set("timer.timerTime", 0);
  AppState.set("timer.isRunning", false);
  AppState.set("timer.isWorkSession", true);
  AppState.set("timer.stopwatchTime", 0);
  AppState.set("timer.stopwatchInterval", null);
  AppState.set("timer.manualTimeInSeconds", 0);
}

// Reset de tous les compteurs
function resetAllCounters() {
  AppState.set("session.counter.value", 0);
}

// Reset de tous les inputs
function resetAllInputs() {
  const hoursInput = document.getElementById("manual-hours");
  const minutesInput = document.getElementById("manual-minutes");
  const customTimerInput = document.getElementById("custom-timer");

  if (hoursInput) hoursInput.value = "";
  if (minutesInput) minutesInput.value = "";
  if (customTimerInput) {
    customTimerInput.value = Math.floor(
      AppState.get("timer.workDuration") / 60
    );
  }
}

// Arrêter tous les timers actifs sans les réinitialiser
function stopAllActiveTimers() {
  // Arrêter le timer pomodoro s'il est en cours
  if (AppState.get("timer.isRunning") && AppState.get("timer.timer")) {
    clearInterval(AppState.get("timer.timer"));
    AppState.set("timer.timer", null);
    AppState.set("timer.isRunning", false);

    // Mettre à jour le bouton du timer pour afficher "Start"
    const startStopBtn = document.getElementById("start_stop");
    if (startStopBtn) {
      startStopBtn.innerHTML =
        '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
  }

  // Arrêter le chronomètre s'il est en cours
  if (AppState.get("timer.stopwatchInterval")) {
    clearInterval(AppState.get("timer.stopwatchInterval"));
    AppState.set("timer.stopwatchInterval", null);

    // Mettre à jour le bouton du chronomètre pour afficher "Start"
    const stopwatchStartBtn = document.getElementById("stopwatch-start");
    if (stopwatchStartBtn) {
      stopwatchStartBtn.innerHTML =
        '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
    }
  }
}

// Clear de tous les intervalles
function clearAllIntervals() {
  if (AppState.get("timer.timer")) {
    clearInterval(AppState.get("timer.timer"));
    AppState.set("timer.timer", null);
  }

  if (AppState.get("timer.stopwatchInterval")) {
    clearInterval(AppState.get("timer.stopwatchInterval"));
    AppState.set("timer.stopwatchInterval", null);
  }
}

// Mise à jour de l'UI après sauvegarde
function updateUIAfterSave() {
  // Remettre le compteur à 0
  updateDOMIfExists("counter-value", "0");

  // Remettre le temps total à 0
  updateDOMIfExists("total-work-time", "00:00:00");

  // Remettre le chronomètre à 0
  updateDOMIfExists("stopwatch-time", "00:00:00");

  // Mettre à jour l'affichage du timer (retour au temps configuré)
  updateTimerDisplay();

  // Mettre à jour le statut de session
  updateDOMIfExists(
    "current-session-id",
    translationManager.t(
      "content.timer.selectTaskToStart",
      "Sélectionnez une tâche pour commencer"
    )
  );

  // Remettre les boutons à l'état initial (Start)
  const startStopBtn = document.getElementById("start_stop");
  const stopwatchStartBtn = document.getElementById("stopwatch-start");

  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
  if (stopwatchStartBtn) {
    stopwatchStartBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Mise à jour de l'UI pour une nouvelle session
function updateUIForNewSession() {
  updateSessionDOMIfExists(
    "current-session-id",
    translationManager.t(
      "content.timer.newSessionInProgress",
      "Nouvelle Session en cours"
    )
  );
  updateDOMIfExists("counter-value", "0");
  updateDOMIfExists("total-work-time", "00:00:00");
  updateDOMIfExists("stopwatch-time", "00:00:00");

  const startStopBtn = document.getElementById("start_stop");
  const stopwatchStartBtn = document.getElementById("stopwatch-start");

  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
  if (stopwatchStartBtn) {
    stopwatchStartBtn.innerHTML =
      '<img src="./assets/icons/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Application d'une nouvelle durée au timer
async function applyTimerDuration() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  const customTimerInput = document.getElementById("custom-timer");
  const newDuration = parseInt(customTimerInput?.value) || 25;

  if (newDuration < 1 || newDuration > 120) {
    notificationService.show("timer.invalid_duration", "warning");
    customTimerInput.value = Math.floor(
      AppState.get("timer.workDuration") / 60
    );
    return;
  }

  const newDurationInSeconds = newDuration * 60;
  AppState.set("timer.workDuration", newDurationInSeconds);

  if (!AppState.get("timer.isRunning")) {
    AppState.set("timer.currentTime", newDurationInSeconds);
    updateTimerDisplay();
  }

  try {
    await saveTimerState();
    notificationService.show("timer.duration_updated", "success");
  } catch (error) {
    notificationService.show("timer.save_error", "error");
  }
}

// Sauvegarde de l'état du timer
async function saveTimerState() {
  try {
    const state = {
      isRunning: AppState.get("timer.isRunning"),
      isWorkSession: AppState.get("timer.isWorkSession"),
      workDuration: AppState.get("timer.workDuration"),
      breakDuration: AppState.get("timer.breakDuration"),
      currentTime: AppState.get("timer.currentTime"),
    };

    localStorage.setItem("timerSettings", JSON.stringify(state));
    await api.post("/timer/saveState", state);
  } catch (error) {
    notificationService.show("timer.settings_save_error", "error");
  }
}

// Gestion des erreurs de session
function handleSessionError() {
  updateDOMIfExists(
    "current-session-id",
    translationManager.t("content.timer.loadingError", "Erreur de chargement")
  );
  updateSessionDOMIfExists("previous-sessions-count", "N/A");
  AppState.set("session.isActive", false);
  enableControls();
  notificationService.show("session.load_error", "error", 0);
}

// Reset de l'état de l'UI
function resetUIState() {
  const resetElements = [
    "current-session-id",
    "previous-sessions-count",
    "total-time",
    "session-info",
    "counter-value",
  ];

  resetElements.forEach((id) => {
    updateDOMIfExists(id, "0");
  });

  updateDOMIfExists("session-info", "session.waiting");
}

// Reset de l'état de la session
function resetSessionState() {
  AppState.set("session.counter.value", 0);
  AppState.set("timer.timerTime", 0);
  AppState.set("timer.stopwatchTime", 0);
  AppState.set("timer.manualTimeInSeconds", 0);
  AppState.set("timer.isRunning", false);
  AppState.set("timer.currentTime", AppState.get("timer.workDuration"));
  clearAllIntervals();
}

// Mise à jour du compteur
function changeCounter(value) {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task_before_start", "warning");
    return;
  }

  // Créer automatiquement une session si pas encore active
  if (!AppState.get("session.isActive")) {
    createAutomaticSession();
  }

  const currentValue = parseInt(AppState.get("session.counter.value") || 0);
  const newValue = Math.max(0, currentValue + value);
  AppState.set("session.counter.value", newValue);
  updateDOMIfExists("counter-value", newValue.toString());
}

// Restauration de session depuis le cache
function restoreSessionFromCache(sessionData) {
  Object.entries({
    "session.currentSessionId": sessionData.sessionId,
    "session.taskLastSessionId": sessionData.taskLastSessionId,
    "session.selectedTaskId": sessionData.taskId,
    "session.totalWorkTime": sessionData.totalWorkTime,
    "timer.stopwatchTime": sessionData.stopwatchTime,
    "session.counter.value": sessionData.counterValue,
    "timer.manualTimeInSeconds": sessionData.manualTimeInSeconds || 0,
  }).forEach(([key, value]) => AppState.set(key, value));

  updateSessionDOMIfExists("current-session-id", sessionData.sessionId);
  updateDOMIfExists("counter-value", sessionData.counterValue);
  updateTimerDisplay();
  AppState.set("session.isActive", true);
}

// Mise à jour avec les dernières données de session
function updateSessionWithLastData(lastSession, sessionCount) {
  AppState.set("session.counter.value", lastSession.counter_value || 0);
  AppState.set("timer.timerTime", lastSession.timer_time || 0);
  AppState.set("timer.stopwatchTime", lastSession.stopwatch_time || 0);

  const currentSessionText = translationManager.t(
    "content.timer.lastSessionFound",
    "Dernière session trouvée"
  );
  const sessionCountText = sessionCount?.toString() || "N/A";

  updateSessionDOMIfExists("current-session-id", currentSessionText);
  updateSessionDOMIfExists("previous-sessions-count", sessionCountText);
  updateDOMIfExists("counter-value", AppState.get("session.counter.value"));
  updateDOMIfExists("total-work-time", formatTime(calculateTotalWorkTime()));

  // Vérifier immédiatement après la mise à jour
  setTimeout(() => verifySessionElementsSync(), 150);
}

// Mise à jour du titre de la tâche
async function updateTaskTitle(
  forceRefresh = false,
  skipDataLoad = false,
  isUserAction = false
) {
  try {
    // Récupérer l'ID de la tâche sélectionnée
    const taskSelect = document.getElementById("task-select");
    const selectedTaskId = taskSelect?.value;

    if (!selectedTaskId) {
      AppState.set("session.selectedTaskId", null);
      enableControls();
      return;
    }

    AppState.set("session.selectedTaskId", selectedTaskId);

    if (!skipDataLoad) {
      const data = await api.get(
        `/sessions/task/${selectedTaskId}/last?getCount=true`
      );

      if (data && data.last_session) {
        const lastSession = data.last_session;
        const sessionCount = data.session_count || 0;

        updateSessionWithLastData(lastSession, sessionCount);
      } else {
        updateUIForNewSession();
      }
    }

    enableControls();
  } catch (error) {
    notificationService.show("session.load_error", "error", 0);
    handleSessionError();
  }
}

// Met à jour un élément de session avec valeur
function updateSessionElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// Met à jour le DOM avec une valeur si l'élément existe
function updateSessionDOMIfExists(id, value) {
  const element = document.getElementById(id);
  if (element) {
    let displayValue = value;

    // Traduction spéciale pour les valeurs textuelles
    if (typeof value === "string" && value.includes(".")) {
      displayValue = translationManager.t(value, value);
    }

    element.textContent = displayValue;

    // Sauvegarder dans sessionValues
    if (id === "current-session-id") {
      sessionValues.currentSessionId = displayValue;
    } else if (id === "previous-sessions-count") {
      sessionValues.previousSessionsCount = displayValue;
    }

    setupSessionElementsObserver();
  } else {
    // Créer l'élément s'il n'existe pas
    const container = document.querySelector("#apprentissage");
    if (container) {
      const newElement = document.createElement("span");
      newElement.id = id;
      let displayValue = value;

      if (typeof value === "string" && value.includes(".")) {
        displayValue = translationManager.t(value, value);
      }

      newElement.textContent = displayValue;
      container.appendChild(newElement);

      if (id === "current-session-id") {
        sessionValues.currentSessionId = displayValue;
      } else if (id === "previous-sessions-count") {
        sessionValues.previousSessionsCount = displayValue;
      }

      setupSessionElementsObserver();
    }
  }
}

// Vérifier la synchronisation des éléments de session
function verifySessionElementsSync() {
  const currentElement = document.getElementById("current-session-id");
  const previousElement = document.getElementById("previous-sessions-count");

  const currentValue = currentElement?.textContent || "N/A";
  const previousValue = previousElement?.textContent || "N/A";

  // Correction automatique si nécessaire
  if (
    sessionValues.currentSessionId &&
    sessionValues.currentSessionId !== currentValue
  ) {
    forceUpdateSessionElement(
      "current-session-id",
      sessionValues.currentSessionId
    );
  }

  if (
    sessionValues.previousSessionsCount &&
    sessionValues.previousSessionsCount !== previousValue
  ) {
    forceUpdateSessionElement(
      "previous-sessions-count",
      sessionValues.previousSessionsCount
    );
  }
}

// Stockage des valeurs de session pour éviter les conflits avec les traductions
let sessionValues = {
  currentSessionId: "0",
  previousSessionsCount: "0",
};

// Fonction renforcée pour mettre à jour les éléments de session
function forceUpdateSessionElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    let displayValue = value;

    // Traduction spéciale pour les valeurs textuelles
    if (typeof value === "string" && value.includes(".")) {
      displayValue = translationManager.t(value, value);
    }

    element.textContent = displayValue;

    // Force le re-rendu
    element.style.display = "none";
    element.offsetHeight; // Force reflow
    element.style.display = "";

    // Sauvegarder dans sessionValues
    if (elementId === "current-session-id") {
      sessionValues.currentSessionId = displayValue;
    } else if (elementId === "previous-sessions-count") {
      sessionValues.previousSessionsCount = displayValue;
    }
  }
}

// Configurer l'observateur de changement de langue
function setupLanguageObserver() {
  // Observer les changements de langue
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "lang") {
        // Vérifier si les éléments ont des valeurs stockées
        if (sessionValues.currentSessionId) {
          // Ne pas restaurer "session.waiting" après traduction
          if (!sessionValues.currentSessionId.includes("session.waiting")) {
            setTimeout(() => {
              forceUpdateSessionElement(
                "current-session-id",
                sessionValues.currentSessionId
              );
            }, 100);
          }
        }

        if (sessionValues.previousSessionsCount) {
          setTimeout(() => {
            forceUpdateSessionElement(
              "previous-sessions-count",
              sessionValues.previousSessionsCount
            );
          }, 100);
        }

        // Double vérification après traduction
        setTimeout(() => verifySessionElementsSync(), 300);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
}

// Observer pour surveiller les modifications des éléments de session
function setupSessionElementsObserver() {
  // S'assurer qu'on n'ajoute pas plusieurs observateurs
  if (window.sessionElementsObserver) {
    window.sessionElementsObserver.disconnect();
  }

  const targetElements = ["current-session-id", "previous-sessions-count"];

  targetElements.forEach((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "childList" ||
            mutation.type === "characterData"
          ) {
            const newValue = element.textContent;

            // Sauvegarder la nouvelle valeur si ce n'est pas une traduction
            if (
              !newValue.includes("content.") &&
              !newValue.includes("session.")
            ) {
              if (elementId === "current-session-id") {
                sessionValues.currentSessionId = newValue;
              } else if (elementId === "previous-sessions-count") {
                sessionValues.previousSessionsCount = newValue;
              }
            }
          }
        });
      });

      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      // Stocker l'observateur pour pouvoir le déconnecter plus tard
      if (!window.sessionElementsObserver) {
        window.sessionElementsObserver = observer;
      }
    } else {
      // Réessayer après un délai si l'élément n'existe pas encore
      setTimeout(() => setupSessionElementsObserver(), 100);
    }
  });
}

// Fonction de test pour vérifier les éléments de session
function testSessionElementsUpdate() {
  const currentElement = document.getElementById("current-session-id");
  const previousElement = document.getElementById("previous-sessions-count");

  if (!currentElement || !previousElement) {
    return;
  }

  // Test 2 - Mise à jour forcée:
  forceUpdateSessionElement("current-session-id", "TEST_CURRENT");
  forceUpdateSessionElement("previous-sessions-count", "TEST_PREVIOUS");

  // Vérifier après 500ms
  setTimeout(() => {
    const newCurrentValue =
      document.getElementById("current-session-id")?.textContent;
    const newPreviousValue = document.getElementById(
      "previous-sessions-count"
    )?.textContent;

    // Test final - Restaurer les valeurs originales
    forceUpdateSessionElement(
      "current-session-id",
      sessionValues.currentSessionId
    );
    forceUpdateSessionElement(
      "previous-sessions-count",
      sessionValues.previousSessionsCount
    );
  }, 500);

  // Fonctions de debug globales
  window.testSessionSync = testSessionElementsUpdate;
  window.verifySessionSync = verifySessionElementsSync;
  window.forceSessionUpdate = forceUpdateSessionElement;
}

// Attendre que la page soit visible et que les éléments critiques soient chargés
function waitForPageVisible(callback, maxAttempts = 15) {
  let attempts = 0;
  const checkPageVisible = () => {
    attempts++;
    const apprentissagePage = document.getElementById("apprentissage");
    const hasActiveClass = apprentissagePage?.classList.contains("active");
    const sessionElements =
      document.getElementById("current-session-id") &&
      document.getElementById("previous-sessions-count");

    if (hasActiveClass && sessionElements) {
      callback();
    } else if (attempts < maxAttempts) {
      setTimeout(checkPageVisible, 200);
    } else {
      // Forcer l'initialisation après le timeout
      callback();
    }
  };

  checkPageVisible();
}

// S'assurer que les éléments de session existent avant l'initialisation
function ensureSessionElementsExist() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkElements = () => {
      attempts++;
      const currentElement = document.getElementById("current-session-id");
      const previousElement = document.getElementById(
        "previous-sessions-count"
      );

      if (currentElement && previousElement) {
        resolve();
      } else if (attempts < maxAttempts) {
        setTimeout(checkElements, 100);
      } else {
        // Timeout - continuer quand même
        resolve();
      }
    };

    checkElements();
  });
}

// Fonction pour réinitialiser le flag d'initialisation (utile pour les tests)
function resetTimerInitialization() {
  timerInitialized = false;
  sessionInitialized = false;
}

// Fonction de diagnostic complet du DOM
function fullDOMDiagnosis() {
  const apprentissagePage = document.getElementById("apprentissage");
  if (apprentissagePage) {
    const computedStyle = window.getComputedStyle(apprentissagePage);
    // Élément apprentissage présent et styles calculés
  }

  // Recherche des éléments de session dans apprentissage
  const sessionIdsInApp = apprentissagePage?.querySelectorAll(
    "#current-session-id"
  );
  const sessionCountsInApp = apprentissagePage?.querySelectorAll(
    "#previous-sessions-count"
  );

  // Recherche globale dans tout le document
  const currentGlobal = document.getElementById("current-session-id");
  const previousGlobal = document.getElementById("previous-sessions-count");

  // Recherche dans toutes les sections pour voir où sont les éléments
  const allSections = document.querySelectorAll(".page");
  allSections.forEach((section) => {
    const currentInSection = section.querySelector("#current-session-id");
    const previousInSection = section.querySelector("#previous-sessions-count");
    if (currentInSection || previousInSection) {
      // Éléments trouvés dans une section
    }
  });

  // Vérification HTML brut pour debug
  const htmlContent = document.documentElement.innerHTML;
  const hasCurrentInHTML = htmlContent.includes('id="current-session-id"');
  const hasCountInHTML = htmlContent.includes('id="previous-sessions-count"');

  // Recherche manuelle dans le texte HTML
  const manualSearch = {
    currentSessionInHTML: hasCurrentInHTML,
    countInHTML: hasCountInHTML,
  };
}

// Exportation globale pour utilisation externe
window.initializeTimer = initializeTimer;
window.resetTimerInit = resetTimerInitialization;

// Export des fonctions pour utilisation dans d'autres modules
export {
  initializeTimer,
  updateTimerDisplay,
  resetTimer,
  toggleTimer,
  saveSessionData,
  resetTimerInitialization,
};
