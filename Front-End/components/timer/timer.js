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
  console.log("[TIMER] Initialisation des valeurs de session stockées");

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

  console.log("[TIMER] Valeurs de session initialisées:", sessionValues);
}

// Initialisation du Timer
function initializeTimer() {
  try {
    // Éviter les initialisations complètes multiples
    if (timerInitialized) {
      console.log("Timer déjà initialisé, saut de l'initialisation");
      return;
    }
    timerInitialized = true;

    console.log("[TIMER] Début de l'initialisation du timer");

    // Diagnostic immédiat de l'état de la page
    setTimeout(() => fullDOMDiagnosis(), 100);

    // Attendre que la page soit visible et accessible avant d'initialiser
    waitForPageVisible(async () => {
      try {
        console.log(
          "[TIMER] Page active, vérification des éléments de session..."
        );

        // Attendre que les éléments de session soient disponibles
        await ensureSessionElementsExist();

        console.log(
          "[TIMER] Éléments de session confirmés, continuation de l'initialisation"
        );

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

        console.log(
          "[TIMER] ✓ Initialisation complète du timer terminée avec succès"
        );
      } catch (error) {
        console.error(
          "[TIMER] ✗ Erreur lors de l'initialisation après activation de la page:",
          error
        );
        // Continuer quand même avec l'initialisation de base
        loadTasks();
        initializeSessionState();
        loadTimerState();
        updateTaskTitle();
        enableControls();
      }
    });
  } catch (error) {
    console.error("Erreur dans initializeTimer:", error);
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
    console.error("Erreur lors du traitement de l'action:", error);
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
    console.error("Erreur lors de la sauvegarde en cache:", error);
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
    console.error(
      "Erreur lors de l'initialisation de l'état de la session:",
      error
    );
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
    console.error("Erreur lors du chargement des paramètres:", error);
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
    console.error("Erreur lors de la création automatique de session:", error);
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
    console.error("Erreur lors de la sauvegarde:", error);
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
    console.error("Erreur lors de la sauvegarde de la durée:", error);
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
    console.error("Erreur lors de la sauvegarde de l'état:", error);
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
  const defaultSessionText = translationManager.t(
    "content.timer.selectTaskToStart",
    "Sélectionnez une tâche pour commencer"
  );

  console.log("[TIMER] Reset de l'état UI");

  updateSessionDOMIfExists("current-session-id", defaultSessionText);
  updateSessionDOMIfExists("previous-sessions-count", "0");
  updateDOMIfExists("counter-value", "0");
  updateDOMIfExists("total-work-time", "00:00:00");

  // Remettre le texte par défaut traduit pour le counter-task-title
  const selectedTaskTitle = document.getElementById("counter-task-title");
  if (selectedTaskTitle) {
    selectedTaskTitle.textContent = translationManager.t(
      "content.timer.selectTask",
      "Select a task"
    );
  }

  AppState.set("session.isActive", false);
  enableControls();
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
  console.log(`[TIMER] Mise à jour avec les données de session:`, {
    lastSession,
    sessionCount,
  });

  AppState.set("session.counter.value", lastSession.counter_value || 0);
  AppState.set("timer.timerTime", lastSession.timer_time || 0);
  AppState.set("timer.stopwatchTime", lastSession.stopwatch_time || 0);

  const currentSessionText = translationManager.t(
    "content.timer.lastSessionFound",
    "Dernière session trouvée"
  );
  const sessionCountText = sessionCount?.toString() || "N/A";

  console.log(`[TIMER] Mise à jour des éléments de session avec:`, {
    currentSessionText,
    sessionCountText,
  });

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
  const taskSelect = document.getElementById("task-select");
  const selectedTaskTitle = document.getElementById("counter-task-title");
  const selectedTask = taskSelect?.options[taskSelect.selectedIndex]?.text;

  const newTaskId = taskSelect?.value || "";
  const currentTaskId = AppState.get("session.selectedTaskId");

  // Si une session est active et qu'on change de tâche ET que c'est une action utilisateur, forcer la sauvegarde
  if (
    isUserAction &&
    AppState.get("session.isActive") &&
    currentTaskId &&
    newTaskId !== currentTaskId
  ) {
    const confirmed = await notificationService.confirm(
      "Vous avez une session en cours. Voulez-vous la sauvegarder avant de changer de tâche ?"
    );

    if (confirmed) {
      await saveSessionData();
    } else {
      // Annuler le changement de tâche
      taskSelect.value = currentTaskId;
      return;
    }
  }

  AppState.set("session.selectedTaskId", newTaskId);

  if (!newTaskId) {
    // Remettre le texte par défaut traduit
    selectedTaskTitle.textContent = translationManager.t(
      "content.timer.selectTask",
      "Select a task"
    );
    resetUIState();
    return;
  }

  selectedTaskTitle.textContent = selectedTask;

  if (!skipDataLoad) {
    try {
      console.log(
        `[TIMER] Chargement des données de session pour la tâche: ${newTaskId}`
      );
      const data = await api.get(`/session/last/${newTaskId}`);
      console.log(`[TIMER] Données reçues de l'API:`, data);

      if (data.message === "No previous session found for this task") {
        console.log(
          `[TIMER] Aucune session précédente trouvée pour la tâche ${newTaskId}`
        );
        resetSessionState();
        updateSessionDOMIfExists(
          "current-session-id",
          translationManager.t(
            "content.timer.noOldSession",
            "Pas d'ancienne session"
          )
        );
        updateSessionDOMIfExists("previous-sessions-count", "0");
      } else {
        console.log(`[TIMER] Session précédente trouvée, mise à jour de l'UI`);
        updateSessionWithLastData(data.lastSession, data.sessionCount);
      }

      // Vérifier la synchronisation après mise à jour
      setTimeout(() => verifySessionElementsSync(), 200);
    } catch (error) {
      console.error("Erreur lors du chargement de la dernière session:", error);
      notificationService.show("session.load_error", "error", 0);
      handleSessionError();
    }
  }

  AppState.set("session.isActive", false);
  enableControls();
}

// Fonction utilitaire pour mettre à jour les éléments de session de manière robuste
function updateSessionElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
    // Forcer le re-rendu pour éviter les problèmes de cache DOM
    element.style.display = "none";
    element.offsetHeight; // Force reflow
    element.style.display = "";
  }
}

