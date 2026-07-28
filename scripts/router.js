/* router.js — Screen switching */

const WIZARD_SCREENS = [1, 2, 3, 4, 5];
const screenHistory = [];

export function showScreen(n) {
  if (screenHistory[screenHistory.length - 1] !== n) {
    screenHistory.push(n);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${n}`);
  if (!target) { console.warn(`screen-${n} not found`); return; }
  target.classList.add('active');
  target.classList.add('animate-in');
  setTimeout(() => target.classList.remove('animate-in'), 500);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Wizard bar
  const bar = document.getElementById('wizard-bar');
  if (bar) {
    if (WIZARD_SCREENS.includes(n)) {
      bar.classList.remove('hidden');
      _updateWizard(n);
    } else {
      bar.classList.add('hidden');
    }
  }

  // Navbar: toggle About link vs Step counter
  const aboutEl   = document.getElementById('nav-about-link');
  const counterEl = document.getElementById('nav-step-counter');
  if (aboutEl && counterEl) {
    if (WIZARD_SCREENS.includes(n)) {
      aboutEl.style.display   = 'none';
      counterEl.style.display = 'inline';
    } else {
      aboutEl.style.display   = 'inline';
      counterEl.style.display = 'none';
    }
  }

  if (window.lucide) lucide.createIcons();
}

function _updateWizard(step) {
  const mobile = document.getElementById('wz-mobile-label');
  if (mobile) mobile.textContent = `Step ${step} of 5`;

  document.querySelectorAll('.wz-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s < step)  el.classList.add('done');
    if (s === step) el.classList.add('active');
  });

  document.querySelectorAll('.wz-line').forEach(el => {
    const s = parseInt(el.dataset.after);
    el.classList.toggle('filled', s < step);
  });

  // Navbar step counter
  const counter = document.getElementById('nav-step-counter');
  if (counter) counter.textContent = `Step ${step} of 5`;
}

export function goBack() {
  screenHistory.pop();
  const prev = screenHistory[screenHistory.length - 1] ?? 0;
  showScreen(prev);
}

export function startOver() {
  window.location.reload();
}

window.goBack = goBack;
window.startOver = startOver;
window.showScreen = showScreen;

export function initRouter() { showScreen(0); }
