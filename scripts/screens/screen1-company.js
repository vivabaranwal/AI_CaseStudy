/* screens/screen1-company.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';
import { initScreen2 } from './screen2-challenge.js';
import { initScreen3 } from './screen3-sources.js';
import { initScreen4 } from './screen4-preferences.js';

const INDUSTRIES = ['IT Services','Food & Beverage','E-Commerce','Manufacturing','BFSI','Healthcare','Logistics','Retail','Education','Other'];

export function initScreen1() {
  const el = document.getElementById('screen-1');
  el.innerHTML = `
    <div class="page-wrap">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div class="label-rose" style="margin-bottom:0">Tell us about the company</div>
        <button class="btn-outline" id="s1-autofill-btn" style="padding: 6px 12px; font-size: 13px; height: auto; display: inline-flex; align-items: center; gap: 4px;">
          <i data-lucide="sparkles" style="width:14px; height:14px;"></i> Autofill Mock Data
        </button>
      </div>
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

  const autofillBtn = document.getElementById('s1-autofill-btn');
  if (autofillBtn) {
    autofillBtn.addEventListener('click', () => {
      // 1. Set formState inputs
      formState.step1.companyName = "Zomato";
      formState.step1.industry = "E-Commerce";
      formState.step1.timePeriodFrom = "2023";
      formState.step1.timePeriodTo = "2024";

      formState.step2.challengeText = "Blinkit's dark stores in Tier 2 cities — Indore, Bhopal, Jaipur, Lucknow — were burning through ₹180 crore a quarter with no path to profitability in sight. Zomato had to decide whether to consolidate footprint or invest further.";
      formState.step2.protagonistName = "Deepinder Goyal";
      formState.step2.protagonistTitle = "CEO & Co-Founder";

      formState.step3.manualURLs = [
        "https://ir.zomato.com/annual-reports",
        "https://ir.zomato.com/investor-presentations",
        "https://yourstory.com/2024/01/deepinder-goyal-zomato-blinkit-strategy"
      ];
      formState.step3.manualPDFs = [];
      formState.step3.audioVideoFiles = [];
      formState.step3.transcriptFiles = [];

      formState.step4.caseLength = "standard";
      formState.step4.tone = "academic";
      formState.step4.includeTeachingNote = true;
      formState.step4.citationStyle = "APA";
      formState.step4.sectionApproval = false;
      formState.step4.hookStyle = "cinematic";
      formState.step4.language = "english-academic";

      // 2. Refresh screens to update DOM with new state values
      initScreen1();
      initScreen2();
      initScreen3();
      initScreen4();

      // 3. Show visually stunning success notification toast
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:linear-gradient(135deg, #f4a7b9, #f7c3cf); color:#1a1a2e; padding:16px 28px; border-radius:12px; font-weight:700; font-family:var(--font-heading); font-size:14px; box-shadow:0 8px 32px rgba(244,167,185,0.3); z-index:9999; display:flex; align-items:center; gap:10px; border: 1px solid rgba(255,255,255,0.2); transform:translateY(100px); opacity:0; transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);';
      toast.innerHTML = '<i data-lucide="sparkles" style="color:#d13b63"></i> Zomato case study mock data loaded successfully!';
      document.body.appendChild(toast);
      
      if (window.lucide) lucide.createIcons({node: toast});

      // Animate toast in
      setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      }, 50);

      // Animate toast out
      setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    });
  }
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
