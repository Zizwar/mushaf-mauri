"use strict";

/**
 * Mushaf MA Lite — server
 *
 * A small, production-lean backend for a Quran recitation recording app.
 * Users upload m4a recordings, get a share link (/r/:id) and can optionally
 * publish to a public gallery (GET /api/recitations).
 *
 * Plain env vars (no dotenv) — see .env.example.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const express = require("express");
const multer = require("multer");
const cors = require("cors");

// ---------------------------------------------------------------------------
// Config (env vars with defaults)
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT, 10) || 4000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB, 10) || 50;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "uploads"));

const DB_FILE = path.join(DATA_DIR, "recitations.json");

// ---------------------------------------------------------------------------
// Storage: dirs + JSON metadata with atomic writes
// ---------------------------------------------------------------------------

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** @type {Array<object>} */
let recitations = [];
try {
  recitations = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  if (!Array.isArray(recitations)) recitations = [];
} catch (err) {
  if (err.code !== "ENOENT") {
    console.error(`Warning: could not read ${DB_FILE} (${err.message}); starting empty.`);
  }
  recitations = [];
}

function saveRecitations() {
  const tmp = DB_FILE + "." + crypto.randomBytes(4).toString("hex") + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(recitations, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic on the same filesystem
}

const audioPath = (id) => path.join(UPLOADS_DIR, `${id}.m4a`);
const newId = () => crypto.randomBytes(6).toString("base64url");
const newOwnerToken = () => crypto.randomBytes(24).toString("base64url");

// ---------------------------------------------------------------------------
// Sura names (114, Arabic) + helpers
// ---------------------------------------------------------------------------

// prettier-ignore
const SURA_NAMES = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
  "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
  "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
  "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
  "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
  "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
  "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
  "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
  "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
  "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
  "المسد","الإخلاص","الفلق","الناس"
];

const RIWAYA_LABELS = { warsh: "ورش", hafs: "حفص" };

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function parseIntField(value) {
  if (typeof value !== "string" || value.trim() === "") return NaN;
  const n = Number(value.trim());
  return Number.isInteger(n) ? n : NaN;
}

function parseBoolField(value) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function publicView(rec) {
  const { ownerToken, ...meta } = rec;
  return {
    ...meta,
    shareUrl: `${BASE_URL}/r/${rec.id}`,
    audioUrl: `${BASE_URL}/api/recitations/${rec.id}/audio`,
  };
}

// ---------------------------------------------------------------------------
// Naive in-memory rate limit: max 20 uploads / hour / IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const uploadHits = new Map(); // ip -> [timestamps]

function uploadRateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const hits = (uploadHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    uploadHits.set(ip, hits);
    return res.status(429).json({ error: "Too many uploads, try again later." });
  }
  hits.push(now);
  uploadHits.set(ip, hits);
  next();
}

// Periodically drop stale IPs so the Map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of uploadHits) {
    const fresh = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) uploadHits.delete(ip);
    else uploadHits.set(ip, fresh);
  }
}, 10 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

// --- POST /api/recitations — upload a recitation -----------------------------

