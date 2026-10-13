import { esc, t, otherLang, langName, paths } from './lib.mjs';

const FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#0b3d2e'/><text x='32' y='45' font-size='36' text-anchor='middle'>\u2696\uFE0F</text></svg>"
  );

const CALLOUTS = {
  'did-you-know': { emoji: '\uD83D\uDCA1', key: 'callouts.didYouKnow', cls: 'callout--info' },
  rights: { emoji: '\u2696\uFE0F', key: 'callouts.rights', cls: 'callout--rights' },
  caution: { emoji: '\u26A0\uFE0F', key: 'callouts.caution', cls: 'callout--warn' },
  action: { emoji: '\u2705', key: 'callouts.action', cls: 'callout--action' },
  remember: { emoji: '\uD83D\uDCCC', key: 'callouts.remember', cls: 'callout--remember' },
  sources: { emoji: '\uD83D\uDCDA', key: 'callouts.sources', cls: 'callout--sources' },
  misconceptions: { emoji: '\uD83D\uDD0E', key: 'callouts.misconceptions', cls: 'callout--myth' },
};

const STATUS_MAP = {
  reviewed: { key: 'status.reviewed', cls: 'badge--ok' },
  pending: { key: 'status.pending', cls: 'badge--warn' },
  in_review: { key: 'status.in_review', cls: 'badge--warn' },
  draft: { key: 'status.draft', cls: 'badge--muted' },
  machine: { key: 'status.machine', cls: 'badge--muted' },
  human: { key: 'status.human', cls: 'badge--muted' },
  published: { key: 'status.published', cls: 'badge--ok' },
};

export function badge(value, lang, ui) {
  const s = STATUS_MAP[value] || STATUS_MAP.pending;
  return `<span class="badge ${s.cls}">${esc(t(ui, lang, s.key))}</span>`;
}

function callout(kind, text, lang, ui) {
  const c = CALLOUTS[kind] || CALLOUTS['did-you-know'];
  return `<aside class="callout ${c.cls}" role="note">
      <p class="callout__title"><span class="callout__emoji" aria-hidden="true">${c.emoji}</span>${esc(t(ui, lang, c.key))}</p>
      <p class="callout__text">${esc(text)}</p>
    </aside>`;
}