// Améliorer la fonction updateDOMIfExists pour les éléments de session
function updateSessionDOMIfExists(id, value) {
  console.log(
    `[TIMER] Mise à jour de l'élément ${id} avec la valeur: ${value}`
  );

  // Vérifier d'abord si l'élément existe
  const element = document.getElementById(id);
  if (!element) {
    console.warn(
      `[TIMER] Élément ${id} non trouvé, mise en attente de la valeur: ${value}`
    );

    // Stocker la valeur pour plus tard
    if (id === "current-session-id") {
      sessionValues.currentSessionId = value;
    } else if (id === "previous-sessions-count") {
      sessionValues.previousSessionsCount = value;
    }

    // Réessayer après un délai
    setTimeout(() => {
      const retryElement = document.getElementById(id);
      if (retryElement) {
        console.log(
          `[TIMER] Élément ${id} maintenant disponible, mise à jour avec: ${value}`
        );
        forceUpdateSessionElement(id, value);
      } else {
        console.error(
          `[TIMER] Élément ${id} toujours non disponible après délai`
        );
      }
    }, 500);

    return;
  }

  // Utiliser la fonction renforcée pour les éléments de session
  forceUpdateSessionElement(id, value);

  // Ajouter plusieurs vérifications avec des délais différents
  setTimeout(() => {
    forceUpdateSessionElement(id, value);
    console.log(
      `[TIMER] Vérification après 100ms - ${id}: ${
        document.getElementById(id)?.textContent
      }`
    );
  }, 100);

  setTimeout(() => {
    forceUpdateSessionElement(id, value);
    console.log(
      `[TIMER] Vérification après 300ms - ${id}: ${
        document.getElementById(id)?.textContent
      }`
    );
  }, 300);
}

