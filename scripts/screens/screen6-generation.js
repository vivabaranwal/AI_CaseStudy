/* screens/screen6-generation.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';
import { startLogger, stopLogger } from '../utils/logger.js';
import { startTimer, stopTimer } from '../utils/timer.js';

const SECTIONS = [
  'Opening Hook',
  'Company Background',
  'Industry & Competitive Context',
  'The Challenge',
  'Intervention',
  'Results & Outcomes',
  'Sources & Citations',
  'Learning Outcomes',
];

let _genIdx = 0;
let _timeout = null;

export function initScreen6() {
  document.getElementById('screen-6').innerHTML = `
    <div class="gen-layout">
      <!-- Left: section tracker -->
      <div>
        <div class="gen-title">Generating your case study…</div>
        <div id="gen-rows"></div>
        <div class="gen-progress-wrap" style="margin-top:28px">
          <div class="progress-track"><div class="progress-fill" id="gen-fill" style="width:0%"></div></div>
          <div class="gen-progress-lbl" id="gen-lbl">0 of 8 sections complete</div>
        </div>
        <div style="margin-top:12px;font-size:13px;color:var(--color-text-muted)">
          ETA: <span id="gen-eta">~8m 00s</span>
        </div>
      </div>
      <!-- Right: terminal -->
      <div>
        <div class="terminal-win">
          <div class="terminal-head">
            <div class="t-dot t-red"></div>
            <div class="t-dot t-yellow"></div>
            <div class="t-dot t-green"></div>
            <span class="t-label">caseiq-pipeline — bash</span>
          </div>
          <div class="terminal-body" id="term-body"></div>
        </div>
      </div>
    </div>

    <!-- Success overlay -->
    <div class="gen-success" id="gen-success">
      <div class="gen-success-icon"><i data-lucide="check"></i></div>
      <h2>Generation Complete</h2>
      <p>All 8 sections generated and verified.</p>
    </div>`;

  lucide.createIcons();
  _buildRows();
}

function _buildRows() {
  const el = document.getElementById('gen-rows');
  if (!el) return;
  el.innerHTML = '';
  SECTIONS.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'gen-row'; row.id = `gr-${i}`;
    row.innerHTML = `
      <div class="gen-icon" id="gi-${i}">${i+1}</div>
      <div class="gen-row-body">
        <div class="gen-row-name">${name}</div>
        <div class="gen-row-status" id="gs-${i}">Waiting…</div>
      </div>`;
    el.appendChild(row);
  });
}

let _generationPromise = null;

// NOTE: generation is performed by screen5-review.js via API_BASE_URL.
// This screen only renders progress; _generationPromise stays null unless set there.

export function startGeneration() {
  _genIdx = 0;
  formState.approvedSections = [];
  formState.generatedSections = {};
  _buildRows();
  startLogger('term-body');
  startTimer('gen-eta', 30);
  _updateProgress();

  _timeout = setTimeout(_runSection, 1200);
  lucide.createIcons();
}

export function stopGeneration() {
  // Stop any running timers or intervals on screen 6
  if (window._generationInterval) {
      clearInterval(window._generationInterval);
      window._generationInterval = null;
  }
  if (window._logInterval) {
      clearInterval(window._logInterval);
      window._logInterval = null;
  }
  stopLogger();
  stopTimer();
  if (_timeout) {
    clearTimeout(_timeout);
    _timeout = null;
  }
}

function _runSection() {
  if (_genIdx >= SECTIONS.length) {
    return;
  }
  const icon = document.getElementById(`gi-${_genIdx}`);
  const stat = document.getElementById(`gs-${_genIdx}`);
  if (icon) {
    icon.className = 'gen-icon running';
    icon.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-color:rgba(244,167,185,0.3);border-top-color:var(--color-accent)"></div>';
  }
  if (stat) stat.textContent = 'Writing…';

  _timeout = setTimeout(() => {
    _completeSection(_genIdx);
  }, 3000); // Visual advance every 3 seconds
}

function _completeSection(idx) {
  const icon = document.getElementById(`gi-${idx}`);
  const stat = document.getElementById(`gs-${idx}`);
  const row  = document.getElementById(`gr-${idx}`);
  if (icon) { icon.className = 'gen-icon done'; icon.innerHTML = '<i data-lucide="check" style="width:16px;height:16px"></i>'; }
  if (stat) stat.textContent = 'Complete';
  if (row)  row.classList.add('done');
  formState.approvedSections.push(SECTIONS[idx]);
  _updateProgress();
  lucide.createIcons();
  _genIdx++;
  _timeout = setTimeout(_runSection, 300);
}

function _updateProgress() {
  const done = formState.approvedSections.length;
  const pct  = Math.round((done / SECTIONS.length) * 100);
  const fill = document.getElementById('gen-fill');
  const lbl  = document.getElementById('gen-lbl');
  if (fill) fill.style.width = pct + '%';
  if (lbl)  lbl.textContent  = `${done} of ${SECTIONS.length} sections complete`;
}

async function _finish() {
  stopLogger(); stopTimer();

  const termBody = document.getElementById('term-body');
  const printLog = (text) => {
    if (!termBody) return;
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = `<span class="term-time">[${new Date().toLocaleTimeString()}]</span> ${text}`;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  };

  if (_generationPromise) {
    printLog("<span class='term-yellow'>[SYSTEM] Waiting for model pipeline to finalize...</span>");
    await _generationPromise;
  }

  const overlay = document.getElementById('gen-success');
  if (overlay) overlay.classList.add('show');
  lucide.createIcons();
  setTimeout(() => {
    overlay?.classList.remove('show');
    // Screen 5 advances to the preview once the real response lands. Only take
    // over here if it hasn't (e.g. the animation outlived the request path).
    const previewActive = document.getElementById('screen-7')?.classList.contains('active');
    const exportActive  = document.getElementById('screen-8')?.classList.contains('active');
    if (!previewActive && !exportActive) {
      if (formState.step4.sectionApproval) {
        document.dispatchEvent(new CustomEvent('caseiq:show-export'));
        showScreen(7);
      } else {
        document.dispatchEvent(new CustomEvent('caseiq:show-export-screen'));
        showScreen(8);
      }
    }
  }, 1800);
}

