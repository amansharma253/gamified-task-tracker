import { loadAppData, persistGamification, persistPreferences, persistTasks } from './data/storage.js';
import { applyCompletion, initialGamification } from './models/gamification.js';
import { createTask, nextRecurrenceDate, parseQuickAdd, updateTaskFromForm } from './models/task.js';
import { renderAnalytics, renderView } from './ui/renderers.js';
import { adjustCalendarOffset, getState, loadState, removeTask, replaceGamification, setCompact, setDarkMode, setEditing, setFilter, setSearch, setSort, setTasks, upsertTask, pushUndo, popUndo, hasUndo, setSelectionMode, toggleSelected, clearSelected, setSelected } from './ui/state.js';
import { initOnboarding } from './ui/onboarding.js';
import { todayISO } from './utils/dates.js';
import { qsa, qs, setText, toggleClass, trapFocus } from './utils/dom.js';
import { showSuccess, showError, showInfo, showAction } from './utils/toast.js';

const state = getState();
let dragSourceId = null;
let refs = {};

const preferences = {
  darkMode: false,
  compactMode: false,
  onboardingSeen: false,
  lastProject: 'personal',
  sidebarCollapsed: false
};

function initRefs() {
  refs = {
    sidebar: qs('.sidebar'),
    taskForm: qs('#task-form'),
    taskModal: qs('#task-modal'),
    modalTitle: qs('#modal-title'),
    taskInputs: {
      name: qs('#task-name'),
      description: qs('#task-description'),
      priority: qs('#task-priority'),
      project: qs('#task-project'),
      dueDate: qs('#task-due-date'),
      status: qs('#task-status'),
      recurrence: qs('#task-recurrence'),
      tags: qs('#task-tags')
    },
    errors: {
      name: qs('#task-name-error')
    },
    taskList: qs('#task-list'),
    boardContainer: qs('#board-container'),
    calendarContainer: qs('#calendar-container'),
    emptyState: qs('#empty-state'),
    searchInput: qs('#search-input'),
    addTaskBtn: qs('#add-task-btn'),
    sidebarToggle: qs('#sidebar-toggle'),
    closeModalBtn: qs('#close-modal'),
    cancelBtn: qs('#cancel-btn'),
    themeToggle: qs('#theme-toggle'),
    projectBtns: qsa('.project-btn'),
    viewBtns: qsa('.view-btn'),
    sortBtns: qsa('.sort-btn'),
    // Batch selection controls
    selectModeToggle: qs('#select-mode-toggle'),
    selectAllBtn: qs('#select-all'),
    clearSelectionBtn: qs('#clear-selection'),
    bulkCompleteBtn: qs('#bulk-complete'),
    bulkDeleteBtn: qs('#bulk-delete'),
    viewTitle: qs('#view-title'),
    viewSubtitle: qs('#view-subtitle'),
    analyticsBtn: qs('#analytics-btn'),
    analyticsModal: qs('#analytics-modal'),
    closeAnalyticsBtn: qs('#close-analytics'),
    exportBtn: qs('#export-btn'),
    importBtn: qs('#import-btn'),
    importFile: qs('#import-file'),
    quickAddInput: qs('#quick-add-input'),
    quickAddBtn: qs('#quick-add-btn'),
    densityToggle: qs('#density-toggle'),
    analytics: {
      completionRate: qs('#completion-rate'),
      productivityScore: qs('#productivity-score'),
      tasksWeek: qs('#tasks-week'),
      avgPriority: qs('#avg-priority'),
      topTags: qs('#top-tags'),
      projectBreakdown: qs('#project-breakdown'),
      gamification: qs('#gamification-summary')
    },
    statTotal: qs('#stat-total'),
    statCompleted: qs('#stat-completed'),
    statPending: qs('#stat-pending'),
    statOverdue: qs('#stat-overdue'),
    onboardingComplete: () => {
      preferences.onboardingSeen = true;
      persistPreferences(preferences);
    }
  };
}