app.post("/api/recitations", uploadRateLimit, upload.single("audio"), (req, res, next) => {
  try {
    const body = req.body || {};

    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return badRequest(res, 'Missing audio file (multipart field "audio").');
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return badRequest(res, "title is required.");
    if (title.length > 200) return badRequest(res, "title must be at most 200 characters.");

    const reciterName = typeof body.reciterName === "string" ? body.reciterName.trim() : "";
    if (reciterName.length > 80) return badRequest(res, "reciterName must be at most 80 characters.");

    let sura = null;
    if (body.sura !== undefined && body.sura !== "") {
      sura = parseIntField(body.sura);
      if (Number.isNaN(sura) || sura < 1 || sura > 114) {
        return badRequest(res, "sura must be an integer between 1 and 114.");
      }
    }

    let ayaFrom = null;
    if (body.ayaFrom !== undefined && body.ayaFrom !== "") {
      ayaFrom = parseIntField(body.ayaFrom);
      if (Number.isNaN(ayaFrom) || ayaFrom < 1) {
        return badRequest(res, "ayaFrom must be an integer >= 1.");
      }
    }

    let ayaTo = null;
    if (body.ayaTo !== undefined && body.ayaTo !== "") {
      ayaTo = parseIntField(body.ayaTo);
      if (Number.isNaN(ayaTo) || ayaTo < 1) {
        return badRequest(res, "ayaTo must be an integer >= 1.");
      }
      if (ayaFrom !== null && ayaTo < ayaFrom) {
        return badRequest(res, "ayaTo must be >= ayaFrom.");
      }
    }

    let riwaya = null;
    if (body.riwaya !== undefined && body.riwaya !== "") {
      riwaya = String(body.riwaya).trim().toLowerCase();
      if (riwaya !== "warsh" && riwaya !== "hafs") {
        return badRequest(res, 'riwaya must be "warsh" or "hafs".');
      }
    }

    let duration = null;
    if (body.duration !== undefined && body.duration !== "") {
      duration = Number(body.duration);
      if (!Number.isFinite(duration) || duration < 0) {
        return badRequest(res, "duration must be a non-negative number of seconds.");
      }
    }

    let isPublic = false;
    if (body.isPublic !== undefined && body.isPublic !== "") {
      const parsed = parseBoolField(String(body.isPublic).trim().toLowerCase());
      if (parsed === null) return badRequest(res, 'isPublic must be "1", "0", "true" or "false".');
      isPublic = parsed;
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 500) return badRequest(res, "note must be at most 500 characters.");

    const id = newId();
    const ownerToken = newOwnerToken();

    fs.writeFileSync(audioPath(id), req.file.buffer);

    const rec = {
      id,
      title,
      reciterName,
      sura,
      ayaFrom,
      ayaTo,
      riwaya,
      duration,
      isPublic,
      note,
      size: req.file.buffer.length,
      createdAt: new Date().toISOString(),
      ownerToken,
    };
    recitations.push(rec);
    saveRecitations();

    res.status(201).json({
      id,
      shareUrl: `${BASE_URL}/r/${id}`,
      audioUrl: `${BASE_URL}/api/recitations/${id}/audio`,
      ownerToken,
      isPublic,
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/recitations — public gallery -----------------------------------

app.get("/api/recitations", (req, res) => {
  let items = recitations.filter((r) => r.isPublic);

  const sura = parseIntField(String(req.query.sura || ""));
  if (!Number.isNaN(sura)) items = items.filter((r) => r.sura === sura);

  const riwaya = String(req.query.riwaya || "").trim().toLowerCase();
  if (riwaya) items = items.filter((r) => r.riwaya === riwaya);

  const q = String(req.query.q || "").trim().toLowerCase();
  if (q) {
    items = items.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.reciterName || "").toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first

  const total = items.length;
  let limit = parseIntField(String(req.query.limit || ""));
  if (Number.isNaN(limit) || limit < 1) limit = 50;
  limit = Math.min(limit, 100);
  let offset = parseIntField(String(req.query.offset || ""));
  if (Number.isNaN(offset) || offset < 0) offset = 0;

  res.json({ total, items: items.slice(offset, offset + limit).map(publicView) });
});

// --- GET /api/recitations/:id — meta (unlisted reachable by link) -------------

app.get("/api/recitations/:id", (req, res) => {
  const rec = recitations.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: "Recitation not found." });
  res.json(publicView(rec));
});

// --- GET /api/recitations/:id/audio — stream with Range support ---------------

app.get("/api/recitations/:id/audio", (req, res) => {
  const rec = recitations.find((r) => r.id === req.params.id);
  const file = rec && audioPath(rec.id);
  if (!rec || !fs.existsSync(file)) {
    return res.status(404).json({ error: "Audio not found." });
  }
  // Express sendFile handles Range / 206 responses.
  res.sendFile(file, {
    headers: {
      "Content-Type": "audio/mp4",
      "Content-Disposition": `inline; filename="${rec.id}.m4a"`,
    },
  });
});

// --- DELETE /api/recitations/:id — owner only ---------------------------------

app.delete("/api/recitations/:id", (req, res) => {
  const rec = recitations.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: "Recitation not found." });

  const token = req.get("x-owner-token") || "";
  const a = Buffer.from(token);
  const b = Buffer.from(rec.ownerToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Invalid owner token." });
  }

  try {
    fs.unlinkSync(audioPath(rec.id));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  recitations = recitations.filter((r) => r.id !== rec.id);
  saveRecitations();
  res.status(204).end();
});

// --- GET /r/:id — share page ---------------------------------------------------

app.get("/r/:id", (req, res) => {
  const rec = recitations.find((r) => r.id === req.params.id);
  if (!rec) {
    return res
      .status(404)
      .type("html")
      .send(sharePageShell("غير موجود", '<p class="muted">هذه التلاوة غير موجودة أو تم حذفها.</p>'));
  }

  const audioUrl = `${BASE_URL}/api/recitations/${rec.id}/audio`;
  const suraLine =
    rec.sura && rec.ayaFrom && rec.ayaTo
      ? `سورة ${SURA_NAMES[rec.sura - 1]} — الآيات ${rec.ayaFrom}-${rec.ayaTo}`
      : rec.sura
        ? `سورة ${SURA_NAMES[rec.sura - 1]}`
        : "";
  const riwayaLabel = rec.riwaya ? RIWAYA_LABELS[rec.riwaya] : "";

  const body = `
    <h1>${escapeHtml(rec.title)}</h1>
    ${rec.reciterName ? `<p class="reciter">${escapeHtml(rec.reciterName)}</p>` : ""}
    <div class="tags">
      ${suraLine ? `<span class="tag">${escapeHtml(suraLine)}</span>` : ""}
      ${riwayaLabel ? `<span class="tag riwaya">رواية ${escapeHtml(riwayaLabel)}</span>` : ""}
    </div>
    <audio controls preload="metadata" src="${escapeHtml(audioUrl)}"></audio>
    <p class="dl"><a href="${escapeHtml(audioUrl)}" download="${escapeHtml(rec.id)}.m4a">⬇ تحميل التلاوة</a></p>
    ${rec.note ? `<p class="note">${escapeHtml(rec.note)}</p>` : ""}`;

  res.type("html").send(sharePageShell(rec.title, body));
});

function sharePageShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Mushaf MA Lite</title>
<style>
  :root { color-scheme: dark light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", system-ui, sans-serif;
    background: radial-gradient(1200px 600px at 50% -10%, #1d3a34 0%, #0d1615 55%, #0a100f 100%);
    color: #e9efec;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 560px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 36px 32px 28px;
    text-align: center;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
  }
  .bismillah { color: #c9a86a; font-size: 15px; letter-spacing: 1px; margin-bottom: 18px; }
  h1 { font-size: 26px; font-weight: 700; line-height: 1.4; margin-bottom: 6px; color: #f4f7f5; }
  .reciter { color: #9fb8ae; font-size: 16px; margin-bottom: 14px; }
  .tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
  .tag {
    display: inline-block;
    background: rgba(76, 175, 130, 0.14);
    border: 1px solid rgba(76, 175, 130, 0.35);
    color: #9fd8bd;
    border-radius: 999px;
    padding: 5px 14px;
    font-size: 14px;
  }
  .tag.riwaya { background: rgba(201, 168, 106, 0.12); border-color: rgba(201, 168, 106, 0.4); color: #dcc494; }
  audio { width: 100%; margin: 4px 0 16px; }
  .dl a { color: #7fcfa8; text-decoration: none; font-size: 15px; }
  .dl a:hover { text-decoration: underline; }
  .note { color: #b9c8c1; font-size: 14px; line-height: 1.7; margin-top: 14px; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 14px; }
  .muted { color: #93a59d; font-size: 16px; }
  footer { margin-top: 26px; color: #6d7f77; font-size: 13px; letter-spacing: 0.5px; }
  @media (prefers-color-scheme: light) {
    body { background: radial-gradient(1200px 600px at 50% -10%, #dff0e8 0%, #f2f6f4 60%, #eef2f0 100%); color: #1c2a25; }
    .card { background: #ffffff; border-color: #dde6e1; box-shadow: 0 14px 40px rgba(30, 60, 50, 0.12); }
    h1 { color: #17342a; }
    .reciter { color: #4e6a5f; }
    .tag { background: #e6f4ec; border-color: #b9dcc9; color: #1f6b47; }
    .tag.riwaya { background: #f7f0e0; border-color: #e0cfa4; color: #8a6d2f; }
    .dl a { color: #1f6b47; }
    .note { color: #45564f; border-top-color: #dbe4df; }
    .muted { color: #66776f; }
    footer { color: #8b9a93; }
  }
</style>
</head>
<body>
  <main class="card">
    <div class="bismillah">﷽</div>
    ${bodyHtml}
    <footer>Mushaf MA Lite</footer>
  </main>
</body>
</html>`;
}

// --- GET /api/health -----------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ ok: true, count: recitations.length });
});

// --- 404 + central error handler -------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large (max ${MAX_UPLOAD_MB} MB).` });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Mushaf MA Lite server listening on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Data: ${DB_FILE} | Uploads: ${UPLOADS_DIR} | Max upload: ${MAX_UPLOAD_MB} MB`);
});
