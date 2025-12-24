import { formatDate, isBeforeToday, todayISO } from '../utils/dates.js';
import { createEl, setText, setVisible } from '../utils/dom.js';

const WIP_LIMIT_IN_PROGRESS = 5;

export function renderView(state, refs) {
  if (!refs.taskList) return;
  const { filters } = state;
  const filtered = filterTasks(state);

  const isBoard = filters.view === 'board';
  const isCalendar = filters.view === 'calendar';

  setVisible(refs.taskList, !isBoard && !isCalendar);
  setVisible(refs.boardContainer, isBoard);
  setVisible(refs.calendarContainer, isCalendar);
  if (isBoard || isCalendar) {
    setVisible(refs.emptyState, false);
  }

  if (isBoard) {
    renderBoard(state, refs, filtered);
  } else if (isCalendar) {
    renderCalendar(state, refs);
  } else {
    renderList(state, refs, filtered);
  }
  renderStats(state, refs);
}

export function renderStats(state, refs) {
  const today = todayISO();
  const stats = {
    total: state.tasks.length,
    completed: state.tasks.filter((t) => t.completed).length,
    pending: state.tasks.filter((t) => !t.completed).length,
    overdue: state.tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length
  };
  setText(refs.statTotal, stats.total);
  setText(refs.statCompleted, stats.completed);
  setText(refs.statPending, stats.pending);
  setText(refs.statOverdue, stats.overdue);
}

