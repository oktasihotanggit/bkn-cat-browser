# BKN CAT Browser — ExamBro

Secure exam browser berbasis Electron untuk CAT ujian online SMA Unggul Binakasih Nusantara.

Setiap request ke server ujian otomatis menyertakan:
- **User-Agent:** `BKN-CAT-SecureBrowser`
- **Header:** `X-Exam-Browser: BKN-CAT-SecureBrowser`

---

## Struktur Project

```
exambro/
├── src/
│   ├── main.js        ← Entry point Electron (kiosk, UA/header injection)
│   ├── preload.js     ← Blokir context menu, drag-drop, print
│   ├── splash.html    ← Loading screen
│   └── error.html     ← Halaman jika koneksi gagal
├── assets/
│   ├── icon.icns      ← Icon macOS (512×512, format ICNS)
│   ├── icon.ico       ← Icon Windows (256×256, format ICO)
│   └── icon.png       ← Sumber icon (512×512 PNG)
├── .github/
│   └── workflows/
│       └── build.yml  ← GitHub Actions CI/CD
├── package.json
└── README.md
```

---

## ⚙️ Ganti URL Server

Buka `src/main.js`, ubah baris berikut:

```js
const CONFIG = {
  EXAM_URL: 'https://catterbaru.com',   // ← ganti ini
  ...
};
```

Commit & push, lalu buat tag baru untuk trigger build otomatis.

---

## 🚀 Cara Build & Release

### Via GitHub Actions (Otomatis — Direkomendasikan)

Cukup buat git tag baru:

```bash
git tag v1.3.0
git push origin v1.3.0
```

GitHub Actions akan:
1. Build **macOS Universal DMG** (arm64 + x64) di runner `macos-latest`
2. Build **Windows Portable EXE** (x64) di runner `windows-latest`
3. Buat GitHub Release dengan kedua file siap download

> Tidak perlu Mac untuk build macOS — GitHub menyediakan runner-nya.

---

### Build Manual (Lokal)

Butuh: Node.js 20+

```bash
# Install dependencies
npm install

# Build macOS Universal (hanya bisa di mesin macOS)
npm run build:mac

# Build Windows Portable (bisa di Windows atau WSL)
npm run build:win
```

Output ada di folder `dist/`.

---

## 📦 Cara Setup GitHub Repository

```bash
# 1. Masuk ke folder exambro
cd exambro

# 2. Init git
git init
git add .
git commit -m "feat: initial ExamBro build"

# 3. Buat repo baru di GitHub (github.com/new), lalu:
git remote add origin https://github.com/USERNAME/bkn-cat-browser.git
git branch -M main
git push -u origin main

# 4. Buat release pertama
git tag v1.3.0
git push origin v1.3.0
```

GitHub Actions langsung jalan — tunggu ~5–10 menit, cek tab **Releases**.

---

## 🔒 Fitur Keamanan

| Fitur | Status |
|---|---|
| Kiosk mode (fullscreen penuh) | ✅ |
| Blokir DevTools (F12) | ✅ |
| Blokir refresh (F5, Ctrl+R) | ✅ |
| Blokir close/quit (Cmd+Q, Alt+F4) | ✅ |
| Blokir minimize (Cmd+M) | ✅ |
| Blokir klik kanan | ✅ |
| Blokir buka tab/jendela baru | ✅ |
| Blokir navigasi ke domain lain | ✅ |
| Blokir download file | ✅ |
| Inject UA `BKN-CAT-SecureBrowser` | ✅ |
| Inject header `X-Exam-Browser` | ✅ |
| Single instance (1 jendela saja) | ✅ |

---

## 🖼️ Menambahkan Icon

Taruh file berikut di folder `assets/`:

- `icon.png` — 512×512 PNG (sumber)
- `icon.icns` — untuk macOS (bisa convert dari PNG dengan [png2icns](https://cloudconvert.com/png-to-icns))
- `icon.ico` — untuk Windows (bisa convert dari PNG dengan [convertio.co](https://convertio.co/png-ico/))

Jika tidak ada icon, electron-builder akan pakai icon default Electron.

---

## 🔄 Update Versi

1. Edit `version` di `package.json`
2. Edit versi di `src/splash.html` (baris `.version`)
3. Commit & push tag baru

```bash
git add package.json src/splash.html
git commit -m "chore: bump version to v1.4.0"
git tag v1.4.0
git push origin main v1.4.0
```
