#!/usr/bin/env node
// Journey with God / graceforevery.day -- translate devotionals, lessons and topics with the Claude Message Batches API
// (50 % of the standard price; a batch usually finishes within the hour). One language per run; English stays in the base
// tables, translations go to devotionals_i18n / lessons_i18n / topics_i18n (owner 2026-11-09 "start on grace").
//
//   node i18n/translate.mjs dry es        count what is missing + cost estimate, no API call
//   node i18n/translate.mjs submit es     create the batch; ids saved to i18n/batch.es.json
//   node i18n/translate.mjs collect es    fetch finished results, validate, upsert into the *_i18n tables
//
// Env: ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY (service role: reads the base tables, writes *_i18n), SUPABASE_URL (optional)
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SB = process.env.SUPABASE_URL || 'https://mjphpctvuxmbjhmcscoj.supabase.co';
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!KEY) { console.error('SUPABASE_SECRET_KEY missing'); process.exit(1); }
const MODEL = 'claude-opus-5-5';
const PRICE_BATCH = { in: 2 / 1e6, out: 10 / 1e6 };            // Opus 5.5 ($4 / $20) at the 50 % batch discount
const LANGS = {
  es: { name: 'Spanish (neutral, understood in Spain and Latin America; formal "usted")', adj: 'Spanish',
        bible: 'Reina-Valera 1909 (public domain)', example: 'Juan 3:16' },
};
const [cmd, lang] = process.argv.slice(2);
if (!['dry', 'submit', 'collect'].includes(cmd) || !LANGS[lang]) { console.error('usage: node i18n/translate.mjs dry|submit|collect <lang>'); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
async function sb(q, opts = {}) {
  const r = await fetch(`${SB}/rest/v1/${q}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${q.slice(0, 60)}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  const txt = await r.text();
  return txt.trim() ? JSON.parse(txt) : null;                 // return=minimal upserts answer with an empty body
}
const FIELDS = {
  devotionals: ['scripture_reference', 'scripture_text', 'theme', 'meditation', 'quote_text', 'quote_author', 'reflection_questions', 'prayer', 'call_to_action'],
  lessons: ['title', 'meditation', 'quote_text', 'quote_author', 'scripture_reference', 'scripture_text', 'reflection_questions', 'key_idea'],
  topics: ['title', 'subtitle', 'description'],
};
const FK = { devotionals: 'devotional_id', lessons: 'lesson_id', topics: 'topic_id' };
const KEEP = new Set(['quote_author']);                           // copied, never translated

const SYSTEM = (l) => `You are a careful literary translator for "Journey with God" (graceforevery.day): daily Christian devotionals and study lessons written in English for a young-adult church group in Vienna. You translate into ${LANGS[l].name}.

Rules:
- Translate meaning and tone faithfully: warm, reverent, direct. Natural ${LANGS[l].adj}, not word-for-word. Keep paragraph breaks (\\n\\n) exactly as in the English.
- Scripture: give "scripture_text" in the wording of the ${LANGS[l].bible} and "scripture_reference" with the ${LANGS[l].adj} book name and the same chapter and verses (e.g. "${LANGS[l].example}"). Never invent or paraphrase a verse.
- Quotations ("quote_text"): translate them. "quote_author" is copied as given; names are not translated.
- Keep every name, book title, year and number exactly as in the English; titles of the source books stay in English. Do not add or remove claims.
- "reflection_questions" is a list of {"topic": ..., "question": ...} objects: translate both values, keep the structure and the order.
- Respond with ONLY the JSON object with the same keys, no markdown fences, no commentary.`;

function payload(table, row) { const o = {}; for (const k of FIELDS[table]) o[k] = row[k]; return o; }
function request(table, row) {
  return { custom_id: `${table}-${row.id}`, params: {
    model: MODEL, max_tokens: 8000, output_config: { effort: 'medium' },
    system: [{ type: 'text', text: SYSTEM(lang), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Translate this ${table.slice(0, -1)}. Return the same JSON object with translated values.\n\n${JSON.stringify(payload(table, row), null, 1)}` }],
  } };
}
async function missing(table) {
  const rows = await sb(`${table}?select=*&order=id.asc`);
  const have = new Set((await sb(`${table}_i18n?select=${FK[table]}&lang=eq.${lang}`)).map(r => r[FK[table]]));
  return rows.filter(r => !have.has(r.id));
}
const stateFile = path.join(here, `batch.${lang}.json`);
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { batches: [] };
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