// Stockage des valeurs de session pour éviter les conflits avec les traductions
let sessionValues = {
  currentSessionId: "0",
  previousSessionsCount: "0",
};

// Fonction pour vérifier et synchroniser les éléments de session
function verifySessionElementsSync() {
  const currentSessionElement = document.getElementById("current-session-id");
  const previousSessionElement = document.getElementById(
    "previous-sessions-count"
  );

  console.log(`[TIMER] Vérification de la synchronisation:`);
  console.log(
    `  - current-session-id: ${
      currentSessionElement?.textContent || "NON TROUVÉ"
    }`
  );
  console.log(
    `  - previous-sessions-count: ${
      previousSessionElement?.textContent || "NON TROUVÉ"
    }`
  );
  console.log(`  - Valeurs stockées:`, sessionValues);

  // Vérifier si les éléments existent dans le DOM
  if (!currentSessionElement) {
    console.error(
      `[TIMER] ERREUR: L'élément current-session-id n'est pas trouvé dans le DOM`
    );
  } else {
    // Forcer la restauration de la valeur stockée si elle diffère
    if (currentSessionElement.textContent !== sessionValues.currentSessionId) {
      console.log(
        `[TIMER] Restauration de current-session-id: ${sessionValues.currentSessionId}`
      );
      currentSessionElement.textContent = sessionValues.currentSessionId;
    }
  }

  if (!previousSessionElement) {
    console.error(
      `[TIMER] ERREUR: L'élément previous-sessions-count n'est pas trouvé dans le DOM`
    );
  } else {
    // Forcer la restauration de la valeur stockée si elle diffère
    if (
      previousSessionElement.textContent !== sessionValues.previousSessionsCount
    ) {
      console.log(
        `[TIMER] Restauration de previous-sessions-count: ${sessionValues.previousSessionsCount}`
      );
      previousSessionElement.textContent = sessionValues.previousSessionsCount;
    }
  }
}

// Fonction renforcée pour mettre à jour les éléments de session
function forceUpdateSessionElement(elementId, value) {
  // Stocker la valeur
  if (elementId === "current-session-id") {
    sessionValues.currentSessionId = value;
  } else if (elementId === "previous-sessions-count") {
    sessionValues.previousSessionsCount = value;
  }

  const element = document.getElementById(elementId);
  if (element) {
    console.log(`[TIMER] Mise à jour forcée de ${elementId} avec: ${value}`);

    // Méthode 1: Mise à jour directe
    element.textContent = value;

    // Méthode 2: Forcer le reflow
    element.style.display = "none";
    element.offsetHeight; // Force reflow
    element.style.display = "";

    // Méthode 3: Utiliser setAttribute pour forcer la mise à jour
    element.setAttribute("data-session-value", value);
    element.textContent = value;

    // Vérification immédiate
    setTimeout(() => {
      if (element.textContent !== value) {
        console.warn(
          `[TIMER] CONFLIT DÉTECTÉ - Restauration de ${elementId} vers ${value}`
        );
        element.textContent = value;
      }
    }, 10);
  }
}

