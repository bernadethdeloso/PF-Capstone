// Task array to store tasks
let tasks = [];

// Timer intervals storage
let timers = {};

// DOM elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const timerInput = document.getElementById('timer-input');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const notification = document.getElementById('notification');
const loading = document.getElementById('loading');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const exportBtn = document.getElementById('export-btn');
const clearTasksBtn = document.getElementById('clear-tasks-btn');

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to show notification
function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Function to show loading
function showLoading() {
    loading.classList.remove('hidden');
}

// Function to hide loading
function hideLoading() {
    loading.classList.add('hidden');
}

// Function to save tasks to localStorage
async function saveTasksToStorage() {
    try {
        const data = JSON.stringify(tasks);
        localStorage.setItem('tasks', data);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Function to load tasks from localStorage
async function loadTasksFromStorage() {
    try {
        const data = localStorage.getItem('tasks');
        if (data) {
            tasks = JSON.parse(data).map(task => ({
                id: task.id,
                text: task.text || '',
                category: task.category || 'General',
                priority: task.priority || 'Low',
                completed: Boolean(task.completed),
                timer: Number(task.timer) || 0,
                timerRunning: Boolean(task.timerRunning)
            }));
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Function to fetch categories from API
async function fetchCategories() {
    try {
        showLoading();
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Use the title as a sample category
        const newCategory = data.title.split(' ')[0]; // First word
        if (!categorySelect.querySelector(`option[value="${newCategory}"]`)) {
            const option = document.createElement('option');
            option.value = newCategory;
            option.textContent = newCategory;
            categorySelect.appendChild(option);
            filterSelect.appendChild(option.cloneNode(true));
            showNotification(`New category "${newCategory}" added from API!`);
        }
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Error fetching categories: ' + error.message);
    }
}

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDark);
}

// Function to export tasks as JSON
function exportTasks() {
    try {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'tasks.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Tasks exported successfully!');
    } catch (error) {
        showNotification('Error exporting tasks: ' + error.message);
    }
}

// Function to update counters
function updateCounters() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    taskCounter.textContent = `Total: ${total} | Completed: ${completed} | Pending: ${pending}`;
}

// Function to render tasks
function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterCategory = filterSelect.value;
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        if (task.completed) {
            li.classList.add('completed');
        }
        const span = document.createElement('span');
        span.textContent = task.text;
        span.contentEditable = false;
        li.appendChild(span);

        const categoryLabel = document.createElement('span');
        categoryLabel.textContent = task.category;
        categoryLabel.classList.add('category-label', `category-${task.category}`);
        li.appendChild(categoryLabel);

        const priorityLabel = document.createElement('span');
        priorityLabel.textContent = task.priority;
        priorityLabel.classList.add('priority-label', `priority-${task.priority}`);
        li.appendChild(priorityLabel);

        // Timer controls
        const timerDiv = document.createElement('div');
        timerDiv.classList.add('timer-controls');

        const timerDisplay = document.createElement('span');
        timerDisplay.classList.add('timer-display');
        timerDisplay.textContent = formatTime(task.timer);
        timerDiv.appendChild(timerDisplay);

        const startBtn = document.createElement('button');
        startBtn.textContent = task.timerRunning ? 'Pause' : 'Start';
        startBtn.classList.add('timer-btn');
        if (task.timerRunning) startBtn.classList.add('active');
        startBtn.onclick = () => toggleTimer(task.id);
        timerDiv.appendChild(startBtn);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.classList.add('timer-btn');
        resetBtn.onclick = () => resetTimer(task.id);
        timerDiv.appendChild(resetBtn);

        li.appendChild(timerDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    updateCounters();
}

// Function to add a new task
async function addTask(text, category, priority, initialMinutes) {
    try {
        showLoading();
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        const initialSeconds = Number(initialMinutes) > 0 ? Number(initialMinutes) * 60 : 0;
        const task = {
            id: Date.now(),
            text: text,
            category: category,
            priority: priority,
            completed: false,
            timer: initialSeconds,
            timerRunning: false
        };
        tasks.push(task);
        await saveTasksToStorage();
        renderTasks();
        hideLoading();
        showNotification('Task added successfully!');
    } catch (error) {
        hideLoading();
        showNotification('Error adding task: ' + error.message);
    }
}

// Function to format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Function to toggle timer
function toggleTimer(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.timerRunning) {
        // Pause timer
        clearInterval(timers[id]);
        delete timers[id];
        task.timerRunning = false;
    } else {
        // Start timer
        timers[id] = setInterval(() => {
            task.timer++;
            const timerDisplay = document.querySelector(`[data-id="${id}"] .timer-display`);
            if (timerDisplay) {
                timerDisplay.textContent = formatTime(task.timer);
            }
        }, 1000);
        task.timerRunning = true;
    }
    renderTasks();
}

