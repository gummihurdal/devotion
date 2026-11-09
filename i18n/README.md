# Translations (i18n)

English lives in `devotionals`, `lessons`, `topics` and in the HTML. Every other language lives in `devotionals_i18n`,
`lessons_i18n`, `topics_i18n` (one row per source row and language; public read, written only with the service key) and
in `i18n-pages.js` (page strings) plus the dictionary inside `i18n.js` (shared labels). The pages load `i18n.js` then
`i18n-pages.js`; the language is `?lang=es`, the saved choice (sidebar switch or Settings), or the browser language.
Anything missing stays English.

## Content (database)

    export ANTHROPIC_API_KEY=... SUPABASE_SECRET_KEY=...
    node i18n/translate.mjs dry es        # rows without a translation, cost estimate
    node i18n/translate.mjs submit es     # Claude Opus 5.5 Message Batch (half price), id saved to i18n/batch.es.json
    node i18n/translate.mjs collect es    # when the batch has ended: validate + upsert

## Page strings (HTML)

    python3 -I i18n/extract_ui.py --patch   # marks every visible string with data-i18n / data-i18n-html / data-i18n-ph,
                                            # writes i18n/ui-strings.en.json (re-run after editing English text)
    node i18n/translate_ui.mjs es           # Opus 5.5, one call per page -> ui-strings.es.json + i18n-pages.js

Labels that scripts render (buttons, empty states, settings values) live in the dictionary in `i18n.js`.

## Spanish, 2026-11-09
Content: 365 devotionals (the 28 December ones were generated the same day, Opus 5.5), 84 lessons, 12 topics (~$13 in batches). Pages: 253 strings on all 15 pages ($0.21). Scripture in the
Reina-Valera 1909 (public domain), formal "usted". Language row in Settings; EN/ES switch in every sidebar and on the
landing, onboarding, privacy and visitor pages.

## Not translated on purpose
Visitor-submitted blog posts, sermon and music entries (shown as submitted); source book titles; the Android/iOS store
listings (outside the repo; the apps wrap the site and pick Spanish up on their next build).

## Adding a language
Add it to `LANGS` in `i18n.js` and the dictionary there, to `LANGS` in both scripts, then run the four commands above.