async function init() {
  initRefs();
  const { tasks, preferences: savedPrefs, gamification } = await loadAppData();
  Object.assign(preferences, savedPrefs);
  loadState({ tasks, preferences: savedPrefs, gamification: gamification || initialGamification() });
  applyUiPreferences();
  ensureOrders();
  renderViewWithTitle();
  bindEvents();
  initOnboarding(preferences, refs);
}

function bindEvents() {
  refs.addTaskBtn?.addEventListener('click', () => openTaskModal());
  
  // Empty state CTA
  const emptyStateCta = qs('#empty-state-cta');
  emptyStateCta?.addEventListener('click', () => openTaskModal());
  
  refs.closeModalBtn?.addEventListener('click', closeTaskModal);
    // Batch selection handlers
    refs.selectModeToggle?.addEventListener('click', () => {
      const next = !state.ui.selectionMode;
      setSelectionMode(next);
      refs.selectModeToggle.textContent = next ? 'Selecting…' : 'Select';
      renderViewWithTitle();
    });
    refs.selectAllBtn?.addEventListener('click', () => {
      const visible = qsa('.task-item').map((li) => Number(li.dataset.id));
      setSelected(visible);
      renderViewWithTitle();
    });
    refs.clearSelectionBtn?.addEventListener('click', () => {
      clearSelected();
      renderViewWithTitle();
    });
    refs.bulkCompleteBtn?.addEventListener('click', async () => {
      const ids = state.ui.selectedIds.slice();
      if (ids.length === 0) return;
      state.tasks.forEach((t) => {
        if (ids.includes(t.id)) {
          t.completed = true;
          t.status = 'done';
        }
      });
      await persistTasks(state.tasks);
      clearSelected();
      renderViewWithTitle();
      showSuccess('Selected tasks marked complete');
    });
    refs.bulkDeleteBtn?.addEventListener('click', async () => {
      const ids = state.ui.selectedIds.slice();
      if (ids.length === 0) return;
      const deleted = state.tasks.filter((t) => ids.includes(t.id));
      state.tasks = state.tasks.filter((t) => !ids.includes(t.id));
      await persistTasks(state.tasks);
      clearSelected();
      renderViewWithTitle();
      pushUndo({ type: 'bulk-delete', tasks: deleted });
      showAction('Deleted selected tasks', 'Undo', async () => {
        const payload = popUndo();
        if (!payload || payload.type !== 'bulk-delete') return;
        payload.tasks.forEach((t) => upsertTask(t));
        await persistTasks(state.tasks);
        renderViewWithTitle();
        showInfo('Bulk deletion undone');
      }, 'error');
    });
  refs.cancelBtn?.addEventListener('click', closeTaskModal);
  refs.taskModal?.addEventListener('click', (e) => {
    if (e.target === refs.taskModal) closeTaskModal();
  });
  refs.taskForm?.addEventListener('submit', handleTaskSubmit);

  // Auto-capitalize task name on blur
  refs.taskInputs.name?.addEventListener('blur', () => {
    const v = refs.taskInputs.name.value;
    if (v && v.length > 0) {
      refs.taskInputs.name.value = v.charAt(0).toUpperCase() + v.slice(1);
    }
  });

  // Quick date buttons
  const quickDateButtons = qsa('.quick-date-btn');
  const dueInput = refs.taskInputs.dueDate;
  quickDateButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days, 10);
      if (btn.id === 'clear-due-date') {
        dueInput.value = '';
        quickDateButtons.forEach((b) => b.classList.remove('active'));
        return;
      }
      const date = new Date();
      date.setDate(date.getDate() + days);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      dueInput.value = `${yyyy}-${mm}-${dd}`;
      quickDateButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  refs.searchInput?.addEventListener('input', (e) => {
    setSearch(e.target.value);
    renderViewWithTitle();
  });

  refs.projectBtns.forEach((btn) => btn.addEventListener('click', () => {
    refs.projectBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setFilter('project', btn.dataset.project);
    setFilter('view', 'all');
    clearActive(refs.viewBtns);
    renderViewWithTitle();
  }));

  refs.viewBtns.forEach((btn) => btn.addEventListener('click', () => {
    clearActive(refs.viewBtns);
    btn.classList.add('active');
    setFilter('view', btn.dataset.view);
    renderViewWithTitle();
  }));

  refs.sortBtns.forEach((btn) => btn.addEventListener('click', () => {
    clearActive(refs.sortBtns);
    btn.classList.add('active');
    setSort(btn.dataset.sort);
    renderViewWithTitle();
  }));

  refs.themeToggle?.addEventListener('click', async () => {
    preferences.darkMode = !preferences.darkMode;
    setDarkMode(preferences.darkMode);
    applyUiPreferences();
    await persistPreferences(preferences);
  });

  refs.densityToggle?.addEventListener('click', async () => {
    preferences.compactMode = !preferences.compactMode;
    setCompact(preferences.compactMode);
    applyUiPreferences();
    refs.densityToggle.textContent = preferences.compactMode ? 'Comfortable' : 'Compact';
    await persistPreferences(preferences);
  });

  // Sidebar collapse toggle
  refs.sidebarToggle?.addEventListener('click', async () => {
    preferences.sidebarCollapsed = !preferences.sidebarCollapsed;
    applyUiPreferences();
    await persistPreferences(preferences);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openTaskModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      performUndo();
    }
    // Ctrl/Cmd+A: Select all in selection mode
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && state.ui.selectionMode) {
      e.preventDefault();
      const visible = qsa('.task-item').map((li) => Number(li.dataset.id));
      setSelected(visible);
      renderViewWithTitle();
    }
    if (e.key === '?' || (e.shiftKey && e.key === '?')) {
      e.preventDefault();
      openShortcuts();
    }
    if (e.key === 'Escape') {
      closeTaskModal();
      closeAnalytics();
      closeShortcuts();
    }
  });

  refs.taskList?.addEventListener('change', handleListChange);
  refs.taskList?.addEventListener('click', handleListClick);
  // Toggle selection on item click in selection mode
  refs.taskList?.addEventListener('click', (e) => {
    if (!state.ui.selectionMode) return;
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (!id) return;
    toggleSelected(id);
    renderViewWithTitle();
  });
  refs.taskList?.addEventListener('dblclick', handleListDblClick);
  refs.taskList?.addEventListener('dragstart', handleDragStart);
  refs.taskList?.addEventListener('dragover', (e) => e.preventDefault());
  refs.taskList?.addEventListener('drop', handleDrop);

  refs.analyticsBtn?.addEventListener('click', () => {
    renderAnalytics(state, refs);
    openAnalytics();
  });
  refs.closeAnalyticsBtn?.addEventListener('click', closeAnalytics);
  refs.analyticsModal?.addEventListener('click', (e) => {
    if (e.target === refs.analyticsModal) closeAnalytics();
  });

  // Shortcuts modal listeners
  const closeShortcutsBtn = qs('#close-shortcuts');
  closeShortcutsBtn?.addEventListener('click', closeShortcuts);
  const shortcutsModal = qs('#shortcuts-modal');
  shortcutsModal?.addEventListener('click', (e) => {
    if (e.target === shortcutsModal) closeShortcuts();
  });
  refs.exportBtn?.addEventListener('click', exportTasks);
  refs.importBtn?.addEventListener('click', () => refs.importFile?.click());
  refs.importFile?.addEventListener('change', importTasks);

  refs.quickAddBtn?.addEventListener('click', handleQuickAdd);
  refs.quickAddInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleQuickAdd();
  });

  refs.boardContainer?.addEventListener('dragstart', handleBoardDragStart);
  refs.boardContainer?.addEventListener('dragover', (e) => e.preventDefault());
  refs.boardContainer?.addEventListener('drop', handleBoardDrop);
  refs.boardContainer?.addEventListener('click', handleBoardClick);

  refs.calendarContainer?.addEventListener('click', handleCalendarNav);
}

