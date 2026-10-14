import { esc, t, paths, BASE } from './lib.mjs';

const FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#0b3d2e'/><text x='32' y='45' font-size='36' text-anchor='middle'>\u2696\uFE0F</text></svg>"
  );

const CALLOUTS = {
  'did-you-know': { emoji: '\uD83D\uDCA1', key: 'callouts.didYouKnow', cls: 'c-info' },
  rights: { emoji: '\u2696\uFE0F', key: 'callouts.rights', cls: 'c-rights' },
  caution: { emoji: '\u26A0\uFE0F', key: 'callouts.caution', cls: 'c-warn' },
  action: { emoji: '\u2705', key: 'callouts.action', cls: 'c-action' },
  remember: { emoji: '\uD83D\uDCCC', key: 'callouts.remember', cls: 'c-remember' },
  sources: { emoji: '\uD83D\uDCDA', key: 'callouts.sources', cls: 'c-sources' },
  misconceptions: { emoji: '\uD83D\uDD0E', key: 'callouts.misconceptions', cls: 'c-myth' },
};

// ---- bilingual building blocks (Tamil line first, English line second) ----
const pair = (ta, en) => {
  const a = ta ? `<span class="ta" lang="ta">${esc(ta)}</span>` : '';
  const b = en ? `<span class="en" lang="en">${esc(en)}</span>` : '';
  return a + b;
};
const pPair = (ta, en) =>
  `<div class="pair">${ta ? `<p class="ta" lang="ta">${esc(ta)}</p>` : ''}${en ? `<p class="en" lang="en">${esc(en)}</p>` : ''}</div>`;

function listPair(taItems, enItems) {
  const n = Math.max(taItems.length, enItems.length);
  const items = Array.from({ length: n }, (_, i) => {
    const ta = taItems[i];
    const en = enItems[i];
    return `<li>${ta ? `<span class="ta" lang="ta">${esc(ta)}</span>` : ''}${en ? `<span class="en" lang="en">${esc(en)}</span>` : ''}</li>`;
  }).join('');
  return `<ul class="pair-list">${items}</ul>`;
}

const label = (ui, key, vars) => pair(t(ui, 'ta', key, vars), t(ui, 'en', key, vars));

function callout(ui, kind, taText, enText) {
  const c = CALLOUTS[kind] || CALLOUTS['did-you-know'];
  return `<aside class="callout ${c.cls}">
    <p class="callout-h"><span class="emj" aria-hidden="true">${c.emoji}</span>${label(ui, c.key)}</p>
    ${pPair(taText, enText)}
  </aside>`;
}

function blockPair(ui, taB, enB) {
  const type = (taB && taB.type) || (enB && enB.type) || 'p';
  const taText = taB && taB.text;
  const enText = enB && enB.text;
  if (type === 'h2') return { html: `<h2 class="pair-h"><span class="ta" lang="ta">${esc(taText || '')}</span><span class="en" lang="en">${esc(enText || '')}</span></h2>`, toc: taText || enText };
  if (type === 'h3') return { html: `<h3 class="pair-h3">${pair(taText, enText)}</h3>`, toc: null };
  if (type === 'list') return { html: listPair((taB && taB.items) || [], (enB && enB.items) || []), toc: null };
  if (type === 'callout') return { html: callout(ui, (taB && taB.kind) || (enB && enB.kind), taText, enText), toc: null };
  return { html: pPair(taText, enText), toc: null };
}

function renderBody(ui, taBody, enBody) {
  const n = Math.max((taBody || []).length, (enBody || []).length);
  const toc = [];
  let idx = 0;
  const html = Array.from({ length: n }, (_, i) => {
    const r = blockPair(ui, (taBody || [])[i], (enBody || [])[i]);
    if (r.toc) {
      idx += 1;
      toc.push({ id: `sec-${idx}`, text: r.toc });
      return r.html.replace('<h2 ', `<h2 id="sec-${idx}" `);
    }
    return r.html;
  }).join('\n');
  return { html, toc };
}

