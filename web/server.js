const express = require('express');
const https   = require('https');
const path    = require('path');

const app  = express();
const PORT = 8080;

// ==========================================================
// Serve static files (index.html, qurantxtdb.db, etc.)
// ==========================================================
app.use(express.static(path.join(__dirname), {
  // No cache for development
  maxAge: 0,
  setHeaders(res, filePath) {
    // Proper MIME for .db files so fetch() works
    if (filePath.endsWith('.db')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// ==========================================================
// Audio proxy: /audio/:folder/:file
// ----------------------------------------------------------
// Proxies audio from audio.al-mushaf.com with Range support
// for seeking. This is the ONLY remote dependency.
//
// Example: /audio/alkouchi/alkouchi-001-1.mp3
//   → https://audio.al-mushaf.com/alkouchi/alkouchi-001-1.mp3
// ==========================================================
app.get('/audio/:folder/:file', (req, res) => {
  const { folder, file } = req.params;

  // Sanitize: only allow alphanumeric, dash, dot
  if (!/^[a-z0-9._-]+$/i.test(folder) || !/^[a-z0-9._-]+$/i.test(file)) {
    return res.status(400).send('Invalid path');
  }

  const remotePath = '/' + folder + '/' + file;
  const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' };

  // Forward Range header for seeking in MP3
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  const proxyReq = https.request({
    hostname: 'audio.al-mushaf.com',
    path: remotePath,
    method: 'GET',
    headers
  }, (proxyRes) => {
    // Forward relevant headers
    const fwd = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    fwd.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.status(502).send('Audio proxy error: ' + e.message);
  });
  proxyReq.end();
});

// ==========================================================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Audio proxy: /audio/{folder}/{file}.mp3`);
});
