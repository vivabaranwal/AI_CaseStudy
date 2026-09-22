/* about.js — Navbar "About" modal. Reuses the shared modal shell from index.html. */

const ABOUT_HTML = `
  <p style="margin-bottom:14px">
    <strong>CaseIQ</strong> turns company research into publisher-grade,
    IFQM-structured business case studies.
  </p>
  <p style="margin-bottom:14px">
    Enter a company and the strategic challenge, optionally attach source PDFs
    and reference URLs, then choose your length, tone, and citation style.
    CaseIQ retrieves related material from a vector index of real case studies,
    grounds the writing in your sources, and exports a formatted Word document
    with an optional teaching note.
  </p>
  <p style="margin-bottom:14px">
    <strong>How it works:</strong> a retrieval-augmented pipeline — your inputs
    are combined with semantically matched passages from the case library, then
    written up by a large language model against a strict academic structure.
  </p>
  <p style="margin-bottom:0; opacity:0.75; font-size:13px">
    Built for IFQM Bangalore by
    <a href="https://vivabaranwal.vercel.app/" target="_blank" rel="noopener noreferrer"
       style="color:inherit">Viva Baranwal</a> · SRM Q Club
  </p>`;

export function initAbout() {
  const link = document.getElementById('nav-about-link');
  if (!link) return;

  const overlay = document.getElementById('case-modal-overlay');
  const title   = document.getElementById('modal-company-name');
  const content = document.getElementById('modal-case-content');
  const closeBtn = document.getElementById('modal-close-btn');
  if (!overlay || !content) return;

  const close = () => { overlay.style.display = 'none'; };

  link.style.cursor = 'pointer';
  link.addEventListener('click', () => {
    if (title) title.textContent = 'About CaseIQ';
    content.innerHTML = ABOUT_HTML;
    overlay.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') close();
  });
}
