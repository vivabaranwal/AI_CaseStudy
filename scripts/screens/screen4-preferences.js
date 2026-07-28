/* screens/screen4-preferences.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';

const PREFS = [
  { key: 'caseLength', label: 'Case Length', type: 'seg', desc: 'Longer cases include more detailed analysis and extra sub-sections.',
    opts: [{v:'short',l:'Short (8 pages)'},{v:'standard',l:'Standard (15 pages)'},{v:'long',l:'Long (20+ pages)'}] },
  { key: 'tone', label: 'Tone', type: 'pills', desc: 'Select the writing style and voice for your case study.',
    opts: [{v:'academic',l:'Academic'},{v:'semi-academic',l:'Semi-Academic'},{v:'consulting',l:'Consulting'},{v:'business-style',l:'Business Style'},{v:'none',l:'None'}] },
  { key: 'includeTeachingNote', label: 'Include Teaching Note?', type: 'toggle',
    desc: 'Separate doc for professors with discussion questions and classroom guidance.' },
  { key: 'citationStyle', label: 'Citation Style', type: 'select', desc: 'Official citation format for references and bibliography.',
    opts: [
      { label: 'General (No Citation)', value: 'general' },
      { label: 'APA 7th Edition', value: 'apa7' },
      { label: 'APA 6th Edition', value: 'apa6' },
      { label: 'Harvard Referencing', value: 'harvard' },
      { label: 'Chicago 17th (Footnotes)', value: 'chicago' },
      { label: 'MLA 9th Edition', value: 'mla' }
    ] },
  { key: 'sectionApproval', label: 'Section-by-Section Approval', type: 'toggle',
    desc: 'Approve each section before AI moves to the next. Turn off for fully automatic generation.' },
  { key: 'hookStyle', label: 'Opening Hook Style', type: 'pills', desc: 'Cinematic: in-the-room moment. Statistical: striking number. Question: provocation.',
    opts: [{v:'cinematic',l:'Cinematic'},{v:'statistical',l:'Statistical'},{v:'question',l:'Question'}] },
  { key: 'language', label: 'Language', type: 'select', desc: 'Language and register of the generated case study.',
    opts: [{v:'english-academic',l:'English (Academic)'},{v:'english-indian',l:'English (Indian Academic Style)'}] },
];

export function initScreen4() {
  document.getElementById('screen-4').innerHTML = `
    <div class="page-wrap">
      <div class="label-rose" style="margin-bottom:20px">Customize your case study</div>
      <h2 style="margin-bottom:28px">Preferences</h2>
      <div class="prefs-grid" id="s4-grid"></div>
      <div class="action-row">
        <button class="btn-back" onclick="goBack()">
          <i data-lucide="arrow-left"></i> Back
        </button>
        <button class="btn-primary" id="s4-next">
          Review &amp; Confirm <i data-lucide="arrow-right"></i>
        </button>
      </div>
    </div>`;

  _buildGrid();
  lucide.createIcons();

  document.getElementById('s4-next').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('caseiq:init-review'));
    showScreen(5);
  });
}

function _buildGrid() {
  const grid = document.getElementById('s4-grid');
  grid.innerHTML = '';
  PREFS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card-accent';
    card.innerHTML = `<div class="pref-label">${p.label}</div><div class="pref-desc">${p.desc}</div><div class="pref-ctrl" id="pc-${p.key}"></div>`;
    grid.appendChild(card);
    const ctrl = card.querySelector('.pref-ctrl');

    if (p.type === 'seg') {
      const wrap = document.createElement('div');
      wrap.className = 'segmented';
      p.opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'seg-opt' + (formState.step4[p.key] === o.v ? ' active' : '');
        btn.textContent = o.l;
        btn.addEventListener('click', () => {
          wrap.querySelectorAll('.seg-opt').forEach(b => b.classList.remove('active'));
          btn.classList.add('active'); formState.step4[p.key] = o.v;
        });
        wrap.appendChild(btn);
      });
      ctrl.appendChild(wrap);

    } else if (p.type === 'toggle') {
      const track = document.createElement('div');
      track.className = 'toggle-track' + (formState.step4[p.key] ? ' on' : '');
      track.style.marginTop = '4px';
      track.innerHTML = '<div class="toggle-thumb"></div>';
      track.addEventListener('click', () => {
        formState.step4[p.key] = !formState.step4[p.key];
        track.classList.toggle('on', formState.step4[p.key]);
      });
      ctrl.appendChild(track);

    } else if (p.type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'form-select'; sel.style.marginTop = '4px';
      p.opts.forEach(opt => {
        const option = document.createElement('option');
        if (typeof opt === 'object') {
          option.value = opt.value !== undefined ? opt.value : opt.v;
          option.textContent = opt.label !== undefined ? opt.label : opt.l;
        } else {
          option.value = opt;
          option.textContent = opt;
        }
        if (formState.step4[p.key] === option.value) option.selected = true;
        sel.appendChild(option);
      });
      sel.addEventListener('change', () => { formState.step4[p.key] = sel.value; });
      ctrl.appendChild(sel);

    } else if (p.type === 'pills') {
      const wrap = document.createElement('div');
      wrap.className = 'pill-group'; wrap.style.marginTop = '4px';
      p.opts.forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'pill-opt' + (formState.step4[p.key] === o.v ? ' selected' : '');
        btn.textContent = o.l;
        btn.addEventListener('click', () => {
          wrap.querySelectorAll('.pill-opt').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected'); formState.step4[p.key] = o.v;
        });
        wrap.appendChild(btn);
      });
      ctrl.appendChild(wrap);
    }
  });
}
