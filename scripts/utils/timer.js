/* utils/timer.js — ETA countdown */
let _t = null;

export function startTimer(elId, seconds = 480) {
  let s = seconds;
  const el = document.getElementById(elId);
  if (!el) return;
  const fmt = n => n <= 0 ? 'Almost done…' : `~${Math.floor(n/60)}m ${String(n%60).padStart(2,'0')}s`;
  el.textContent = fmt(s);
  _t = setInterval(() => { s--; el.textContent = fmt(s); if (s <= 0) stopTimer(); }, 1000);
}
export function stopTimer() { clearInterval(_t); _t = null; }
