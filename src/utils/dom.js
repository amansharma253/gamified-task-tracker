export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function setVisible(el, visible) {
  if (!el) return;
  el.style.display = visible ? '' : 'none';
}

export function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

export function toggleClass(el, className, force) {
  if (!el) return;
  el.classList.toggle(className, force);
}

export function createEl(tag, options = {}) {
  const el = document.createElement(tag);
  const { className, text, html, attrs = {} } = options;
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (html) el.innerHTML = html;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      el.setAttribute(key, value);
    }
  });
  return el;
}

export function trapFocus(container, firstFocusable) {
  if (!container) return;
  const focusableSelectors = [
    'button', 'a[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'
  ];
  const focusables = qsa(focusableSelectors.join(','), container).filter(el => !el.disabled);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  (firstFocusable || first).focus();
}