function renderBody(blocks, lang, ui) {
  const toc = [];
  let n = 0;
  const html = (blocks || [])
    .map((b) => {
      if (b.type === 'h2') {
        n += 1;
        const id = `sec-${n}`;
        toc.push({ id, text: b.text });
        return `<h2 id="${id}">${esc(b.text)}</h2>`;
      }
      if (b.type === 'h3') return `<h3>${esc(b.text)}</h3>`;
      if (b.type === 'list') return `<ul class="prose-list">${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
      if (b.type === 'callout') return callout(b.kind, b.text, lang, ui);
      return `<p>${esc(b.text)}</p>`;
    })
    .join('\n');
  return { html, toc };
}

function headerHtml(ctx, alt) {
  const { lang, ui } = ctx;
  const nav = [
    { href: paths.home(lang), label: t(ui, lang, 'nav.home'), key: 'home' },
    { href: paths.guides(lang), label: t(ui, lang, 'nav.guides'), key: 'guides' },
    { href: paths.emergency(lang), label: t(ui, lang, 'nav.emergency'), key: 'emergency' },
    { href: paths.about(lang), label: t(ui, lang, 'nav.about'), key: 'about' },
  ];
  const navHtml = nav.map((i) => `<a href="${i.href}">${esc(i.label)}</a>`).join('');
  const enActive = lang === 'en' ? ' is-active' : '';
  const taActive = lang === 'ta' ? ' is-active' : '';
  return `<a class="skip-link" href="#main">${esc(t(ui, lang, 'nav.skipToContent'))}</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${paths.home(lang)}">
      <span class="brand-mark" aria-hidden="true">\u2696\uFE0F</span>
      <span class="brand-name">${esc(t(ui, lang, 'brand.name'))}</span>
    </a>
    <nav class="nav nav--desktop" aria-label="${esc(t(ui, lang, 'nav.menu'))}">${navHtml}</nav>
    <div class="header-actions">
      <form class="header-search" role="search" action="${paths.guides(lang)}" method="get">
        <label class="sr-only" for="hdr-q">${esc(t(ui, lang, 'search.label'))}</label>
        <input id="hdr-q" type="search" name="q" placeholder="${esc(t(ui, lang, 'search.placeholder'))}" autocomplete="off">
        <button type="submit" aria-label="${esc(t(ui, lang, 'search.button'))}">\uD83D\uDD0D</button>
      </form>
      <div class="lang-switch" role="group" aria-label="${esc(t(ui, lang, 'languageSwitcher.label'))}">
        <a class="lang-opt${enActive}" href="${alt.en}" hreflang="en" lang="en" data-setlang="en" aria-current="${lang === 'en' ? 'true' : 'false'}">\uD83C\uDDEC\uD83C\uDDE7 English</a>
        <span class="lang-sep" aria-hidden="true">|</span>
        <a class="lang-opt${taActive}" href="${alt.ta}" hreflang="ta" lang="ta" data-setlang="ta" aria-current="${lang === 'ta' ? 'true' : 'false'}">\uD83C\uDDEE\uD83C\uDDF3 \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD</a>
      </div>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${esc(t(ui, lang, 'nav.openMenu'))}">\u2630</button>
    </div>
  </div>
  <nav id="mobile-nav" class="mobile-nav nav" hidden aria-label="${esc(t(ui, lang, 'nav.menu'))}">${navHtml}</nav>
</header>`;
}

function footerHtml(ctx) {
  const { lang, ui } = ctx;
  const year = new Date().getFullYear();
  const topics = ctx.taxonomy.categories
    .slice(0, 6)
    .map((c) => `<li><a href="${paths.category(lang, c.slug)}">${c.emoji} ${esc(c[lang].name)}</a></li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-col">
      <p class="footer-brand">\u2696\uFE0F ${esc(t(ui, lang, 'brand.name'))}</p>
      <p class="footer-text">${esc(t(ui, lang, 'footer.aboutText'))}</p>
    </div>
    <div class="footer-col">
      <h2 class="footer-head">${esc(t(ui, lang, 'footer.quickLinks'))}</h2>
      <ul>
        <li><a href="${paths.guides(lang)}">${esc(t(ui, lang, 'nav.guides'))}</a></li>
        <li><a href="${paths.emergency(lang)}">${esc(t(ui, lang, 'nav.emergency'))}</a></li>
        <li><a href="${paths.about(lang)}">${esc(t(ui, lang, 'nav.about'))}</a></li>
        <li><a href="${paths.disclaimer(lang)}">${esc(t(ui, lang, 'footer.terms'))}</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2 class="footer-head">${esc(t(ui, lang, 'footer.topics'))}</h2>
      <ul>${topics}</ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p class="footer-disclaimer">${esc(t(ui, lang, 'disclaimer.full'))}</p>
    <p class="footer-meta">\u00A9 ${year} ${esc(t(ui, lang, 'brand.name'))} \u00B7 ${esc(t(ui, lang, 'footer.builtWith'))}</p>
  </div>
</footer>`;
}

export function doc(ctx, page) {
  const { lang, ui, taxonomy } = ctx;
  const siteUrl = taxonomy.siteUrl;
  const alt = page.alt || { en: paths.home('en'), ta: paths.home('ta') };
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${siteUrl}${page.canonical}">
<link rel="alternate" hreflang="en" href="${siteUrl}${alt.en}">
<link rel="alternate" hreflang="ta" href="${siteUrl}${alt.ta}">
<link rel="alternate" hreflang="x-default" href="${siteUrl}${alt.en}">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:site_name" content="${esc(t(ui, lang, 'meta.siteName'))}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:locale" content="${lang === 'ta' ? 'ta_IN' : 'en_IN'}">
<meta name="theme-color" content="#0b3d2e">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="${page.bodyClass || ''}" data-lang="${lang}">
${headerHtml(ctx, alt)}
<main id="main" class="main">
${page.content}
</main>
${footerHtml(ctx)}
<script src="/assets/app.js" defer></script>
${page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld)}</script>` : ''}
</body>
</html>`;
}

function articleCard(a, lang, taxonomy, ui, opts = {}) {
  const cat = taxonomy.categories.find((c) => c.slug === a.category);
  const emoji = cat ? cat.emoji : '\u2696\uFE0F';
  const catName = cat ? cat[lang].name : a.category;
  return `<a class="card" href="${paths.article(lang, a.slug)}">
    <span class="card__emoji" aria-hidden="true">${emoji}</span>
    <span class="card__cat">${esc(catName)}</span>
    <h3 class="card__title">${esc(a.title)}</h3>
    <p class="card__summary">${esc(a.summary)}</p>
    <span class="card__meta">${esc(t(ui, lang, 'article.readingTime', { n: a.readingMinutes }))}</span>
  </a>`;
}

function reviewPanel(a, lang, ui) {
  return `<div class="review-panel" aria-label="${esc(t(ui, lang, 'article.reviewStatus'))}">
    <div class="review-item">
      <span class="review-label">${esc(t(ui, lang, 'article.translationStatus'))}</span>
      ${badge(a.translationStatus, lang, ui)}
    </div>
    <div class="review-item">
      <span class="review-label">${esc(t(ui, lang, 'article.legalStatus'))}</span>
      ${badge(a.legalReviewStatus, lang, ui)}
    </div>
    <div class="review-item">
      <span class="review-label">${esc(t(ui, lang, 'article.lastUpdated'))}</span>
      <time datetime="${esc(a.lastUpdated)}">${esc(a.lastUpdated)}</time>
    </div>
  </div>`;
}

function notices(a, lang, ui, isFallback) {
  const out = [];
  if (isFallback) {
    out.push(`<p class="notice notice--fallback"><span aria-hidden="true">\uD83C\uDF10</span> ${esc(
      t(ui, lang, 'status.fallbackNotice', { lang: langName(a.lang), missing: langName(lang) })
    )}</p>`);
  }
  if (a.legalReviewStatus !== 'reviewed') {
    out.push(`<p class="notice notice--warn"><span aria-hidden="true">\u26A0\uFE0F</span> ${esc(t(ui, lang, 'status.unverifiedNotice'))}</p>`);
  }
  if (!isFallback && a.translationStatus !== 'reviewed') {
    out.push(`<p class="notice notice--info"><span aria-hidden="true">\uD83D\uDD0D</span> ${esc(t(ui, lang, 'status.translationPendingNotice'))}</p>`);
  }
  return out.join('\n');
}

export function articlePage(ctx, { article: a, related, alt, isFallback }) {
  const { lang, ui, taxonomy } = ctx;
  const cat = taxonomy.categories.find((c) => c.slug === a.category);
  const { html: bodyHtml, toc } = renderBody(a.body, lang, ui);
  const catEmoji = cat ? cat.emoji : '\u2696\uFE0F';
  const catName = cat ? cat[lang].name : a.category;

  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="${esc(t(ui, lang, 'article.onThisPage'))}">
        <p class="toc__title">${esc(t(ui, lang, 'article.onThisPage'))}</p>
        <ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol>
      </nav>`
    : '';

  const steps = (a.practicalSteps || []).length
    ? `<section class="article-section" aria-labelledby="steps-h">
        <h2 id="steps-h">\u2705 ${esc(t(ui, lang, 'article.practicalSteps'))}</h2>
        <ol class="steps">${a.practicalSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      </section>`
    : '';

  const exceptions = (a.exceptions || []).length
    ? `<section class="article-section" aria-labelledby="exc-h">
        <h2 id="exc-h">\u26A0\uFE0F ${esc(t(ui, lang, 'article.exceptions'))}</h2>
        <ul class="prose-list">${a.exceptions.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </section>`
    : '';

  const misconceptions = (a.misconceptions || []).length
    ? `<section class="article-section" aria-labelledby="myth-h">
        <h2 id="myth-h">\uD83D\uDD0E ${esc(t(ui, lang, 'article.faqs') && t(ui, lang, 'callouts.misconceptions'))}</h2>
        <ul class="myth-list">${a.misconceptions
          .map((m) => `<li><p class="myth"><span aria-hidden="true">\u274C</span> ${esc(m.myth)}</p><p class="fact"><span aria-hidden="true">\u2705</span> ${esc(m.fact)}</p></li>`)
          .join('')}</ul>
      </section>`
    : '';

  const faqs = (a.faqs || []).length
    ? `<section class="article-section" aria-labelledby="faq-h">
        <h2 id="faq-h">\u2753 ${esc(t(ui, lang, 'article.faqs'))}</h2>
        <div class="faq-list">${a.faqs
          .map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
          .join('')}</div>
      </section>`
    : '';

  const sources = (a.sources || []).length
    ? `<section class="article-section" aria-labelledby="src-h">
        <h2 id="src-h">\uD83D\uDCDA ${esc(t(ui, lang, 'article.sources'))}</h2>
        <ul class="source-list">${a.sources
          .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} <span class="ext" aria-hidden="true">\u2197</span><span class="sr-only"> (${esc(t(ui, lang, 'a11y.externalLink'))})</span></a></li>`)
          .join('')}</ul>
      </section>`
    : '';

  const relatedHtml = (related || []).length
    ? `<section class="article-section" aria-labelledby="rel-h">
        <h2 id="rel-h">\uD83D\uDCD8 ${esc(t(ui, lang, 'article.related'))}</h2>
        <div class="card-grid">${related.map((r) => articleCard(r, lang, taxonomy, ui)).join('')}</div>
      </section>`
    : '';

  const content = `<article class="article wrap" lang="${a.lang}">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${paths.home(lang)}">${esc(t(ui, lang, 'nav.home'))}</a>
    <span aria-hidden="true">/</span>
    <a href="${paths.category(lang, a.category)}">${catEmoji} ${esc(catName)}</a>
  </nav>
  <header class="article-head">
    <p class="article-cat"><span aria-hidden="true">${catEmoji}</span> ${esc(catName)}</p>
    <h1 class="article-title">${esc(a.title)}</h1>
    <p class="article-summary">${esc(a.summary)}</p>
    ${reviewPanel(a, lang, ui)}
  </header>
  ${notices(a, lang, ui, isFallback)}
  <div class="article-body">
    ${tocHtml}
    <div class="prose">
      ${bodyHtml}
      ${steps}
      ${exceptions}
      ${misconceptions}
      ${faqs}
      ${sources}
      <p class="article-disclaimer">${esc(t(ui, lang, 'disclaimer.full'))}</p>
    </div>
  </div>
  ${relatedHtml}