function applyUiPreferences() {
  document.body.classList.toggle('dark-mode', preferences.darkMode);
  document.body.classList.toggle('compact', preferences.compactMode);
  if (refs.sidebar) {
    refs.sidebar.classList.toggle('collapsed', preferences.sidebarCollapsed);
  }
  if (refs.themeToggle) {
    refs.themeToggle.textContent = preferences.darkMode ? '☀️' : '🌙';
    refs.themeToggle.setAttribute('aria-pressed', String(preferences.darkMode));
  }
  if (refs.densityToggle) {
    refs.densityToggle.textContent = preferences.compactMode ? 'Comfortable' : 'Compact';
    refs.densityToggle.setAttribute('aria-pressed', String(preferences.compactMode));
  }
  if (refs.sidebarToggle) {
    refs.sidebarToggle.setAttribute('aria-pressed', String(preferences.sidebarCollapsed));
  }
}

function renderViewWithTitle() {
  const titles = {
    all: 'All Tasks',
    today: 'Today',
    pending: 'Pending Tasks',
    completed: 'Completed Tasks',
    board: 'Board',
    calendar: 'Calendar'
  };
  setText(refs.viewTitle, titles[state.filters.view] || 'All Tasks');
  renderView(state, refs);
}

function openTaskModal(task = null) {
  clearValidation();
  refs.taskForm.reset();
  if (task) {
    setEditing(task.id);
    refs.modalTitle.textContent = 'Edit Task';
    refs.taskInputs.name.value = task.name;
    refs.taskInputs.description.value = task.description || '';
    refs.taskInputs.priority.value = task.priority;
    refs.taskInputs.project.value = task.project;
    refs.taskInputs.dueDate.value = task.dueDate || '';
    refs.taskInputs.status.value = task.status || (task.completed ? 'done' : 'todo');
    refs.taskInputs.recurrence.value = task.recurrence || 'none';
    refs.taskInputs.tags.value = (task.tags || []).join(', ');
  } else {
    setEditing(null);
    refs.modalTitle.textContent = 'New Task';
    refs.taskInputs.project.value = preferences.lastProject || 'personal';
    refs.taskInputs.priority.value = 'Medium';
    refs.taskInputs.status.value = 'todo';
  }
  refs.taskModal.style.display = 'flex';
  trapFocus(refs.taskModal, refs.taskInputs.name);
}

