/* screens/screen0-landing.js */
import { showScreen } from '../router.js';

export function initScreen0() {
  const el = document.getElementById('screen-0');
  el.innerHTML = `
    <div class="hero">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-dot"></span>
        IFQM-aligned AI case study generator
      </div>
      <h1>Turn company data into <span class="accent">publish-ready</span> case studies.</h1>
      <p class="hero-sub">
        Upload reference materials, outline the core strategic challenge, and select your citation style — CaseIQ crafts a publisher-grade, academically structured business case study in minutes.
      </p>
      <div class="stat-pills">
        <div class="stat-pill"><span class="stat-dot rose"></span> Under 10 min generation</div>
        <div class="stat-pill"><span class="stat-dot green"></span> 95%+ fact accuracy</div>
        <div class="stat-pill"><span class="stat-dot amber"></span> Under $2 per case</div>
      </div>
      <div class="hero-btns">
        <button class="btn-primary" id="hero-start">
          <i data-lucide="sparkles"></i> Start generating
        </button>
        <button class="btn-outline" id="hero-how">
          See how it works
        </button>
      </div>
    </div>

    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon"><i data-lucide="list-ordered"></i></div>
        <div class="feature-title">5-Step Wizard</div>
        <div class="feature-desc">Guided input flow — company, challenge, sources, preferences, review. No guesswork.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i data-lucide="brain"></i></div>
        <div class="feature-title">RAG Pipeline</div>
        <div class="feature-desc">Retrieval-Augmented Generation grounds every claim in your source documents. 94%+ citation accuracy.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i data-lucide="download"></i></div>
        <div class="feature-title">Export Ready</div>
        <div class="feature-desc">Download as Word (.docx), PDF, or BibTeX. IFQM structure, inline citations, teaching note optional.</div>
      </div>
    </div>

    <div class="landing-footer">
      Built for IFQM Banglore by <a href="https://vivabaranwal.vercel.app/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Viva Baranwal</a>
    </div>`;

  if (window.lucide) lucide.createIcons();

  document.getElementById('hero-start').addEventListener('click', () => showScreen(1));
  document.getElementById('hero-how').addEventListener('click', () => {
    document.querySelector('.feature-grid')?.scrollIntoView({ behavior: 'smooth' });
  });
}