// Écouter les changements de langue pour mettre à jour les traductions dynamiques
function setupLanguageObserver() {
  console.log("[TIMER] Configuration de l'observateur de langue");
  translationManager.onLanguageChange(() => {
    console.log("[TIMER] Changement de langue détecté");

    // Mettre à jour le titre de la tâche s'il n'y a pas de tâche sélectionnée
    const selectedTaskTitle = document.getElementById("counter-task-title");
    const taskSelect = document.getElementById("task-select");

    if (selectedTaskTitle && (!taskSelect || !taskSelect.value)) {
      selectedTaskTitle.textContent = translationManager.t(
        "content.timer.selectTask",
        "Select a task"
      );
    }

    // Préserver et restaurer les valeurs des éléments de session avec les valeurs stockées
    console.log(
      `[TIMER] Changement de langue - Restoration des valeurs stockées:`,
      sessionValues
    );

    // Attendre que les traductions soient appliquées puis restaurer les valeurs
    setTimeout(() => {
      console.log(`[TIMER] Restoration des valeurs après traduction`);
      forceUpdateSessionElement(
        "current-session-id",
        sessionValues.currentSessionId
      );
      forceUpdateSessionElement(
        "previous-sessions-count",
        sessionValues.previousSessionsCount
      );

      // Vérifier après la restauration
      setTimeout(() => verifySessionElementsSync(), 100);
    }, 100);

    // Double vérification après un délai plus long
    setTimeout(() => {
      console.log(`[TIMER] Double vérification après traduction`);
      forceUpdateSessionElement(
        "current-session-id",
        sessionValues.currentSessionId
      );
      forceUpdateSessionElement(
        "previous-sessions-count",
        sessionValues.previousSessionsCount
      );
    }, 300);

    // Forcer la re-traduction de l'option task-select
    const taskSelectOption = document.querySelector(
      '#task-select option[value=""]'
    );
    if (taskSelectOption) {
      taskSelectOption.textContent = translationManager.t(
        "content.task.selectTask",
        "Sélectionnez une tâche"
      );
    }
  });
}

// Observer les mutations DOM pour les éléments de session
function setupSessionElementsObserver() {
  // Attendre un peu que les éléments soient disponibles
  setTimeout(() => {
    const targetNodes = [
      document.getElementById("current-session-id"),
      document.getElementById("previous-sessions-count"),
    ].filter(Boolean);

    if (targetNodes.length === 0) {
      console.warn(
        "[TIMER] Aucun élément de session trouvé pour l'observation, nouvelle tentative dans 1s"
      );
      // Réessayer plus tard
      setTimeout(setupSessionElementsObserver, 1000);
      return;
    }

    console.log(
      `[TIMER] Configuration de l'observateur pour ${targetNodes.length} éléments de session`
    );

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          const elementId = mutation.target.id;
          const currentValue = mutation.target.textContent;

          let expectedValue = null;
          if (elementId === "current-session-id") {
            expectedValue = sessionValues.currentSessionId;
          } else if (elementId === "previous-sessions-count") {
            expectedValue = sessionValues.previousSessionsCount;
          }

          if (expectedValue && currentValue !== expectedValue) {
            console.log(
              `[TIMER] Mutation détectée sur ${elementId}: "${currentValue}" -> "${expectedValue}"`
            );

            // Restaurer la valeur attendue avec un petit délai
            setTimeout(() => {
              if (mutation.target.textContent !== expectedValue) {
                console.log(`[TIMER] Correction automatique de ${elementId}`);
                mutation.target.textContent = expectedValue;
              }
            }, 50);
          }
        }
      });
    });

    // Observer les changements de contenu textuel
    targetNodes.forEach((node) => {
      observer.observe(node, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    console.log(
      "[TIMER] ✓ Observateur de mutations DOM configuré pour les éléments de session"
    );
    return observer;
  }, 1000);
}

// Initialiser les observateurs quand la page est chargée
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupLanguageObserver();
    // Attendre un peu que les éléments soient initialisés
    setTimeout(() => setupSessionElementsObserver(), 500);
  });
} else {
  setupLanguageObserver();
  setTimeout(() => setupSessionElementsObserver(), 500);
}

