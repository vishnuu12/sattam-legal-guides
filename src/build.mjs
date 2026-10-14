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

  console.log(`\u2713 Built static site: ${pairs.length} guides, ${urls.length} pages -> site/`);
}

main();
