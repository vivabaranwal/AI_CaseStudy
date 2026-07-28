/* screens/screen3-sources.js */
import { formState } from '../formState.js';
import { showScreen } from '../router.js';
import { renderSourceCard } from '../utils/sourceManager.js';

export function initScreen3() {
  document.getElementById('screen-3').innerHTML = `
    <div class="page-wrap page-wrap-narrow">
      <h2 style="margin-bottom:8px">Sources</h2>
      <p class="text-muted" style="margin-bottom:32px">Add references for the AI to work from.</p>

      <!-- Card B: Manual URLs -->
      <div class="card" style="margin-bottom:20px">
        <div class="src-section-hd">
          <span class="src-section-title">Manual URL Sources</span>
        </div>
        <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px">
          Add your own articles, company pages, or reports.
        </p>
        <div class="add-url-row">
          <input id="s3-url-inp" class="add-url-inp" type="url" placeholder="https://example.com/article" />
          <button class="add-url-btn" id="s3-url-add">Add URL</button>
        </div>
        <div id="s3-url-max" class="url-max-msg" style="display:none">Maximum 10 URLs reached.</div>
        <div id="s3-url-list"></div>
      </div>

      <!-- Card C: PDFs -->
      <div class="card" style="margin-bottom:20px">
        <div class="src-section-hd">
          <span class="src-section-title">Upload Additional Documents</span>
        </div>
        <div class="dropzone" id="s3-dz" style="min-height:100px">
          <input type="file" id="s3-pdf-inp" accept=".pdf" multiple />
          <div class="dz-icon"><i data-lucide="file-plus"></i></div>
          <div class="dz-title" style="font-size:14px">Drop PDFs here or click to browse</div>
          <div class="dz-sub">Multiple files accepted</div>
        </div>
        <div id="s3-pdf-list" style="margin-top:8px"></div>
      </div>

      <!-- Card D: Audio / Video Upload -->
      <div class="card" style="margin-bottom:20px">
        <div class="src-section-hd">
          <span class="src-section-title">Upload Audio or Video</span>
        </div>
        <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px">
          Interview recordings, press conference footage, earnings call recordings
        </p>
        <div class="dropzone" id="s3-av-dz" style="min-height:100px">
          <input type="file" id="s3-av-inp" accept=".mp3,.mp4,.wav,.m4a,.webm" multiple />
          <div class="dz-icon"><i data-lucide="mic"></i></div>
          <div class="dz-title" style="font-size:14px">Drop audio or video files here or click to browse</div>
          <div class="dz-sub">.mp3, .mp4, .wav, .m4a, .webm accepted</div>
        </div>
        <div id="s3-av-list" style="margin-top:8px"></div>
      </div>

      <!-- Card E: Transcript Upload -->
      <div class="card" style="margin-bottom:20px">
        <div class="src-section-hd">
          <span class="src-section-title">Upload Transcripts</span>
        </div>
        <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px">
          Text transcripts of interviews, earnings calls, or press briefings
        </p>
        <div class="dropzone" id="s3-tr-dz" style="min-height:100px">
          <input type="file" id="s3-tr-inp" accept=".txt,.docx,.pdf" multiple />
          <div class="dz-icon"><i data-lucide="file-text"></i></div>
          <div class="dz-title" style="font-size:14px">Drop transcript files here or click to browse</div>
          <div class="dz-sub">.txt, .docx, .pdf accepted</div>
        </div>
        <div id="s3-tr-list" style="margin-top:8px"></div>
      </div>

      <div class="sources-footer" id="s3-count">Total sources: 0 URLs, 0 PDFs, 0 audio/video, 0 transcripts</div>

      <div class="action-row">
        <button class="btn-back" onclick="goBack()"><i data-lucide="arrow-left"></i> Back</button>
        <button class="btn-primary" id="s3-next">
          Next: Preferences <i data-lucide="arrow-right"></i>
        </button>
      </div>
    </div>`;

  lucide.createIcons();
  _bind3();
  _updateCount3();
}

