/* screens/screen5-review.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';
import { startGeneration, stopGeneration } from './screen6-generation.js';
import { API_BASE_URL } from '../config.js';


const LEN = { short:'Short (8 pages)', standard:'Standard (15 pages)', long:'Long (20+ pages)' };
const HOOK = { cinematic:'Cinematic', statistical:'Statistical', question:'Question' };
const citationLabels = {
    'general': 'General (No Citation)',
    'apa7': 'APA 7th Edition',
    'apa6': 'APA 6th Edition',
    'harvard': 'Harvard Referencing',
    'chicago': 'Chicago 17th',
    'mla': 'MLA 9th Edition'
};

export function initScreen5() {
  const s1 = formState.step1;
  const s2 = formState.step2;
  const s3 = formState.step3;
  const s4 = formState.step4;

  const citationDisplay = citationLabels[s4.citationStyle] || s4.citationStyle || 'General';

  const challengeShort = (s2.challengeText || '').slice(0, 200);
  const hasMore = (s2.challengeText || '').length > 200;

  document.getElementById('screen-5').innerHTML = `
    <div class="page-wrap page-wrap-narrow">
      <div class="label-rose" style="margin-bottom:16px">Review your inputs</div>
      <h2 style="margin-bottom:28px">Review &amp; Confirm</h2>

      <!-- Card 1: Company -->
      <div class="review-card">
        <div class="review-card-hd">
          <span class="review-card-title">Company</span>
          <button class="btn-link rev-edit" data-goto="1">Edit</button>
        </div>
        <div class="review-kv-grid">
          ${_kv('Name',      s1.companyName    || '—')}
          ${_kv('Industry',  s1.industry       || '—')}
          ${_kv('Period',    `${s1.timePeriodFrom||'—'} – ${s1.timePeriodTo||'—'}`)}
        </div>
      </div>

      <!-- Card 2: Challenge -->
      <div class="review-card">
        <div class="review-card-hd">
          <span class="review-card-title">Challenge</span>
          <button class="btn-link rev-edit" data-goto="2">Edit</button>
        </div>
        <p class="rev-challenge-text">
          ${challengeShort || '(not provided)'}${hasMore ? `<span id="rv-more" style="display:none">${s2.challengeText.slice(200)}</span>` : ''}
          ${hasMore ? '<button class="show-more-btn" id="rv-show-more">show more</button>' : ''}
        </p>
      </div>

      <!-- Card 3: Sources -->
      <div class="review-card">
        <div class="review-card-hd">
          <span class="review-card-title">Sources</span>
          <button class="btn-link rev-edit" data-goto="3">Edit</button>
        </div>
        <div class="review-kv-grid">
          ${_kv('Manual URLs',    s3.manualURLs.length)}
          ${_kv('PDFs Uploaded',  s3.manualPDFs.length)}
          ${_kv('Audio / Video',  s3.audioVideoFiles.length)}
          ${_kv('Transcripts',    s3.transcriptFiles.length)}
        </div>
      </div>

      <!-- Card 4: Preferences -->
      <div class="review-card">
        <div class="review-card-hd">
          <span class="review-card-title">Preferences</span>
          <button class="btn-link rev-edit" data-goto="4">Edit</button>
        </div>
        <div class="review-kv-grid">
          ${_kv('Length',       LEN[s4.caseLength] || s4.caseLength)}
          ${_kv('Tone',         s4.tone)}
          ${_kv('Teaching Note',s4.includeTeachingNote ? 'Yes' : 'No')}
          ${_kv('Citations',    citationDisplay)}
          ${_kv('Sec. Approval',s4.sectionApproval     ? 'On'  : 'Off')}
          ${_kv('Hook Style',   HOOK[s4.hookStyle] || s4.hookStyle)}
          ${_kv('Language',     s4.language)}
        </div>
      </div>

      <!-- CTA -->
      <div class="begin-cta">
        <button class="btn-primary full" id="s5-begin" style="font-size:18px;padding:18px 32px">
          Begin Generation <i data-lucide="zap"></i>
        </button>
        <p class="begin-sub">Estimated time: 6–10 minutes depending on case length.</p>
        <div id="generation-error" style="color: #ff6b6b; text-align: center; margin-top: 12px; font-size: 14px; font-weight: 500;"></div>
      </div>

      <div class="action-row">
        <button class="btn-back" onclick="goBack()">
          <i data-lucide="arrow-left"></i> Back
        </button>
        <div></div>
      </div>
    </div>`;

  lucide.createIcons();

  document.querySelectorAll('.rev-edit[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(parseInt(btn.dataset.goto)));
  });

  const moreBtn = document.getElementById('rv-show-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      document.getElementById('rv-more').style.display = 'inline';
      moreBtn.style.display = 'none';
    });
  }


  document.getElementById('s5-begin').addEventListener('click', async () => {
    const btn = document.getElementById('s5-begin');
    const errDiv = document.getElementById('generation-error');
    if (errDiv) errDiv.textContent = '';

    // Show generation screen immediately and start visuals
    showScreen(6);
    startGeneration();

    const payload = new FormData();
    payload.append('company_name', formState.step1.companyName);
    payload.append('challenge_text', formState.step2.challengeText);
    payload.append('protagonist_name', formState.step2.protagonistName);
    payload.append('protagonist_title', formState.step2.protagonistTitle);
    payload.append('preferences', JSON.stringify(formState.step4));
    payload.append('urls', JSON.stringify(formState.step3.manualURLs || []));

    if (formState.step2.uploadedFiles && formState.step2.uploadedFiles[0]) {
        payload.append('file', formState.step2.uploadedFiles[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/generate-case/`, {
            method: 'POST',
            body: payload
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();

        // Store case text in memory (clears on reload)
        formState.generatedCaseText = data.case_text;
        formState.generatedFileName = data.filename;

        // Convert base64 to blob for Word download
        const docxBytes = Uint8Array.from(atob(data.docx_base64), c => c.charCodeAt(0));
        const docxBlob = new Blob([docxBytes], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        formState.generatedFileUrl = URL.createObjectURL(docxBlob);

        // Handle teaching note if present
        if (data.teaching_note_base64) {
            const tnBytes = Uint8Array.from(atob(data.teaching_note_base64), c => c.charCodeAt(0));
            const tnBlob = new Blob([tnBytes], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            formState.generatedTeachingNoteUrl = URL.createObjectURL(tnBlob);
            formState.generatedTeachingNoteFileName = data.teaching_note_filename;
        }

        // Auto download Word file
        const a = document.createElement('a');
        a.href = formState.generatedFileUrl;
        a.download = formState.generatedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Stop generation visual loops
        stopGeneration();

        // Dispatch show-export event to initialize screen 7 content
        document.dispatchEvent(new CustomEvent('caseiq:show-export'));

        // Navigate to Screen 7 (preview/success)
        showScreen(7);

    } catch (error) {
        console.error('Generation failed:', error);
        stopGeneration();
        showScreen(5);
        if (errDiv) {
            errDiv.textContent = 'Generation failed. Make sure backend is running at 127.0.0.1:8000';
        }
        btn.disabled = false;
    }
  });
}

function _kv(key, val) {
  return `<div><div class="rv-key">${key}</div><div class="rv-val">${val}</div></div>`;
}
function _kvColor(key, val, color) {
  return `<div><div class="rv-key">${key}</div><div class="rv-val" style="color:${color}">${val}</div></div>`;
}