</article>`;

  return doc(ctx, {
    title: `${a.title} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: a.summary,
    canonical: paths.article(lang, a.slug),
    alt,
    type: 'article',
    bodyClass: 'page-article',
    content,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.summary,
      inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN',
      dateModified: a.lastUpdated,
      publisher: { '@type': 'Organization', name: t(ui, lang, 'brand.name') },
    },
  });
}

export function homePage(ctx, { articles, featured, situations, popular, alt }) {
  const { lang, ui, taxonomy } = ctx;
  const cards = articles.map((a) => articleCard(a, lang, taxonomy, ui)).join('');
  const topicTiles = taxonomy.categories
    .map(
      (c) => `<a class="tile" href="${paths.category(lang, c.slug)}">
        <span class="tile__emoji" aria-hidden="true">${c.emoji}</span>
        <span class="tile__name">${esc(c[lang].name)}</span>
        <span class="tile__blurb">${esc(c[lang].blurb)}</span>
      </a>`
    )
    .join('');

  const feat = featured
    ? `<div class="daily-card">
        <p class="daily-label"><span aria-hidden="true">\uD83D\uDCA1</span> ${esc(t(ui, lang, 'home.dailyTitle'))}</p>
        <p class="daily-text">${esc(featured.summary)}</p>
        <p class="daily-actions">
          <a class="btn btn--sm" href="${paths.article(lang, featured.slug)}">${esc(t(ui, lang, 'actions.readGuide'))}</a>
        </p>
        <p class="daily-src">\uD83D\uDCDA ${esc(t(ui, lang, 'home.dailySourceLabel'))}:
          <a href="${esc((featured.sources && featured.sources[0] && featured.sources[0].url) || '#')}" target="_blank" rel="noopener noreferrer">${esc(
            (featured.sources && featured.sources[0] && featured.sources[0].label) || ''
          )}</a> \u00B7 <span class="daily-verified">\u2714 ${esc(t(ui, lang, 'home.dailyVerified'))}</span>
        </p>
      </div>`
    : '';

  const popularHtml = popular
    .map((q) => `<li><a href="${paths.article(lang, q.slug)}">\u2753 ${esc(q.q)}</a></li>`)
    .join('');

  const situationsHtml = situations
    .map(
      (s) => `<a class="situation" href="${paths.article(lang, s.slug)}">
        <span class="situation__emoji" aria-hidden="true">${s.emoji}</span>
        <span class="situation__text">${esc(s.text)}</span>
      </a>`
    )
    .join('');

  const trust = [
    { t: 'home.trustOneTitle', x: 'home.trustOneText', e: '\uD83D\uDD24' },
    { t: 'home.trustTwoTitle', x: 'home.trustTwoText', e: '\uD83C\uDDEE\uD83C\uDDF3' },
    { t: 'home.trustThreeTitle', x: 'home.trustThreeText', e: '\uD83D\uDCDA' },
    { t: 'home.trustFourTitle', x: 'home.trustFourText', e: '\u2705' },
  ]
    .map(
      (c) => `<div class="trust-card">
        <span class="trust-emoji" aria-hidden="true">${c.e}</span>
        <h3>${esc(t(ui, lang, c.t))}</h3>
        <p>${esc(t(ui, lang, c.x))}</p>
      </div>`
    )
    .join('');

  const content = `<section class="hero">
    <div class="wrap hero-inner">
      <p class="hero-eyebrow">${esc(t(ui, lang, 'hero.eyebrow'))}</p>
      <h1 class="hero-title">${esc(t(ui, lang, 'hero.title'))}</h1>
      <p class="hero-subtitle">${esc(t(ui, lang, 'hero.subtitle'))}</p>
      <form class="hero-search" role="search" action="${paths.guides(lang)}" method="get">
        <label class="sr-only" for="hero-q">${esc(t(ui, lang, 'search.label'))}</label>
        <input id="hero-q" type="search" name="q" placeholder="${esc(t(ui, lang, 'search.placeholder'))}" autocomplete="off">
        <button type="submit" class="btn btn--primary">\uD83D\uDD0D ${esc(t(ui, lang, 'search.button'))}</button>
      </form>
      <div class="hero-actions">
        <a class="btn btn--primary" href="${paths.guides(lang)}">\uD83D\uDD0D ${esc(t(ui, lang, 'actions.exploreGuides'))}</a>
        <a class="btn btn--ghost" href="${paths.category(lang, 'know-your-rights')}">\u2696\uFE0F ${esc(t(ui, lang, 'actions.knowYourRights'))}</a>
      </div>
    </div>
  </section>

  <section class="section wrap">
    <h2 class="section-title">${esc(t(ui, lang, 'home.topicsTitle'))}</h2>
    <p class="section-sub">${esc(t(ui, lang, 'home.topicsSubtitle'))}</p>
    <div class="tile-grid">${topicTiles}</div>
  </section>

  <section class="section wrap">
    <div class="split">
      <div>
        <h2 class="section-title">${esc(t(ui, lang, 'home.dailyTitle'))}</h2>
        <p class="section-sub">${esc(t(ui, lang, 'home.dailySubtitle'))}</p>
        ${feat}
      </div>
      <div class="panel">
        <h2 class="section-title">${esc(t(ui, lang, 'home.popularTitle'))}</h2>
        <p class="section-sub">${esc(t(ui, lang, 'home.popularSubtitle'))}</p>
        <ul class="popular-list">${popularHtml}</ul>
      </div>
    </div>
  </section>

  <section class="section wrap">
    <h2 class="section-title">${esc(t(ui, lang, 'home.situationsTitle'))}</h2>
    <p class="section-sub">${esc(t(ui, lang, 'home.situationsSubtitle'))}</p>
    <div class="situation-grid">${situationsHtml}</div>
  </section>

  <section class="section wrap">
    <h2 class="section-title">${esc(t(ui, lang, 'home.trustTitle'))}</h2>
    <div class="trust-grid">${trust}</div>
  </section>

  <section class="section wrap">
    <h2 class="section-title">${esc(t(ui, lang, 'nav.guides'))}</h2>
    <div class="card-grid">${cards}</div>
  </section>`;

  return doc(ctx, {
    title: t(ui, lang, 'meta.homeTitle'),
    description: t(ui, lang, 'meta.homeDescription'),
    canonical: paths.home(lang),
    alt,
    bodyClass: 'page-home',
    content,
  });
}

