class TodoApp {
    constructor() {
        this.todos = this.loadFromStorage();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        // DOM Elements
        this.todoInput = document.getElementById('todoInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.taskCount = document.getElementById('taskCount');
        this.activeStat = document.getElementById('activeStat');
        this.completedStat = document.getElementById('completedStat');
        this.overdueStat = document.getElementById('overdueStat');
        this.clearBtn = document.getElementById('clearBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');

        // Event Listeners
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        this.clearBtn.addEventListener('click', () => this.clearCompleted());
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.render();
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: this.prioritySelect.value,
            dueDate: this.dueDateInput.value,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.todoInput.value = '';
        this.dueDateInput.value = '';
        this.prioritySelect.value = 'medium';
        this.saveToStorage();
        this.render();
        this.todoInput.focus();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.render();
    }

    getFilteredTodos() {
        let filtered;
        switch (this.currentFilter) {
            case 'active':
                filtered = this.todos.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = this.todos.filter(t => t.completed);
                break;
            case 'overdue':
                filtered = this.todos.filter(t => !t.completed && this.isOverdue(t.dueDate));
                break;
            default:
                filtered = this.todos;
        }
        return filtered.sort((a, b) => {
            if (a.completed === b.completed) {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
            }
            return a.completed ? 1 : -1;
        });
    }

    isOverdue(dueDate) {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    }

    isDueSoon(dueDate) {
        if (!dueDate) return false;
        const due = new Date(dueDate).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        return due > now && due - now < oneDay;
    }

    render() {
        const filteredTodos = this.getFilteredTodos();

        // Clear list
        this.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            const emptyMessages = {
                all: '✨ No tasks yet. Add one to get started!',
                active: '🎉 All caught up!',
                completed: '📋 No completed tasks.',
                overdue: '✓ No overdue tasks!'
            };
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>${emptyMessages[this.currentFilter] || emptyMessages.all}</p>
                </div>
            `;
        } else {
            filteredTodos.forEach(todo => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                
                const dateDisplay = this.formatDate(todo.dueDate);
                let dateClass = '';
                if (!todo.completed) {
                    if (this.isOverdue(todo.dueDate)) dateClass = 'overdue';
                    else if (this.isDueSoon(todo.dueDate)) dateClass = 'due-soon';
                }

                li.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="todo-checkbox" 
                        ${todo.completed ? 'checked' : ''} 
                        onchange="app.toggleTodo(${todo.id})"
                    >
                    <div class="priority-indicator priority-${todo.priority}"></div>
                    <div class="todo-content">
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        <div class="todo-meta">
                            ${dateDisplay ? `<span class="todo-date ${dateClass}">📅 ${dateDisplay}</span>` : ''}
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">🗑️</button>
                    </div>
                `;
                this.todoList.appendChild(li);
            });
        }

        this.updateStats();
    }

    formatDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    updateStats() {
        const activeTodos = this.todos.filter(t => !t.completed).length;
        const completedTodos = this.todos.filter(t => t.completed).length;
        const overdueTodos = this.todos.filter(t => !t.completed && this.isOverdue(t.dueDate)).length;

        this.activeStat.textContent = activeTodos;
        this.completedStat.textContent = completedTodos;
        this.overdueStat.textContent = overdueTodos;
        this.taskCount.textContent = `${activeTodos} ${activeTodos === 1 ? 'task' : 'tasks'}`;
    }

    saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('todos');
        return stored ? JSON.parse(stored) : [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});
