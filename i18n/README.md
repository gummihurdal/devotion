# Translations (i18n)

English lives in `devotionals`, `lessons`, `topics`. Every other language lives in `devotionals_i18n`, `lessons_i18n`,
`topics_i18n` (one row per source row and language; public read, written only with the service key). The pages load
`i18n.js`, which picks the language (`?lang=es`, the saved choice, or the browser) and merges the translated row over
the English one, so a missing translation simply shows English.

Translate a language (Claude Opus 5.5 through the Message Batches API, half price, usually done within the hour):

    export ANTHROPIC_API_KEY=... SUPABASE_SECRET_KEY=...
    node i18n/translate.mjs dry es        # what is missing, cost estimate
    node i18n/translate.mjs submit es     # creates the batch, id saved to i18n/batch.es.json
    node i18n/translate.mjs collect es    # when the batch has ended: validate + upsert

Spanish, 2026-11-09: 433 rows submitted, 432 imported ($10.48), 1 resubmitted. Scripture in the Reina-Valera 1909
(public domain), formal "usted".

## Done (first pass)
- `i18n.js` with the EN/ES dictionary, date words, overlay, and the EN/ES switch in the sidebar (11 pages) and on the landing page
- devotion, learn, topics, calendar, archive: labels and content in the chosen language; index: hero, cards, today's verse

## Still English (next passes)
- well, blog, contact, settings, sermons, music, ip, privacy, onboarding: page bodies (nav and switch are done)
- calendar drawer labels, archive card text, learn lesson sidebar; `<title>` tags and meta descriptions; a Language row in Settings
- store listings for the Android/iOS apps (the apps wrap the site and pick Spanish up on their next build)
- 28 calendar dates still have no devotional in any language (337 of 365)
