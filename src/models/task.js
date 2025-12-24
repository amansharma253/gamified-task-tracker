import { toISODate } from '../utils/dates.js';

export function normalizeTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(t => t.trim()).filter(Boolean);
  return input.split(',').map(t => t.trim()).filter(Boolean);
}

export function createTask(payload, order = 0) {
  const nowIso = new Date().toISOString();
  return {
    id: payload.id || Date.now(),
    name: payload.name?.trim() || 'Untitled',
    description: payload.description?.trim() || '',
    priority: payload.priority || 'Medium',
    project: payload.project || 'personal',
    dueDate: payload.dueDate || null,
    status: payload.status || 'todo',
    recurrence: payload.recurrence || 'none',
    tags: normalizeTags(payload.tags),
    completed: payload.status === 'done' ? true : payload.completed || false,
    createdAt: payload.createdAt || nowIso,
    order
  };
}

export function updateTaskFromForm(task, payload) {
  task.name = payload.name?.trim() || task.name;
  task.description = payload.description?.trim() || '';
  task.priority = payload.priority || task.priority;
  task.project = payload.project || task.project;
  task.dueDate = payload.dueDate || null;
  task.status = payload.status || 'todo';
  task.recurrence = payload.recurrence || 'none';
  task.tags = normalizeTags(payload.tags);
  if (task.status === 'done') {
    task.completed = true;
  }
  return task;
}

export function parseQuickAdd(input) {
  const parts = input.split(/\s+/);
  let nameParts = [];
  let project = 'personal';
  let priority = 'Medium';
  let tags = [];
  let status = 'todo';
  let recurrence = 'none';
  let dueDate = null;

  parts.forEach((p) => {
    if (p.startsWith('#')) {
      const val = p.slice(1).toLowerCase();
      if (['work', 'personal', 'learning'].includes(val)) project = val;
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
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = toISODate(d);
    } else if (/^today$/i.test(p)) {
      dueDate = toISODate(new Date());
    } else if (/^next\s*week$/i.test(p)) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDate = toISODate(d);
    } else if (/^daily$|^weekly$|^monthly$/i.test(p)) {
      recurrence = p.toLowerCase();
    } else {
      nameParts.push(p);
    }
  });

  return createTask({
    name: nameParts.join(' ').trim() || 'Untitled',
    description: '',
    project,
    priority,
    tags,
    status,
    recurrence,
    dueDate
  });
}

export function nextRecurrenceDate(dateStr, recurrence) {
  if (!dateStr || recurrence === 'none') return null;
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    return toISODate(d);
  } catch (error) {
    console.error('Invalid recurrence date', error);
    return null;
  }
}
