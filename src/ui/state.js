import { initialGamification } from '../models/gamification.js';

const state = {
  tasks: [],
  filters: {
    project: 'all',
    view: 'all',
    sort: 'date',
    search: ''
  },
  ui: {
    darkMode: false,
    compact: false,
    editingId: null,
    calendarMonthOffset: 0,
    undoStack: [],
    selectionMode: false,
    selectedIds: []
  },
  gamification: null
};

export function loadState({ tasks = [], preferences = {}, gamification = null }) {
  state.tasks = tasks;
  state.ui.darkMode = Boolean(preferences.darkMode);
  state.ui.compact = Boolean(preferences.compactMode);
  state.gamification = initialGamification(gamification);
}

export function getState() {
  // Ensure gamification is initialized before first access
  if (!state.gamification) {
    state.gamification = initialGamification();
  }
  return state;
}

export function setTasks(tasks) {
  state.tasks = tasks;
}

export function upsertTask(task) {
  const idx = state.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) state.tasks[idx] = task;
  else state.tasks.push(task);
}

export function removeTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
}

export function setFilter(key, value) {
  state.filters[key] = value;
}

export function setSearch(value) {
  state.filters.search = value;
}

export function setSort(value) {
  state.filters.sort = value;
}

export function setEditing(id) {
  state.ui.editingId = id;
}

export function setDarkMode(enabled) {
  state.ui.darkMode = enabled;
}

export function setCompact(enabled) {
  state.ui.compact = enabled;
}

export function adjustCalendarOffset(delta) {
  state.ui.calendarMonthOffset += delta;
}

export function replaceGamification(next) {
  state.gamification = next;
}

export function pushUndo(item) {
  const stack = state.ui.undoStack;
  stack.unshift(item);
  if (stack.length > 5) stack.pop();
}

export function popUndo() {
  return state.ui.undoStack.shift();
}

export function hasUndo() {
  return state.ui.undoStack.length > 0;
}

export function setSelectionMode(enabled) {
  state.ui.selectionMode = Boolean(enabled);
  if (!enabled) state.ui.selectedIds = [];
}

export function toggleSelected(id) {
  const idx = state.ui.selectedIds.indexOf(id);
  if (idx >= 0) state.ui.selectedIds.splice(idx, 1);
  else state.ui.selectedIds.push(id);
}

export function clearSelected() {
  state.ui.selectedIds = [];
}

export function setSelected(ids) {
  state.ui.selectedIds = Array.from(new Set(ids));
}