function closeTaskModal() {
  refs.taskModal.style.display = 'none';
  setEditing(null);
}

function clearValidation() {
  refs.errors.name.textContent = '';
  refs.taskInputs.name.setAttribute('aria-invalid', 'false');
}

function validateTaskForm() {
  const name = refs.taskInputs.name.value.trim();
  if (!name) {
    refs.errors.name.textContent = 'Task name is required.';
    refs.taskInputs.name.setAttribute('aria-invalid', 'true');
    refs.taskInputs.name.focus();
    return false;
  }
  clearValidation();
  return true;
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  if (!validateTaskForm()) return;
  const payload = {
    name: refs.taskInputs.name.value,
    description: refs.taskInputs.description.value,
    priority: refs.taskInputs.priority.value,
    project: refs.taskInputs.project.value,
    dueDate: refs.taskInputs.dueDate.value || null,
    status: refs.taskInputs.status.value,
    recurrence: refs.taskInputs.recurrence.value,
    tags: refs.taskInputs.tags.value
  };

  if (state.ui.editingId) {
    const existing = state.tasks.find((t) => t.id === state.ui.editingId);
    if (existing) {
      const wasCompleted = existing.completed;
      updateTaskFromForm(existing, payload);
      upsertTask(existing);
      if (!wasCompleted && existing.completed) {
        replaceGamification(applyCompletion(state.gamification, existing));
        await persistGamification(state.gamification);
      }
    }
  } else {
    const task = createTask(payload, nextOrderValue());
    upsertTask(task);
  }

  await persistTasks(state.tasks);
  // Remember last selected project for smart default
  preferences.lastProject = refs.taskInputs.project.value;
  await persistPreferences(preferences);
  renderViewWithTitle();
  closeTaskModal();
  showSuccess('Task saved successfully!');
}

async function handleListChange(e) {
  if (!e.target.classList.contains('task-checkbox')) return;
  const id = Number(e.target.dataset.id);
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = e.target.checked;
  task.status = task.completed ? 'done' : (task.status === 'done' ? 'todo' : task.status || 'todo');
  if (task.completed) {
    replaceGamification(applyCompletion(state.gamification, task));
    await persistGamification(state.gamification);
    maybeGenerateRecurrence(task);
  }
  await persistTasks(state.tasks);
  renderViewWithTitle();
}

