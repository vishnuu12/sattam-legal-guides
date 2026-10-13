# Sattam · சட்டம்

**Know Your Rights. Live With Confidence.**
**உங்கள் உரிமைகளை அறியுங்கள். நம்பிக்கையுடன் வாழுங்கள்.**

Sattam is a free, bilingual (English + Tamil) public legal-education website. It explains
everyday Indian laws — traffic, cybercrime, consumer rights, employment, rent, banking,
family and emergency help — in plain language so that anyone can understand their rights
without struggling with legal jargon.

- Plain, conversational English and natural, modern Tamil (proper Unicode, not transliteration).
- Tamil is a first-class language: every interface string, category, callout and guide is translated.
- A visible language switcher (`🇬🇧 English | 🇮🇳 தமிழ்`) that keeps you on the same page.
- Localized URLs (`/en/traffic-rules/` and `/ta/traffic-rules/`) connected by a shared article id.
- Honest review labels: the site never shows an un-reviewed translation as if it were verified.

> Sattam provides **general legal information for education only**. It is not legal advice.
> Laws change and vary by state. For your situation, consult a qualified lawyer or your
> nearest free legal aid centre.

---

## Tech stack

A dependency-free static site generator in Node.js (>= 18). No frameworks, no build
toolchain to install — `npm run build` reads JSON content and writes plain HTML/CSS/JS.

```
content/            Localized content (one JSON file per article, per language)
  taxonomy.json     Categories: slug, emoji, English + Tamil name and blurb
  en/<id>.json      English article
  ta/<id>.json      Tamil article (same id/slug -> linked translation)
src/
  lib.mjs           Content loading, i18n lookup, path helpers, search text builder
  render.mjs        HTML templates (layout, callouts, article/home/category pages)
  build.mjs         Site generator -> dist/
  validate.mjs      Content validation (run before publishing)
  i18n/ui.json      All interface strings in English and Tamil
  data/             synonyms.json (cross-language search), helplines.json, situations.json
  styles/main.css   Design system + bilingual typography
  client/app.js     Language memory, search, filters, mobile menu
scripts/
  new-article.mjs   Scaffold a new English + Tamil article pair
  serve.mjs         Preview the built site locally
```

---

## Getting started

```bash
npm run validate   # check content integrity (translations, ids, sources, review dates)
npm run build      # generate the site into dist/
npm run serve      # preview dist/ at http://localhost:8080
npm run check      # validate + build (what CI runs)
```

There are no dependencies to install. `dist/` is generated and is git-ignored.

---

## The article model

Each article is a single JSON file. English and Tamil live in **separate files** with the
**same `id`** so they can be edited, reviewed and published independently.

```jsonc
{
  "id": "traffic-rules",              // must equal the filename and the slug
  "slug": "traffic-rules",            // URL segment: /en/traffic-rules/
  "lang": "en",                       // "en" or "ta"
  "category": "traffic-rules",        // must exist in content/taxonomy.json
  "title": "...",
  "summary": "...",                   // one-sentence answer, used in cards + meta
  "tags": ["traffic", "challan"],
  "readingMinutes": 6,
  "lastUpdated": "2026-10-13",        // ISO date
  "translationStatus": "draft",       // draft | machine | human | reviewed
  "legalReviewStatus": "pending",     // pending | in_review | reviewed | not_required
  "translationReviewer": null,        // required once translationStatus = "reviewed"
  "legalReviewer": null,              // required once legalReviewStatus = "reviewed"
  "lastLegalReview": null,            // ISO date, required once legally reviewed
  "sectionRefs": ["Motor Vehicles Act, 1988"],   // must match across en + ta
  "body": [                           // ordered content blocks
    { "type": "p", "text": "..." },
    { "type": "h2", "text": "..." },
    { "type": "list", "items": ["...", "..."] },
    { "type": "callout", "kind": "caution", "text": "..." }
  ],
  "practicalSteps": ["..."],          // rendered as a numbered list
  "exceptions": ["..."],
  "faqs": [{ "q": "...", "a": "..." }],
  "sources": [{ "label": "...", "url": "https://..." }],   // URLs must match across en + ta
  "misconceptions": [{ "myth": "...", "fact": "..." }]
}
```

Callout `kind` values: `did-you-know`, `rights`, `caution`, `action`, `remember`,
`sources`, `misconceptions`.

---

## How to add a new guide

1. **Scaffold both languages:**
   ```bash
   npm run new -- --slug=min-wages --category=employment-rights
   ```
   This creates `content/en/min-wages.json` and `content/ta/min-wages.json` with the
   required fields and placeholder text, both marked `draft` / `pending`.

2. **Write the English article.** Keep it conversational and short. Explain any legal term
   in plain words. Add at least one official source URL.

