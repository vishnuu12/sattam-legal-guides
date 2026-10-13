#!/usr/bin/env node
// Scaffold a new bilingual article pair: content/en/<slug>.json + content/ta/<slug>.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJSON } from '../src/lib.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);

const slug = args.slug;
const category = args.category;

if (!slug || !category) {
  console.error('Usage: npm run new -- --slug=<slug> --category=<category-slug>');
  process.exit(1);
}

const taxonomy = readJSON(path.join(ROOT, 'content/taxonomy.json'));
if (!taxonomy.categories.some((c) => c.slug === category)) {
  console.error(`Unknown category "${category}". Valid categories:`);
  for (const c of taxonomy.categories) console.error(`  - ${c.slug}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

function base(lang) {
  return {
    id: slug,
    slug,
    lang,
    category,
    title: lang === 'en' ? 'TODO: title' : 'TODO: தலைப்பு',
    summary: lang === 'en' ? 'TODO: one-sentence summary' : 'TODO: ஒரு வரி சுருக்கம்',
    tags: [],
    readingMinutes: 4,
    lastUpdated: today,
    publishedDate: today,
    translationStatus: 'draft',
    legalReviewStatus: 'pending',
    translationReviewer: null,
    legalReviewer: null,
    lastLegalReview: null,
    sectionRefs: [],
    body: [
      { type: 'p', text: lang === 'en' ? 'TODO: opening paragraph.' : 'TODO: தொடக்கப் பத்தி.' },
      { type: 'h2', text: lang === 'en' ? 'TODO: section heading' : 'TODO: பிரிவுத் தலைப்பு' },
      { type: 'list', items: [lang === 'en' ? 'TODO' : 'TODO'] },
    ],
    practicalSteps: [],
    exceptions: [],
    faqs: [{ q: lang === 'en' ? 'TODO: question' : 'TODO: கேள்வி', a: lang === 'en' ? 'TODO: answer' : 'TODO: பதில்' }],
    sources: [{ label: 'India Code', url: 'https://www.indiacode.nic.in/' }],
    misconceptions: [],
  };
}

for (const lang of ['en', 'ta']) {
  const file = path.join(ROOT, 'content', lang, `${slug}.json`);
  if (fs.existsSync(file)) {
    console.error(`Refusing to overwrite existing file: ${file}`);
    process.exit(1);
  }
  fs.writeFileSync(file, JSON.stringify(base(lang), null, 2) + '\n');
  console.log(`created ${path.relative(ROOT, file)}`);
}

console.log('\nNext: fill in both files, then run `npm run check`.');