export function guidesPage(ctx, { articles, alt }) {
  const { lang, ui, taxonomy } = ctx;
  const cats = taxonomy.categories
    .map((c) => `<option value="${c.slug}">${c.emoji} ${esc(c[lang].name)}</option>`)
    .join('');
  const content = `<div class="wrap page">
    <h1 class="page-title">\uD83D\uDD0D ${esc(t(ui, lang, 'nav.guides'))}</h1>
    <form class="filters" id="filters">
      <div class="filter-field filter-field--grow">
        <label for="f-q">${esc(t(ui, lang, 'search.label'))}</label>
        <input id="f-q" type="search" name="q" placeholder="${esc(t(ui, lang, 'search.placeholder'))}" autocomplete="off">
      </div>
      <div class="filter-field">
        <label for="f-lang">${esc(t(ui, lang, 'search.filterLanguage'))}</label>
        <select id="f-lang" name="lang">
          <option value="">${esc(t(ui, lang, 'search.allLanguages'))}</option>
          <option value="en">\uD83C\uDDEC\uD83C\uDDE7 English</option>
          <option value="ta">\uD83C\uDDEE\uD83C\uDDF3 \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="f-cat">${esc(t(ui, lang, 'search.filterCategory'))}</label>
        <select id="f-cat" name="category">
          <option value="">${esc(t(ui, lang, 'search.allCategories'))}</option>
          ${cats}
        </select>
      </div>
      <button type="button" class="btn btn--ghost btn--sm" id="f-reset">${esc(t(ui, lang, 'search.reset'))}</button>
    </form>
    <p class="results-count" id="results-count" aria-live="polite"></p>
    <div class="card-grid" id="results">
      ${articles.map((a) => articleCard(a, lang, taxonomy, ui)).join('')}
    </div>
    <div class="empty-state" id="empty" hidden>
      <p class="empty-emoji" aria-hidden="true">\uD83D\uDD0E</p>
      <h2>${esc(t(ui, lang, 'empty.noResultsTitle'))}</h2>
      <p>${esc(t(ui, lang, 'search.noResultsHelp'))}</p>
    </div>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, lang, 'nav.guides')} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: t(ui, lang, 'meta.homeDescription'),
    canonical: paths.guides(lang),
    alt,
    bodyClass: 'page-guides',
    content,
  });
}

export function categoryPage(ctx, { category, articles, alt }) {
  const { lang, ui, taxonomy } = ctx;
  const cards = articles.length
    ? `<div class="card-grid">${articles.map((a) => articleCard(a, lang, taxonomy, ui)).join('')}</div>`
    : `<div class="empty-state">
        <p class="empty-emoji" aria-hidden="true">\uD83D\uDCDD</p>
        <h2>${esc(t(ui, lang, 'empty.noGuidesTitle'))}</h2>
        <p>${esc(t(ui, lang, 'empty.noGuidesText'))}</p>
      </div>`;
  const content = `<div class="wrap page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${paths.home(lang)}">${esc(t(ui, lang, 'nav.home'))}</a> <span aria-hidden="true">/</span> <a href="${paths.guides(lang)}">${esc(t(ui, lang, 'nav.guides'))}</a></nav>
    <header class="page-head">
      <p class="page-emoji" aria-hidden="true">${category.emoji}</p>
      <h1 class="page-title">${esc(category[lang].name)}</h1>
      <p class="page-sub">${esc(category[lang].blurb)}</p>
    </header>
    ${cards}
  </div>`;
  return doc(ctx, {
    title: `${category[lang].name} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: category[lang].blurb,
    canonical: paths.category(lang, category.slug),
    alt,
    bodyClass: 'page-category',
    content,
  });
}