// Fonction de test pour vérifier le bon fonctionnement des éléments de session
function testSessionElementsUpdate() {
  console.log("[TIMER] === TEST DES ÉLÉMENTS DE SESSION ===");

  // Test 1: Vérifier la présence des éléments
  const currentSessionElement = document.getElementById("current-session-id");
  const previousSessionElement = document.getElementById(
    "previous-sessions-count"
  );

  console.log("Test 1 - Présence des éléments:");
  console.log(
    `  current-session-id: ${currentSessionElement ? "✓ TROUVÉ" : "✗ MANQUANT"}`
  );
  console.log(
    `  previous-sessions-count: ${
      previousSessionElement ? "✓ TROUVÉ" : "✗ MANQUANT"
    }`
  );

  if (!currentSessionElement || !previousSessionElement) {
    console.error("[TIMER] ✗ ÉCHEC DU TEST - Éléments manquants dans le DOM");
    return false;
  }

  // Test 2: Mise à jour forcée
  console.log("Test 2 - Mise à jour forcée:");
  const testCurrentValue = "TEST_SESSION_" + Date.now();
  const testPreviousValue =
    "TEST_COUNT_" + Math.random().toString(36).substr(2, 5);

  updateSessionDOMIfExists("current-session-id", testCurrentValue);
  updateSessionDOMIfExists("previous-sessions-count", testPreviousValue);

  // Vérifier immédiatement
  setTimeout(() => {
    const currentActual = currentSessionElement.textContent;
    const previousActual = previousSessionElement.textContent;

    console.log(
      `  current-session-id: "${currentActual}" === "${testCurrentValue}" ? ${
        currentActual === testCurrentValue ? "✓" : "✗"
      }`
    );
    console.log(
      `  previous-sessions-count: "${previousActual}" === "${testPreviousValue}" ? ${
        previousActual === testPreviousValue ? "✓" : "✗"
      }`
    );

    if (
      currentActual === testCurrentValue &&
      previousActual === testPreviousValue
    ) {
      console.log(
        "[TIMER] ✓ TEST RÉUSSI - Les éléments de session se mettent à jour correctement"
      );
    } else {
      console.error(
        "[TIMER] ✗ TEST ÉCHOUÉ - Les éléments de session ne se mettent pas à jour correctement"
      );
    }

    // Restaurer les valeurs par défaut
    updateSessionDOMIfExists("current-session-id", "0");
    updateSessionDOMIfExists("previous-sessions-count", "0");
  }, 500);

  return true;
}

// Ajouter des commandes globales pour debugging depuis la console
if (typeof window !== "undefined") {
  window.testTimerSessionElements = testSessionElementsUpdate;
  window.diagnoseTimerPageState = fullDOMDiagnosis;
  window.resetTimerInit = resetTimerInitialization;
  console.log("[TIMER] Fonctions de debug disponibles:");
  console.log(
    "  - window.testTimerSessionElements() : Tester les éléments de session"
  );
  console.log(
    "  - window.diagnoseTimerPageState() : Diagnostiquer l'état de la page"
  );
  console.log("  - window.resetTimerInit() : Réinitialiser le timer");
}

// Fonction pour attendre que la page soit visible et accessible
function waitForPageVisible(callback, maxAttempts = 15) {
  let attempts = 0;

  const checkPageVisible = () => {
    attempts++;
    const apprentissagePage = document.getElementById("apprentissage");

    // Vérifier plusieurs conditions pour s'assurer que la page est vraiment accessible
    const hasActiveClass =
      apprentissagePage && apprentissagePage.classList.contains("active");
    const isDisplayVisible =
      apprentissagePage &&
      getComputedStyle(apprentissagePage).display !== "none";
    const sessionElements =
      document.getElementById("current-session-id") &&
      document.getElementById("previous-sessions-count");

    console.log(`[TIMER] Tentative ${attempts} - État de la page:`);
    console.log(`  - Élément apprentissage trouvé: ${!!apprentissagePage}`);
    console.log(`  - Classe 'active': ${hasActiveClass}`);
    console.log(
      `  - CSS display: ${
        apprentissagePage ? getComputedStyle(apprentissagePage).display : "N/A"
      }`
    );
    console.log(`  - Éléments de session présents: ${!!sessionElements}`);

    // La page est considérée comme prête si elle est visible ET que les éléments de session existent
    const isPageReady =
      apprentissagePage && isDisplayVisible && sessionElements;

    if (isPageReady) {
      console.log(
        "[TIMER] ✓ Page apprentissage prête et éléments accessibles, initialisation"
      );
      callback();
    } else if (attempts < maxAttempts) {
      // Réessayer après un court délai
      setTimeout(checkPageVisible, 250);
    } else {
      console.error(
        "[TIMER] ✗ Échec: La page apprentissage n'est pas devenue accessible après",
        maxAttempts,
        "tentatives"
      );
      console.log("[TIMER] Tentative d'initialisation forcée...");
      // Essayer quand même l'initialisation
      callback();
    }
  };

  checkPageVisible();
}

