const HINTS = [
  { target: '#add-task-btn', text: 'Create your first task. Shortcut: Cmd/Ctrl + K.' },
  { target: '#quick-add-input', text: 'Use quick add syntax: #project !high @tag tomorrow.' },
  { target: '#select-mode-toggle', text: 'Batch actions: toggle Select, then click tasks.' },
  { target: '#export-btn', text: 'Export a backup regularly. Import when switching devices.' },
  { target: 'body', text: 'Undo deletions via toast action or Cmd/Ctrl + Z.' }
];

export function initOnboarding(preferences, refs) {
  if (preferences.onboardingSeen) return;
  let step = 0;
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const tooltip = document.createElement('div');
  tooltip.className = 'onboarding-tooltip';
  const actions = document.createElement('div');
  actions.className = 'onboarding-actions';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-primary';
  nextBtn.id = 'onboarding-next';
  nextBtn.textContent = 'Next';
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn btn-secondary';
  skipBtn.id = 'onboarding-skip';
  skipBtn.textContent = 'Skip';
  actions.appendChild(nextBtn);
  actions.appendChild(skipBtn);
  overlay.appendChild(tooltip);
  overlay.appendChild(actions);
  document.body.appendChild(overlay);

  const showStep = (i) => {
    const hint = HINTS[i];
    const target = document.querySelector(hint.target);
    const rect = target ? target.getBoundingClientRect() : { top: 80, left: 80 };
    tooltip.innerHTML = `<div class="onboarding-progress">Step ${i + 1} of ${HINTS.length}</div><p>${hint.text}</p>`;
    tooltip.style.top = `${rect.top + window.scrollY + 40}px`;
    tooltip.style.left = `${Math.max(rect.left + window.scrollX, 24)}px`;
    if (target) target.classList.add('onboarding-highlight');
    // remove highlight from previous
    document.querySelectorAll('.onboarding-highlight').forEach((el) => {
      if (el !== target) el.classList.remove('onboarding-highlight');
    });
  };

  const complete = () => {
    document.querySelectorAll('.onboarding-highlight').forEach((el) => el.classList.remove('onboarding-highlight'));
    overlay.remove();
    refs.onboardingComplete();
  };

  nextBtn.addEventListener('click', () => {
    step += 1;
    if (step >= HINTS.length) {
      complete();
    } else {
      showStep(step);
    }
  });
  skipBtn.addEventListener('click', complete);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) complete();
  });

  showStep(step);
}
