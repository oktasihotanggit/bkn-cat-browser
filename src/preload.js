'use strict';

/**
 * preload.js
 *
 * Berjalan di konteks renderer sebelum halaman dimuat.
 * Karena contextIsolation: true, tidak ada akses ke window/document di sini —
 * semua injeksi header dan UA dilakukan di main.js via session.webRequest.
 *
 * File ini tetap dibutuhkan agar webPreferences.preload valid.
 * Di sini kita tambahkan perlindungan DOM tambahan.
 */

const { ipcRenderer } = require('electron');

// ─── Blokir klik kanan (context menu) ───────────────────────────────────────
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
}, true);

// ─── Blokir drag & drop file ke dalam window ────────────────────────────────
window.addEventListener('dragover',  (e) => e.preventDefault(), false);
window.addEventListener('drop',      (e) => e.preventDefault(), false);

// ─── Blokir print (Cmd+P / Ctrl+P) ─────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

// ─── Tandai bahwa ini ExamBro (bisa dibaca oleh JS server) ──────────────────
// Tidak mengekspos node API — hanya set custom property yang read-only
Object.defineProperty(window, '__examBro', {
  value: true,
  writable: false,
  enumerable: false,
  configurable: false,
});
