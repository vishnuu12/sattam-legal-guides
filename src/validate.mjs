import fs from 'node:fs';
import path from 'node:path';
import { ROOT, LANGS, loadArticles, readJSON } from './lib.mjs';

const taxonomy = readJSON(path.join(ROOT, 'content/taxonomy.json'));
const ui = readJSON(path.join(ROOT, 'src/i18n/ui.json'));
const articles = loadArticles();

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const REQUIRED = ['id', 'slug', 'lang', 'category', 'title', 'summary', 'tags', 'readingMinutes', 'lastUpdated', 'translationStatus', 'legalReviewStatus', 'body', 'sources'];
const TRANS_STATUS = new Set(['draft', 'machine', 'human', 'reviewed']);
const LEGAL_STATUS = new Set(['pending', 'in_review', 'reviewed', 'not_required']);
const MAX_AGE_DAYS = 548; // ~18 months
const MAX_LEGAL_REVIEW_DAYS = 365;

const daysAgo = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const catSlugs = new Set(taxonomy.categories.map((c) => c.slug));
const seenIds = new Map();
const seenSlugs = new Map();

for (const [id, pair] of Object.entries(articles)) {
  // duplicate id check (same id across two files)
  if (seenIds.has(id)) err(`Duplicate article id "${id}"`);
  seenIds.set(id, true);

  // missing translation
  for (const lang of LANGS) {
    if (!pair[lang]) err(`[${id}] Missing ${lang.toUpperCase()} translation (no content/${lang}/${id}.json)`);
  }

  for (const lang of LANGS) {
    const a = pair[lang];
    if (!a) continue;
    const tag = `[${lang}/${a.slug || id}]`;

    // required metadata
    for (const field of REQUIRED) {
      const v = a[field];
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) err(`${tag} Missing required field "${field}"`);
    }

    // id / slug consistency
    if (a.id !== id) err(`${tag} id "${a.id}" does not match filename "${id}"`);
    if (a.slug !== id) err(`${tag} slug "${a.slug}" does not match filename "${id}"`);

    // duplicate slug within a language
    const key = `${lang}:${a.slug}`;
    if (seenSlugs.has(key)) err(`${tag} Duplicate slug in ${lang}`);
    seenSlugs.set(key, true);

    // category exists
    if (!catSlugs.has(a.category)) err(`${tag} Unknown category "${a.category}" (not in taxonomy)`);

    // status enums
    if (!TRANS_STATUS.has(a.translationStatus)) err(`${tag} Invalid translationStatus "${a.translationStatus}"`);
    if (!LEGAL_STATUS.has(a.legalReviewStatus)) err(`${tag} Invalid legalReviewStatus "${a.legalReviewStatus}"`);

    // published-before-verified gate
    if (a.translationStatus === 'reviewed' && !a.translationReviewer) err(`${tag} translationStatus is "reviewed" but translationReviewer is missing`);
    if (a.legalReviewStatus === 'reviewed' && (!a.legalReviewer || !a.lastLegalReview)) err(`${tag} legalReviewStatus is "reviewed" but legalReviewer / lastLegalReview is missing`);

    // source URLs must be absolute https
    for (const s of a.sources || []) {
      if (!/^https:\/\//.test(s.url || '')) err(`${tag} Source URL is not https: ${s.url}`);
    }

    // freshness
    const age = daysAgo(a.lastUpdated);
    if (age == null) err(`${tag} lastUpdated is not a valid ISO date: ${a.lastUpdated}`);
    else if (age > MAX_AGE_DAYS) warn(`${tag} lastUpdated is ${age} days old (over ${MAX_AGE_DAYS}); review it`);
    if (a.lastLegalReview) {
      const lage = daysAgo(a.lastLegalReview);
      if (lage == null) err(`${tag} lastLegalReview is not a valid ISO date: ${a.lastLegalReview}`);
      else if (lage > MAX_LEGAL_REVIEW_DAYS) warn(`${tag} lastLegalReview is ${lage} days old; flag both languages for review`);
    }
  }

  // cross-language consistency
  const en = pair.en;
  const ta = pair.ta;
  if (en && ta) {
    const enRefs = JSON.stringify(en.sectionRefs || []);
    const taRefs = JSON.stringify(ta.sectionRefs || []);
    if (enRefs !== taRefs) err(`[${id}] sectionRefs differ between en and ta`);

    const enUrls = (en.sources || []).map((s) => s.url).sort();
    const taUrls = (ta.sources || []).map((s) => s.url).sort();
    if (JSON.stringify(enUrls) !== JSON.stringify(taUrls)) err(`[${id}] source URLs differ between en and ta`);

    if ((en.tags || []).length !== (ta.tags || []).length) warn(`[${id}] tag counts differ between en and ta`);

    for (const lang of LANGS) {
      const a = pair[lang];
      if (a && a.translationStatus === 'draft' && a.legalReviewStatus === 'reviewed') {
        warn(`[${lang}/${a.slug}] marked legally reviewed while its translation is still a draft`);
      }
    }
  }
}

const total = Object.keys(articles).length;
console.log(`Content validation`);
console.log(`  articles: ${total}  (${total * LANGS.length} files expected)`);
console.log(`  errors:   ${errors.length}`);
console.log(`  warnings: ${warnings.length}`);

if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log('  \u26A0 ' + w);
}
if (errors.length) {
  console.log('\nErrors:');
  for (const e of errors) console.log('  \u2717 ' + e);
  process.exit(1);
}
console.log('\n\u2713 All content checks passed.');