// ---- layout ----
function header(ctx, active) {
  const { ui } = ctx;
  const nav = [
    { href: paths.home(), key: 'nav.home' },
    { href: paths.guides(), key: 'nav.guides' },
    { href: paths.templates(), key: 'nav.templates' },
    { href: paths.glossary(), key: 'nav.glossary' },
    { href: paths.deadlines(), key: 'nav.deadlines' },
    { href: paths.emergency(), key: 'nav.emergency' },
    { href: paths.about(), key: 'nav.about' },
  ];
  const navHtml = nav
    .map((i) => `<a href="${i.href}"${active === i.key ? ' class="is-active" aria-current="page"' : ''}>${label(ui, i.key)}</a>`)
    .join('');
  return `<a class="skip" href="#main">${label(ui, 'nav.skipToContent')}</a>
<header class="site-header">
  <div class="wrap head">
    <a class="brand" href="${paths.home()}">
      <span class="brand-mark" aria-hidden="true">\u2696\uFE0F</span>
      <span class="brand-text"><span class="ta" lang="ta">${esc(t(ui, 'ta', 'brand.name'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'brand.name'))}</span></span>
    </a>
    <div class="tools">
      <button class="tool-btn" type="button" data-font="-1" aria-label="Smaller text" title="Smaller text">A\u2212</button>
      <button class="tool-btn" type="button" data-font="1" aria-label="Larger text" title="Larger text">A+</button>
      <button class="tool-btn" type="button" data-theme-toggle aria-label="Switch light or dark theme" title="Light / dark">\uD83C\uDF19</button>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="${esc(t(ui, 'en', 'nav.openMenu'))}">\u2630</button>
    <nav class="nav" id="mnav" aria-label="${esc(t(ui, 'en', 'nav.menu'))}">${navHtml}</nav>
  </div>
</header>`;
}