// Function to reset timer
function resetTimer(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (timers[id]) {
        clearInterval(timers[id]);
        delete timers[id];
    }
    task.timer = 0;
    task.timerRunning = false;
    renderTasks();
}

// Function to delete a task
async function deleteTask(id) {
    try {
        showLoading();
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clear timer if running
        if (timers[id]) {
            clearInterval(timers[id]);
            delete timers[id];
        }

        tasks = tasks.filter(task => task.id !== id);
        await saveTasksToStorage();
        renderTasks();
        hideLoading();
        showNotification('Task deleted!');
    } catch (error) {
        hideLoading();
        showNotification('Error deleting task: ' + error.message);
    }
}

// Function to toggle task completion
async function toggleComplete(id) {
    try {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        await saveTasksToStorage();
        renderTasks();
        showNotification('Task status updated!');
    } catch (error) {
        showNotification('Error updating task: ' + error.message);
    }
}

// Function to edit task
async function editTask(id, newText) {
    try {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, text: newText };
            }
            return task;
        });
        await saveTasksToStorage();
        renderTasks();
        showNotification('Task edited!');
    } catch (error) {
        showNotification('Error editing task: ' + error.message);
    }
}

// Debounced search handler
const debouncedSearch = debounce(() => {
    renderTasks();
}, 300);

// Event listener for form submission
taskForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const text = taskInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    const timerMinutes = timerInput.value.trim();
    if (text) {
        await addTask(text, category, priority, timerMinutes);
        taskInput.value = '';
        timerInput.value = '';
    }
});

clearTasksBtn.addEventListener('click', async function() {
    tasks = [];
    localStorage.removeItem('tasks');
    renderTasks();
    showNotification('All tasks cleared.');
});

// Event listener for search input
searchInput.addEventListener('input', debouncedSearch);

// Event listener for filter select
filterSelect.addEventListener('change', renderTasks);

// Event listener for dark mode toggle
darkModeToggle.addEventListener('click', toggleDarkMode);

// Event listener for export button
exportBtn.addEventListener('click', exportTasks);

// Event listener for task list clicks
taskList.addEventListener('click', async function(event) {
    const target = event.target;
    const li = target.closest('li');
    if (!li) return;
    const id = parseInt(li.dataset.id);
    if (target.classList.contains('delete-btn')) {
        await deleteTask(id);
    } else if (!target.classList.contains('category-label') && !target.classList.contains('priority-label') && !target.classList.contains('timer-btn')) {
        await toggleComplete(id);
    }
});

// Event listener for double-click to edit
taskList.addEventListener('dblclick', function(event) {
    const target = event.target;
    if (target.tagName === 'SPAN' && !target.classList.contains('category-label') && !target.classList.contains('priority-label')) {
        const li = target.closest('li');
        const span = li.querySelector('span:not(.category-label):not(.priority-label)');
        span.contentEditable = true;
        span.focus();
        span.addEventListener('blur', async function() {
            span.contentEditable = false;
            const newText = span.textContent.trim();
            if (newText) {
                await editTask(parseInt(li.dataset.id), newText);
            } else {
                renderTasks(); // Revert if empty
            }
        });
        span.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.blur();
            }
        });
    }
});

// Initialize app
async function initApp() {
    try {
        await loadTasksFromStorage();
        
        // Load dark mode preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        }
        
        // Fetch categories after a delay
        setTimeout(fetchCategories, 1000);
        
        renderTasks();
    } catch (error) {
        showNotification('Error initializing app: ' + error.message);
    }
}

initApp();