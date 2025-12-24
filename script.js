// Database Setup
const DB_NAME = 'TaskPro';
const DB_VERSION = 1;

const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('tasks')) {
      const store = db.createObjectStore('tasks', { keyPath: 'id' });
      store.createIndex('project', 'project');
      store.createIndex('completed', 'completed');
    }
    if (!db.objectStoreNames.contains('preferences')) {
      db.createObjectStore('preferences', { keyPath: 'key' });
    }
  }
});

// State
let tasks = [];
let currentProject = 'all';
let currentView = 'all';
let currentSort = 'date';
let searchQuery = '';
let isDarkMode = false;
let editingId = null;
let calendarMonthOffset = 0;
const WIP_LIMIT_IN_PROGRESS = 5;

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-name');
const taskDescription = document.getElementById('task-description');
const taskPriority = document.getElementById('task-priority');
const taskProject = document.getElementById('task-project');
const taskDueDate = document.getElementById('task-due-date');
const taskStatus = document.getElementById('task-status');
const taskRecurrence = document.getElementById('task-recurrence');
const taskList = document.getElementById('task-list');
const boardContainer = document.getElementById('board-container');
const calendarContainer = document.getElementById('calendar-container');
const searchInput = document.getElementById('search-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const themeToggle = document.getElementById('theme-toggle');
const projectBtns = document.querySelectorAll('.project-btn');
const viewBtns = document.querySelectorAll('.view-btn');
const sortBtns = document.querySelectorAll('.sort-btn');
const emptyState = document.getElementById('empty-state');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');
const modalTitle = document.getElementById('modal-title');

// New elements
const taskTags = document.getElementById('task-tags');
const analyticsBtn = document.getElementById('analytics-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const analyticsModal = document.getElementById('analytics-modal');
const closeAnalyticsBtn = document.getElementById('close-analytics');
const quickAddInput = document.getElementById('quick-add-input');
const quickAddBtn = document.getElementById('quick-add-btn');
const densityToggle = document.getElementById('density-toggle');

// Persistence
async function saveData() {
  try {
    const db = await dbPromise;
    const tx = db.transaction(['tasks', 'preferences'], 'readwrite');
    
    await tx.objectStore('tasks').clear();
    await Promise.all(tasks.map(task => tx.objectStore('tasks').put(task)));
    await tx.objectStore('preferences').put({ key: 'darkMode', value: isDarkMode });
    
    await tx.done;
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

async function loadData() {
  try {
    const db = await dbPromise;
    tasks = (await db.getAll('tasks')) || [];
    const darkModeData = await db.get('preferences', 'darkMode');
    isDarkMode = darkModeData?.value || false;
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Helper Functions
function getFilteredTasks() {
  let filtered = tasks;

  // Project filter
  if (currentProject !== 'all') {
    filtered = filtered.filter(t => t.project === currentProject);
  }

  // View filter
  if (currentView === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(t => t.dueDate === today && !t.completed);
  } else if (currentView === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentView === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    if (currentSort === 'date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    } else if (currentSort === 'priority') {
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (currentSort === 'name') {
      return a.name.localeCompare(b.name);
    } else if (currentSort === 'manual') {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    }
    return 0;
  });

  return filtered;
}

function getStats() {
  const today = new Date().toISOString().split('T')[0];
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length
  };
}

// Render Functions
function renderStats() {
  const stats = getStats();
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-completed').textContent = stats.completed;
  document.getElementById('stat-pending').textContent = stats.pending;
  document.getElementById('stat-overdue').textContent = stats.overdue;
}

function renderTasks() {
  // Toggle containers based on view
  taskList.style.display = (currentView === 'board' || currentView === 'calendar') ? 'none' : '';
  boardContainer.style.display = currentView === 'board' ? '' : 'none';
  calendarContainer.style.display = currentView === 'calendar' ? '' : 'none';

  if (currentView === 'board') {
    renderBoard();
    renderStats();
    return;
  }
  if (currentView === 'calendar') {
    renderCalendar();
    renderStats();
    return;
  }

  taskList.innerHTML = '';
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(task => {
    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !task.completed;
    const status = task.status || (task.completed ? 'done' : 'todo');

    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    const tagsHtml = task.tags && task.tags.length > 0 
      ? `<div class="task-tags">${task.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';
    
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-name">${escapeHtml(task.name)}</div>
        <div class="task-meta">
          <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
          <span class="task-project">${task.project}</span>
          <span class="task-status">${status.replace('_',' ')}</span>
          ${task.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : ''}
        </div>
        ${tagsHtml}
      </div>
      <div class="task-actions">
        ${currentSort === 'manual' ? '<span class="drag-handle" title="Drag to reorder"></span>' : ''}
        <button class="task-btn task-btn-edit" data-id="${task.id}" title="Edit">✏️</button>
        <button class="task-btn task-btn-delete" data-id="${task.id}" title="Delete">🗑️</button>
      </div>
    `;
    if (currentSort === 'manual') {
      li.setAttribute('draggable', 'true');
      li.dataset.id = String(task.id);
    }
    taskList.appendChild(li);
  });

  if (currentSort === 'manual') {
    enableManualReorder();
  }
  renderStats();
}

function updateViewTitle() {
  const titles = {
    all: 'All Tasks',
    today: 'Today',
    pending: 'Pending Tasks',
    completed: 'Completed Tasks',
    board: 'Board',
    calendar: 'Calendar'
  };
  viewTitle.textContent = titles[currentView] || 'All Tasks';
  viewSubtitle.textContent = '';
}

// Helper Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Event Listeners
addTaskBtn.addEventListener('click', () => {
  editingId = null;
  taskForm.reset();
  modalTitle.textContent = 'New Task';
  taskProject.value = 'personal';
  taskPriority.value = 'Medium';
  taskModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  taskModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
  taskModal.style.display = 'none';
});

taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) {
    taskModal.style.display = 'none';
  }
});

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const taskName = taskInput.value.trim();
  if (!taskName) {
    alert('Task name is required');
    return;
  }

  if (editingId) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.name = taskName;
      task.description = taskDescription.value.trim();
      task.priority = taskPriority.value;
      task.project = taskProject.value;
      task.dueDate = taskDueDate.value || null;
      task.status = taskStatus.value;
      task.completed = task.status === 'done' ? true : task.completed;
      task.recurrence = taskRecurrence.value;
      task.tags = taskTags.value.split(',').map(t => t.trim()).filter(t => t);
    }
  } else {
    const newTask = {
      id: Date.now(),
      name: taskName,
      description: taskDescription.value.trim(),
      priority: taskPriority.value,
      project: taskProject.value,
      dueDate: taskDueDate.value || null,
      status: taskStatus ? taskStatus.value : 'todo',
      recurrence: taskRecurrence ? taskRecurrence.value : 'none',
      tags: taskTags.value.split(',').map(t => t.trim()).filter(t => t),
      completed: false,
      createdAt: new Date().toISOString(),
      order: nextOrderValue()
    };
    if (newTask.status === 'done') newTask.completed = true;
    tasks.push(newTask);
  }

  await saveData();
  renderTasks();
  taskModal.style.display = 'none';
  taskForm.reset();
});