async function handleListClick(e) {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains('task-btn-edit')) {
    const task = state.tasks.find((t) => t.id === id);
    if (task) openTaskModal(task);
  }
  // Inline priority change: cycle Low → Medium → High
  const prioEl = e.target.closest('.task-priority');
  if (prioEl && prioEl.classList.contains('task-priority')) {
    const li = prioEl.closest('.task-item');
    if (!li) return;
    const tid = Number(li.dataset.id);
    const task = state.tasks.find((t) => t.id === tid);
    if (!task) return;
    const order = ['Low', 'Medium', 'High'];
    const idx = order.indexOf(task.priority);
    const next = order[(idx + 1) % order.length];
    task.priority = next;
    await persistTasks(state.tasks);
    renderViewWithTitle();
  }
  // Inline due date editing
  const dueEl = e.target.closest('.task-due');
  if (dueEl) {
    const li = dueEl.closest('.task-item');
    if (li) {
      const tid = Number(li.dataset.id);
      const task = state.tasks.find((t) => t.id === tid);
      if (task) editDueInline(dueEl, task);
    }
    return;
  }
  // Inline tags editing
  const tagsEl = e.target.closest('.task-tags');
  if (tagsEl) {
    const li = tagsEl.closest('.task-item');
    if (li) {
      const tid = Number(li.dataset.id);
      const task = state.tasks.find((t) => t.id === tid);
      if (task) editTagsInline(tagsEl, task);
    }
    return;
  }
  if (e.target.classList.contains('task-btn-delete')) {
    if (confirm('Delete this task?')) {
      const deleted = state.tasks.find((t) => t.id === id);
      if (!deleted) return;
      removeTask(id);
      await persistTasks(state.tasks);
      renderViewWithTitle();
      pushUndo({ type: 'delete-task', task: deleted });
      showAction('Task deleted', 'Undo', async () => {
        const payload = popUndo();
        if (!payload || payload.type !== 'delete-task') return;
        upsertTask(payload.task);
        await persistTasks(state.tasks);
        renderViewWithTitle();
        showInfo('Deletion undone');
      }, 'error');
    }
  }
}

function handleListDblClick(e) {
  const nameEl = e.target.closest('.task-name');
  if (!nameEl) return;
  const li = nameEl.closest('.task-item');
  if (!li) return;
  const tid = Number(li.dataset.id);
  const task = getState().tasks.find((t) => t.id === tid);
  if (!task) return;
  const original = task.name;
  nameEl.setAttribute('contenteditable', 'true');
  nameEl.focus();
  // Place cursor at end
  const range = document.createRange();
  range.selectNodeContents(nameEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = async (save) => {
    nameEl.removeAttribute('contenteditable');
    nameEl.removeEventListener('blur', onBlur);
    nameEl.removeEventListener('keydown', onKey);
    if (save) {
      const newName = nameEl.textContent.trim();
      if (newName && newName !== original) {
        task.name = newName;
        await persistTasks(getState().tasks);
        renderViewWithTitle();
        showSuccess('Task updated');
      } else {
        nameEl.textContent = original;
      }
    } else {
      nameEl.textContent = original;
    }
  };

  const onBlur = () => finish(true);
  const onKey = (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      finish(true);
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      finish(false);
    }
  };

  nameEl.addEventListener('blur', onBlur);
  nameEl.addEventListener('keydown', onKey);
}

function handleDragStart(e) {
  const li = e.target.closest('.task-item');
  if (!li) return;
  dragSourceId = Number(li.dataset.id);
}

async function handleDrop(e) {
  e.preventDefault();
  if (dragSourceId == null) return;
  const targetLi = e.target.closest('.task-item');
  if (!targetLi) return;
  reorderTasks(dragSourceId, Number(targetLi.dataset.id));
  dragSourceId = null;
  await persistTasks(state.tasks);
  renderViewWithTitle();
}

