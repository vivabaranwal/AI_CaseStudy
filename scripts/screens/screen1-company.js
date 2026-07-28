/* screens/screen1-company.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';

const INDUSTRIES = ['IT Services','Food & Beverage','E-Commerce','Manufacturing','BFSI','Healthcare','Logistics','Retail','Education','Other'];

export function initScreen1() {
  const el = document.getElementById('screen-1');
  el.innerHTML = `
    <div class="page-wrap">
      <div class="label-rose" style="margin-bottom:20px">Tell us about the company</div>
      <div class="two-col">
        <!-- LEFT: Form -->
        <div>
          <div class="form-group">
            <label class="form-label">Company Name <span class="required-star">*</span></label>
            <input id="s1-name" class="form-input" type="text" placeholder="e.g. Zomato, Infosys, Tata Motors" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Industry</label>
            <select id="s1-industry" class="form-select">
              <option value="">Select industry…</option>
              ${INDUSTRIES.map(i => `<option value="${i}">${i}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Time Period of the Case</label>
            <div class="input-row-2">
              <input id="s1-from" class="form-input" type="number" placeholder="From (e.g. 2022)" min="1990" max="2030" />
              <input id="s1-to"   class="form-input" type="number" placeholder="To (e.g. 2024)"   min="1990" max="2030" />
            </div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-top:6px">Specify the year range this case study covers e.g. 2021–2023</div>
          </div>

          <div class="action-row">
            <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
            <button class="btn-primary" id="s1-next" disabled>
              Next: The Challenge <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
        <!-- RIGHT: Live preview -->
        <div>
          <div class="company-preview">
            <div class="co-avatar" id="s1-avatar">?</div>
            <div class="co-name empty" id="s1-prev-name">Enter a company name to begin</div>
            <div class="co-tags">
              <span class="co-tag" id="s1-t-industry">Industry</span>
            </div>
            <div style="font-size:13px;color:var(--color-text-muted);display:flex;align-items:center;gap:6px">
              <i data-lucide="calendar" style="width:14px;height:14px;opacity:0.5"></i>
              <span id="s1-t-period">Time period not set</span>
            </div>
            <p class="preview-hint">Fill in the fields and watch this card update in real time.</p>
          </div>
        </div>
      </div>
    </div>`;

  lucide.createIcons();
  _restore1();
  _bind1();
}

function _restore1() {
  const s = formState.step1;
  if (s.companyName)    { document.getElementById('s1-name').value = s.companyName; }
  if (s.industry)         document.getElementById('s1-industry').value = s.industry;
  if (s.timePeriodFrom)   document.getElementById('s1-from').value = s.timePeriodFrom;
  if (s.timePeriodTo)     document.getElementById('s1-to').value   = s.timePeriodTo;
  _updatePreview1(); _validate1();
}

function _bind1() {
  document.getElementById('s1-name').addEventListener('input', e => {
    formState.step1.companyName = e.target.value.trim(); _updatePreview1(); _validate1();
  });
  document.getElementById('s1-industry').addEventListener('change', e => {
    formState.step1.industry = e.target.value; _updatePreview1();
  });
  document.getElementById('s1-from').addEventListener('input', e => {
    formState.step1.timePeriodFrom = e.target.value; _updatePreview1();
  });
  document.getElementById('s1-to').addEventListener('input', e => {
    formState.step1.timePeriodTo = e.target.value; _updatePreview1();
  });
  document.getElementById('s1-next').addEventListener('click', () => showScreen(2));
}

function _updatePreview1() {
  const s = formState.step1;
  const av  = document.getElementById('s1-avatar');
  const nm  = document.getElementById('s1-prev-name');
  const tin = document.getElementById('s1-t-industry');
  const tpr = document.getElementById('s1-t-period');

  if (s.companyName) {
    av.textContent = s.companyName[0].toUpperCase(); nm.textContent = s.companyName; nm.classList.remove('empty');
  } else {
    av.textContent = '?'; nm.textContent = 'Enter a company name to begin'; nm.classList.add('empty');
  }
  tin.textContent = s.industry  || 'Industry';
  const hasP = s.timePeriodFrom || s.timePeriodTo;
  tpr.textContent = hasP ? `${s.timePeriodFrom || '—'} – ${s.timePeriodTo || '—'}` : 'Time period not set';
  lucide.createIcons();
}

function _validate1() {
  document.getElementById('s1-next').disabled = !formState.step1.companyName;
}