function footer(ctx) {
  const { ui, taxonomy } = ctx;
  const year = new Date().getFullYear();
  const topics = taxonomy.categories
    .slice(0, 8)
    .map((c) => `<li><a href="${paths.topic(c.slug)}">${c.emoji} ${pair(c.ta.name, c.en.name)}</a></li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <p class="foot-brand">\u2696\uFE0F ${pair(t(ui, 'ta', 'brand.name'), t(ui, 'en', 'brand.name'))}</p>
      ${pPair(t(ui, 'ta', 'footer.aboutText'), t(ui, 'en', 'footer.aboutText'))}
    </div>
    <div>
      <h2 class="foot-h">🔗 ${label(ui, 'footer.quickLinks')}</h2>
      <ul>
        <li><a href="${paths.guides()}">${label(ui, 'nav.guides')}</a></li>
        <li><a href="${paths.emergency()}">${label(ui, 'nav.emergency')}</a></li>
        <li><a href="${paths.about()}">${label(ui, 'nav.about')}</a></li>
      </ul>
    </div>
    <div>
      <h2 class="foot-h">📚 ${label(ui, 'footer.topics')}</h2>
      <ul>${topics}</ul>
    </div>
  </div>
  <div class="wrap foot-bottom">
    ${pPair(t(ui, 'ta', 'disclaimer.full'), t(ui, 'en', 'disclaimer.full'))}
    <p class="foot-meta">\u00A9 ${year} ${esc(t(ui, 'en', 'brand.name'))}</p>
  </div>
</footer>`;
}

export function doc(ctx, page) {
  const { taxonomy } = ctx;
  const siteUrl = taxonomy.siteUrl;
  return `<!DOCTYPE html>
<html lang="ta">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${siteUrl}${page.canonical}">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:locale" content="ta_IN">
<meta name="theme-color" content="#0b3d2e">
<meta name="site-base" content="${BASE}">
<link rel="icon" href="${FAVICON}">
<link rel="manifest" href="${BASE}/manifest.webmanifest">
<link rel="apple-touch-icon" href="${BASE}/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Baloo+Thambi+2:wght@600;700;800&display=swap">
<link rel="stylesheet" href="${BASE}/assets/style.css">
</head>
<body class="${page.bodyClass || ''}">
${header(ctx, page.active)}
<main id="main">
${page.content}
</main>
${footer(ctx)}
<a class="fab" href="${paths.emergency()}" aria-label="Emergency help">\uD83C\uDD98</a>
<script src="${BASE}/assets/app.js" defer></script>
</body>
</html>`;
}

function reviewPanel(ctx, a) {
  const { ui } = ctx;
  const badge = `<span class="badge badge-warn">${label(ui, 'status.pending')}</span>`;
  return `<div class="review">
    <div><span class="rv-l">${label(ui, 'article.translationStatus')}</span>${badge}</div>
    <div><span class="rv-l">${label(ui, 'article.legalStatus')}</span>${badge}</div>
    <div><span class="rv-l">🕒 ${label(ui, 'article.lastUpdated')}</span><time datetime="${esc(a.lastUpdated)}">${esc(a.lastUpdated)}</time></div>
  </div>`;
}

export function articlePage(ctx, { pair: ap, related }) {
  const { ui, taxonomy } = ctx;
  const ta = ap.ta;
  const en = ap.en;
  const a = ta || en;
  const cat = taxonomy.categories.find((c) => c.slug === a.category);
  const catEmoji = cat ? cat.emoji : '\u2696\uFE0F';
  const catName = cat ? pair(cat.ta.name, cat.en.name) : a.category;

  const { html: bodyHtml, toc } = renderBody(ui, ta && ta.body, en && en.body);

  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="${esc(t(ui, 'en', 'article.onThisPage'))}"><p class="toc-h">📑 ${label(ui, 'article.onThisPage')}</p><ol>${toc
        .map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`)
        .join('')}</ol></nav>`
    : '';

  const steps = (ta && ta.practicalSteps) || (en && en.practicalSteps) ? `<section class="blk">
    <h2 class="pair-h">✅ ${label(ui, 'article.practicalSteps')}</h2>
    ${listPair((ta && ta.practicalSteps) || [], (en && en.practicalSteps) || [])}</section>` : '';
  const exc = (ta && ta.exceptions) || (en && en.exceptions) ? `<section class="blk">
    <h2 class="pair-h">⚠️ ${label(ui, 'article.exceptions')}</h2>
    ${listPair((ta && ta.exceptions) || [], (en && en.exceptions) || [])}</section>` : '';
  const myth = (ta && ta.misconceptions) || (en && en.misconceptions) ? `<section class="blk">
    <h2 class="pair-h">🔎 ${label(ui, 'callouts.misconceptions')}</h2>
    ${listPair(
      ((ta && ta.misconceptions) || []).map((m) => `\u274C ${m.myth}  \u2705 ${m.fact}`),
      ((en && en.misconceptions) || []).map((m) => `\u274C ${m.myth}  \u2705 ${m.fact}`)
    )}</section>` : '';
  const faqs = (ta && ta.faqs) || (en && en.faqs) ? `<section class="blk">
    <h2 class="pair-h">❓ ${label(ui, 'article.faqs')}</h2>
    <div class="faqs">${zipFaqs(ta && ta.faqs, en && en.faqs)}</div></section>` : '';
  const sources = (ta && ta.sources) || (en && en.sources) ? `<section class="blk">
    <h2 class="pair-h">📚 ${label(ui, 'article.sources')}</h2>
    <ul class="src-list">${((ta && ta.sources) || (en && en.sources) || [])
      .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} <span class="ext" aria-hidden="true">\u2197</span></a></li>`)
      .join('')}</ul></section>` : '';

  const relatedHtml = (related || []).length
    ? `<section class="blk"><h2 class="pair-h">${label(ui, 'article.related')}</h2><div class="cards">${related
        .map((r) => card(ctx, r))
        .join('')}</div></section>`
    : '';

  const content = `<article class="wrap article">
  <nav class="crumb"><a href="${paths.home()}">🏠 ${label(ui, 'nav.home')}</a><span>/</span><a href="${paths.topic(a.category)}">${catEmoji} ${catName}</a></nav>
  <h1 class="pair-h1">${catEmoji} <span class="ta" lang="ta">${esc(ta ? ta.title : en.title)}</span><span class="en" lang="en">${esc(en ? en.title : ta.title)}</span></h1>
  <div class="pair summary">${pair(ta && ta.summary, en && en.summary)}</div>
  ${reviewPanel(ctx, a)}
  <p class="share"><a class="btn btn-ghost btn-sm" href="https://wa.me/?text=${encodeURIComponent(`${(ta ? ta.title : en.title)} — ${taxonomy.siteUrl}${paths.article(a.slug)}`)}" target="_blank" rel="noopener noreferrer">🟢 ${label(ui, 'share.whatsapp')}</a></p>
  <p class="notice">\u26A0\uFE0F ${label(ui, 'status.unverifiedNotice')}</p>
  <div class="article-grid">
    ${tocHtml}
    <div class="prose">
      ${bodyHtml}
      ${steps}${exc}${myth}${faqs}${sources}
      <p class="disclaimer">⚖️ ${label(ui, 'disclaimer.full')}</p>
    </div>
  </div>
  ${relatedHtml}
</article>`;

  return doc(ctx, {
    title: `${a.title} | ${t(ui, 'en', 'brand.name')}`,
    description: (en && en.summary) || a.summary,
    canonical: paths.article(a.slug),
    type: 'article',
    bodyClass: 'page-article',
    active: '',
    content,
  });
}

function zipFaqs(taFaqs, enFaqs) {
  const ta = taFaqs || [];
  const en = enFaqs || [];
  const n = Math.max(ta.length, en.length);
  return Array.from({ length: n }, (_, i) => {
    const q = `${ta[i] ? `<span class="ta" lang="ta">${esc(ta[i].q)}</span>` : ''}${en[i] ? `<span class="en" lang="en">${esc(en[i].q)}</span>` : ''}`;
    const a = `${ta[i] ? `<p class="ta" lang="ta">${esc(ta[i].a)}</p>` : ''}${en[i] ? `<p class="en" lang="en">${esc(en[i].a)}</p>` : ''}`;
    return `<details class="faq"><summary>${q}</summary>${a}</details>`;
  }).join('');
}

export function card(ctx, ap) {
  const { ui, taxonomy } = ctx;
  const ta = ap.ta || ap.en;
  const en = ap.en || ap.ta;
  const cat = taxonomy.categories.find((c) => c.slug === ta.category);
  return `<a class="card" href="${paths.article(ta.slug)}">
    <span class="card-emj" aria-hidden="true">${cat ? cat.emoji : '\u2696\uFE0F'}</span>
    <span class="card-cat">${cat ? pair(cat.ta.name, cat.en.name) : ''}</span>
    <span class="card-title">${pair(ta.title, en.title)}</span>
    <span class="card-sum">${pair(ta.summary, en.summary)}</span>
  </a>`;
}

export function homePage(ctx, { pairs, featured, situations, popular }) {
  const { ui, taxonomy } = ctx;
  const tiles = taxonomy.categories
    .map((c) => `<a class="tile" href="${paths.topic(c.slug)}"><span class="tile-emj" aria-hidden="true">${c.emoji}</span><span class="tile-name">${pair(c.ta.name, c.en.name)}</span><span class="tile-blurb">${pair(c.ta.blurb, c.en.blurb)}</span></a>`)
    .join('');

  const feat = featured
    ? `<div class="daily">
        <p class="daily-h">\uD83D\uDCA1 ${label(ui, 'home.dailyTitle')}</p>
        ${pPair(featured.ta.summary, featured.en.summary)}
        <p class="daily-a"><a class="btn" href="${paths.article(featured.ta.slug)}">${label(ui, 'actions.readGuide')}</a></p>
      </div>`
    : '';

  const pop = popular
    .map((q) => `<li><a href="${paths.article(q.slug)}">${pair(q.ta, q.en)}</a></li>`)
    .join('');

  const sit = situations
    .map((s) => `<a class="sit" href="${paths.article(s.slug)}"><span class="sit-emj" aria-hidden="true">${s.emoji}</span><span class="sit-txt">${pair(s.ta, s.en)}</span></a>`)
    .join('');

  const content = `<section class="hero">
    <div class="wrap">
      <h1 class="hero-title"><span class="ta" lang="ta">${esc(t(ui, 'ta', 'hero.title'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'hero.title'))}</span></h1>
      <p class="hero-sub ta" lang="ta">${esc(t(ui, 'ta', 'hero.subtitle'))}</p>
      <p class="hero-sub en" lang="en">${esc(t(ui, 'en', 'hero.subtitle'))}</p>
      <form class="hero-search" role="search" action="${paths.guides()}" method="get">
        <label class="sr-only" for="q">${esc(t(ui, 'en', 'search.label'))}</label>
        <input id="q" type="search" name="q" placeholder="${esc(t(ui, 'en', 'search.placeholder'))}" autocomplete="off">
        <button type="submit" class="btn">\uD83D\uDD0D ${esc(t(ui, 'en', 'search.button'))}</button>
      </form>
      <div class="hero-actions">
        <a class="btn" href="${paths.guides()}">\uD83D\uDCD6 ${label(ui, 'actions.exploreGuides')}</a>
        <a class="btn btn-ghost" href="${paths.topic('rights-checklist')}">\uD83D\uDCCB ${label(ui, 'actions.knowYourRights')}</a>
      </div>
    </div>
  </section>

  <section class="wrap sec">
    <h2 class="sec-h">📚 ${label(ui, 'home.topicsTitle')}</h2>
    <div class="tiles">${tiles}</div>
  </section>

  <section class="wrap sec">
    <div class="two">
      <div><h2 class="sec-h">💡 ${label(ui, 'home.dailyTitle')}</h2>${feat}</div>
      <div><h2 class="sec-h">❓ ${label(ui, 'home.popularTitle')}</h2><ul class="pop">${pop}</ul></div>
    </div>
  </section>

  <section class="wrap sec">
    <h2 class="sec-h">🧭 ${label(ui, 'home.situationsTitle')}</h2>
    <div class="sits">${sit}</div>
  </section>

  <section class="wrap sec">
    <h2 class="sec-h">📖 ${label(ui, 'nav.guides')}</h2>
    <div class="cards">${pairs.map((p) => card(ctx, p)).join('')}</div>
  </section>`;

  return doc(ctx, {
    title: t(ui, 'en', 'meta.homeTitle'),
    description: t(ui, 'en', 'meta.homeDescription'),
    canonical: paths.home(),
    bodyClass: 'page-home',
    active: 'nav.home',
    content,
  });
}

export function guidesPage(ctx, { pairs }) {
  const { ui, taxonomy } = ctx;
  const cats = taxonomy.categories.map((c) => `<option value="${c.slug}">${c.emoji} ${esc(c.en.name)} / ${esc(c.ta.name)}</option>`).join('');
  const content = `<div class="wrap page">
    <h1 class="pair-h1">📖 ${label(ui, 'nav.guides')}</h1>
    <form class="filters" id="filters">
      <div class="f f-grow"><label for="fq">${label(ui, 'search.label')}</label><input id="fq" type="search" name="q" placeholder="${esc(t(ui, 'en', 'search.placeholder'))}" autocomplete="off"></div>
      <div class="f"><label for="fc">${label(ui, 'search.filterCategory')}</label><select id="fc" name="category"><option value="">${esc(t(ui, 'en', 'search.allCategories'))}</option>${cats}</select></div>
      <button type="button" class="btn btn-ghost btn-sm" id="freset">${label(ui, 'search.reset')}</button>
    </form>
    <p class="rc" id="rc" aria-live="polite"></p>
    <div class="cards" id="results">${pairs.map((p) => card(ctx, p)).join('')}</div>
    <div class="empty" id="empty" hidden><p class="empty-emj" aria-hidden="true">\uD83D\uDD0E</p><h2>${label(ui, 'empty.noResultsTitle')}</h2><p>${label(ui, 'search.noResultsHelp')}</p></div>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, 'en', 'nav.guides')} | ${t(ui, 'en', 'brand.name')}`,
    description: t(ui, 'en', 'meta.homeDescription'),
    canonical: paths.guides(),
    bodyClass: 'page-guides',
    active: 'nav.guides',
    content,
  });
}

export function topicPage(ctx, { category, pairs }) {
  const { ui } = ctx;
  const cards = pairs.length
    ? `<div class="cards">${pairs.map((p) => card(ctx, p)).join('')}</div>`
    : `<div class="empty"><p class="empty-emj" aria-hidden="true">\uD83D\uDCDD</p><h2>${label(ui, 'empty.noGuidesTitle')}</h2><p>${label(ui, 'empty.noGuidesText')}</p></div>`;
  const content = `<div class="wrap page">
    <nav class="crumb"><a href="${paths.home()}">🏠 ${label(ui, 'nav.home')}</a><span>/</span><a href="${paths.guides()}">${label(ui, 'nav.guides')}</a></nav>
    <p class="page-emj" aria-hidden="true">${category.emoji}</p>
    <h1 class="pair-h1">${pair(category.ta.name, category.en.name)}</h1>
    <div class="pair summary">${pair(category.ta.blurb, category.en.blurb)}</div>
    ${cards}
  </div>`;
  return doc(ctx, {
    title: `${category.en.name} | ${t(ui, 'en', 'brand.name')}`,
    description: category.en.blurb,
    canonical: paths.topic(category.slug),
    bodyClass: 'page-topic',
    active: 'nav.guides',
    content,
  });
}

export function emergencyPage(ctx) {
  const { ui, helplines } = ctx;
  const rows = helplines.numbers
    .map((n) => `<tr class="${n.urgent ? 'urgent' : ''}"><td class="num"><a href="tel:${esc(n.num)}">${esc(n.num)}</a></td><td>${pair(n.ta, n.en)}</td></tr>`)
    .join('');
  const portals = (helplines.portals || [])
    .map((p) => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${pair(p.ta, p.en)} <span class="ext" aria-hidden="true">\u2197</span></a></li>`)
    .join('');
  const content = `<div class="wrap page">
    <p class="emergency"><span aria-hidden="true">\uD83D\uDEA8</span> <strong>${label(ui, 'emergency.bannerTitle')}</strong> ${label(ui, 'emergency.bannerText')}</p>
    <h1 class="pair-h1">${label(ui, 'emergency.title')}</h1>
    <div class="pair summary">${label(ui, 'emergency.subtitle')}</div>
    <table class="helpline"><caption class="sr-only">${esc(t(ui, 'en', 'emergency.national'))}</caption>
      <thead><tr><th>${label(ui, 'emergency.number')}</th><th>${label(ui, 'emergency.service')}</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <section class="blk"><h2 class="pair-h">\uD83D\uDD17 ${label(ui, 'emergency.portals')}</h2><ul class="src-list">${portals}</ul></section>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, 'en', 'emergency.title')} | ${t(ui, 'en', 'brand.name')}`,
    description: t(ui, 'en', 'emergency.subtitle'),
    canonical: paths.emergency(),
    bodyClass: 'page-emergency',
    active: 'nav.emergency',
    content,
  });
}