export function emergencyPage(ctx, { alt }) {
  const { lang, ui, helplines } = ctx;
  const rows = helplines.numbers
    .map(
      (n) => `<tr class="${n.urgent ? 'row--urgent' : ''}">
        <td class="num"><a href="tel:${esc(n.num)}">${esc(n.num)}</a></td>
        <td>${esc(n[lang] || n.en)}</td>
      </tr>`
    )
    .join('');
  const content = `<div class="wrap page">
    <p class="emergency-banner" role="note"><span aria-hidden="true">\uD83D\uDEA8</span> <strong>${esc(t(ui, lang, 'emergency.bannerTitle'))}</strong> ${esc(t(ui, lang, 'emergency.bannerText'))}</p>
    <h1 class="page-title">\uD83C\uDD98 ${esc(t(ui, lang, 'emergency.title'))}</h1>
    <p class="page-sub">${esc(t(ui, lang, 'emergency.subtitle'))}</p>
    <table class="helpline-table">
      <caption class="sr-only">${esc(t(ui, lang, 'emergency.national'))}</caption>
      <thead><tr><th scope="col">${esc(t(ui, lang, 'emergency.number'))}</th><th scope="col">${esc(t(ui, lang, 'emergency.service'))}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="article-section">
      <h2>\u2696\uFE0F ${esc(t(ui, lang, 'emergency.freeAid'))}</h2>
      <p>${esc(t(ui, lang, 'emergency.freeAidText'))}</p>
      <p><a class="btn btn--primary" href="https://nalsa.gov.in/" target="_blank" rel="noopener noreferrer">NALSA \u2197</a></p>
    </section>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, lang, 'emergency.title')} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: t(ui, lang, 'emergency.subtitle'),
    canonical: paths.emergency(lang),
    alt,
    bodyClass: 'page-emergency',
    content,
  });
}

export function aboutPage(ctx, { alt }) {
  const { lang, ui } = ctx;
  const content = `<div class="wrap page prose-page">
    <h1 class="page-title">\u2139\uFE0F ${esc(t(ui, lang, 'nav.about'))}</h1>
    <p class="lede">${esc(t(ui, lang, 'footer.aboutText'))}</p>
    <h2>${esc(t(ui, lang, 'home.trustTitle'))}</h2>
    <ul class="prose-list">
      <li><strong>${esc(t(ui, lang, 'home.trustOneTitle'))}</strong> \u2014 ${esc(t(ui, lang, 'home.trustOneText'))}</li>
      <li><strong>${esc(t(ui, lang, 'home.trustTwoTitle'))}</strong> \u2014 ${esc(t(ui, lang, 'home.trustTwoText'))}</li>
      <li><strong>${esc(t(ui, lang, 'home.trustThreeTitle'))}</strong> \u2014 ${esc(t(ui, lang, 'home.trustThreeText'))}</li>
      <li><strong>${esc(t(ui, lang, 'home.trustFourTitle'))}</strong> \u2014 ${esc(t(ui, lang, 'home.trustFourText'))}</li>
    </ul>
    <h2>${esc(t(ui, lang, 'footer.contribute'))}</h2>
    <p>${esc(t(ui, lang, 'footer.contributeText'))}</p>
    <p class="article-disclaimer">${esc(t(ui, lang, 'disclaimer.full'))}</p>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, lang, 'nav.about')} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: t(ui, lang, 'footer.aboutText'),
    canonical: paths.about(lang),
    alt,
    bodyClass: 'page-about',
    content,
  });
}

