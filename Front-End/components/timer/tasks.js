// tasks.js
import { escapeHTML } from "../../utils/utils.js";
import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import AppState from "../../services/state/state.js";

const appState = AppState;
let isInitialized = false;

function initializeTasks() {
  if (!isInitialized) {
    loadTasks();

    const addTaskBtn = document.getElementById("todo-add-task");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", addNewTask);
    }

    const newTaskInput = document.getElementById("todo-new-task");
    if (newTaskInput) {
      newTaskInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          addNewTask();
        }
      });
    }

    const taskList = document.getElementById("todo-task-list");
    if (taskList) {
      taskList.addEventListener("click", handleTaskActions);
    }

    const selectAllCheckbox = document.getElementById("select-all-tasks");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", handleSelectAllTasks);
    }

    const deleteSelectedBtn = document.getElementById("delete-selected");
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener("click", deleteSelectedTasks);
    }

    isInitialized = true;
  } else {
    loadTasks();
  }
}

async function loadTasks() {
  try {
    const tasks = await api.get("/tasks/getAllTasks");
    appState.set("tasks.items", tasks);
    updateTaskUI();
    updateTaskSelect();
  } catch (error) {
    console.error("Error loading tasks:", error);
    if (error.status === 401) {
      window.location.href = "/welcomepage";
    } else {
      notificationService.show("tasks.load.error", "error", 0); // Notification persistante
    }
  }
}

function updateTaskUI() {
  const taskList = document.getElementById("todo-task-list");
  if (!taskList) return;

  const tasks = AppState.get("tasks.items") || [];
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    let li = document.createElement("li");
    li.className = `todo-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" id="todo-task-${task.id}" 
                       class="todo-checkbox">
                <label for="todo-task-${task.id}" class="task-name">
                    ${escapeHTML(task.name)}
                </label>
            </div>
            <div class="task-actions">
                <button class="todo-rename-btn" data-task-id="${task.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="todo-delete-btn" data-task-id="${task.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
    taskList.appendChild(li);

    const checkbox = li.querySelector(`#todo-task-${task.id}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));
  });
  updateTasksCounter();
}

function updateTaskSelect() {
  const taskSelect = document.getElementById("task-select");
  if (!taskSelect) return;

  const tasks = AppState.get("tasks.items") || [];
  taskSelect.innerHTML = '<option value="">Sélectionnez une tâche</option>';
  tasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.name;
    taskSelect.appendChild(option);
  });
}

async function addNewTask() {
  const newTaskInput = document.getElementById("todo-new-task");
  const taskName = newTaskInput.value.trim();

  if (taskName === "") {
    notificationService.show("task.empty", "warning");
    return;
  }

  try {
    const tasks = AppState.get("tasks.items") || [];
    const taskExists = tasks.some(
      (task) => task.name.toLowerCase() === taskName.toLowerCase()
    );

    if (taskExists) {
      notificationService.show("task.exists", "warning");
      return;
    }

    await api.post("/tasks/addTask", { name: taskName });
    newTaskInput.value = "";
    await loadTasks();
    notificationService.show("task.added", "success");
  } catch (error) {
    console.error("Error adding task:", error);
    notificationService.show("task.add.error", "error", 0); // Notification persistante
  }
}

function handleTaskActions(event) {
  const deleteBtn = event.target.closest(".todo-delete-btn");
  const renameBtn = event.target.closest(".todo-rename-btn");

  if (deleteBtn) {
    const taskId = deleteBtn.dataset.taskId;
    confirmAndRemoveTask(taskId);
  } else if (renameBtn) {
    const taskId = renameBtn.dataset.taskId;
    const taskElement = renameBtn.closest(".todo-item");
    startInlineRename(taskId, taskElement);
  }
}

