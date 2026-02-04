// Task Manager - Shared JavaScript for all pages
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.nextId = this.getNextId();
    }

    // Load tasks from localStorage
    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Get next available ID
    getNextId() {
        return this.tasks.length > 0 ? Math.max(...this.tasks.map(task => task.id)) + 1 : 1;
    }

    // Add a new task
    addTask(text, date = null, priority = 'medium') {
        if (!text.trim()) {
            throw new Error('Task text cannot be empty');
        }

        const newTask = {
            id: this.nextId++,
            text: text.trim(),
            completed: false,
            date: date,
            priority: priority,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }

    // Get all tasks
    getAllTasks() {
        return this.tasks;
    }

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks.filter(task => task.completed);
    }

    // Get pending tasks
    getPendingTasks() {
        return this.tasks.filter(task => !task.completed);
    }

    // Toggle task completion status
    toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            return task;
        }
        return null;
    }

    // Delete a task
    deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            const deletedTask = this.tasks.splice(index, 1)[0];
            this.saveTasks();
            return deletedTask;
        }
        return null;
    }

    // Delete all completed tasks
    clearCompletedTasks() {
        const completedTasks = this.getCompletedTasks();
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        return completedTasks;
    }

    // Get task statistics
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Get priority class for styling
    getPriorityClass(priority) {
        const classes = {
            high: 'priority-high',
            medium: 'priority-medium',
            low: 'priority-low'
        };
        return classes[priority] || 'priority-medium';
    }
}

// Initialize TaskManager
const taskManager = new TaskManager();

