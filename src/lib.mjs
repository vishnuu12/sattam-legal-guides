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

// Load every article as a pair: { id: { en: {...}, ta: {...} } }
export function loadArticles() {
  const byId = {};
  const base = path.join(ROOT, 'content');
  for (const lang of LANGS) {
    const dir = path.join(base, lang);
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
    situations: readJSON(path.join(ROOT, 'src/data/situations.json')),
    templates: readJSON(path.join(ROOT, 'src/data/templates.json')),
    glossary: readJSON(path.join(ROOT, 'src/data/glossary.json')),
    deadlines: readJSON(path.join(ROOT, 'src/data/deadlines.json')),
    wizard: readJSON(path.join(ROOT, 'src/data/wizard.json')),
    articles: loadArticles(),
  };
}

// Translate a dot-path UI key for one language (falls back to English).
export function t(ui, lang, key, vars) {
  const get = (d) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d);
  let s = get(ui[lang]);
  if (s == null) s = get(ui.en);
  if (s == null) return key;
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

// Optional deploy base path (GitHub Pages project site uses "/<repo>").
export let BASE = '';
export function setBase(b) {
  BASE = b ? '/' + String(b).replace(/^\/+|\/+$/g, '') : '';
}

const withBase = (rest) => `${BASE}${rest}`;

export const paths = {
  home: () => withBase('/'),
  guides: () => withBase('/guides/'),
  topic: (slug) => withBase(`/topic/${slug}/`),
  article: (slug) => withBase(`/${slug}/`),
  emergency: () => withBase('/emergency/'),
  about: () => withBase('/about/'),
  templates: () => withBase('/templates/'),
  template: (slug) => withBase(`/templates/${slug}/`),
  glossary: () => withBase('/glossary/'),
  deadlines: () => withBase('/deadlines/'),
  help: () => withBase('/help/'),
};

// Searchable text for a paired article, in both languages, expanded with synonyms.
export function buildSearchText(pair, taxonomy, synonyms) {
  const parts = [];
  for (const lang of LANGS) {
    const a = pair[lang];
    if (!a) continue;
    const cat = taxonomy.categories.find((c) => c.slug === a.category);
    parts.push(
      a.title, a.summary, ...(a.tags || []),
      cat ? `${cat.en.name} ${cat.ta.name}` : '',
      ...(a.body || []).map((b) => [b.text, ...(b.items || [])].filter(Boolean).join(' ')),
      ...(a.practicalSteps || []),
      ...(a.exceptions || []),
      ...(a.faqs || []).flatMap((f) => [f.q, f.a]),
      ...(a.misconceptions || []).flatMap((m) => [m.myth, m.fact]),
      ...(a.sources || []).map((s) => s.label)
    );
  }
  let text = parts.join(' ').toLowerCase();
  for (const group of synonyms.groups || []) {
    const terms = group.map((g) => g.toLowerCase());
    if (terms.some((term) => text.includes(term))) text += ' ' + terms.join(' ');
  }
  return text;
}
