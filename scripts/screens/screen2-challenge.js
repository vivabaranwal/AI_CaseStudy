/* screens/screen2-challenge.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';

export function initScreen2() {
  const co = formState.step1.companyName || 'the company';
  document.getElementById('screen-2').innerHTML = `
    <div class="page-wrap page-wrap-narrow">
      <h2 style="margin-bottom:8px">The Themes</h2>
      <p class="text-muted" style="margin-bottom:36px">Identify the key theme — a innovation, transformation, challenge, or decision.</p>

      <!-- Themes textarea -->
      <div class="form-group">
        <label class="form-label">What themes are you writing about? <span class="required-star">*</span></label>
        <textarea id="s2-text" class="form-textarea" rows="7"
          placeholder="What happened? This could be a crisis, an expansion, a product launch, a transformation, or any significant business moment. Be specific about when and who was involved."></textarea>
        <div class="word-count" id="s2-wc">0 words — aim for 1–150 for best results</div>
      </div>

      <!-- Protagonist -->
      <button class="prot-toggle" id="s2-prot-toggle">
        <span class="prot-plus" id="s2-plus">+</span> Add protagonist details (optional)
      </button>
      <div class="prot-body" id="s2-prot-body">
        <div class="prot-grid">
          <div class="form-group">
            <label class="form-label">Protagonist Name</label>
            <input id="s2-prot-name" class="form-input" type="text" placeholder="e.g. Deepinder Goyal" />
          </div>
          <div class="form-group">
            <label class="form-label">Title / Role</label>
            <input id="s2-prot-role" class="form-input" type="text" placeholder="e.g. CEO &amp; Co-Founder" />
          </div>
        </div>
        <p class="prot-note">If left blank, AI will identify the key decision-maker from your sources.</p>
      </div>

      <div class="action-row">
        <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
        <button class="btn-primary" id="s2-next" disabled>
          Next: Sources <i data-lucide="arrow-right"></i>
        </button>
      </div>
    </div>`;

  lucide.createIcons();
  _restore2(); _bind2();
}

function _restore2() {
  const s = formState.step2;
  if (s.challengeText) { document.getElementById('s2-text').value = s.challengeText; _wc(s.challengeText); }
  if (s.protagonistName) document.getElementById('s2-prot-name').value = s.protagonistName;
  if (s.protagonistTitle) document.getElementById('s2-prot-role').value = s.protagonistTitle;
  _validate2();
}

function _bind2() {
  document.getElementById('s2-text').addEventListener('input', e => {
    formState.step2.challengeText = e.target.value; _wc(e.target.value); _validate2();
  });

  const toggle = document.getElementById('s2-prot-toggle');
  toggle.addEventListener('click', () => {
    const body = document.getElementById('s2-prot-body');
    const plus = document.getElementById('s2-plus');
    body.classList.toggle('open');
    plus.textContent = body.classList.contains('open') ? '−' : '+';
  });
  document.getElementById('s2-prot-name').addEventListener('input', e => { formState.step2.protagonistName = e.target.value; });
  document.getElementById('s2-prot-role').addEventListener('input', e => { formState.step2.protagonistTitle = e.target.value; });

  document.getElementById('s2-next').addEventListener('click', () => showScreen(3));
}

function _wc(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const el = document.getElementById('s2-wc');
  el.textContent = `${words} words — aim for 1–150 for best results`;
  el.classList.remove('good','over');
  if (words >= 1 && words <= 150) el.classList.add('good');
  else if (words > 150)            el.classList.add('over');
}

function _validate2() {
  const hasText = (formState.step2.challengeText || '').trim().length > 0;
  document.getElementById('s2-next').disabled = !hasText;
}
