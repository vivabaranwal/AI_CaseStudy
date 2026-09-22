/* screens/screen7-preview.js */
import { showScreen } from '../router.js';
import { formState } from '../formState.js';
import { CITATION_LABELS, LENGTH_LABELS, TONE_LABELS, labelFor } from '../labels.js';

export function initScreen7() {
    const el = document.getElementById('screen-7');
    if (!el) return;

    el.innerHTML = `
    <div class="screen-content preview-screen">
      <div class="preview-success-icon">&#10003;</div>
      <h1 id="preview-company-name" class="preview-company-title">Company Name</h1>
      <p class="preview-subtitle">Case Study Generated Successfully</p>
      <p id="preview-summary" class="preview-meta">Standard case &middot; Academic tone &middot; APA citations</p>

      <div class="preview-actions">
        <button id="preview-download-word" class="btn-primary">
          Download Word Document
        </button>
        <button id="preview-continue-btn" class="btn-outline">
          View Export Options &rarr;
        </button>
      </div>

      <a id="preview-start-over" class="preview-start-over-link">Start over</a>
    </div>`;

    // Populate company name
    const companyEl = document.getElementById('preview-company-name');
    if (companyEl) {
        companyEl.textContent = formState.step1?.companyName || 'Your Company';
    }

    // Populate preferences summary
    const summaryEl = document.getElementById('preview-summary');
    if (summaryEl) {
        const prefs = formState.step4 || {};
        const lenLabel  = labelFor(LENGTH_LABELS,   prefs.caseLength,    'Standard');
        const toneLabel = labelFor(TONE_LABELS,     prefs.tone,          'Academic');
        const citeLabel = labelFor(CITATION_LABELS, prefs.citationStyle, 'General (No Citation)');
        summaryEl.textContent = `${lenLabel} · ${toneLabel} tone · ${citeLabel}`;
    }

    // Wire download word button
    const downloadWordBtn = document.getElementById('preview-download-word');
    if (downloadWordBtn) {
        downloadWordBtn.addEventListener('click', () => {
            if (formState.generatedFileUrl) {
                const a = document.createElement('a');
                a.href = formState.generatedFileUrl;
                a.download = formState.generatedFileName || 'case_study.docx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    // Wire continue to export button
    const continueBtn = document.getElementById('preview-continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('caseiq:show-export-screen'));
            showScreen(8);
        });
    }

    // Wire start over button
    const startOverBtn = document.getElementById('preview-start-over');
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            formState.generatedFileUrl = null;
            formState.generatedFileName = null;
            showScreen(0);
        });
    }
}
