'use strict';

const { app, BrowserWindow, session, shell, dialog } = require('electron');
const path = require('path');

// ─── KONFIGURASI ────────────────────────────────────────────────────────────
const CONFIG = {
  // Ganti dengan URL server ujian Anda
  EXAM_URL: 'https://cat-enterprise.binakasihnusantara.sch.id',

  // String yang diinjeksi ke User-Agent
  UA_TOKEN: 'BKN-CAT-SecureBrowser',

  // Header custom yang dikirim ke server
  EXAM_HEADER_NAME: 'X-Exam-Browser',
  EXAM_HEADER_VALUE: 'BKN-CAT-SecureBrowser',

  // Splash screen duration (ms) sebelum load URL utama
  SPLASH_DURATION: 2200,
};
// ────────────────────────────────────────────────────────────────────────────

let mainWindow = null;
let splashWindow = null;

// Paksa single instance — jika sudah jalan, fokus ke window yang ada
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── User-Agent ──────────────────────────────────────────────────────────────
// Inject token SEBELUM app ready agar berlaku untuk semua request
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

app.on('ready', () => {
  // Ambil UA default Chromium lalu tambahkan token
  const defaultUA = `Mozilla/5.0 (compatible; ${CONFIG.UA_TOKEN}/1.3.0)`;

  // Set UA default di level session
  session.defaultSession.setUserAgent(defaultUA);

  // ─── Inject header X-Exam-Browser ke setiap request ke server ujian ───
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${CONFIG.EXAM_URL}/*`, `${CONFIG.EXAM_URL.replace('https://', 'http://')}/*`] },
    (details, callback) => {
      const headers = details.requestHeaders;
      headers[CONFIG.EXAM_HEADER_NAME] = CONFIG.EXAM_HEADER_VALUE;
      // Pastikan UA juga ada di setiap request
      headers['User-Agent'] = defaultUA;
      callback({ requestHeaders: headers });
    }
  );

  // Blokir navigasi ke domain lain
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      const allowed = isAllowedUrl(details.url);
      callback({ cancel: !allowed });
    }
  );

  createSplash();
});

// ─── Cek URL yang diizinkan ──────────────────────────────────────────────────
function isAllowedUrl(url) {
  if (!url) return false;

  const allowedPrefixes = [
    CONFIG.EXAM_URL,
    CONFIG.EXAM_URL.replace('https://', 'http://'),
    // Aset CDN yang umum dipakai (Bootstrap, FontAwesome, Google Fonts)
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    // Electron internal
    'devtools://',
    'chrome-extension://',
    'about:',
    'data:',
    'blob:',
  ];

  return allowedPrefixes.some(prefix => url.startsWith(prefix));
}

// ─── Splash Screen ───────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  setTimeout(() => {
    createMain();
  }, CONFIG.SPLASH_DURATION);
}

// ─── Main Window ─────────────────────────────────────────────────────────────
function createMain() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: 'BKN CAT — Ujian Online',
    // Kiosk mode: fullscreen, tanpa menu, tanpa address bar
    kiosk: true,
    fullscreen: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Keamanan
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Disable DevTools di production
      devTools: false,
    },
  });

  // Hapus menu bar sepenuhnya
  mainWindow.setMenu(null);

  mainWindow.loadURL(CONFIG.EXAM_URL);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Jika gagal load — tampilkan halaman error
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, url) => {
    console.error(`Load failed [${errorCode}] ${errorDesc} — ${url}`);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // Blokir buka tab/jendela baru
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Blokir navigasi keluar dari domain ujian
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!isAllowedUrl(url)) {
      e.preventDefault();
    }
  });

  // Cegah download file
  session.defaultSession.on('will-download', (e) => {
    e.preventDefault();
  });

  // ── Keyboard shortcut lockdown ──────────────────────────────────────────
  mainWindow.webContents.on('before-input-event', (e, input) => {
    const blocked = [
      // DevTools
      input.key === 'F12',
      input.key === 'F11',
      // Refresh
      input.key === 'F5',
      (input.control || input.meta) && input.key === 'r',
      (input.control || input.meta) && input.shift && input.key === 'i',
      // Copy/paste tidak diblokir — hanya navigasi
      (input.control || input.meta) && input.key === 'w',
      (input.control || input.meta) && input.key === 'q',
      // Alt+F4 Windows
      input.alt && input.key === 'F4',
      // Cmd+M (minimize) Mac
      input.meta && input.key === 'm',
      // Cmd+H (hide) Mac
      input.meta && input.key === 'h',
      // Escape dari kiosk
      input.key === 'Escape',
    ];

    if (blocked.some(Boolean)) {
      e.preventDefault();
    }
  });

  // Paksa selalu fullscreen/kiosk jika user mencoba keluar
  mainWindow.on('leave-full-screen', () => mainWindow.setFullScreen(true));
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.focus();
  });
}

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.on('window-all-closed', () => {
  // Jangan quit — kiosk tidak boleh ditutup
});

app.on('activate', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
  }
});

// Cegah quit via Cmd+Q atau system
app.on('before-quit', (e) => {
  e.preventDefault();
});