async function confirmAndRemoveTask(taskId) {
  try {
    const tasks = AppState.get("tasks.items") || [];
    const taskName = tasks.find((t) => t.id === parseInt(taskId))?.name;
    if (!taskName) return;

    const confirmed = await notificationService.confirm("task.delete.confirm");
    if (!confirmed) return;

    await api.delete(`/tasks/deleteTask/${taskId}`);
    await loadTasks();
    notificationService.show("task.deleted", "success");
  } catch (error) {
    console.error("Error deleting task:", error);
    notificationService.show("task.delete.error", "error", 0); // Notification persistante
  }
}

async function startInlineRename(taskId, taskElement) {
  const labelElement = taskElement.querySelector(".task-name");
  const currentName = labelElement.textContent.trim();

  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.value = currentName;
  inputElement.className = "inline-edit-input";

  labelElement.style.display = "none";
  labelElement.parentNode.insertBefore(inputElement, labelElement);
  inputElement.focus();

  const finishRename = async () => {
    const newName = inputElement.value.trim();

    if (!newName) {
      notificationService.show("task.empty", "warning");
      inputElement.remove();
      labelElement.style.display = "";
      return;
    }

    if (newName !== currentName) {
      try {
        const tasks = AppState.get("tasks.items") || [];
        const taskExists = tasks.some(
          (task) =>
            task.name.toLowerCase() === newName.toLowerCase() &&
            task.id !== parseInt(taskId)
        );

        if (taskExists) {
          notificationService.show("task.exists", "warning");
          inputElement.remove();
          labelElement.style.display = "";
          return;
        }

        await api.put(`/tasks/updateTask/${taskId}`, { name: newName });
        await loadTasks();
        notificationService.show("task.updated", "success");
      } catch (error) {
        console.error("Error renaming task:", error);
        notificationService.show("task.update.error", "error", 0); // Notification persistante
      }
    }
    inputElement.remove();
    labelElement.style.display = "";
  };

  inputElement.addEventListener("blur", finishRename);
  inputElement.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishRename();
    }
  });
}

function toggleTask(taskId) {
  const checkbox = document.querySelector(`#todo-task-${taskId}`);
  const deleteSelectedBtn = document.getElementById("delete-selected");

  const anyChecked =
    document.querySelectorAll(".todo-item .todo-checkbox:checked").length > 0;
  deleteSelectedBtn.disabled = !anyChecked;

  const allCheckboxes = document.querySelectorAll(".todo-item .todo-checkbox");
  const allChecked = Array.from(allCheckboxes).every((cb) => cb.checked);

  const selectAllCheckbox = document.getElementById("select-all-tasks");
  selectAllCheckbox.checked = allChecked;
}

function handleSelectAllTasks() {
  const selectAllCheckbox = document.getElementById("select-all-tasks");
  const deleteSelectedBtn = document.getElementById("delete-selected");
  const checkboxes = document.querySelectorAll(".todo-item .todo-checkbox");

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });

  deleteSelectedBtn.disabled = !selectAllCheckbox.checked;
}

async function deleteSelectedTasks() {
  const checkboxes = document.querySelectorAll(
    ".todo-item .todo-checkbox:checked"
  );
  if (!checkboxes.length) return;

  try {
    const confirmed = await notificationService.confirm("tasks.delete.confirm");
    if (!confirmed) return;

    const taskIds = Array.from(checkboxes)
      .map((checkbox) => checkbox.id.replace("todo-task-", ""))
      .filter((id) => id);

    await Promise.all(
      taskIds.map((id) => api.delete(`/tasks/deleteTask/${id}`))
    );

    await loadTasks();
    document.getElementById("select-all-tasks").checked = false;
    document.getElementById("delete-selected").disabled = true;

    notificationService.show("tasks.deleted", "success");
  } catch (error) {
    console.error("Error deleting tasks:", error);
    notificationService.show("tasks.delete.error", "error", 0); // Notification persistante
  }
}

function updateTasksCounter() {
  const counter = document.getElementById("tasks-counter");
  const tasks = AppState.get("tasks.items") || [];
  if (counter) {
    counter.textContent = `(${tasks.length})`;
  }
}

export { initializeTasks, loadTasks };