export function aboutPage(ctx) {
  const { ui } = ctx;
  const content = `<div class="wrap page prose">
    <h1 class="pair-h1">ℹ️ ${label(ui, 'nav.about')}</h1>
    ${pPair(t(ui, 'ta', 'footer.aboutText'), t(ui, 'en', 'footer.aboutText'))}
    <h2 class="pair-h">${label(ui, 'home.trustTitle')}</h2>
    <ul class="pair-list">
      <li><span class="ta" lang="ta">${esc(t(ui, 'ta', 'home.trustOneText'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'home.trustOneText'))}</span></li>
      <li><span class="ta" lang="ta">${esc(t(ui, 'ta', 'home.trustTwoText'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'home.trustTwoText'))}</span></li>
      <li><span class="ta" lang="ta">${esc(t(ui, 'ta', 'home.trustThreeText'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'home.trustThreeText'))}</span></li>
      <li><span class="ta" lang="ta">${esc(t(ui, 'ta', 'home.trustFourText'))}</span><span class="en" lang="en">${esc(t(ui, 'en', 'home.trustFourText'))}</span></li>
    </ul>
    <h2 class="pair-h">${label(ui, 'footer.contribute')}</h2>
    ${pPair(t(ui, 'ta', 'footer.contributeText'), t(ui, 'en', 'footer.contributeText'))}
    <p class="disclaimer">${label(ui, 'disclaimer.full')}</p>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, 'en', 'nav.about')} | ${t(ui, 'en', 'brand.name')}`,
    description: t(ui, 'en', 'footer.aboutText'),
    canonical: paths.about(),
    bodyClass: 'page-about',
    active: 'nav.about',
    content,
  });
}