function reorderTasks(sourceId, targetId) {
  ensureOrders();
  const src = state.tasks.find((t) => t.id === sourceId);
  const tgt = state.tasks.find((t) => t.id === targetId);
  if (!src || !tgt) return;
  const srcOrder = src.order;
  const tgtOrder = tgt.order;
  state.tasks.forEach((t) => {
    if (t.id === sourceId) return;
    if (srcOrder < tgtOrder && t.order > srcOrder && t.order <= tgtOrder) t.order -= 1;
    else if (srcOrder > tgtOrder && t.order < srcOrder && t.order >= tgtOrder) t.order += 1;
  });
  src.order = tgtOrder;
}

function ensureOrders() {
  let i = 1;
  state.tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach((t) => { t.order = i++; });
}

function nextOrderValue() {
  const max = state.tasks.reduce((m, t) => Math.max(m, t.order ?? 0), 0);
  return max + 1;
}

function handleBoardDragStart(e) {
  const card = e.target.closest('.draggable');
  if (!card) return;
  dragSourceId = Number(card.dataset.id);
}

async function handleBoardDrop(e) {
  e.preventDefault();
  if (dragSourceId == null) return;
  const list = e.target.closest('.board-list');
  if (!list) return;
  const status = list.dataset.status;
  const task = state.tasks.find((t) => t.id === dragSourceId);
  if (!task) return;
  if (status === 'in_progress') {
    const currentCount = state.tasks.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) === 'in_progress').length;
    if (currentCount >= 5) {
      alert('WIP limit reached for In Progress');
      dragSourceId = null;
      return;
    }
  }
  task.status = status;
  task.completed = status === 'done';
  if (task.completed) {
    replaceGamification(applyCompletion(state.gamification, task));
    await persistGamification(state.gamification);
    maybeGenerateRecurrence(task);
  }
  await persistTasks(state.tasks);
  renderViewWithTitle();
  dragSourceId = null;
}

async function handleBoardClick(e) {
  const id = Number(e.target.dataset.id);
  if (e.target.classList.contains('task-btn-edit')) {
    const task = state.tasks.find((t) => t.id === id);
    if (task) openTaskModal(task);
  }
  if (e.target.classList.contains('task-btn-delete')) {
    if (confirm('Delete this task?')) {
      const deleted = state.tasks.find((t) => t.id === id);
      if (!deleted) return;
      removeTask(id);
      await persistTasks(state.tasks);
      renderViewWithTitle();
      pushUndo({ type: 'delete-task', task: deleted });
      showAction('Task deleted', 'Undo', async () => {
        const payload = popUndo();
        if (!payload || payload.type !== 'delete-task') return;
        upsertTask(payload.task);
        await persistTasks(state.tasks);
        renderViewWithTitle();
        showInfo('Deletion undone');
      }, 'error');
    }
  }
}

function handleCalendarNav(e) {
  if (e.target.id === 'cal-prev') {
    adjustCalendarOffset(-1);
    renderViewWithTitle();
  }
  if (e.target.id === 'cal-next') {
    adjustCalendarOffset(1);
    renderViewWithTitle();
  }
}

async function handleQuickAdd() {
  const text = refs.quickAddInput.value.trim();
  if (!text) {
    showError('Task name cannot be empty');
    return;
  }
  const task = parseQuickAdd(text);
  task.order = nextOrderValue();
  upsertTask(task);
  refs.quickAddInput.value = '';
  await persistTasks(state.tasks);
  renderViewWithTitle();
  showSuccess(`Task "${task.name}" added!`);
}

