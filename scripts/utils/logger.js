/* utils/logger.js — Terminal log streamer */

const LOG_LINES = [
  '[Layer 1] Opening PDF stream...',
  '[Layer 1] Detected 52 pages. Starting text extraction.',
  '[Layer 1] OCR triggered on pages 14, 27.',
  '[Layer 1] Cleaned 48,204 tokens. Removing noise.',
  '[Layer 2] Chunking into 312 semantic segments.',
  '[Layer 2] Generating embeddings via nomic-embed-text-v1...',
  '[Layer 2] 312 vectors stored in ChromaDB. Index ready.',
  '[Layer 3] RAG pipeline activated. Top-5 chunks retrieved.',
  '[Layer 3] Sending prompt to Gemini 2.5 via API.',
  '[Generator] Writing Opening Hook...',
  '[Generator] Opening Hook complete. (312 words)',
  '[Generator] Writing Company Background...',
  '[RAG] Retrieving context for company history...',
  '[RAG] Top 3 chunks retrieved.',
  '[Generator] Company Background complete. (487 words)',
  '[Generator] Writing Industry & Competitive Context...',
  '[Generator] Industry section complete. (398 words)',
  '[Generator] Writing Challenge section...',
  '[Generator] Challenge complete. (521 words)',
  '[Generator] Writing Intervention...',
  '[Generator] Intervention complete. (614 words)',
  '[Generator] Writing Results & Outcomes...',
  '[Generator] Results complete. (443 words)',
  '[Generator] Mapping citations to source documents...',
  '[Layer 4] Confidence score: 94.7%. 2 claims flagged.',
  '[Layer 4] Citation mapping complete. 18 references tagged.',
  '[Generator] Writing Learning Outcomes...',
  '[Generator] Learning Outcomes complete. (276 words)',
  '[Layer 5] Formatting to IFQM structure.',
  '[Layer 5] Building .docx with citation blocks.',
  '[Layer 5] Case study export ready.',
];

let _interval = null;
let _idx = 0;

export function startLogger(bodyId) {
  const el = document.getElementById(bodyId);
  if (!el) return;
  _idx = 0;
  el.innerHTML = '';

  // Add blinking cursor
  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.id = 'term-cursor';
  el.appendChild(cursor);

  _interval = setInterval(() => {
    if (_idx >= LOG_LINES.length) { stopLogger(); return; }
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = LOG_LINES[_idx++];
    el.insertBefore(line, cursor);
    el.scrollTop = el.scrollHeight;
  }, 1200);
}

export function stopLogger() {
  if (_interval) { clearInterval(_interval); _interval = null; }
  const cursor = document.getElementById('term-cursor');
  if (cursor) cursor.remove();
}
