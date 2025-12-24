/**
 * Toast Notification System
 * Provides user feedback for actions (success, error, info)
 */

export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  
  // Add emoji based on type
  const emoji = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span>${emoji}</span><span>${message}</span>`;
  
  container.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

export function showSuccess(message, duration = 2500) {
  return showToast(message, 'success', duration);
}

export function showError(message, duration = 4000) {
  return showToast(message, 'error', duration);
}

export function showInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

/**
 * Show a toast with an action button (e.g., Undo)
 * onClick will be called when the action button is pressed.
 */
export function showAction(message, actionLabel, onClick, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');

  const emoji = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const msgSpan = document.createElement('span');
  msgSpan.textContent = `${emoji} ${message}`;
  const btn = document.createElement('button');
  btn.className = 'toast-action';
  btn.type = 'button';
  btn.textContent = actionLabel;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    try { onClick?.(); } finally {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  });

  toast.appendChild(msgSpan);
  toast.appendChild(btn);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  return toast;
}