// Fonction pour vérifier que les éléments de session existent
function ensureSessionElementsExist() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 15;

    const checkElements = () => {
      attempts++;
      const currentSessionElement =
        document.getElementById("current-session-id");
      const previousSessionElement = document.getElementById(
        "previous-sessions-count"
      );

      console.log(`[TIMER] Vérification éléments (tentative ${attempts}):`);
      console.log(
        `  - current-session-id: ${
          currentSessionElement ? "✓ TROUVÉ" : "✗ MANQUANT"
        }`
      );
      console.log(
        `  - previous-sessions-count: ${
          previousSessionElement ? "✓ TROUVÉ" : "✗ MANQUANT"
        }`
      );

      if (currentSessionElement && previousSessionElement) {
        console.log("[TIMER] ✓ Tous les éléments de session sont disponibles");
        // Initialiser les valeurs stockées avec les valeurs actuelles
        sessionValues.currentSessionId =
          currentSessionElement.textContent || "0";
        sessionValues.previousSessionsCount =
          previousSessionElement.textContent || "0";
        resolve();
      } else if (attempts < maxAttempts) {
        setTimeout(checkElements, 300);
      } else {
        console.error(
          "[TIMER] ✗ ÉCHEC: Les éléments de session ne sont pas disponibles après",
          maxAttempts,
          "tentatives"
        );
        reject(new Error("Éléments de session non trouvés"));
      }
    };

    checkElements();
  });
}

// Fonction pour réinitialiser le timer (utile pour les tests)
function resetTimerInitialization() {
  console.log("[TIMER] Réinitialisation du flag d'initialisation du timer");
  timerInitialized = false;
}

