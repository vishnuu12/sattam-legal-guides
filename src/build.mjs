import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadAll, readJSON, writeFile, paths, setBase, BASE, buildSearchText } from './lib.mjs';
import * as R from './render.mjs';

const OUT = path.join(ROOT, 'site');

function main() {
  const all = loadAll();
  const situationsData = readJSON(path.join(ROOT, 'src/data/situations.json'));
  const { taxonomy, ui, synonyms, helplines } = all;

  const siteUrl = process.env.SITE_URL || taxonomy.siteUrl;
  taxonomy.siteUrl = siteUrl;
  setBase(process.env.BASE_PATH || taxonomy.basePath || '');

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const orderedIds = [
    ...taxonomy.categories.map((c) => c.slug),
    ...Object.keys(all.articles).filter((id) => !taxonomy.categories.some((c) => c.slug === id)),
  ].filter((id) => all.articles[id]);

  const pairs = orderedIds.map((id) => ({ id, en: all.articles[id].en, ta: all.articles[id].ta }));
  const ctx = { ui, taxonomy, helplines };

  // ---------- static assets ----------
  writeFile(path.join(OUT, 'assets/style.css'), fs.readFileSync(path.join(ROOT, 'src/styles/main.css'), 'utf8'));
  writeFile(path.join(OUT, 'assets/app.js'), fs.readFileSync(path.join(ROOT, 'src/client/app.js'), 'utf8'));
  // app icons (PWA)
  const iconDir = path.join(ROOT, 'src/assets/icons');
  if (fs.existsSync(iconDir)) {
    for (const ic of fs.readdirSync(iconDir)) fs.copyFileSync(path.join(iconDir, ic), path.join(OUT, ic));
  }

  // ---------- search index (both languages) ----------
  const index = pairs.map((p) => {
    const a = p.ta || p.en;
    const cat = taxonomy.categories.find((c) => c.slug === a.category);
    return {
      slug: a.slug,
      url: paths.article(a.slug),
      category: a.category,
      emoji: cat ? cat.emoji : '\u2696\uFE0F',
      catTa: cat ? cat.ta.name : a.category,
      catEn: cat ? cat.en.name : a.category,
      titleTa: (p.ta && p.ta.title) || (p.en && p.en.title),
      titleEn: (p.en && p.en.title) || (p.ta && p.ta.title),
      sumTa: (p.ta && p.ta.summary) || '',
      sumEn: (p.en && p.en.summary) || '',
      keywords: buildSearchText(p, taxonomy, synonyms),
    };
  });
  writeFile(path.join(OUT, 'assets/search-index.json'), JSON.stringify(index));

  // ---------- home ----------
  const withSrc = pairs.filter((p) => (((p.ta && p.ta.sources) || (p.en && p.en.sources) || []).length));
  let featured = null;
  if (withSrc.length) {
    const doy = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
    featured = withSrc[doy % withSrc.length];
  }
  const situations = situationsData.items.map((it) => ({ emoji: it.emoji, slug: it.slug, ta: it.ta, en: it.en }));
  const popular = [];
  for (const p of pairs) {
    const ta = (p.ta && p.ta.faqs) || [];
    const en = (p.en && p.en.faqs) || [];
    const n = Math.max(ta.length, en.length);
    for (let i = 0; i < n; i++) {
      const a = p.ta || p.en;
      popular.push({ slug: a.slug, ta: ta[i] && ta[i].q, en: en[i] && en[i].q });
    }
  }

  writeFile(path.join(OUT, 'index.html'), R.homePage(ctx, { pairs, featured, situations, popular: popular.slice(0, 8) }));

  // ---------- main pages ----------
  writeFile(path.join(OUT, 'guides', 'index.html'), R.guidesPage(ctx, { pairs }));
  writeFile(path.join(OUT, 'emergency', 'index.html'), R.emergencyPage(ctx));
  writeFile(path.join(OUT, 'about', 'index.html'), R.aboutPage(ctx));

  // ---------- templates ----------
  const templates = all.templates.templates;
  writeFile(path.join(OUT, 'templates', 'index.html'), R.templatesPage(ctx, { templates }));
  for (const tpl of templates) writeFile(path.join(OUT, 'templates', tpl.slug, 'index.html'), R.templatePage(ctx, { tpl }));

  // ---------- topic pages ----------
  for (const cat of taxonomy.categories) {
    const inCat = pairs.filter((p) => (p.ta || p.en).category === cat.slug);
    writeFile(path.join(OUT, 'topic', cat.slug, 'index.html'), R.topicPage(ctx, { category: cat, pairs: inCat }));
  }

  // ---------- article pages ----------
  for (const p of pairs) {
    const a = p.ta || p.en;
    const related = pairs.filter((x) => x.id !== p.id).slice(0, 3);
    writeFile(path.join(OUT, a.slug, 'index.html'), R.articlePage(ctx, { pair: p, related }));
  }

  // ---------- 404 ----------
  writeFile(path.join(OUT, '404.html'), R.notFoundPage(ctx));

  // ---------- sitemap + robots ----------
  const urls = [paths.home(), paths.guides(), paths.templates(), paths.emergency(), paths.about(),
    ...templates.map((tp) => paths.template(tp.slug)),
    ...taxonomy.categories.map((c) => paths.topic(c.slug)),
    ...pairs.map((p) => paths.article((p.ta || p.en).slug))];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`)
    .join('\n')}\n</urlset>`;
  writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
  writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}${BASE}/sitemap.xml\n`);

  // ---------- PWA: manifest + service worker ----------
  const manifest = {
    name: 'Sattam \u2014 Everyday law in Tamil & English',
    short_name: 'Sattam',
    description: 'Everyday Indian law, line by line in Tamil and English.',
    start_url: BASE + '/',
    scope: BASE + '/',
    display: 'standalone',
    background_color: '#f7f6f1',
    theme_color: '#0e4d3a',
    lang: 'ta',
    icons: [
      { src: BASE + '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: BASE + '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: BASE + '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  writeFile(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

  const precache = [BASE + '/', ...urls, BASE + '/assets/style.css', BASE + '/assets/app.js',
    BASE + '/assets/search-index.json', BASE + '/manifest.webmanifest'];
  const sw = `/* Sattam service worker - offline support */
const CACHE = 'sattam-v1';
const BASE = ${JSON.stringify(BASE)};
const ASSETS = ${JSON.stringify(precache)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(BASE + '/')))
  );
});
`;
  writeFile(path.join(OUT, 'sw.js'), sw);

  console.log(`\u2713 Built static site: ${pairs.length} guides, ${urls.length} pages -> site/`);
}

main();
