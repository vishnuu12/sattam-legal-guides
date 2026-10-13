import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LANGS = ['en', 'ta'];

export const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeFile = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};

export function loadArticles() {
  const byId = {};
  for (const lang of LANGS) {
    const dir = path.join(ROOT, 'content', lang);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.json')) continue;
      const a = readJSON(path.join(dir, f));
      a.lang = a.lang || lang;
      (byId[a.id] ||= {})[lang] = a;
    }
  }
  return byId;
}

export function loadAll() {
  return {
    taxonomy: readJSON(path.join(ROOT, 'content/taxonomy.json')),
    ui: readJSON(path.join(ROOT, 'src/i18n/ui.json')),
    synonyms: readJSON(path.join(ROOT, 'src/data/synonyms.json')),
    helplines: readJSON(path.join(ROOT, 'src/data/helplines.json')),
    articles: loadArticles(),
  };
}

// Translate a dot-path key with {var} interpolation, falling back to English.
export function t(ui, lang, key, vars) {
  const get = (d) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d);
  let s = get(ui[lang]);
  if (s == null) s = get(ui.en);
  if (s == null) return key;
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const otherLang = (lang) => (lang === 'en' ? 'ta' : 'en');
export const langName = (lang) => (lang === 'ta' ? 'Tamil' : 'English');

// Optional deploy base path, e.g. "/sattam-legal-guides" for a GitHub Pages
// project site. An empty string means the site is served from the domain root
// (Netlify, Vercel, Cloudflare Pages, or a custom domain).
export let BASE = '';
export function setBase(b) {
  BASE = b ? '/' + String(b).replace(/^\/+|\/+$/g, '') : '';
}

const withBase = (rest) => `${BASE}${rest}`;

export const paths = {
  home: (lang) => withBase(`/${lang}/`),
  guides: (lang) => withBase(`/${lang}/guides/`),
  category: (lang, slug) => withBase(`/${lang}/category/${slug}/`),
  article: (lang, slug) => withBase(`/${lang}/${slug}/`),
  emergency: (lang) => withBase(`/${lang}/emergency/`),
  about: (lang) => withBase(`/${lang}/about/`),
  disclaimer: (lang) => withBase(`/${lang}/disclaimer/`),
};

// Build the searchable text for one article, expanding with cross-language synonyms.
export function buildSearchText(article, taxonomy, synonyms) {
  const cat = taxonomy.categories.find((c) => c.slug === article.category);
  const parts = [
    article.title,
    article.summary,
    ...(article.tags || []),
    cat ? `${cat.en.name} ${cat.ta.name}` : '',
    ...(article.body || []).map((b) => [b.text, ...(b.items || [])].filter(Boolean).join(' ')),
    ...(article.practicalSteps || []),
    ...(article.exceptions || []),
    ...(article.faqs || []).flatMap((f) => [f.q, f.a]),
    ...(article.misconceptions || []).flatMap((m) => [m.myth, m.fact]),
    ...(article.sources || []).map((s) => s.label),
  ];
  let text = parts.join(' ').toLowerCase();

  // Expand with synonym groups so an English term finds Tamil content and vice versa.
  for (const group of synonyms.groups || []) {
    const terms = group.map((g) => g.toLowerCase());
    if (terms.some((term) => text.includes(term))) {
      text += ' ' + terms.join(' ');
    }
  }
  return text;
}