export function renderList(state, refs, tasks) {
  const list = refs.taskList;
  if (!list) return;
  list.innerHTML = '';

  if (tasks.length === 0) {
    setVisible(refs.emptyState, true);
    return;
  }
  setVisible(refs.emptyState, false);

  const frag = document.createDocumentFragment();
  tasks.forEach((task) => {
    const isOverdue = task.dueDate && isBeforeToday(task.dueDate) && !task.completed;
    const status = task.status || (task.completed ? 'done' : 'todo');
    const isSelected = state.ui.selectedIds.includes(task.id);
    const li = createEl('li', { className: `task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}` });
    // Always set dataset id for inline editing support; enable drag only when manual sort
    li.dataset.id = String(task.id);
    if (state.filters.sort === 'manual') {
      li.setAttribute('draggable', 'true');
    }
    const tagsHtml = task.tags?.length
      ? `<div class="task-tags" title="Click to edit tags">${task.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '<div class="task-tags" title="Click to edit tags"></div>';
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" aria-label="Mark task complete" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-name" title="Double-click to edit name">${escapeHtml(task.name)}</div>
        <div class="task-meta">
          <span class="task-priority priority-${task.priority.toLowerCase()}" title="Click to change priority">${task.priority}</span>
          <span class="task-project">${task.project}</span>
          <span class="task-status">${status.replace('_', ' ')}</span>
          ${task.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}" title="Click to edit due date">📅 ${formatDate(task.dueDate)}</span>` : `<span class="task-due" title="Click to set due date"></span>`}
        </div>
        ${tagsHtml}
      </div>
      <div class="task-actions">
        ${state.filters.sort === 'manual' ? '<span class="drag-handle" title="Drag to reorder" aria-label="Reorder task"></span>' : ''}
        <button class="task-btn task-btn-edit" data-id="${task.id}" aria-label="Edit task">✏️</button>
        <button class="task-btn task-btn-delete" data-id="${task.id}" aria-label="Delete task">🗑️</button>
      </div>
    `;
    frag.appendChild(li);
  });
  list.appendChild(frag);
}

export function renderBoard(state, refs, tasks) {
  const byStatus = { todo: [], in_progress: [], done: [] };
  tasks.forEach((t) => {
    const status = t.status || (t.completed ? 'done' : 'todo');
    if (!byStatus[status]) byStatus.todo.push(t);
    else byStatus[status].push(t);
  });

  refs.boardContainer.innerHTML = `
    ${renderBoardColumn(`To Do (${byStatus.todo.length})`, 'todo', byStatus.todo)}
    ${renderBoardColumn(`In Progress (${byStatus.in_progress.length}/${WIP_LIMIT_IN_PROGRESS})`, 'in_progress', byStatus.in_progress)}
    ${renderBoardColumn(`Done (${byStatus.done.length})`, 'done', byStatus.done)}
  `;
}

function renderBoardColumn(title, key, items) {
  const cards = items.map((task) => {
    const isOverdue = task.dueDate && isBeforeToday(task.dueDate) && !task.completed;
    const tagsHtml = task.tags?.length
      ? `<div class="task-tags">${task.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
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
          <button class="task-btn task-btn-edit" data-id="${task.id}" aria-label="Edit task">✏️</button>
          <button class="task-btn task-btn-delete" data-id="${task.id}" aria-label="Delete task">🗑️</button>
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

export function renderCalendar(state, refs) {
  const base = new Date();
  base.setMonth(base.getMonth() + state.ui.calendarMonthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const days = getMonthDays(year, month);

  const headerHtml = `
    <div class="calendar-header">
      <div>
        <button class="btn btn-secondary" id="cal-prev" aria-label="Previous month">Prev</button>
        <button class="btn btn-secondary" id="cal-next" aria-label="Next month">Next</button>
      </div>
      <strong>${base.toLocaleString('en-US', { month: 'long' })} ${year}</strong>
      <span class="muted">Week starts Mon</span>
    </div>
  `;

  const gridHtml = days.map((d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    const dayTasks = state.tasks.filter((t) => t.dueDate === dateStr);
    const tasksHtml = dayTasks.map((t) => `<span class="calendar-task">${escapeHtml(t.name)}</span>`).join('');
    return `
      <div class="calendar-day">
        <div class="day-label">${d.day}</div>
        ${tasksHtml}
      </div>
    `;
  }).join('');

  refs.calendarContainer.innerHTML = headerHtml + `<div class="calendar-grid">${gridHtml}</div>`;
}

export function renderAnalytics(state, refs) {
  const { tasks, gamification } = state;
  const stats = basicStats(state);
  const completionRate = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  setText(refs.analytics.completionRate, `${completionRate}%`);

  const priorityScore = tasks.reduce((sum, t) => {
    if (!t.completed) return sum;
    if (t.priority === 'High') return sum + 30;
    if (t.priority === 'Medium') return sum + 20;
    return sum + 10;
  }, 0);
  const productivityScore = Math.min(100, Math.round(completionRate * 0.6 + Math.min(priorityScore / 10, 40)));
  setText(refs.analytics.productivityScore, productivityScore);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const tasksThisWeek = tasks.filter((t) => new Date(t.createdAt) >= weekAgo).length;
  setText(refs.analytics.tasksWeek, tasksThisWeek);

  const pendingTasks = tasks.filter((t) => !t.completed);
  if (pendingTasks.length > 0) {
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    const avgPriority = pendingTasks.reduce((sum, t) => sum + priorityMap[t.priority], 0) / pendingTasks.length;
    const avgLabel = avgPriority >= 2.5 ? 'High' : avgPriority >= 1.5 ? 'Medium' : 'Low';
    setText(refs.analytics.avgPriority, avgLabel);
  } else {
    setText(refs.analytics.avgPriority, '-');
  }

  renderTopTags(tasks, refs.analytics.topTags);
  renderProjectBreakdown(tasks, refs.analytics.projectBreakdown);
  renderGamification(gamification, refs.analytics.gamification);
}

function renderGamification(gamification, container) {
  if (!container) return;
  container.innerHTML = `
    <div class="badge">XP: ${gamification.xp}</div>
    <div class="badge">Level: ${gamification.level}</div>
    <div class="badge">Streak: ${gamification.streak} day${gamification.streak === 1 ? '' : 's'}</div>
    <div class="badge">Badges: ${gamification.badges.length ? gamification.badges.join(', ') : 'None yet'}</div>
    <div class="badge">Weekly quest: ${gamification.challenges.weeklyHighPriority.progress}/${gamification.challenges.weeklyHighPriority.target} high-priority tasks</div>
  `;
}

function renderTopTags(tasks, container) {
  const tagFreq = {};
  tasks.forEach((t) => {
    (t.tags || []).forEach((tag) => {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  container.innerHTML = topTags.length
    ? topTags.map(([tag, count]) => `<div class="tag-item"><span class="tag-label">${escapeHtml(tag)}</span><span class="tag-count">${count}</span></div>`).join('')
    : '<p class="muted">No tags yet</p>';
}

function renderProjectBreakdown(tasks, container) {
  const projectBreakdown = {};
  tasks.forEach((t) => {
    projectBreakdown[t.project] = (projectBreakdown[t.project] || 0) + 1;
  });
  container.innerHTML = Object.entries(projectBreakdown)
    .map(([project, count]) => `<div class="breakdown-item"><span class="project-label">${project}</span><span class="breakdown-count">${count}</span></div>`)
    .join('');
}

function basicStats(state) {
  const today = todayISO();
  return {
    total: state.tasks.length,
    completed: state.tasks.filter((t) => t.completed).length,
    pending: state.tasks.filter((t) => !t.completed).length,
    overdue: state.tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length
  };
}

function filterTasks(state) {
  const { filters } = state;
  let filtered = [...state.tasks];

  if (filters.project !== 'all') {
    filtered = filtered.filter((t) => t.project === filters.project);
  }

  if (filters.view === 'today') {
    filtered = filtered.filter((t) => t.dueDate === todayISO() && !t.completed);
  } else if (filters.view === 'pending') {
    filtered = filtered.filter((t) => !t.completed);
  } else if (filters.view === 'completed') {
    filtered = filtered.filter((t) => t.completed);
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query));
  }

  filtered.sort((a, b) => {
    if (filters.sort === 'date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (filters.sort === 'priority') {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (filters.sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (filters.sort === 'manual') {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    }
    return 0;
  });

  return filtered;
}

function getMonthDays(year, month) {
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ day: d });
  }
  return days;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
