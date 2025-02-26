// state.js
const AppState = {
  state: {
    timer: {
      isRunning: false,
      isWorkSession: true,
      workDuration: 25 * 60,
      breakDuration: 5 * 60,
      currentTime: 25 * 60,
      timerTime: 0,
      stopwatchTime: 0,
      manualTimeInSeconds: 0,
      stopwatchInterval: null,
      timer: null,
    },
    session: {
      isActive: false,
      selectedTaskId: "",
      counter: { value: 0 },
      currentSessionId: null,
      taskLastSessionId: null,
      totalWorkTime: 0,
    },
    tasks: {
      items: [],
    },
  },

  get(path) {
    const keys = path.split(".");
    let current = this.state;
    for (const key of keys) {
      current = current[key];
    }
    return current;
  },

  set(path, value) {
    const keys = path.split(".");
    let current = this.state;
    const lastKey = keys.pop();

    for (const key of keys) {
      if (!current[key]) current[key] = {};
      current = current[key];
    }

    current[lastKey] = value;
    this.saveToLocalStorage();
  },

  saveToLocalStorage() {
    localStorage.setItem("appState", JSON.stringify(this.state));
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem("appState");
    if (saved) {
      this.state = JSON.parse(saved);
    }
  },
};

export default AppState;
