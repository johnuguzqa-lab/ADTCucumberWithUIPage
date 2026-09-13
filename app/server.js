// Vegetable Counter — tiny zero-dependency static server.
//
// Serves the app/ directory over HTTP so Playwright can navigate to it.
// Run with:  npm run app   (or:  node app/server.js [port])
//
// Defaults to port 8080 and only binds to 127.0.0.1.

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const APP_DIR = path.join(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://' + req.headers.host);
    // Map "/" to the app entry point and reject anything outside APP_DIR.
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    const filePath = path.normalize(path.join(APP_DIR, pathname));
    if (!filePath.startsWith(APP_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found: ' + pathname);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log('Vegetable Counter app running at http://' + HOST + ':' + PORT);
});

module.exports = server;
