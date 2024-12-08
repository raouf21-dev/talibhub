// tasks.js

import { escapeHTML } from './utils.js';

async function makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
        credentials: 'include', // Pour les cookies
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Fallback token
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, finalOptions);
        
        if (response.status === 401) {
            window.location.href = '/welcomepage';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Request error:', error);
        throw error;
    }
}

function initializeTasks() {
    loadTasks();

    const addTaskBtn = document.getElementById('todo-add-task');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addNewTask);
    }

    const newTaskInput = document.getElementById('todo-new-task');
    if (newTaskInput) {
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewTask();
            }
        });
    }

    const taskList = document.getElementById('todo-task-list');
    if (taskList) {
        taskList.addEventListener('click', (e) => {
            if (e.target.closest('.todo-delete-btn')) {
                const taskId = e.target.closest('.todo-delete-btn').dataset.taskId;
                removeTask(taskId);
            } else if (e.target.closest('.todo-rename-btn')) {
                const taskId = e.target.closest('.todo-rename-btn').dataset.taskId;
                renameTask(taskId);
            }
        });
    }
}

async function loadTasks() {
    try {
        const response = await makeAuthenticatedRequest('/api/tasks/getAllTasks');
        const tasks = await response.json();

        const taskList = document.getElementById('todo-task-list');
        const taskSelect = document.getElementById('task-select');

        // Mise à jour du DOM pour afficher les tâches dans la liste
        if (taskList) {
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
                        <button class="todo-rename-btn" data-task-id="${task.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span class="sr-only">Renommer</span>
                        </button>
                        <button class="todo-delete-btn" data-task-id="${task.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            <span class="sr-only">Supprimer</span>
                        </button>
                    </div>
                `;
                taskList.appendChild(li);

                const checkbox = li.querySelector(`#todo-task-${task.id}`);
                checkbox.addEventListener('change', () => toggleTask(task.id));
            });
        }

        // Mise à jour du sélecteur de tâches s'il existe
        if (taskSelect) {
            taskSelect.innerHTML = '<option value="">Sélectionnez une tâche</option>';
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
    const newTaskInput = document.getElementById('todo-new-task');
    const taskName = newTaskInput.value.trim();
    if (taskName === '') return;

    try {
        await makeAuthenticatedRequest('/api/tasks/addTask', {
            method: 'POST',
            body: JSON.stringify({ name: taskName })
        });

        newTaskInput.value = '';
        await loadTasks();
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

async function toggleTask(taskId) {
    try {
        const taskElement = document.querySelector(`#todo-task-${taskId}`).closest('.todo-item');
        const isCompleted = taskElement.classList.toggle('completed');

        await makeAuthenticatedRequest(`/api/tasks/updateTask/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ completed: isCompleted })
        });
    } catch (error) {
        console.error('Error toggling task:', error);
        await loadTasks(); // Recharger en cas d'erreur
    }
}

async function removeTask(taskId) {
    try {
        await makeAuthenticatedRequest(`/api/tasks/deleteTask/${taskId}`, {
            method: 'DELETE'
        });
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function renameTask(taskId) {
    const newName = prompt("Entrez le nouveau nom de la tâche:");
    if (!newName || newName.trim() === "") return;

    try {
        await makeAuthenticatedRequest(`/api/tasks/updateTask/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName.trim() })
        });
        await loadTasks();
    } catch (error) {
        console.error('Error renaming task:', error);
    }
}

export { 
    initializeTasks,
    loadTasks
};