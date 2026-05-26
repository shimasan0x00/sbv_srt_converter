import { sbvToSrt } from './converter.js';
import './styles.css';

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const downloadBtn = document.getElementById('download-btn');
const fileNameEl = document.getElementById('file-name');
const previewEl = document.getElementById('preview');
const errorEl = document.getElementById('error');

let lastSrt = '';
let lastSrtName = 'output.srt';

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.textContent = '';
  errorEl.hidden = true;
}

function toSrtFileName(originalName) {
  if (!originalName) return 'output.srt';
  return originalName.replace(/\.sbv$/i, '').replace(/\.[^.]+$/, '') + '.srt';
}

async function handleFile(file) {
  clearError();
  previewEl.textContent = '';
  downloadBtn.disabled = true;
  lastSrt = '';

  if (!file) return;
  fileNameEl.textContent = file.name;

  try {
    const text = await file.text();
    const srt = sbvToSrt(text);
    if (srt === '') {
      showError('入力が空、または変換対象がありません。');
      return;
    }
    lastSrt = srt;
    lastSrtName = toSrtFileName(file.name);
    previewEl.textContent = srt;
    downloadBtn.disabled = false;
  } catch (err) {
    showError(`変換に失敗しました: ${err.message}`);
  }
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  handleFile(file);
});

['dragenter', 'dragover'].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  }),
);
['dragleave', 'drop'].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  }),
);
dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

downloadBtn.addEventListener('click', () => {
  if (!lastSrt) return;
  const blob = new Blob([lastSrt], { type: 'application/x-subrip;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = lastSrtName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
