// Import des dépendances et services
import { updateDOMIfExists } from "../../utils/utils.js";
import { loadTasks } from "./tasks.js";
import { api } from "../../services/api/dynamicLoader.js";
import AppState from "../../services/state/state.js";
import { notificationService } from "../../services/notifications/notificationService.js";

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

  // Valeur par défaut : 25 minutes, si rien n’est défini
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
  const h = hours; // un seul digit pour l’heure
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

    if (!AppState.get("session.isActive")) {
      notificationService.show("session.required", "warning");
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

  // 6) S’assurer de ne pas dépasser le max (9:59:59 => 35999)
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

// Initialisation du Timer
function initializeTimer() {
  try {
    loadTasks();
    initializeSessionState();
    loadTimerState();

    const focusTimerContainer = document.getElementById("focus-timer-control");
    if (focusTimerContainer) {
      initializeTimerControls(focusTimerContainer);
    }

    updateTaskTitle();
    enableControls();

    const apprentissageSection = document.getElementById("apprentissage");
    if (apprentissageSection) {
      apprentissageSection.addEventListener("click", handleApprentissageEvents);
    }

    const taskSelect = document.getElementById("task-select");
    if (taskSelect) {
      taskSelect.addEventListener("change", updateTaskTitle);
    }

    const addManualTimeBtn = document.getElementById("add-manual-time-btn");
    if (addManualTimeBtn) {
      addManualTimeBtn.addEventListener("click", addManualTime);
    }

    updateTimerDisplay();
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
      "start-new-session": startNewSession,
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
  controls.forEach((control) => {
    control.disabled = !AppState.get("session.isActive");
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
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
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

// Initialisation de l'état de session
async function initializeSessionState() {
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
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required", "warning");
    return;
  }

  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("session.select_task", "warning");
    return;
  }

  const startStopBtn = document.getElementById("start_stop");
  if (!startStopBtn) return;

  if (AppState.get("timer.isRunning")) {
    clearInterval(AppState.get("timer.timer"));
    startStopBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  } else {
    const timer = setInterval(updateTimer, 1000);
    AppState.set("timer.timer", timer);
    startStopBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
  }

  AppState.set("timer.isRunning", !AppState.get("timer.isRunning"));
  saveTimerState();
}

// Toggle du chronomètre
function toggleStopwatch() {
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required_stopwatch", "warning");
    return;
  }

  const stopwatchStartBtn = document.getElementById("stopwatch-start");
  if (!stopwatchStartBtn) return;

  if (!AppState.get("timer.stopwatchInterval")) {
    const interval = setInterval(updateStopwatch, 1000);
    AppState.set("timer.stopwatchInterval", interval);
    stopwatchStartBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/pause_icone.png" alt="pause" class="timer-icon" />';
  } else {
    clearInterval(AppState.get("timer.stopwatchInterval"));
    AppState.set("timer.stopwatchInterval", null);
    stopwatchStartBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
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
    isWorkSession ? "timer.work_complete" : "timer.break_complete",
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
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required", "warning");
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
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
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
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required_manual", "warning");
    return;
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
  notificationService.show("timer.manual_time_added", "success");
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
    notificationService.show("timer.work_session_started", "info");
  } else {
    AppState.set("timer.currentTime", AppState.get("timer.breakDuration"));
    updateDOMIfExists("timer-label", "Pause");
    notificationService.show("timer.break_session_started", "info");
  }

  updateTimerDisplay();
  AppState.set("timer.isRunning", false);

  const startStopBtn = document.getElementById("start_stop");
  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Démarrage d'une nouvelle session
function startNewSession() {
  if (!AppState.get("session.selectedTaskId")) {
    notificationService.show("task.empty", "warning");
    return;
  }

  if (AppState.get("session.isActive")) {
    notificationService.show("session.already_active", "warning");
    return;
  }

  try {
    resetSessionState();
    updateUIForNewSession();
    AppState.set("session.isActive", true);
    enableControls();

    const newSessionBtn = document.getElementById("start-new-session");
    if (newSessionBtn) {
      newSessionBtn.disabled = true;
    }

    saveSessionToCache();
    notificationService.show("session.restored", "success");
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la nouvelle session:",
      error
    );
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

  try {
    const dataToSave = {
      taskId: AppState.get("session.selectedTaskId"),
      totalWorkTime: calculateTotalWorkTime(),
      stopwatchTime: AppState.get("timer.stopwatchTime"),
      timerTime: AppState.get("timer.timerTime"),
      counterValue: AppState.get("session.counter.value"),
      manualTimeInSeconds: AppState.get("timer.manualTimeInSeconds"),
    };

    await api.post("/session/save", dataToSave);

    resetAllTimers();
    resetAllCounters();
    resetAllInputs();
    clearAllIntervals();

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
  updateDOMIfExists(
    "time-left",
    `${Math.floor(AppState.get("timer.workDuration") / 60)}:00`
  );
  updateDOMIfExists("counter-value", "0");
  updateDOMIfExists("total-work-time", "00:00:00");
  updateDOMIfExists("current-session-id", "Session terminée");

  const startStopBtn = document.getElementById("start_stop");
  const stopwatchStartBtn = document.getElementById("stopwatch-start");

  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
  if (stopwatchStartBtn) {
    stopwatchStartBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }

  const newSessionBtn = document.getElementById("start-new-session");
  if (newSessionBtn) {
    newSessionBtn.disabled = false;
  }
}

// Mise à jour de l'UI pour une nouvelle session
function updateUIForNewSession() {
  updateDOMIfExists(
    "current-session-id",
    window.translationManager
      ? window.translationManager.t("apprentissage.newSessionInProgress")
      : "Nouvelle Session en cours"
  );
  updateDOMIfExists("counter-value", "0");
  updateDOMIfExists("total-work-time", "00:00:00");
  updateDOMIfExists("stopwatch-time", "00:00:00");

  const startStopBtn = document.getElementById("start_stop");
  const stopwatchStartBtn = document.getElementById("stopwatch-start");

  if (startStopBtn) {
    startStopBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
  if (stopwatchStartBtn) {
    stopwatchStartBtn.innerHTML =
      '<img src="./Icones/ButtonsIcone/Start_icone.png" alt="play" class="timer-icon" />';
  }
}

// Application d'une nouvelle durée au timer
async function applyTimerDuration() {
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required", "warning");
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
    window.translationManager
      ? window.translationManager.t("apprentissage.loadingError")
      : "Erreur de chargement"
  );
  updateDOMIfExists("previous-sessions-count", "N/A");
  AppState.set("session.isActive", false);
  enableControls();
  notificationService.show("session.load_error", "error", 0);
}

// Reset de l'état de l'UI
function resetUIState() {
  updateDOMIfExists(
    "current-session-id",
    window.translationManager
      ? window.translationManager.t("apprentissage.pleaseStartNewSession")
      : "Veuillez démarrer une nouvelle session"
  );
  updateDOMIfExists("previous-sessions-count", "0");
  updateDOMIfExists("counter-value", "0");
  updateDOMIfExists("total-work-time", "00:00:00");

  // Remettre le texte par défaut traduit pour le counter-task-title
  const selectedTaskTitle = document.getElementById("counter-task-title");
  if (selectedTaskTitle) {
    selectedTaskTitle.textContent = window.translationManager
      ? window.translationManager.t("apprentissage.selectTask")
      : "Select a task";
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
  if (!AppState.get("session.isActive")) {
    notificationService.show("session.required_counter", "warning");
    return;
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

  updateDOMIfExists("current-session-id", sessionData.sessionId);
  updateDOMIfExists("counter-value", sessionData.counterValue);
  updateTimerDisplay();
  AppState.set("session.isActive", true);
}

// Mise à jour avec les dernières données de session
function updateSessionWithLastData(lastSession, sessionCount) {
  AppState.set("session.counter.value", lastSession.counter_value || 0);
  AppState.set("timer.timerTime", lastSession.timer_time || 0);
  AppState.set("timer.stopwatchTime", lastSession.stopwatch_time || 0);

  updateDOMIfExists(
    "current-session-id",
    window.translationManager
      ? window.translationManager.t("apprentissage.lastSessionFound")
      : "Dernière session trouvée"
  );
  updateDOMIfExists(
    "previous-sessions-count",
    sessionCount?.toString() || "N/A"
  );
  updateDOMIfExists("counter-value", AppState.get("session.counter.value"));
  updateDOMIfExists("total-work-time", formatTime(calculateTotalWorkTime()));
}

// Mise à jour du titre de la tâche
async function updateTaskTitle(forceRefresh = false, skipDataLoad = false) {
  const taskSelect = document.getElementById("task-select");
  const selectedTaskTitle = document.getElementById("counter-task-title");
  const selectedTask = taskSelect?.options[taskSelect.selectedIndex]?.text;

  AppState.set("session.selectedTaskId", taskSelect?.value || "");
  const selectedTaskId = AppState.get("session.selectedTaskId");

  if (!selectedTaskId) {
    // Remettre le texte par défaut traduit
    selectedTaskTitle.textContent = window.translationManager
      ? window.translationManager.t("apprentissage.selectTask")
      : "Select a task";
    resetUIState();
    return;
  }

  selectedTaskTitle.textContent = selectedTask;

  if (!skipDataLoad) {
    try {
      const data = await api.get(`/session/last/${selectedTaskId}`);
      if (data.message === "No previous session found for this task") {
        resetSessionState();
        updateDOMIfExists(
          "current-session-id",
          window.translationManager
            ? window.translationManager.t("apprentissage.noOldSession")
            : "Pas d'ancienne session"
        );
        updateDOMIfExists("previous-sessions-count", "0");
      } else {
        updateSessionWithLastData(data.lastSession, data.sessionCount);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la dernière session:", error);
      notificationService.show("session.load_error", "error", 0);
      handleSessionError();
    }
  }

  AppState.set("session.isActive", false);
  document.getElementById("start-new-session").disabled = false;
  enableControls();
}

// Écouter les changements de langue pour mettre à jour les traductions dynamiques
// Utiliser un délai pour s'assurer que translationManager est disponible
function setupLanguageObserver() {
  if (
    window.translationManager &&
    typeof window.translationManager.onLanguageChange === "function"
  ) {
    console.log("[TIMER] Configuration de l'observateur de langue");
    window.translationManager.onLanguageChange(() => {
      console.log("[TIMER] Changement de langue détecté");
      // Mettre à jour le titre de la tâche s'il n'y a pas de tâche sélectionnée
      const selectedTaskTitle = document.getElementById("counter-task-title");
      const taskSelect = document.getElementById("task-select");

      if (selectedTaskTitle && (!taskSelect || !taskSelect.value)) {
        selectedTaskTitle.textContent = window.translationManager.t(
          "apprentissage.selectTask"
        );
      }

      // Forcer la re-traduction des éléments session info avec structure HTML complexe
      const previousSessionElement = document.querySelector(
        '[data-translate="apprentissage.previousSession"]'
      );
      if (previousSessionElement) {
        const span = previousSessionElement.querySelector(
          "#previous-sessions-count"
        );
        if (span) {
          const count = span.textContent;
          previousSessionElement.innerHTML = `${window.translationManager.t(
            "apprentissage.previousSession"
          )} ${span.outerHTML}`;
          // Restaurer la valeur du span
          const newSpan = previousSessionElement.querySelector(
            "#previous-sessions-count"
          );
          if (newSpan) newSpan.textContent = count;
        }
      }

      const currentSessionElement = document.querySelector(
        '[data-translate="apprentissage.currentSession"]'
      );
      if (currentSessionElement) {
        const span = currentSessionElement.querySelector("#current-session-id");
        if (span) {
          const sessionText = span.textContent;
          currentSessionElement.innerHTML = `${window.translationManager.t(
            "apprentissage.currentSession"
          )} ${span.outerHTML}`;
          // Restaurer la valeur du span
          const newSpan = currentSessionElement.querySelector(
            "#current-session-id"
          );
          if (newSpan) newSpan.textContent = sessionText;
        }
      }

      // Forcer la re-traduction de l'option task-select
      const taskSelectOption = document.querySelector(
        '#task-select option[data-translate="apprentissage.selectTask"]'
      );
      if (taskSelectOption) {
        taskSelectOption.textContent = window.translationManager.t(
          "apprentissage.selectTask"
        );
      }

      // Mettre à jour les textes de session si ils sont dans leur état par défaut
      const sessionElement = document.getElementById("current-session-id");
      if (sessionElement) {
        const currentText = sessionElement.textContent.trim();
        // Vérifier si c'est un des textes par défaut
        if (
          currentText === "Veuillez démarrer une nouvelle session" ||
          currentText === "Please start new session" ||
          currentText === "Dernière session trouvée" ||
          currentText === "Last session found" ||
          currentText === "Pas d'ancienne session" ||
          currentText === "No old session" ||
          currentText === "Erreur de chargement" ||
          currentText === "Loading error"
        ) {
          // Déterminer quel message afficher selon l'état
          if (
            currentText.includes("dernière") ||
            currentText.includes("Last session")
          ) {
            sessionElement.textContent = window.translationManager.t(
              "apprentissage.lastSessionFound"
            );
          } else if (
            currentText.includes("ancienne") ||
            currentText.includes("No old")
          ) {
            sessionElement.textContent = window.translationManager.t(
              "apprentissage.noOldSession"
            );
          } else if (
            currentText.includes("Erreur") ||
            currentText.includes("Loading error")
          ) {
            sessionElement.textContent = window.translationManager.t(
              "apprentissage.loadingError"
            );
          } else {
            sessionElement.textContent = window.translationManager.t(
              "apprentissage.pleaseStartNewSession"
            );
          }
        }
      }
    });
  } else {
    console.log(
      "[TIMER] TranslationManager non disponible, tentative dans 100ms"
    );
    setTimeout(setupLanguageObserver, 100);
  }
}

// Initialiser l'observateur quand la page est chargée
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLanguageObserver);
} else {
  setupLanguageObserver();
}

// Export des fonctions nécessaires
export {
  initializeTimer,
  saveSessionToCache,
  resetTimer,
  handleApprentissageEvents,
  createTimerControlUI,
  initializeTimerControls,
};