3. **Write the Tamil article** in the same file pair. See the translation guide below.

4. **Validate and build:**
   ```bash
   npm run check
   ```

5. **Open a pull request.** CI runs `npm run validate` and fails on any error.

---

## Translation guide (English → Tamil)

- Write **natural, modern Tamil** that people actually use. Do not translate word-for-word
  when it makes the Tamil unnatural — translate the meaning accurately and clearly.
- Use **correct Tamil Unicode**, never transliteration in English letters.
- Avoid heavy literary Tamil. Keep sentences short.
- Keep well-known legal terms in English and, where useful, add the Tamil explanation in
  brackets — e.g. `சாலான் (challan)`, `முன்பணம் (security deposit)`.
- Keep **section numbers, Act names, dates and source URLs identical** to the English file.
  `sectionRefs` and source URLs are checked by the validator.
- Set `translationStatus` honestly: `draft` (initial AI or untrusted draft), `machine`
  (machine translation), `human` (human translated, not yet reviewed), or `reviewed`
  (reviewed by a named person). Only set `reviewed` together with `translationReviewer`.

## Review workflow

An article is only treated as verified when **both** statuses are `reviewed` and the
reviewer fields are filled in:

```jsonc
"translationStatus": "reviewed",  "translationReviewer": "Name (date)",
"legalReviewStatus": "reviewed",  "legalReviewer": "Advocate Name (date)",
"lastLegalReview": "2026-10-13"
```

The UI shows a badge for each status and, while a guide is unreviewed, a clear notice.
Machine-translated or unreviewed legal content is **never** presented as verified.

### When a law changes

Update the affected section in **both** language files, bump `lastUpdated`, reset
`legalReviewStatus` to `pending`, and flag both files in the pull request. The validator
warns when `lastUpdated` is older than ~18 months or `lastLegalReview` is older than a year.

---

## Language switcher, URLs and fallback

- Every page exists in both languages at matching paths (`/en/...` and `/ta/...`).
- The header toggle swaps only the language segment, so you keep the same article, category
  or search context.
- The chosen language is remembered in `localStorage`; returning visitors to `/` are sent
  to their last language automatically.
- Each page declares `<html lang="en">` or `<html lang="ta">` and links `hreflang`
  alternates for search engines.
- **Fallback:** if a Tamil translation is missing, the Tamil URL shows the English content
  inside a subtree marked `lang="en"`, with a prominent "fallback content" notice. An
  English article is never shown as a completed Tamil translation.

## Search

Client-side search over `dist/assets/search-index.json`, generated at build time.

- Searches both languages; each result shows its language.
- `src/data/synonyms.json` maps equivalent terms across languages (e.g. `traffic rules` ↔
  `போக்குவரத்து விதிகள்`), so an English query can surface a Tamil guide and vice versa.
- Language and category filters; localized labels, counts and empty states.

## Typography

- English: **Inter** (body) and **Manrope** (headings).
- Tamil: **Noto Sans Tamil** for both body and headings.
- Fonts load from Google Fonts with `display=swap`, and every stack falls back to system
  fonts (including `Latha` / `Nirmala UI`) for offline resilience.
- Tamil body text uses a taller line-height (~1.9) and headings get extra line spacing so
  vowel signs and combining characters are never clipped.

## Accessibility

- Correct `lang` on `<html>` (and on fallback content).
- Keyboard-operable language switch and menu; visible focus rings.
- Icon-only buttons carry `aria-label`; live region announces search result counts.
- Colour and emoji never carry legal meaning on their own.
- Respects `prefers-reduced-motion`.

## Deployment

The build is a plain static folder, so it deploys anywhere.

- **Netlify / Cloudflare Pages / Vercel:** build command `npm run check`, publish directory `dist`.
  (`netlify.toml` is included.)
- **GitHub Pages:** the included workflow builds and publishes `dist/` on every push to `main`.
  A project site is served from a sub-path, so the workflow sets `BASE_PATH` to `/<repo-name>`
  and `SITE_URL` to `https://<owner>.github.io` automatically. Enable Pages once with
  *Settings → Pages → Source: GitHub Actions*.
- **Custom domain:** set `BASE_PATH` to empty (or leave `basePath` empty in `content/taxonomy.json`)
  and point `siteUrl` at your domain.
- **Any web server:** run `npm run build` and serve `dist/`.

Before going live, set your real domain in `content/taxonomy.json` → `siteUrl` (used for
canonical links, `hreflang` and the sitemap). If the site is served from a sub-path rather
than a domain root, set `basePath` (or the `BASE_PATH` env var) to that sub-path — all
internal links, assets and the search index respect it.

## License

Content is shared under **CC BY-SA 4.0**; the code is under the **MIT License**. See `LICENSE`.
