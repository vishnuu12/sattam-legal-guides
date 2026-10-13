# Contributing to Sattam

Thanks for helping make the law understandable. Contributions of all kinds are welcome:
new guides, translations, corrections, and design or code improvements.

## Ground rules

- **Accuracy first.** Legal information must be correct and sourced. Prefer official
  government or Act sources (India Code, department portals, RBI, NALSA, etc.).
- **Plain language.** Write for a first-time reader. Explain jargon; do not use it.
- **Both languages.** A new guide is not complete until it exists in English **and** Tamil.
- **Honest review status.** Never mark content `reviewed` unless a named person actually
  reviewed it.

## Getting set up

```bash
git clone <your-fork>
cd sattam
npm run validate      # content checks
npm run build         # generate dist/
npm run serve         # preview at http://localhost:8080
```

Node 18+ is required. There are no npm dependencies.

## Adding a guide

```bash
npm run new -- --slug=my-topic --category=consumer-rights
```

Then edit `content/en/my-topic.json` and `content/ta/my-topic.json`. Run `npm run check`
before opening a pull request. CI runs the same command and will fail on content errors.

See the **article model** and **translation guide** sections in `README.md`.

## Translating

- Natural, modern Tamil in proper Unicode. Not transliteration.
- Keep Act names, section numbers, dates and source URLs identical to the English file.
- Legal terms stay in English with a short Tamil explanation in brackets where helpful.

## Reviewing

- **Translation review:** read the Tamil against the English for meaning (not word-for-word),
  then set `translationStatus: "reviewed"` and fill `translationReviewer`.
- **Legal review:** confirm the facts, section references and sources, then set
  `legalReviewStatus: "reviewed"`, fill `legalReviewer` and set `lastLegalReview`.

## What the validator checks

- Missing English or Tamil translation for an id.
- Duplicate article ids or slugs.
- Required metadata missing in either language.
- Invalid translation / legal review status values.
- `sectionRefs` and source URLs that differ between English and Tamil.
- Source URLs that are not `https`.
- `reviewed` status without the matching reviewer / review date.
- Stale `lastUpdated` (~18 months) or `lastLegalReview` (1 year).

## Code changes

- Keep the build dependency-free. If a dependency is truly needed, justify it in the PR.
- Keep the site accessible: correct `lang`, keyboard support, labels on icon buttons,
  and no meaning conveyed by colour or emoji alone.
- Keep both languages in mind for any UI text — add new strings to `src/i18n/ui.json`
  in **both** `en` and `ta`.

## Commit messages

Short and clear, e.g. `content: add min-wages guide (en+ta)` or `fix: correct MV Act source URL`.