function biList(taItems, enItems) {
  const n = Math.max((taItems || []).length, (enItems || []).length);
  return `<ul class="pair-list">${Array.from({ length: n }, (_, i) => {
    const ta = (taItems || [])[i];
    const en = (enItems || [])[i];
    return `<li>${ta ? `<span class="ta" lang="ta">${esc(ta)}</span>` : ''}${en ? `<span class="en" lang="en">${esc(en)}</span>` : ''}</li>`;
  }).join('')}</ul>`;
}

export function templatesPage(ctx, { templates }) {
  const { ui } = ctx;
  const cards = templates
    .map((tp) => `<a class="card" href="${paths.template(tp.slug)}"><span class="card-emj" aria-hidden="true">${tp.emoji}</span><span class="card-title">${pair(tp.title.ta, tp.title.en)}</span><span class="card-sum">${pair(tp.purpose.ta, tp.purpose.en)}</span></a>`)
    .join('');
  const content = `<div class="wrap page">
    <h1 class="pair-h1">📄 ${label(ui, 'templates.title')}</h1>
    <div class="pair summary">${label(ui, 'templates.subtitle')}</div>
    <div class="cards">${cards}</div>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, 'en', 'templates.title')} | ${t(ui, 'en', 'brand.name')}`,
    description: t(ui, 'en', 'templates.subtitle'),
    canonical: paths.templates(),
    bodyClass: 'page-templates',
    active: 'nav.templates',
    content,
  });
}

