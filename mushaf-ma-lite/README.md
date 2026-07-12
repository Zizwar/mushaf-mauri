# Mushaf MA Lite — مصحف MA لايت

**رفيق المرتّلين والمجوّدين** · The reciter's companion · Le compagnon du récitateur

A lightweight, standalone Quran **recitation recording** app extracted from the
[Mushaf Mauri](../README.md) project. Read the Quran as **text** (no page
images) in **Warsh** and **Hafs** riwayat, record your voice like a professional
reciter, keep notes on every take, and share your recitations — locally or
through a tiny self-hosted server.

## Features · المميزات

- 🎙 **Two recording modes / وضعا تسجيل**
  - **آية بآية (Ayah-by-ayah)** — tap or hold to record each ayah, auto-advance
    to the next one, re-record any ayah, green check on recorded ayahs.
  - **تلاوة متواصلة (Continuous)** — record a whole surah or any range in one
    take with **pause/resume**, a live timer, an input level meter, and ayah
    **markers** logged as you advance (tap them later to jump inside the
    recording).
- 📖 **Text-only mushaf** — Warsh text (Maghribi font) and Hafs text (Hafs
  font), adjustable font & size, ayah highlighting, RTL-first UI.
- 🎧 **Compare with famous reciters** — stream any ayah by Al-Husary,
  Al-Minshawy, Abdul Basit and others, or play *your take then the reciter's*
  back-to-back.
- 🗂 **قراءتي (My Recitations)** — all takes with duration, date, riwaya,
  filters, sequential play-all.
- 📝 **Notes per recording** — **text** notes *and* **voice** notes
  (e.g. tajweed remarks from your sheikh).
- 📤 **Sharing**
  - Share the raw audio file via the system share sheet.
  - Export/import **`.mlrec`** backup files (audio + notes + metadata).
  - **Upload to your own server** → get a share link with a web player, and
    optionally publish to the in-app **public gallery**.
- 🌍 **Trilingual**: العربية (default, RTL) · English · Français.
- 🎨 4 themes (white / sepia / green / night), automatic dark-mode friendly.

## Quick start · التشغيل السريع

```bash
# The app (Expo)
cd mushaf-ma-lite
npm install
npm start            # then open in Expo Go / dev client

# The sharing server (optional feature)
cd mushaf-ma-lite/server
npm install
npm start            # http://localhost:4000 — see server/README.md
```

In the app: **Settings → Server URL** → e.g. `http://192.168.1.10:4000` →
*Test connection*. Then any recording can be uploaded from
**قراءتي → (recording) → رفع والحصول على رابط**.

## Project layout

```
mushaf-ma-lite/
├── App.tsx                  # screen switch (no react-navigation), fonts, deep links
├── src/
│   ├── screens/             # Home, Recorder (core), Recitations (قراءتي), Gallery, Settings
│   ├── hooks/               # useQuranRecorder (takes + sessions), usePlayer
│   ├── utils/               # recitationsStore (files + index.json), quranText, serverApi
│   ├── data/                # Warsh & Hafs texts, surah metadata, reciters, French names
│   ├── i18n/                # ar / en / fr
│   └── theme/               # themes + brand colors
└── server/                  # small Express server: upload, share links, public gallery
```

## Data & storage

- **Quran text**: pure-JS bundles — Warsh (6,214 ayahs, Muhammadi mushaf
  orthography) from `textWarsh.ts`, Hafs (6,236 ayahs) from `ayatJson.js` —
  both inherited from Mushaf Mauri. No SQLite, no network needed to read.
- **Recordings** live on-device under `Documents/recitations/`:
  `audio/{id}.m4a`, voice notes in `notes/{id}.m4a`, metadata in `index.json`
  (type, sura, ayah range, riwaya, duration, date, note, markers, upload info).
- Nothing leaves the device unless you explicitly share or upload.

## Credits

Built on the **Mushaf Mauri** project (recording engine, Quran text data,
fonts, i18n patterns). Comparison audio streamed from quran.ksu.edu.sa.
