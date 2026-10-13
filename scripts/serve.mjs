#!/usr/bin/env node
// Minimal static preview server for dist/ with clean-URL support.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/lib.mjs';

const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  let p = path.join(DIST, clean);
  if (!p.startsWith(DIST)) return null;
  if (clean.endsWith('/')) p = path.join(p, 'index.html');
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) {
    const withHtml = p + '.html';
    if (fs.existsSync(withHtml)) return withHtml;
    return path.join(DIST, '404.html');
  }
  return p;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url);
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file);
    const code = file.endsWith('404.html') ? 404 : 200;
    res.writeHead(code, { 'content-type': TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Sattam preview: http://localhost:${PORT}`));
