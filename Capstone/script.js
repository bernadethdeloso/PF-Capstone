// Task array to store tasks
let tasks = [];
let currentUser = null;
let currentTab = 'home';

// DOM elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const signOutBtn = document.getElementById('sign-out-btn');
const userGreeting = document.getElementById('user-greeting');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabs = document.querySelectorAll('.tab-content');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date-input');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const taskList = document.getElementById('task-list');
const completedList = document.getElementById('completed-list');
const pendingList = document.getElementById('pending-list');
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
                dueDateTime: task.dueDateTime || '',
                completed: Boolean(task.completed),
                createdAt: Number(task.createdAt) || Date.now()
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

// Function to create a task list item
function createTaskItem(task, showLate = false) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.completed) {
        li.classList.add('completed');
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = task.text;
    li.appendChild(textSpan);

    const metaDiv = document.createElement('div');
    metaDiv.classList.add('task-meta');

    const categoryLabel = document.createElement('span');
    categoryLabel.textContent = task.category;
    categoryLabel.classList.add('category-label', `category-${task.category}`);
    metaDiv.appendChild(categoryLabel);

    const priorityLabel = document.createElement('span');
    priorityLabel.textContent = task.priority;
    priorityLabel.classList.add('priority-label', `priority-${task.priority}`);
    metaDiv.appendChild(priorityLabel);

    if (task.dueDateTime) {
        const dueDate = new Date(task.dueDateTime);
        const dueLabel = document.createElement('span');
        dueLabel.textContent = `Due: ${dueDate.toLocaleString()}`;
        dueLabel.classList.add('time-pref-label');
        metaDiv.appendChild(dueLabel);
    }

    if (showLate && task.dueDateTime && !task.completed) {
        const dueDate = new Date(task.dueDateTime);
        if (dueDate < Date.now()) {
            const lateLabel = document.createElement('span');
            lateLabel.textContent = `Late by ${formatElapsedTime(dueDate.getTime())}`;
            lateLabel.classList.add('late-label');
            metaDiv.appendChild(lateLabel);
        }
    }

    li.appendChild(metaDiv);

    const actionDiv = document.createElement('div');
    actionDiv.classList.add('task-meta');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    actionDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    actionDiv.appendChild(deleteBtn);

    li.appendChild(actionDiv);
    return li;
}

// Function to render tasks
function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterCategory = filterSelect.value;
    const filteredHomeTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    taskList.innerHTML = '';
    filteredHomeTasks.forEach(task => {
        taskList.appendChild(createTaskItem(task, false));
    });

    const completedTasks = tasks.filter(task => task.completed);
    completedList.innerHTML = '';
    completedTasks.forEach(task => {
        completedList.appendChild(createTaskItem(task, false));
    });

    const pendingTasks = tasks.filter(task => !task.completed);
    pendingList.innerHTML = '';
    pendingTasks.forEach(task => {
        pendingList.appendChild(createTaskItem(task, true));
    });

    updateCounters();
    if (searchTerm.trim()) {
        taskCounter.classList.remove('hidden');
    } else {
        taskCounter.classList.add('hidden');
    }
}

// Function to add a new task
async function addTask(text, category, priority, dueDateTime) {
    try {
        showLoading();
        await new Promise(resolve => setTimeout(resolve, 500));

        const task = {
            id: Date.now(),
            text: text,
            category: category,
            priority: priority,
            dueDateTime: dueDateTime,
            completed: false,
            createdAt: Date.now()
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

function formatElapsedTime(createdAt) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    return formatTime(elapsedSeconds);
}

// Function to delete a task
async function deleteTask(id) {
    try {
        showLoading();
        await new Promise(resolve => setTimeout(resolve, 500));

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

function setUser(username) {
    currentUser = username;
    localStorage.setItem('taskManagerUser', username);
    userGreeting.textContent = `Welcome, ${username}`;
}

function clearUser() {
    currentUser = null;
    localStorage.removeItem('taskManagerUser');
}

function showAuthScreen() {
    authScreen.classList.remove('hidden');
    authScreen.style.display = 'flex';
    appScreen.classList.add('hidden');
    appScreen.style.display = 'none';
}

function showAppScreen() {
    authScreen.classList.add('hidden');
    authScreen.style.display = 'none';
    appScreen.classList.remove('hidden');
    appScreen.style.display = 'block';
}

function showTab(tabName) {
    currentTab = tabName;
    tabs.forEach(tab => {
        tab.classList.toggle('hidden', tab.id !== `${tabName}-tab`);
    });
    tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
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
    const dueDateTime = dueDateInput.value;
    if (text) {
        await addTask(text, category, priority, dueDateTime);
        taskInput.value = '';
        dueDateInput.value = '';
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

// Event listener for login
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;
    showLoading();
    setTimeout(() => {
        setUser(username);
        hideLoading();
        showAppScreen();
        showTab('home');
        renderTasks();
        showNotification('Signed in successfully!');
        usernameInput.value = '';
    }, 1000);
});

// Event listener for sign out
signOutBtn.addEventListener('click', function() {
    showLoading();
    setTimeout(() => {
        clearUser();
        showAuthScreen();
        hideLoading();
    }, 800);
});

// Event listener for tab buttons
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        showTab(this.dataset.tab);
    });
});

// Handle task actions for all lists
function handleTaskListClick(event) {
    const target = event.target;
    const li = target.closest('li');
    if (!li) return;
    const id = parseInt(li.dataset.id, 10);

    if (target.classList.contains('delete-btn')) {
        deleteTask(id);
    } else if (target.classList.contains('edit-btn')) {
        const li = target.closest('li');
        const task = tasks.find(t => t.id === id);
        const currentText = task.text;
        const textSpan = li.querySelector('span');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('inline-edit');
        textSpan.replaceWith(input);
        input.focus();

        const saveEdit = async () => {
            const updated = input.value.trim();
            if (updated) {
                await editTask(id, updated);
            } else {
                renderTasks();
            }
        };

        input.addEventListener('blur', saveEdit, { once: true });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
    } else if (!target.closest('button')) {
        toggleComplete(id);
    }
}

taskList.addEventListener('click', handleTaskListClick);
completedList.addEventListener('click', handleTaskListClick);
pendingList.addEventListener('click', handleTaskListClick);

// Initialize app
async function initApp() {
    try {
        await loadTasksFromStorage();

        const savedUser = localStorage.getItem('taskManagerUser');
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        }

        if (savedUser) {
            setUser(savedUser);
            showAppScreen();
            showTab('home');
            renderTasks();
        } else {
            showAuthScreen();
        }

        setTimeout(fetchCategories, 1000);
    } catch (error) {
        showNotification('Error initializing app: ' + error.message);
    }
}

initApp();