async function exportTasks() {
  const backup = {
    app: 'TaskPro',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    preferences: { ...preferences },
    gamification: state.gamification
  };
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `taskpro-backup-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importTasks(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (state.tasks.length > 0) {
      const ok = confirm('Importing a backup will replace your current tasks. Continue?');
      if (!ok) return;
    }

    const text = await file.text();
    const imported = JSON.parse(text);

    // Backwards compatibility:
    // - legacy exports were a raw array of tasks
    // - new exports are a "backup" object with { tasks, preferences, gamification }
    const tasks = Array.isArray(imported) ? imported : imported?.tasks;
    if (!Array.isArray(tasks)) {
      alert(
        "That file doesn't look like a TaskPro backup.\n\n" +
          'Tip: Use the ⬇️ button to Export a backup first, then import that file here.'
      );
      return;
    }

    const validTasks = tasks.filter((t) => t && typeof t === 'object' && typeof t.name === 'string' && t.name.trim().length > 0);
    if (validTasks.length === 0) {
      alert(
        "We couldn't find any tasks in that file.\n\n" +
          'Please pick a backup file you exported from TaskPro.'
      );
      return;
    }

    const importedPrefs = imported && !Array.isArray(imported) && typeof imported.preferences === 'object' && imported.preferences
      ? imported.preferences
      : {};
    const mergedPrefs = { ...preferences, ...importedPrefs };
    Object.assign(preferences, mergedPrefs);

    loadState({
      tasks: validTasks,
      preferences: mergedPrefs,
      gamification: imported && !Array.isArray(imported) ? imported.gamification : null
    });

    applyUiPreferences();
    ensureOrders();
    await persistTasks(state.tasks);
    await persistPreferences(preferences);
    await persistGamification(state.gamification);
    renderViewWithTitle();
    alert(`Imported ${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'} successfully.`);
  } catch (error) {
    alert(
      "We couldn't import that file.\n\n" +
        'Make sure you selected a TaskPro backup file (exported using ⬇️).'
    );
  }
  event.target.value = '';
}

function openAnalytics() {
  refs.analyticsModal.style.display = 'flex';
  trapFocus(refs.analyticsModal, refs.closeAnalyticsBtn);
}

function closeAnalytics() {
  refs.analyticsModal.style.display = 'none';
}

function openShortcuts() {
  const modal = qs('#shortcuts-modal');
  if (modal) modal.style.display = 'flex';
}

function closeShortcuts() {
  const modal = qs('#shortcuts-modal');
  if (modal) modal.style.display = 'none';
}

function clearActive(btns) {
  btns.forEach((b) => b.classList.remove('active'));
}

function editDueInline(dueEl, task) {
  if (dueEl.dataset.editing === 'true') return;
  dueEl.dataset.editing = 'true';
  const input = document.createElement('input');
  input.type = 'date';
  input.className = 'inline-edit-date';
  input.value = task.dueDate || '';
  // Replace content
  dueEl.innerHTML = '';
  dueEl.appendChild(input);
  input.focus();
  const save = async () => {
    task.dueDate = input.value || null;
    await persistTasks(state.tasks);
    renderViewWithTitle();
    showSuccess('Due date updated');
  };
  const cancel = () => {
    renderViewWithTitle();
  };
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      save();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    }
  });
  input.addEventListener('blur', save);
}

function editTagsInline(tagsEl, task) {
  if (tagsEl.dataset.editing === 'true') return;
  tagsEl.dataset.editing = 'true';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-tags';
  input.placeholder = 'tag1, tag2';
  input.value = (task.tags || []).join(', ');
  tagsEl.innerHTML = '';
  tagsEl.appendChild(input);
  input.focus();
  const parseTags = (value) => value.split(',').map((t) => t.trim()).filter(Boolean);
  const save = async () => {
    task.tags = parseTags(input.value);
    await persistTasks(state.tasks);
    renderViewWithTitle();
    showSuccess('Tags updated');
  };
  const cancel = () => {
    renderViewWithTitle();
  };
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      save();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    }
  });
  input.addEventListener('blur', save);
}

function maybeGenerateRecurrence(task) {
  if (!task.recurrence || task.recurrence === 'none' || !task.dueDate) return;
  const nextDate = nextRecurrenceDate(task.dueDate, task.recurrence);
  if (!nextDate) return;
  const nextTask = createTask({ ...task, id: Date.now() + Math.floor(Math.random() * 1000), status: 'todo', completed: false, dueDate: nextDate }, nextOrderValue());
  upsertTask(nextTask);
}

async function performUndo() {
  const payload = popUndo();
  if (!payload) {
    showInfo('Nothing to undo');
    return;
  }
  if (payload.type === 'delete-task') {
    upsertTask(payload.task);
    await persistTasks(state.tasks);
    renderViewWithTitle();
    showSuccess('Undo: task restored');
    return;
  }
  showInfo('Nothing to undo');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