taskList.addEventListener('change', async (e) => {
  if (e.target.classList.contains('task-checkbox')) {
    const id = parseInt(e.target.dataset.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = e.target.checked;
      task.status = task.completed ? 'done' : (task.status === 'done' ? 'todo' : (task.status || 'todo'));
      // Handle recurrence: create next occurrence when completed
      if (task.completed && task.recurrence && task.recurrence !== 'none' && task.dueDate) {
        const nextDate = nextRecurrenceDate(task.dueDate, task.recurrence);
        if (nextDate) {
          tasks.push({
            id: Date.now() + Math.floor(Math.random()*1000),
            name: task.name,
            description: task.description,
            priority: task.priority,
            project: task.project,
            dueDate: nextDate,
            status: 'todo',
            recurrence: task.recurrence,
            tags: task.tags || [],
            completed: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      await saveData();
      renderTasks();
    }
  }
});

taskList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('task-btn-edit')) {
    const id = parseInt(e.target.dataset.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      editingId = task.id;
      taskInput.value = task.name;
      taskDescription.value = task.description || '';
      taskPriority.value = task.priority;
      taskProject.value = task.project;
      taskDueDate.value = task.dueDate || '';
      taskTags.value = (task.tags || []).join(', ');
      modalTitle.textContent = 'Edit Task';
      taskModal.style.display = 'flex';
    }
  } else if (e.target.classList.contains('task-btn-delete')) {
    const id = parseInt(e.target.dataset.id);
    if (confirm('Delete this task?')) {
      tasks = tasks.filter(t => t.id !== id);
      await saveData();
      renderTasks();
    }
  }
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

projectBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    projectBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentProject = btn.dataset.project;
    currentView = 'all';
    viewBtns.forEach(b => b.classList.remove('active'));
    updateViewTitle();
    renderTasks();
  });
});

viewBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentView = btn.dataset.view;
    updateViewTitle();
    renderTasks();
  });
});

sortBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sortBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderTasks();
  });
});

themeToggle.addEventListener('click', async () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  await saveData();
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + K: New task
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    addTaskBtn.click();
  }
  // Esc: Close modals
  if (e.key === 'Escape') {
    if (taskModal.style.display !== 'none') {
      taskModal.style.display = 'none';
    }
    if (analyticsModal.style.display !== 'none') {
      analyticsModal.style.display = 'none';
    }
  }
});

// Export Tasks
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(tasks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

// Import Tasks
importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    
    if (Array.isArray(imported)) {
      tasks = imported;
      await saveData();
      renderTasks();
      alert('Tasks imported successfully!');
    } else {
      alert('Invalid file format. Please select a valid tasks JSON file.');
    }
  } catch (error) {
    alert('Error importing file: ' + error.message);
  }
  
  importFile.value = '';
});

// Analytics
analyticsBtn.addEventListener('click', () => {
  renderAnalytics();
  analyticsModal.style.display = 'flex';
});

closeAnalyticsBtn.addEventListener('click', () => {
  analyticsModal.style.display = 'none';
});

analyticsModal.addEventListener('click', (e) => {
  if (e.target === analyticsModal) {
    analyticsModal.style.display = 'none';
  }
});

function renderAnalytics() {
  const stats = getStats();
  const completed = stats.completed;
  const total = stats.total;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  // Completion Rate
  document.getElementById('completion-rate').textContent = completionRate + '%';
  
  // Productivity Score (based on multiple factors)
  const priorityScore = tasks.reduce((sum, t) => {
    if (t.completed) {
      return sum + (t.priority === 'High' ? 30 : t.priority === 'Medium' ? 20 : 10);
    }
    return sum;
  }, 0);
  const productivityScore = Math.min(100, Math.round(completionRate * 0.6 + Math.min(priorityScore / 10, 40)));
  document.getElementById('productivity-score').textContent = productivityScore;
  
  // Tasks This Week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const tasksThisWeek = tasks.filter(t => new Date(t.createdAt) >= weekAgo).length;
  document.getElementById('tasks-week').textContent = tasksThisWeek;
  
  // Average Priority
  const pendingTasks = tasks.filter(t => !t.completed);
  if (pendingTasks.length > 0) {
    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const avgPriority = pendingTasks.reduce((sum, t) => sum + priorityMap[t.priority], 0) / pendingTasks.length;
    const avgLabel = avgPriority >= 2.5 ? 'High' : avgPriority >= 1.5 ? 'Medium' : 'Low';
    document.getElementById('avg-priority').textContent = avgLabel;
  } else {
    document.getElementById('avg-priority').textContent = '-';
  }
  
  // Top Tags
  const tagFreq = {};
  tasks.forEach(t => {
    if (t.tags) {
      t.tags.forEach(tag => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    }
  });
  
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const tagsHtml = topTags.length > 0
    ? topTags.map(([tag, count]) => `<div class="tag-item"><span class="tag-label">${escapeHtml(tag)}</span><span class="tag-count">${count}</span></div>`).join('')
    : '<p style="color: var(--text-muted);">No tags yet</p>';
  
  document.getElementById('top-tags').innerHTML = tagsHtml;
  
  // Project Breakdown
  const projectBreakdown = {};
  tasks.forEach(t => {
    projectBreakdown[t.project] = (projectBreakdown[t.project] || 0) + 1;
  });
  
  const projectHtml = Object.entries(projectBreakdown)
    .map(([project, count]) => `<div class="breakdown-item"><span class="project-label">${project}</span><span class="breakdown-count">${count}</span></div>`)
    .join('');
  
  document.getElementById('project-breakdown').innerHTML = projectHtml;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    updateViewTitle();
    renderTasks();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});

// Quick Add
quickAddBtn.addEventListener('click', async () => {
  const text = quickAddInput.value.trim();
  if (!text) return;
  const parsed = parseQuickAdd(text);
  tasks.push({
    id: Date.now(),
    name: parsed.name,
    description: parsed.description,
    priority: parsed.priority,
    project: parsed.project,
    dueDate: parsed.dueDate,
    status: parsed.status,
    recurrence: parsed.recurrence,
    tags: parsed.tags,
    completed: parsed.status === 'done',
    createdAt: new Date().toISOString(),
    order: nextOrderValue()
  });
  await saveData();
  quickAddInput.value = '';
  renderTasks();
});

quickAddInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    quickAddBtn.click();
  }
});

function parseQuickAdd(text) {
  // Tokens: #project, !priority, @tag, keywords: today, tomorrow, next week; status: ~done/~progress
  const parts = text.split(/\s+/);
  let nameParts = [];
  let project = 'personal';
  let priority = 'Medium';
  let tags = [];
  let status = 'todo';
  let recurrence = 'none';
  let dueDate = null;
  parts.forEach(p => {
    if (p.startsWith('#')) {
      const val = p.slice(1).toLowerCase();
      if (['work','personal','learning'].includes(val)) project = val;
      else tags.push(val);
    } else if (p.startsWith('!')) {
      const val = p.slice(1).toLowerCase();
      if (val === 'high') priority = 'High';
      else if (val === 'low') priority = 'Low';
      else priority = 'Medium';
    } else if (p.startsWith('@')) {
      tags.push(p.slice(1));
    } else if (p.startsWith('~')) {
      const val = p.slice(1);
      if (val === 'done') status = 'done';
      else if (val === 'progress') status = 'in_progress';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
      dueDate = p;
    } else if (/^tomorrow$/i.test(p)) {
      const d = new Date(); d.setDate(d.getDate()+1);
      dueDate = toISODate(d);
    } else if (/^today$/i.test(p)) {
      dueDate = toISODate(new Date());
    } else if (/^next\s*week$/i.test(p)) {
      const d = new Date(); d.setDate(d.getDate()+7);
      dueDate = toISODate(d);
    } else if (/^daily$|^weekly$|^monthly$/i.test(p)) {
      recurrence = p.toLowerCase();
    } else {
      nameParts.push(p);
    }
  });
  return {
    name: nameParts.join(' ').trim() || 'Untitled',
    description: '',
    project,
    priority,
    tags,
    status,
    recurrence,
    dueDate
  };
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// Density Toggle
densityToggle.addEventListener('click', () => {
  const compact = document.body.classList.toggle('compact');
  densityToggle.textContent = compact ? 'Comfortable' : 'Compact';
});

// Manual reorder via drag-and-drop
function enableManualReorder() {
  let dragId = null;
  taskList.addEventListener('dragstart', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    dragId = parseInt(li.dataset.id);
  });
  taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  taskList.addEventListener('drop', async (e) => {
    e.preventDefault();
    const targetLi = e.target.closest('.task-item');
    if (!targetLi || dragId == null) return;
    const targetId = parseInt(targetLi.dataset.id);
    reorderTasks(dragId, targetId);
    dragId = null;
    await saveData();
    renderTasks();
  }, { once: true });
}

function reorderTasks(sourceId, targetId) {
  ensureOrders();
  const src = tasks.find(t => t.id === sourceId);
  const tgt = tasks.find(t => t.id === targetId);
  if (!src || !tgt) return;
  const srcOrder = src.order;
  const tgtOrder = tgt.order;
  // Move src to just before tgt
  tasks.forEach(t => {
    if (t.id === sourceId) return;
    if (srcOrder < tgtOrder) {
      // moving down
      if (t.order > srcOrder && t.order <= tgtOrder) t.order -= 1;
    } else if (srcOrder > tgtOrder) {
      // moving up
      if (t.order < srcOrder && t.order >= tgtOrder) t.order += 1;
    }
  });
  src.order = tgtOrder;
}

function ensureOrders() {
  let i = 1;
  tasks.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).forEach(t => { t.order = i++; });
}

function nextOrderValue() {
  const max = tasks.reduce((m, t) => Math.max(m, t.order ?? 0), 0);
  return max + 1;
}

// Board View Rendering
function renderBoard() {
  emptyState.style.display = 'none';
  const byStatus = { todo: [], in_progress: [], done: [] };
  tasks.forEach(t => {
    const status = t.status || (t.completed ? 'done' : 'todo');
    byStatus[status] ? byStatus[status].push(t) : byStatus['todo'].push(t);
  });

  boardContainer.innerHTML = `
    ${renderBoardColumn(`To Do (${byStatus.todo.length})`, 'todo', byStatus.todo)}
    ${renderBoardColumn(`In Progress (${byStatus.in_progress.length}/${WIP_LIMIT_IN_PROGRESS})`, 'in_progress', byStatus.in_progress)}
    ${renderBoardColumn(`Done (${byStatus.done.length})`, 'done', byStatus.done)}
  `;

  setupDragAndDrop();
}