export function templatePage(ctx, { tpl }) {
  const { ui } = ctx;
  const box = (lang, text, heading) => `<div class="letter-box">
      <div class="letter-head"><span class="lh-${lang}" lang="${lang}">${esc(heading)}</span><button class="btn btn-sm btn-ghost" type="button" data-print>🖨️ ${esc(t(ui, 'en', 'templates.print'))}</button></div>
      <pre class="letter letter-${lang}" lang="${lang}">${esc(text)}</pre>
    </div>`;
  const content = `<div class="wrap page">
    <nav class="crumb"><a href="${paths.home()}">🏠 ${label(ui, 'nav.home')}</a><span>/</span><a href="${paths.templates()}">📄 ${label(ui, 'templates.title')}</a></nav>
    <h1 class="pair-h1">${tpl.emoji} ${pair(tpl.title.ta, tpl.title.en)}</h1>
    <div class="pair summary">${pair(tpl.purpose.ta, tpl.purpose.en)}</div>
    <section class="blk"><h2 class="pair-h">👣 ${label(ui, 'templates.when')}</h2>${biList(tpl.when.ta, tpl.when.en)}</section>
    <section class="blk"><h2 class="pair-h">📄 ${label(ui, 'templates.letter')}</h2>
      ${box('ta', tpl.letter.ta, t(ui, 'ta', 'templates.tamilVersion'))}
      ${box('en', tpl.letter.en, t(ui, 'en', 'templates.englishVersion'))}
    </section>
    <section class="blk"><h2 class="pair-h">💡 ${label(ui, 'templates.tips')}</h2>${biList(tpl.tips.ta, tpl.tips.en)}</section>
    <p class="disclaimer">⚖️ ${label(ui, 'disclaimer.full')}</p>
    <p><a class="btn btn-ghost" href="${paths.templates()}">⬅️ ${label(ui, 'templates.backToList')}</a></p>
  </div>`;
  return doc(ctx, {
    title: `${tpl.title.en} | ${t(ui, 'en', 'brand.name')}`,
    description: tpl.purpose.en,
    canonical: paths.template(tpl.slug),
    bodyClass: 'page-template',
    active: 'nav.templates',
    content,
  });
}

