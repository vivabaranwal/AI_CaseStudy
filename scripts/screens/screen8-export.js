import { formState } from '../formState.js';
import { launchConfetti } from '../utils/animations.js';
import { showScreen } from '../router.js';
import { API_BASE_URL } from '../config.js';
import { buildBibtex } from '../bibtex.js';

let _confettiFired = false;

export function initScreen8() {
  const el = document.getElementById('screen-8');
  el.innerHTML = `
    <div class="export-wrap">
      <div class="export-watermark">CaseIQ</div>
      <div class="export-success-icon"><i data-lucide="check-circle"></i></div>
      <h1 class="export-heading">Your case study is ready.</h1>
      <p class="export-sub">Reviewed and formatted to IFQM academic publishing standards.</p>
      <div class="export-btns">
        <button class="btn-export outline" id="view-case-btn">
          <i data-lucide="eye"></i> View Generated Case Study
        </button>
        <button class="btn-export filled" id="e8-word">
          <i data-lucide="file-text"></i> Download as Word (.docx)
        </button>
        <button class="btn-export outline" id="e8-pdf">
          <i data-lucide="file"></i> Download as PDF
        </button>
        <button class="btn-export outline" id="e8-bib">
          <i data-lucide="link"></i> Export citations (.bib)
        </button>
        <button class="btn-export outline" id="e8-teach" style="display:none">
          <i data-lucide="book-open"></i> Download teaching note (.docx)
        </button>
      </div>
      <div style="margin-top:20px;text-align:center">
        <button class="btn-link" onclick="startOver()" style="color:var(--color-text-muted);font-size:13px">Start over</button>
      </div>
      <p class="export-footer">Built for IFQM Banglore by <a href="https://vivabaranwal.vercel.app/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Viva Baranwal</a></p>
    </div>`;

  lucide.createIcons();

  // Show teaching note button if enabled
  if (formState.step4.includeTeachingNote) {
    document.getElementById('e8-teach').style.display = 'flex';
  }

  // Confetti — once
  if (!_confettiFired) { _confettiFired = true; setTimeout(launchConfetti, 300); }

  // View case study button modal handler
  const viewBtn = document.getElementById('view-case-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      const overlay = document.getElementById('case-modal-overlay');
      const content = document.getElementById('modal-case-content');
      const title = document.getElementById('modal-company-name');

      if (!formState.generatedCaseText) {
        alert('Content no longer available — please generate again');
        return;
      }

      title.textContent = (formState.step1?.companyName || 'Case Study') + ' — Case Study';

      // Render case text as HTML
      const html = formState.generatedCaseText
        .split('\n')
        .map(line => {
          line = line.trim();
          if (!line) return '';
          // Check if section header
          const headers = ['BACKGROUND','CHALLENGE','ROOT CAUSE ANALYSIS',
              'INTERVENTION','APPROACH','IMPLEMENTATION','RESULTS',
              'RECOMMENDATIONS','FUTURE SCOPE','THEMES'];
          const isHeader = headers.some(h =>
              line.toUpperCase() === h || line.toUpperCase().startsWith(h + ':')
          );
          if (isHeader) {
            return `<h2 class="modal-section-header">${line}</h2>`;
          }
          return `<p class="modal-paragraph">${line}</p>`;
        })
        .join('');

      content.innerHTML = html;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('case-modal-overlay').style.display = 'none';
      document.body.style.overflow = '';
    });
  }

  // Close on overlay click
  const overlay = document.getElementById('case-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Download handlers
  document.getElementById('e8-word').addEventListener('click', () => {
    if (formState.generatedFileUrl) {
      const a = document.createElement('a');
      a.href     = formState.generatedFileUrl;
      a.download = formState.generatedFileName || 'case_study.docx';
      a.click();
    } else {
      _dl('docx', 'case_study');
    }
  });
  document.getElementById('e8-pdf').addEventListener('click', async () => {
    if (!formState.generatedFileName) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/export-pdf/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_name: formState.step1.companyName
            })
        });
        
        if (!response.ok) throw new Error('PDF export failed');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formState.step1.companyName}_case_study.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('PDF download failed:', error);
        alert('PDF export failed. Please try downloading as Word instead.');
    }
  });
  document.getElementById('e8-bib').addEventListener('click',   () => _dl('bib',  'bibliography'));
  document.getElementById('e8-teach').addEventListener('click', () => {
    if (formState.generatedTeachingNoteUrl) {
      const a = document.createElement('a');
      a.href = formState.generatedTeachingNoteUrl;
      a.download = formState.generatedTeachingNoteFileName || 'teaching_note.docx';
      a.click();
    } else {
      _dl('docx', 'teaching_note');
    }
  });
}

function _dl(ext, prefix) {
  const co  = (formState.step1.companyName || 'output').replace(/\s+/g,'_').toLowerCase();
  const txt = buildBibtex(formState);
  const blob = new Blob([txt], { type: 'application/x-bibtex;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${co}_${prefix}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
