const tasksModel = require('../models/tasksModel');
const userModel = require('../models/userModel');


exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await tasksModel.getTasksByUserId(req.user.id);
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.addTask = async (req, res) => {
    const { name } = req.body;
    try {
        const task = await tasksModel.createTask(name, req.user.id);
        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await tasksModel.deleteTask(req.params.id, req.user.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateTask = async (req, res) => {
    const { name } = req.body;
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
    }

    try {
        const task = await tasksModel.updateTask(taskId, req.user.id, name);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