export function referencePage(ctx, { page }) {
  const { ui } = ctx;
  const canon = page.slug === 'glossary' ? paths.glossary() : paths.deadlines();
  const head = page.columns
    .map((c) => `<th><span class="ta" lang="ta">${esc(c.ta)}</span><span class="en" lang="en">${esc(c.en)}</span></th>`)
    .join('');
  const rows = page.rows
    .map((r) => `<tr>${r.map((cell) => `<td><span class="ta" lang="ta">${esc(cell.ta)}</span><span class="en" lang="en">${esc(cell.en)}</span></td>`).join('')}</tr>`)
    .join('');
  const content = `<div class="wrap page">
    <nav class="crumb"><a href="${paths.home()}">🏠 ${label(ui, 'nav.home')}</a><span>/</span><span>${page.emoji} ${pair(page.title.ta, page.title.en)}</span></nav>
    <h1 class="pair-h1">${page.emoji} ${pair(page.title.ta, page.title.en)}</h1>
    <div class="pair summary">${pair(page.subtitle.ta, page.subtitle.en)}</div>
    <div class="ref-wrap"><table class="ref-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="disclaimer">⚖️ ${label(ui, 'disclaimer.full')}</p>
  </div>`;
  return doc(ctx, {
    title: `${page.title.en} | ${t(ui, 'en', 'brand.name')}`,
    description: page.subtitle.en,
    canonical: canon,
    bodyClass: 'page-reference',
    active: page.slug === 'glossary' ? 'nav.glossary' : 'nav.deadlines',
    content,
  });
}

export function notFoundPage(ctx) {
  const { ui } = ctx;
  const content = `<div class="wrap empty">
    <p class="empty-emj" aria-hidden="true">\uD83E\uDDED</p>
    <h1>${label(ui, 'empty.noResultsTitle')}</h1>
    <p>${label(ui, 'empty.noResultsText')}</p>
    <p><a class="btn" href="${paths.home()}">${label(ui, 'actions.backHome')}</a></p>
  </div>`;
  return doc(ctx, {
    title: `404 | ${t(ui, 'en', 'brand.name')}`,
    description: t(ui, 'en', 'empty.noResultsText'),
    canonical: paths.home(),
    bodyClass: 'page-404',
    active: '',
    content,
  });
}