function _bind3() {
  // Card B: URL
  document.getElementById('s3-url-add').addEventListener('click', _addUrl3);
  document.getElementById('s3-url-inp').addEventListener('keydown', e => { if (e.key === 'Enter') _addUrl3(); });

  // Card C: PDFs
  const pdfInp = document.getElementById('s3-pdf-inp');
  const dz     = document.getElementById('s3-dz');
  pdfInp.addEventListener('change', e => [...e.target.files].forEach(_addPdf3));
  dz.addEventListener('dragover',  ev => { ev.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop',      ev => { ev.preventDefault(); dz.classList.remove('dragover'); [...ev.dataTransfer.files].forEach(_addPdf3); });

  // Card D: Audio / Video
  const avInp = document.getElementById('s3-av-inp');
  const avDz  = document.getElementById('s3-av-dz');
  avInp.addEventListener('change', e => [...e.target.files].forEach(_addAudioVideo3));
  avDz.addEventListener('dragover',  ev => { ev.preventDefault(); avDz.classList.add('dragover'); });
  avDz.addEventListener('dragleave', () => avDz.classList.remove('dragover'));
  avDz.addEventListener('drop',      ev => { ev.preventDefault(); avDz.classList.remove('dragover'); [...ev.dataTransfer.files].forEach(_addAudioVideo3); });

  // Card E: Transcripts
  const trInp = document.getElementById('s3-tr-inp');
  const trDz  = document.getElementById('s3-tr-dz');
  trInp.addEventListener('change', e => [...e.target.files].forEach(_addTranscript3));
  trDz.addEventListener('dragover',  ev => { ev.preventDefault(); trDz.classList.add('dragover'); });
  trDz.addEventListener('dragleave', () => trDz.classList.remove('dragover'));
  trDz.addEventListener('drop',      ev => { ev.preventDefault(); trDz.classList.remove('dragover'); [...ev.dataTransfer.files].forEach(_addTranscript3); });

  document.getElementById('s3-next').addEventListener('click', () => showScreen(4));
}

function _addUrl3() {
  if (formState.step3.manualURLs.length >= 10) return;
  const inp = document.getElementById('s3-url-inp');
  const url = inp.value.trim();
  if (!url) return;
  formState.step3.manualURLs.push(url);
  inp.value = '';
  renderSourceCard(url, 's3-url-list', removed => {
    formState.step3.manualURLs = formState.step3.manualURLs.filter(u => u !== removed);
    _updateCount3(); _checkLimit();
  });
  _updateCount3(); _checkLimit();
}

function _checkLimit() {
  const at = formState.step3.manualURLs.length >= 10;
  document.getElementById('s3-url-max').style.display = at ? 'block' : 'none';
  document.getElementById('s3-url-inp').disabled = at;
  document.getElementById('s3-url-add').disabled = at;
}

function _addPdf3(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) return;
  formState.step3.manualPDFs.push(file);
  const list = document.getElementById('s3-pdf-list');
  const card = document.createElement('div');
  card.className = 'pdf-card';
  card.innerHTML = `
    <div class="pdf-icon"><i data-lucide="file-text"></i></div>
    <div><div class="pdf-name">${file.name}</div><div class="pdf-size">${(file.size/1024).toFixed(0)} KB</div></div>
    <select class="pdf-type-sel">
      <option>Annual Report</option><option>Press Release</option>
      <option>Research Paper</option><option>Other</option>
    </select>
    <button class="source-remove">×</button>`;
  card.querySelector('.source-remove').addEventListener('click', () => {
    formState.step3.manualPDFs = formState.step3.manualPDFs.filter(f => f.name !== file.name);
    card.remove(); _updateCount3();
  });
  list.appendChild(card);
  lucide.createIcons(); _updateCount3();
}

function _getAvType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  if (['mp3','wav','m4a'].includes(ext)) return 'Audio';
  if (['mp4','webm'].includes(ext)) return 'Video';
  return 'Audio';
}

function _addAudioVideo3(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  if (!['mp3','mp4','wav','m4a','webm'].includes(ext)) return;
  formState.step3.audioVideoFiles.push(file);
  const type = _getAvType(file.name);
  const iconName = type === 'Video' ? 'video' : 'mic';
  const list = document.getElementById('s3-av-list');
  const card = document.createElement('div');
  card.className = 'pdf-card';
  card.innerHTML = `
    <div class="pdf-icon"><i data-lucide="${iconName}"></i></div>
    <div><div class="pdf-name">${file.name}</div><div class="pdf-size">${(file.size/1024).toFixed(0)} KB</div></div>
    <span class="source-badge-type type-report">${type}</span>
    <button class="source-remove">×</button>`;
  card.querySelector('.source-remove').addEventListener('click', () => {
    formState.step3.audioVideoFiles = formState.step3.audioVideoFiles.filter(f => f.name !== file.name);
    card.remove(); _updateCount3();
  });
  list.appendChild(card);
  lucide.createIcons(); _updateCount3();
}

function _addTranscript3(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  if (!['txt','docx','pdf'].includes(ext)) return;
  formState.step3.transcriptFiles.push(file);
  const list = document.getElementById('s3-tr-list');
  const card = document.createElement('div');
  card.className = 'pdf-card';
  card.innerHTML = `
    <div class="pdf-icon"><i data-lucide="file-text"></i></div>
    <div><div class="pdf-name">${file.name}</div><div class="pdf-size">${(file.size/1024).toFixed(0)} KB</div></div>
    <select class="pdf-type-sel">
      <option>Interview Transcript</option><option>Earnings Call</option>
      <option>Press Briefing</option><option>Other</option>
    </select>
    <button class="source-remove">×</button>`;
  card.querySelector('.source-remove').addEventListener('click', () => {
    formState.step3.transcriptFiles = formState.step3.transcriptFiles.filter(f => f.name !== file.name);
    card.remove(); _updateCount3();
  });
  list.appendChild(card);
  lucide.createIcons(); _updateCount3();
}

function _updateCount3() {
  const u  = formState.step3.manualURLs.length;
  const p  = formState.step3.manualPDFs.length;
  const av = formState.step3.audioVideoFiles.length;
  const tr = formState.step3.transcriptFiles.length;
  document.getElementById('s3-count').textContent =
    `Total sources: ${u} URL${u !== 1 ? 's' : ''}, ${p} PDF${p !== 1 ? 's' : ''}, ${av} audio/video, ${tr} transcript${tr !== 1 ? 's' : ''}`;
}
