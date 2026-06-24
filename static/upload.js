const dropZone    = document.getElementById('dropZone');
const fileInput   = document.getElementById('fileInput');
const browseBtn   = document.getElementById('browseBtn');
const dropVisual  = dropZone.querySelector('.drop-visual');
const filePreview = document.getElementById('filePreview');
const fileName    = document.getElementById('fileName');
const fileSize    = document.getElementById('fileSize');
const fileRemove  = document.getElementById('fileRemove');
const analyzeBtn  = document.getElementById('analyzeBtn');
const btnText     = document.getElementById('btnText');
const btnSpinner  = document.getElementById('btnSpinner');
const errorBox    = document.getElementById('errorBox');
const progressWrap = document.getElementById('progressWrap');
const progressBar  = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');

let selectedFile = null;

// ── DRAG & DROP ──────────────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropZone.addEventListener('click', (e) => {
  if (e.target === fileRemove || fileRemove.contains(e.target)) return;
  if (e.target === browseBtn || browseBtn.contains(e.target)) return;
  if (!selectedFile) fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

fileRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

// ── FILE HELPERS ─────────────────────────────────────
function setFile(file) {
  if (!file.name.endsWith('.csv')) {
    showError('Only CSV files are supported. Please select a .csv file.');
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

  dropVisual.classList.add('hidden');
  filePreview.classList.remove('hidden');

  analyzeBtn.disabled = false;
  hideError();
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  fileName.textContent = '—';
  fileSize.textContent = '—';

  dropVisual.classList.remove('hidden');
  filePreview.classList.add('hidden');

  analyzeBtn.disabled = true;
  progressWrap.classList.add('hidden');
  hideError();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ── ANALYZE ──────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  setLoading(true);
  hideError();
  startProgress();

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res  = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      showError(data.detail || 'Analysis failed. Please check your CSV format.');
      return;
    }

    finishProgress();
    sessionStorage.setItem('analysisResults', JSON.stringify(data));

    setTimeout(() => { window.location.href = '/dashboard'; }, 400);

  } catch (err) {
    showError('Cannot reach the server. Make sure uvicorn is running.');
  } finally {
    setLoading(false);
  }
});

// ── PROGRESS ANIMATION ───────────────────────────────
const STEPS = [
  { pct: 15, label: 'Reading CSV...' },
  { pct: 35, label: 'Preprocessing features...' },
  { pct: 55, label: 'Running Isolation Forest...' },
  { pct: 75, label: 'Applying K-Means clustering...' },
  { pct: 88, label: 'Evaluating alert rules...' },
  { pct: 95, label: 'Finalizing results...' },
];

let progressTimer = null;
let stepIdx = 0;

function startProgress() {
  progressWrap.classList.remove('hidden');
  progressBar.style.width = '0%';
  stepIdx = 0;

  function tick() {
    if (stepIdx >= STEPS.length) return;
    const { pct, label } = STEPS[stepIdx++];
    progressBar.style.width = pct + '%';
    progressLabel.textContent = label;
    progressTimer = setTimeout(tick, 800);
  }
  tick();
}

function finishProgress() {
  clearTimeout(progressTimer);
  progressBar.style.width = '100%';
  progressLabel.textContent = 'Complete! Redirecting...';
}

// ── UI STATE ─────────────────────────────────────────
function setLoading(state) {
  analyzeBtn.disabled = state;
  btnText.classList.toggle('hidden', state);
  btnSpinner.classList.toggle('hidden', !state);
  if (!state) progressWrap.classList.add('hidden');
}

function showError(msg) {
  errorBox.textContent = '⚠ ' + msg;
  errorBox.classList.remove('hidden');
  progressWrap.classList.add('hidden');
  clearTimeout(progressTimer);
}

function hideError() {
  errorBox.classList.add('hidden');
}