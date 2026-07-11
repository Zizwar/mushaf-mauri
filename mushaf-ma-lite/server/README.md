# Mushaf MA Lite — Server

خادم بسيط لتطبيق «مصحف MA لايت»: يستقبل تسجيلات التلاوة (m4a)، ويعطيك رابط مشاركة أنيقًا، ويتيح نشر التلاوة في معرض عام اختياريًا. لا يحتاج قاعدة بيانات — كل شيء ملفات على القرص.

A small, production-lean Node.js backend for the **Mushaf MA Lite** recitation recording app. Users upload their recorded recitations (m4a audio), receive a share link (`/r/:id`), and can optionally publish to a public gallery. No database — audio files on disk plus a single JSON metadata file with atomic writes.

- **Stack:** Node >= 18, Express 4, Multer 1.x, CORS. Plain CommonJS, no build step.
- **Storage:** `uploads/{id}.m4a` + `data/recitations.json`.

## Quickstart

```bash
npm install
npm start          # listens on http://localhost:4000
# development (auto-restart on change):
npm run dev
```

## Environment variables

Plain env vars — no `.env` file is loaded (no dotenv). See `.env.example`.

| Variable        | Default                  | Description                                              |
| --------------- | ------------------------ | -------------------------------------------------------- |
| `PORT`          | `4000`                   | HTTP port.                                               |
| `BASE_URL`      | `http://localhost:PORT`  | Public base URL used in `shareUrl`/`audioUrl`.            |
| `MAX_UPLOAD_MB` | `50`                     | Max audio upload size (MB). Larger uploads get **413**.   |
| `DATA_DIR`      | `./data`                 | Where `recitations.json` lives. Created on boot.          |
| `UPLOADS_DIR`   | `./uploads`              | Where `{id}.m4a` files live. Created on boot.             |

## API reference

All responses are JSON unless noted. Errors: `{ "error": "message" }`.

### `POST /api/recitations` — upload a recitation

`multipart/form-data`. Rate limited: max **20 uploads per hour per IP** (→ 429).

| Field         | Type   | Rules                                             |
| ------------- | ------ | ------------------------------------------------- |
| `audio`       | file   | **required**, the m4a recording                   |
| `title`       | text   | **required**, trimmed, max 200 chars              |
| `reciterName` | text   | optional, max 80 chars                            |
| `sura`        | text   | optional, integer 1..114                          |
| `ayaFrom`     | text   | optional, integer >= 1                            |
| `ayaTo`       | text   | optional, integer >= `ayaFrom`                    |
| `riwaya`      | text   | optional, `warsh` or `hafs`                       |
| `duration`    | text   | optional, seconds (float)                         |
| `isPublic`    | text   | optional, `1`/`0`/`true`/`false` (default `0`)    |
| `note`        | text   | optional, max 500 chars                           |

**201 response:**

```json
{
  "id": "Ab3xY9zQ",
  "shareUrl": "http://localhost:4000/r/Ab3xY9zQ",
  "audioUrl": "http://localhost:4000/api/recitations/Ab3xY9zQ/audio",
  "ownerToken": "…keep this secret, needed to delete…",
  "isPublic": true
}
```

Store the `ownerToken` on the device — it is shown only once and is required to delete the recitation.

```bash
curl -X POST http://localhost:4000/api/recitations \
  -F "audio=@recitation.m4a" \
  -F "title=تلاوة سورة الفاتحة" \
  -F "reciterName=محمد" \
  -F "sura=1" -F "ayaFrom=1" -F "ayaTo=7" \
  -F "riwaya=warsh" \
  -F "duration=42.5" \
  -F "isPublic=1"
```

### `GET /api/recitations` — public gallery

Lists **public** recitations only, newest first. `ownerToken` is never included.

Query params: `sura` (1..114), `riwaya` (`warsh`|`hafs`), `q` (case-insensitive match on title/reciterName), `limit` (default 50, max 100), `offset` (default 0).

**200 response:** `{ "total": 12, "items": [ { …meta, "shareUrl", "audioUrl" } ] }`

```bash
curl "http://localhost:4000/api/recitations?riwaya=warsh&q=الفاتحة&limit=10"
```

### `GET /api/recitations/:id` — metadata

Returns metadata for any existing id, including unlisted ones (share-by-link is intentional). Never includes `ownerToken`. 404 if unknown.

```bash
curl http://localhost:4000/api/recitations/Ab3xY9zQ
```

### `GET /api/recitations/:id/audio` — audio stream

Streams the m4a (`Content-Type: audio/mp4`) with **HTTP Range** support, so seeking works in `<audio>` players. 404 if missing.

```bash
curl -H "Range: bytes=0-1023" -o clip.m4a http://localhost:4000/api/recitations/Ab3xY9zQ/audio
```

### `DELETE /api/recitations/:id` — delete (owner only)

Requires header `x-owner-token` matching the token returned at upload. Deletes the audio file and the metadata entry. **204** on success, **403** on bad token, **404** on unknown id.

```bash
curl -X DELETE http://localhost:4000/api/recitations/Ab3xY9zQ \
  -H "x-owner-token: YOUR_OWNER_TOKEN"
```

### `GET /r/:id` — share page

A minimal RTL, dark-friendly HTML page with the title, reciter, sura/ayas, riwaya, an audio player and a download link. All user-provided strings are HTML-escaped.

### `GET /api/health`

```json
{ "ok": true, "count": 3 }
```

## Deployment notes

- **pm2:**

  ```bash
  npm i -g pm2
  PORT=4000 BASE_URL=https://recite.example.com pm2 start index.js --name mushaf-ma-lite
  pm2 save
  ```

- **Reverse proxy (nginx/Caddy):** proxy your public host to `127.0.0.1:4000` and raise the proxy body-size limit to at least `MAX_UPLOAD_MB` (nginx: `client_max_body_size 50m;`).
- **Set `BASE_URL`** to the public address (e.g. `https://recite.example.com`) — it is baked into `shareUrl`/`audioUrl` and the share page, so links break if it is wrong.
- **Back up** `data/recitations.json` and the `uploads/` folder together; they are the whole state.

## Connecting the app

في التطبيق: **الإعدادات ← عنوان الخادم (Settings → Server URL)** ثم أدخل عنوان هذا الخادم.

In the Mushaf MA Lite app, open **Settings → Server URL** and enter this server's address, e.g. `http://192.168.1.10:4000` on your LAN, or your public `BASE_URL` in production.