if (cmd === 'dry' || cmd === 'submit') {
  const reqs = [];
  let chars = 0;
  for (const table of Object.keys(FIELDS)) {
    const rows = await missing(table);
    for (const r of rows) { reqs.push(request(table, r)); chars += JSON.stringify(payload(table, r)).length; }
    console.log(`${table}: ${rows.length} rows without ${lang}`);
  }
  const inTok = Math.round(chars / 4) + reqs.length * 420, outTok = Math.round(chars / 4 * 1.15) + reqs.length * 700;   // text + JSON + some thinking
  const est = inTok * PRICE_BATCH.in + outTok * PRICE_BATCH.out;
  console.log(`${reqs.length} requests, ${chars} chars; estimate ~${inTok} in / ~${outTok} out tokens, ~$${est.toFixed(2)} at batch prices (live would be ~$${(est * 2).toFixed(2)})`);
  if (cmd === 'submit' && reqs.length) {
    const client = new Anthropic();
    const b = await client.messages.batches.create({ requests: reqs });
    state.batches.push({ id: b.id, created: new Date().toISOString(), n: reqs.length, status: b.processing_status, collected: false });
    save();
    console.log(`batch ${b.id} created (${b.processing_status}); ${reqs.length} requests. Collect with: node i18n/translate.mjs collect ${lang}`);
  }
}

if (cmd === 'collect') {
  const client = new Anthropic();
  for (const b of state.batches.filter(x => !x.collected)) {
    const info = await client.messages.batches.retrieve(b.id);
    b.status = info.processing_status; save();
    console.log(`${b.id}: ${info.processing_status} processing=${info.request_counts.processing} ok=${info.request_counts.succeeded} err=${info.request_counts.errored} expired=${info.request_counts.expired}`);
    if (info.processing_status !== 'ended') continue;
    const byTable = { devotionals: [], lessons: [], topics: [] };
    const bad = [];
    let usage = { in: 0, out: 0 };
    for await (const res of await client.messages.batches.results(b.id)) {
      const [table, idS] = res.custom_id.split('-'); const id = parseInt(idS, 10);
      if (res.result.type !== 'succeeded') { bad.push(`${res.custom_id}: ${res.result.type} ${res.result.error?.type || ''}`); continue; }
      const m = res.result.message;
      usage.in += m.usage.input_tokens + (m.usage.cache_read_input_tokens || 0) + (m.usage.cache_creation_input_tokens || 0); usage.out += m.usage.output_tokens;
      if (m.stop_reason === 'refusal') { bad.push(`${res.custom_id}: refusal ${m.stop_details?.category || ''}`); continue; }
      const text = m.content.filter(c => c.type === 'text').map(c => c.text).join('').trim().replace(/^```json\s*|```$/g, '').trim();
      let out;
      try { out = JSON.parse(text); } catch (e) { bad.push(`${res.custom_id}: not JSON`); continue; }
      const row = { [FK[table]]: id, lang, model: MODEL };
      let ok = true;
      for (const k of FIELDS[table]) {
        if (KEEP.has(k)) continue;
        const v = out[k];
        if (v == null || (typeof v === 'string' && !v.trim())) { if (table === 'topics' && k === 'description') { row[k] = null; continue; } ok = false; break; }
        if (k === 'reflection_questions' && !Array.isArray(v)) { ok = false; break; }
        row[k] = v;
      }
      if (!ok) { bad.push(`${res.custom_id}: missing field`); continue; }
      byTable[table].push(row);
    }
    for (const [table, rows] of Object.entries(byTable)) {
      for (let i = 0; i < rows.length; i += 50) {
        await sb(`${table}_i18n?on_conflict=${FK[table]},lang`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 50)) });
      }
      console.log(`${table}_i18n: ${rows.length} ${lang} rows upserted`);
    }
    const cost = usage.in * PRICE_BATCH.in + usage.out * PRICE_BATCH.out;
    console.log(`tokens in ${usage.in} out ${usage.out}; cost ~$${cost.toFixed(2)} (batch prices)`);
    if (bad.length) console.log(`${bad.length} not imported (re-run submit to retry):\n  ` + bad.join('\n  '));
    b.collected = true; b.cost_usd = Math.round(cost * 100) / 100; b.failed = bad.length; save();
  }
}
