import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LANGS, loadAll, readJSON, writeFile, paths, otherLang, buildSearchText } from './lib.mjs';
import * as R from './render.mjs';

const DIST = path.join(ROOT, 'dist');

function clean() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function main() {
  const all = loadAll();
  const situations = readJSON(path.join(ROOT, 'src/data/situations.json'));
  clean();

  const { taxonomy, ui, synonyms, helplines } = all;
  const siteUrl = taxonomy.siteUrl;

  const orderedIds = [
    ...taxonomy.categories.map((c) => c.slug),
    ...Object.keys(all.articles).filter((id) => !taxonomy.categories.some((c) => c.slug === id)),
  ].filter((id) => all.articles[id]);

  const resolve = (lang, id) => {
    const pair = all.articles[id] || {};
    if (pair[lang]) return { id, article: pair[lang], isFallback: false };
    const src = pair[otherLang(lang)];
    return { id, article: { ...src, lang: otherLang(lang) }, isFallback: true };
  };

  const ctxFor = (lang) => ({ lang, ui, taxonomy, helplines });
  const alt = (en, ta) => ({ en, ta });

  // ---------- static assets ----------
  writeFile(path.join(DIST, 'assets/styles.css'), fs.readFileSync(path.join(ROOT, 'src/styles/main.css'), 'utf8'));
  writeFile(path.join(DIST, 'assets/app.js'), fs.readFileSync(path.join(ROOT, 'src/client/app.js'), 'utf8'));

  // ---------- search index ----------
  const index = [];
  for (const lang of LANGS) {
    for (const id of orderedIds) {
      const a = (all.articles[id] || {})[lang];
      if (!a) continue;
      const cat = taxonomy.categories.find((c) => c.slug === a.category);
      index.push({
        id: a.id,
        lang,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        url: paths.article(lang, a.slug),
        category: a.category,
        categoryName: cat ? cat[lang].name : a.category,
        emoji: cat ? cat.emoji : '\u2696\uFE0F',
        keywords: buildSearchText(a, taxonomy, synonyms),
      });
    }
  }
  writeFile(path.join(DIST, 'assets/search-index.json'), JSON.stringify(index));

  const sitemap = [];
  const seen = new Set();
  const addUrl = (loc, en, ta) => {
    if (seen.has(loc)) return;
    seen.add(loc);
    sitemap.push({ loc: siteUrl + loc, en: siteUrl + en, ta: siteUrl + ta });
  };

  // ---------- per-language pages ----------
  for (const lang of LANGS) {
    const ctx = ctxFor(lang);
    const resolved = orderedIds.map((id) => resolve(lang, id));
    const articles = resolved.map((r) => r.article);

    // Home
    const withSrc = resolved.filter((r) => (r.article.sources || []).length);
    let featured = null;
    if (withSrc.length) {
      const doy = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
      featured = withSrc[doy % withSrc.length].article;
    }
    const situationsForLang = situations.items.map((it) => ({ emoji: it.emoji, text: it[lang] || it.en, slug: it.slug }));
    const popular = [];
    for (const r of resolved) for (const f of r.article.faqs || []) popular.push({ q: f.q, slug: r.article.slug });
    const popularTop = popular.slice(0, 6);

    writeFile(
      path.join(DIST, lang, 'index.html'),
      R.homePage(ctx, { articles, featured, situations: situationsForLang, popular: popularTop, alt: alt(paths.home('en'), paths.home('ta')) })
    );
    addUrl(paths.home(lang), paths.home('en'), paths.home('ta'));

    // Guides
    writeFile(
      path.join(DIST, lang, 'guides', 'index.html'),
      R.guidesPage(ctx, { articles, alt: alt(paths.guides('en'), paths.guides('ta')) })
    );
    addUrl(paths.guides(lang), paths.guides('en'), paths.guides('ta'));

    // Emergency / About / Disclaimer
    writeFile(path.join(DIST, lang, 'emergency', 'index.html'), R.emergencyPage(ctx, { alt: alt(paths.emergency('en'), paths.emergency('ta')) }));
    addUrl(paths.emergency(lang), paths.emergency('en'), paths.emergency('ta'));
    writeFile(path.join(DIST, lang, 'about', 'index.html'), R.aboutPage(ctx, { alt: alt(paths.about('en'), paths.about('ta')) }));
    addUrl(paths.about(lang), paths.about('en'), paths.about('ta'));
    writeFile(path.join(DIST, lang, 'disclaimer', 'index.html'), R.disclaimerPage(ctx, { alt: alt(paths.disclaimer('en'), paths.disclaimer('ta')) }));
    addUrl(paths.disclaimer(lang), paths.disclaimer('en'), paths.disclaimer('ta'));

    // Category pages
    for (const cat of taxonomy.categories) {
      const inCat = resolved.filter((r) => r.article.category === cat.slug).map((r) => r.article);
      writeFile(
        path.join(DIST, lang, 'category', cat.slug, 'index.html'),
        R.categoryPage(ctx, { category: cat, articles: inCat, alt: alt(paths.category('en', cat.slug), paths.category('ta', cat.slug)) })
      );
      addUrl(paths.category(lang, cat.slug), paths.category('en', cat.slug), paths.category('ta', cat.slug));
    }

    // Article pages
    for (const r of resolved) {
      const a = r.article;
      const related = resolved
        .filter((x) => x.id !== r.id)
        .slice(0, 3)
        .map((x) => x.article);
      writeFile(
        path.join(DIST, lang, a.slug, 'index.html'),
        R.articlePage(ctx, { article: a, related, alt: alt(paths.article('en', a.slug), paths.article('ta', a.slug)), isFallback: r.isFallback })
      );
      addUrl(paths.article(lang, a.slug), paths.article('en', a.slug), paths.article('ta', a.slug));
    }
  }

  // ---------- root + 404 ----------
  const rootCtx = ctxFor('en');
  writeFile(path.join(DIST, 'index.html'), R.rootPage(rootCtx, { alt: alt('/', '/') }));
  writeFile(path.join(DIST, '404.html'), R.notFoundPage(rootCtx, { alt: alt(paths.home('en'), paths.home('ta')) }));

  // ---------- sitemap + robots ----------
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${u.en}"/>
    <xhtml:link rel="alternate" hreflang="ta" href="${u.ta}"/>
  </url>`
  )
  .join('\n')}
</urlset>`;
  writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml);
  writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);

  const pages = sitemap.length;
  console.log(`\u2713 Built ${pages} URLs \u00D7 2 languages into dist/`);
  console.log(`  articles: ${orderedIds.length} per language, search index: ${index.length} entries`);
}

main();