export function disclaimerPage(ctx, { alt }) {
  const { lang, ui } = ctx;
  const content = `<div class="wrap page prose-page">
    <h1 class="page-title">\uD83D\uDCC4 ${esc(t(ui, lang, 'footer.terms'))}</h1>
    <p class="lede">${esc(t(ui, lang, 'disclaimer.short'))}</p>
    <p>${esc(t(ui, lang, 'disclaimer.full'))}</p>
    <h2>${esc(t(ui, lang, 'status.unverifiedNotice'))}</h2>
    <p>${esc(t(ui, lang, 'status.reviewedNotice'))}</p>
  </div>`;
  return doc(ctx, {
    title: `${t(ui, lang, 'footer.terms')} \u2014 ${t(ui, lang, 'brand.name')}`,
    description: t(ui, lang, 'disclaimer.short'),
    canonical: paths.disclaimer(lang),
    alt,
    bodyClass: 'page-disclaimer',
    content,
  });
}

export function rootPage(ctx, { alt }) {
  const { ui } = ctx;
  const content = `<div class="wrap chooser">
    <p class="chooser-logo" aria-hidden="true">\u2696\uFE0F</p>
    <h1 class="chooser-title">Sattam · சட்டம்</h1>
    <p class="chooser-sub">Choose your language / உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
    <div class="chooser-actions">
      <a class="btn btn--primary" href="/en/" data-setlang="en">\uD83C\uDDEC\uD83C\uDDE7 English</a>
      <a class="btn btn--primary" href="/ta/" data-setlang="ta">\uD83C\uDDEE\uD83C\uDDF3 \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD</a>
    </div>
    <p class="chooser-note">${esc(t(ui, 'en', 'hero.subtitle'))}</p>
  </div>`;
  return doc(ctx, {
    title: 'Sattam \u2014 Legal guides in English & Tamil',
    description: 'Choose English or Tamil.',
    canonical: '/',
    alt,
    bodyClass: 'page-chooser',
    content,
  });
}

export function notFoundPage(ctx, { alt }) {
  const { lang, ui } = ctx;
  const content = `<div class="wrap empty-state">
    <p class="empty-emoji" aria-hidden="true">\uD83E\uDDED</p>
    <h1>${esc(t(ui, lang, 'empty.noResultsTitle'))}</h1>
    <p>${esc(t(ui, lang, 'empty.noResultsText'))}</p>
    <p><a class="btn btn--primary" href="${paths.home(lang)}">${esc(t(ui, lang, 'actions.backHome'))}</a></p>
  </div>`;
  return doc(ctx, {
    title: `404 \u2014 ${t(ui, lang, 'brand.name')}`,
    description: t(ui, lang, 'empty.noResultsText'),
    canonical: paths.home(lang),
    alt,
    bodyClass: 'page-404',
    content,
  });
}