// Utility functions for DOM manipulation
const utils = {
    // Get element by ID
    getById(id) {
        return document.getElementById(id);
    },

    // Create element with attributes
    createElement(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        if (text) {
            element.textContent = text;
        }
        return element;
    },

    // Show message to user
    showMessage(message, type = 'info') {
        // Remove existing message
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = this.createElement('div', {
            class: `message message-${type}`
        }, message);

        // Add styles
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '5px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        messageDiv.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    },

    // Confirm dialog
    confirm(message) {
        return window.confirm(message);
    }
};

// Page-specific initialization functions
const pages = {
    // Home page initialization
    initHome() {
        const stats = taskManager.getStats();
        
        // Update stats if elements exist
        const totalTasksEl = utils.getById('total-tasks');
        const completedTasksEl = utils.getById('completed-tasks');
        const pendingTasksEl = utils.getById('pending-tasks');
        
        if (totalTasksEl) totalTasksEl.textContent = stats.total;
        if (completedTasksEl) completedTasksEl.textContent = stats.completed;
        if (pendingTasksEl) pendingTasksEl.textContent = stats.pending;
    },

    // Add task page initialization
    initAddTask() {
        const form = utils.getById('add-task-form');
        const taskInput = utils.getById('task-input');
        const dateInput = utils.getById('task-date');
        const prioritySelect = utils.getById('task-priority');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                try {
                    const taskText = taskInput.value;
                    const taskDate = dateInput.value;
                    const taskPriority = prioritySelect.value;
                    
                    taskManager.addTask(taskText, taskDate, taskPriority);
                    utils.showMessage('Task added successfully!', 'success');
                    
                    // Reset form
                    form.reset();
                    
                    // Redirect to tasks page after a short delay
                    setTimeout(() => {
                        window.location.href = 'tasks.html';
                    }, 1000);
                    
                } catch (error) {
                    utils.showMessage(error.message, 'error');
                }
            });
        }
    },

    // Tasks page initialization
    initTasks() {
        const taskList = utils.getById('task-list');
        const statsContainer = utils.getById('stats-container');
        
        if (statsContainer) {
            this.renderStats();
        }
        
        if (taskList) {
            this.renderTasks(taskManager.getAllTasks());
        }
    },

    // Completed tasks page initialization
    initCompleted() {
        const taskList = utils.getById('completed-task-list');
        const clearBtn = utils.getById('clear-completed');
        
        if (taskList) {
            this.renderTasks(taskManager.getCompletedTasks());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (utils.confirm('Are you sure you want to clear all completed tasks?')) {
                    const deletedTasks = taskManager.clearCompletedTasks();
                    utils.showMessage(`Cleared ${deletedTasks.length} completed tasks`, 'success');
                    
                    // Refresh the page
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            });
        }
    },

    // Render task statistics
    renderStats() {
        const stats = taskManager.getStats();
        const statsContainer = utils.getById('stats-container');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.completed}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.completionRate}%</div>
                    <div class="stat-label">Completion Rate</div>
                </div>
            `;
        }
    },

    // Render tasks list
    renderTasks(tasks) {
        const taskList = document.querySelector('.task-list');
        
        if (!taskList) return;
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                    <h3>No tasks found</h3>
                    <p>Start by adding some tasks!</p>
                </div>
            `;
            return;
        }
        
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    },

    // Create task element
    createTaskElement(task) {
        const taskItem = utils.createElement('div', {
            class: `task-item ${task.completed ? 'completed' : ''}`,
            'data-task-id': task.id
        });

        const checkbox = utils.createElement('input', {
            type: 'checkbox',
            class: 'task-checkbox',
            checked: task.completed
        });

        const contentDiv = utils.createElement('div', { class: 'task-content' });
        
        const taskText = utils.createElement('div', { class: 'task-text' }, task.text);
        
        const metaDiv = utils.createElement('div', { class: 'task-meta' });
        
        if (task.date) {
            const dateSpan = utils.createElement('span', {}, `📅 ${taskManager.formatDate(task.date)}`);
            metaDiv.appendChild(dateSpan);
        }
        
        if (task.priority) {
            const prioritySpan = utils.createElement('span', { 
                class: `priority-badge ${taskManager.getPriorityClass(task.priority)}` 
            }, task.priority.charAt(0).toUpperCase() + task.priority.slice(1));
            metaDiv.appendChild(prioritySpan);
        }
        
        const actionsDiv = utils.createElement('div', { class: 'task-actions' });
        
        const deleteBtn = utils.createElement('button', {
            class: 'btn btn-danger',
            'data-action': 'delete'
        }, 'Delete');
        
        const completeBtn = utils.createElement('button', {
            class: task.completed ? 'btn btn-warning' : 'btn btn-success',
            'data-action': 'toggle-complete'
        }, task.completed ? 'Undo Complete' : 'Mark Complete');
        
        contentDiv.appendChild(taskText);
        contentDiv.appendChild(metaDiv);
        
        actionsDiv.appendChild(completeBtn);
        actionsDiv.appendChild(deleteBtn);
        
        taskItem.appendChild(checkbox);
        taskItem.appendChild(contentDiv);
        taskItem.appendChild(actionsDiv);
        
        // Add event listeners
        checkbox.addEventListener('change', () => {
            taskManager.toggleTaskCompletion(task.id);
            taskItem.classList.toggle('completed');
            taskText.style.textDecoration = task.completed ? 'none' : 'line-through';
            utils.showMessage(task.completed ? 'Task marked as pending' : 'Task completed!', 'success');
            
            // Update stats if on tasks page
            if (window.location.pathname.includes('tasks.html')) {
                this.renderStats();
            }
        });
        
        completeBtn.addEventListener('click', () => {
            taskManager.toggleTaskCompletion(task.id);
            const updatedTask = taskManager.getAllTasks().find(t => t.id === task.id);
            taskItem.classList.toggle('completed', updatedTask.completed);
            taskText.style.textDecoration = updatedTask.completed ? 'line-through' : 'none';
            completeBtn.textContent = updatedTask.completed ? 'Undo Complete' : 'Mark Complete';
            completeBtn.className = updatedTask.completed ? 'btn btn-warning' : 'btn btn-success';
            utils.showMessage(updatedTask.completed ? 'Task marked as complete!' : 'Task marked as pending', 'success');
            
            // Update stats if on tasks page
            if (window.location.pathname.includes('tasks.html')) {
                this.renderStats();
            }
        });
        
        deleteBtn.addEventListener('click', () => {
            if (utils.confirm('Are you sure you want to delete this task?')) {
                taskManager.deleteTask(task.id);
                taskItem.remove();
                utils.showMessage('Task deleted successfully!', 'success');
                
                // Update stats if on tasks page
                if (window.location.pathname.includes('tasks.html')) {
                    this.renderStats();
                }
                
                // Show empty state if no tasks left
                const remainingTasks = taskList.querySelectorAll('.task-item');
                if (remainingTasks.length === 0) {
                    this.renderTasks([]);
                }
            }
        });
        
        return taskItem;
    }
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            pages.initHome();
            break;
        case 'add-task.html':
            pages.initAddTask();
            break;
        case 'tasks.html':
            pages.initTasks();
            break;
        case 'completed.html':
            pages.initCompleted();
            break;
    }
});