// Fonction de diagnostic COMPLÈTE pour chercher les éléments partout
function fullDOMDiagnosis() {
  console.log("[TIMER] === DIAGNOSTIC COMPLET DU DOM ===");

  // 1. État de la page apprentissage
  const apprentissagePage = document.getElementById("apprentissage");
  console.log(
    `📄 #apprentissage:`,
    apprentissagePage ? "✓ TROUVÉ" : "✗ MANQUANT"
  );

  if (apprentissagePage) {
    const computedStyle = getComputedStyle(apprentissagePage);
    console.log(`📱 Classes:`, Array.from(apprentissagePage.classList));
    console.log(`👁️  Display:`, computedStyle.display);
    console.log(`🔍 Visibility:`, computedStyle.visibility);
    console.log(`📏 Opacity:`, computedStyle.opacity);
  }

  // 2. Recherche des éléments de session PARTOUT dans le DOM
  console.log("\n🔍 === RECHERCHE DES ÉLÉMENTS DE SESSION ===");

  // Recherche par ID
  const currentSessionById = document.getElementById("current-session-id");
  const previousSessionById = document.getElementById(
    "previous-sessions-count"
  );

  console.log(
    `🎯 getElementById("current-session-id"):`,
    currentSessionById ? "✓ TROUVÉ" : "✗ MANQUANT"
  );
  console.log(
    `🎯 getElementById("previous-sessions-count"):`,
    previousSessionById ? "✓ TROUVÉ" : "✗ MANQUANT"
  );

  // Recherche par querySelector (plus large)
  const currentSessionByQuery = document.querySelector("#current-session-id");
  const previousSessionByQuery = document.querySelector(
    "#previous-sessions-count"
  );

  console.log(
    `🔍 querySelector("#current-session-id"):`,
    currentSessionByQuery ? "✓ TROUVÉ" : "✗ MANQUANT"
  );
  console.log(
    `🔍 querySelector("#previous-sessions-count"):`,
    previousSessionByQuery ? "✓ TROUVÉ" : "✗ MANQUANT"
  );

  // Recherche avec querySelectorAll pour voir s'il y en a plusieurs
  const allCurrentSession = document.querySelectorAll(
    "#current-session-id, [id*='current-session'], [id*='session-id']"
  );
  const allPreviousSession = document.querySelectorAll(
    "#previous-sessions-count, [id*='previous-session'], [id*='sessions-count']"
  );

  console.log(
    `📊 Éléments similaires à current-session-id:`,
    allCurrentSession.length
  );
  allCurrentSession.forEach((el, i) => {
    console.log(
      `  ${i + 1}. ID: "${el.id}", Parent: ${el.parentElement?.tagName}#${
        el.parentElement?.id
      }, Visible: ${getComputedStyle(el).display !== "none"}`
    );
  });

  console.log(
    `📊 Éléments similaires à previous-sessions-count:`,
    allPreviousSession.length
  );
  allPreviousSession.forEach((el, i) => {
    console.log(
      `  ${i + 1}. ID: "${el.id}", Parent: ${el.parentElement?.tagName}#${
        el.parentElement?.id
      }, Visible: ${getComputedStyle(el).display !== "none"}`
    );
  });

  // 3. Recherche dans toutes les sections/pages
  console.log("\n🗂️ === RECHERCHE DANS TOUTES LES SECTIONS ===");
  const allSections = document.querySelectorAll("section[id], div[id]");

  allSections.forEach((section) => {
    if (
      section.id &&
      (section.id.includes("page") || section.classList.contains("page"))
    ) {
      const sectionCurrentSession = section.querySelector(
        "#current-session-id"
      );
      const sectionPreviousSession = section.querySelector(
        "#previous-sessions-count"
      );

      if (sectionCurrentSession || sectionPreviousSession) {
        console.log(
          `📄 Section "${section.id}":`,
          sectionCurrentSession ? "✓ current-session-id" : "✗",
          sectionPreviousSession ? "✓ previous-sessions-count" : "✗",
          `Display: ${getComputedStyle(section).display}`
        );
      }
    }
  });

  // 4. Vérification du contenu HTML brut
  console.log("\n📝 === VÉRIFICATION HTML BRUT ===");
  const htmlContent = document.documentElement.innerHTML;
  const hasCurrentInHTML = htmlContent.includes('id="current-session-id"');
  const hasPreviousInHTML = htmlContent.includes(
    'id="previous-sessions-count"'
  );

  console.log(`📄 HTML contient 'id="current-session-id"':`, hasCurrentInHTML);
  console.log(
    `📄 HTML contient 'id="previous-sessions-count"':`,
    hasPreviousInHTML
  );

  // 5. Si ils existent, vérifier pourquoi ils ne sont pas trouvés
  if (hasCurrentInHTML && !currentSessionById) {
    console.log(
      "⚠️ ANOMALIE: L'élément existe dans le HTML mais getElementById ne le trouve pas !"
    );

    // Recherche manuelle
    const manualSearch = document.documentElement.outerHTML.match(
      /id="current-session-id"[^>]*>/g
    );
    console.log("🔍 Recherche manuelle:", manualSearch);
  }

  console.log("\n[TIMER] === FIN DU DIAGNOSTIC COMPLET ===");
}

// Export des fonctions nécessaires
export {
  initializeTimer,
  resetTimerInitialization,
  saveSessionToCache,
  resetTimer,
  handleApprentissageEvents,
  createTimerControlUI,
  initializeTimerControls,
  testSessionElementsUpdate,
  fullDOMDiagnosis,
};