function renderBoardColumn(title, key, items) {
  const cards = items.map(task => {
    const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && !task.completed;
    const tagsHtml = task.tags && task.tags.length > 0 
      ? `<div class="task-tags">${task.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';
    return `
      <div class="task-item draggable" draggable="true" data-id="${task.id}">
        <div class="task-content">
          <div class="task-name">${escapeHtml(task.name)}</div>
          <div class="task-meta">
            <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
            <span class="task-project">${task.project}</span>
            ${task.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : ''}
          </div>
          ${tagsHtml}
        </div>
        <div class="task-actions">
          <button class="task-btn task-btn-edit" data-id="${task.id}" title="Edit">✏️</button>
          <button class="task-btn task-btn-delete" data-id="${task.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="board-column" data-status="${key}">
      <h4>${title}</h4>
      <div class="board-list" data-status="${key}">${cards || '<div class="drop-target">Drop tasks here</div>'}</div>
    </div>
  `;
}

function setupDragAndDrop() {
  let draggedId = null;
  boardContainer.querySelectorAll('.draggable').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedId = parseInt(card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  boardContainer.querySelectorAll('.board-list').forEach(list => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (draggedId == null) return;
      const status = list.dataset.status;
      // WIP limit check
      if (status === 'in_progress') {
        const currentCount = tasks.filter(t => (t.status || (t.completed ? 'done':'todo')) === 'in_progress').length;
        if (currentCount >= WIP_LIMIT_IN_PROGRESS) {
          alert('WIP limit reached for In Progress');
          draggedId = null;
          return;
        }
      }
      const task = tasks.find(t => t.id === draggedId);
      if (task) {
        task.status = status;
        task.completed = status === 'done';
        // Recurrence on moving to done
        if (task.completed && task.recurrence && task.recurrence !== 'none' && task.dueDate) {
          const nextDate = nextRecurrenceDate(task.dueDate, task.recurrence);
          if (nextDate) {
            tasks.push({
              id: Date.now() + Math.floor(Math.random()*1000),
              name: task.name,
              description: task.description,
              priority: task.priority,
              project: task.project,
              dueDate: nextDate,
              status: 'todo',
              recurrence: task.recurrence,
              tags: task.tags || [],
              completed: false,
              createdAt: new Date().toISOString()
            });
          }
        }
        await saveData();
        renderBoard();
        renderStats();
      }
      draggedId = null;
    });
  });

  // Rebind edit/delete within board
  boardContainer.querySelectorAll('.task-btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (task) {
        editingId = task.id;
        taskInput.value = task.name;
        taskDescription.value = task.description || '';
        taskPriority.value = task.priority;
        taskProject.value = task.project;
        taskDueDate.value = task.dueDate || '';
        taskStatus.value = task.status || 'todo';
        taskRecurrence.value = task.recurrence || 'none';
        taskTags.value = (task.tags || []).join(', ');
        modalTitle.textContent = 'Edit Task';
        taskModal.style.display = 'flex';
      }
    });
  });
  boardContainer.querySelectorAll('.task-btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        await saveData();
        renderBoard();
        renderStats();
      }
    });
  });
}

// Calendar View Rendering
function renderCalendar() {
  emptyState.style.display = 'none';
  const base = new Date();
  base.setMonth(base.getMonth() + calendarMonthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const days = getMonthDays(year, month);

  const headerHtml = `
    <div class="calendar-header">
      <div>
        <button class="btn btn-secondary" id="cal-prev">Prev</button>
        <button class="btn btn-secondary" id="cal-next">Next</button>
      </div>
      <strong>${base.toLocaleString('en-US', { month: 'long' })} ${year}</strong>
      <span style="color: var(--text-muted);">Week starts Mon</span>
    </div>
  `;

  const gridHtml = days.map(d => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`;
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const tasksHtml = dayTasks.map(t => `<span class="calendar-task">${escapeHtml(t.name)}</span>`).join('');
    return `
      <div class="calendar-day">
        <div class="day-label">${d.day}</div>
        ${tasksHtml}
      </div>
    `;
  }).join('');

  calendarContainer.innerHTML = headerHtml + `<div class="calendar-grid">${gridHtml}</div>`;
  const prev = document.getElementById('cal-prev');
  const next = document.getElementById('cal-next');
  prev.addEventListener('click', () => { calendarMonthOffset -= 1; renderCalendar(); });
  next.addEventListener('click', () => { calendarMonthOffset += 1; renderCalendar(); });
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ day: d });
  }
  return days;
}

// Recurrence helper
function nextRecurrenceDate(dateStr, recurrence) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}
