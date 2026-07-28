/* screens/screen7-preview.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';

const SEC_LABELS = {
  'Opening Hook':                  'OPENING HOOK',
  'Company Background':            'BACKGROUND',
  'Industry & Competitive Context':'INDUSTRY CONTEXT',
  'The Challenge':                 'THE CHALLENGE',
  'Intervention':                  'INTERVENTION',
  'Results & Outcomes':            'RESULTS & OUTCOMES',
  'Sources & Citations':           'SOURCES',
  'Learning Outcomes':             'LEARNING OUTCOMES',
};

let _mockCase    = null;
let _mockSources = null;

export async function initScreen7() {
  try {
    const [cr, sr] = await Promise.all([fetch('./mock/mock-case.json'), fetch('./mock/mock-sources.json')]);
    _mockCase    = await cr.json();
    _mockSources = await sr.json();
  } catch(e) { console.warn('Mock data unavailable', e.message); }

  // Populate formState sections from mock data only if we don't have real generated data
  const hasRealData = Object.keys(formState.generatedSections).length > 0;
  if (!hasRealData) {
    Object.keys(SEC_LABELS).forEach(sec => {
      let key = sec.toLowerCase().replace(/[^a-z0-9]+/g,'_');
      if (key === 'industry_competitive_context') key = 'industry___competitive_context';
      if (key === 'results_outcomes') key = 'results___outcomes';
      formState.generatedSections[sec] = _mockCase?.[key] || `[Generated content for: ${sec}]`;
    });
  }
  
  if (_mockSources) {
    formState.sources.primary   = _mockSources.filter(s => s.type === 'primary');
    formState.sources.secondary = _mockSources.filter(s => s.type === 'secondary');
  }
  _renderPreview7();
}

function _renderPreview7() {
  const co = formState.step1.companyName || 'Case Study';
  const el = document.getElementById('screen-7');
  el.innerHTML = `
    <!-- Sticky top bar -->
    <div class="preview-topbar">
      <div class="preview-company">${co} — Case Study</div>
      <div class="preview-actions">
        <button class="btn-link" onclick="startOver()" style="color:var(--color-text-muted);font-size:13px;margin-right:8px">Start over</button>
        <button class="btn-link" id="p7-edit-prefs">Edit preferences</button>
        <button class="btn-outline" style="padding:10px 20px;font-size:13px" id="p7-regen">Regenerate all</button>
        <button class="btn-primary" style="padding:10px 24px;font-size:13px" id="p7-export">
          Export <i data-lucide="download"></i>
        </button>
      </div>
    </div>

    <!-- Case sections -->
    <div class="preview-body" id="p7-body"></div>

    <!-- Sources panel -->
    <div class="sources-panel" id="p7-sources"></div>`;

  // Render sections
  const body = document.getElementById('p7-body');
  Object.keys(SEC_LABELS).forEach(sec => {
    const text  = formState.generatedSections[sec] || '';
    const label = SEC_LABELS[sec];
    const div   = document.createElement('div');
    div.className = 'case-section';
    div.innerHTML = `
      <div class="case-sec-label">${label}</div>
      <div class="case-sec-body" id="csb-${_slug(sec)}">${text}</div>
      <div class="case-sec-actions">
        <button class="btn-sm btn-sm-green cs-approve" data-sec="${sec}">Approve ✓</button>
        <button class="btn-sm btn-sm-amber cs-regen"   data-sec="${sec}">↺ Regenerate</button>
        <button class="btn-link cs-edit"               data-sec="${sec}">✎ Edit manually</button>
      </div>`;
    div.querySelector('.cs-approve').addEventListener('click', function() {
      this.textContent = '✓ Approved'; this.disabled = true;
      this.style.background = 'var(--color-success-dim)';
    });
    div.querySelector('.cs-regen').addEventListener('click', function() {
      const bd = div.querySelector('.case-sec-body');
      const orig = bd.innerHTML; bd.innerHTML = '<em style="color:var(--color-text-muted)">Rewriting section…</em>';
      this.disabled = true; const self = this;
      setTimeout(() => { bd.innerHTML = orig; self.disabled = false; }, 2500);
    });
    div.querySelector('.cs-edit').addEventListener('click', function() {
      const bd = div.querySelector('.case-sec-body');
      const editing = bd.contentEditable === 'true';
      bd.contentEditable = editing ? 'false' : 'true';
      bd.classList.toggle('editable', !editing);
      if (!editing) bd.focus();
      this.textContent = editing ? '✎ Edit manually' : '✓ Done editing';
    });
    body.appendChild(div);
  });

  // Sources panel
  const srcEl = document.getElementById('p7-sources');
  if (_mockSources) {
    const pri = _mockSources.filter(s => s.type === 'primary');
    const sec = _mockSources.filter(s => s.type === 'secondary');
    srcEl.innerHTML = `
      <h3>Sources</h3>
      <div class="sources-2col">
        <div>
          <div class="src-col-label">Primary Sources</div>
          ${pri.map(s => `
            <div class="source-card">
              <span class="source-badge-type type-primary">Primary</span>
              <span class="source-url" title="${s.url||''}">${s.title}</span>
              <span style="font-size:11px;color:var(--color-text-muted);flex-shrink:0">${s.year}</span>
            </div>`).join('')}
        </div>
        <div>
          <div class="src-col-label">Secondary Sources</div>
          ${sec.map(s => `
            <div class="source-card">
              <span class="source-badge-type type-secondary">Secondary</span>
              <span class="source-url" title="${s.url||''}">${s.title}</span>
              <span style="font-size:11px;color:var(--color-text-muted);flex-shrink:0">${s.year}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  lucide.createIcons();

  document.getElementById('p7-export').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('caseiq:show-export'));
    showScreen(8);
  });
  document.getElementById('p7-regen').addEventListener('click', () => {
    if (confirm('Regenerate the entire case study?')) {
      document.dispatchEvent(new CustomEvent('caseiq:begin-generation'));
    }
  });
  document.getElementById('p7-edit-prefs').addEventListener('click', () => showScreen(4));
}

function _slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
