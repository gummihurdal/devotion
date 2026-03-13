#!/usr/bin/env node
// ============================================================
// THE ETERNAL WORD — Devotional Generator
// Generates all 365 devotionals and inserts into Supabase
//
// Setup on Hetzner:
//   npm install @anthropic-ai/sdk @supabase/supabase-js
//   node generate.js
//
// Safe to re-run — skips dates already in DB
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// ── CONFIG ──────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_KEY; // service role for inserts
const DELAY_MS          = 2500; // delay between API calls (be gentle)
// ────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY);

// Theological sources to weave through the year
const SOURCES = [
  { name: 'The Normal Christian Life', author: 'Watchman Nee', themes: ['union with Christ', 'the exchanged life', 'dying to self', 'the indwelling Spirit', 'the cross as our liberation'] },
  { name: 'The Cost of Discipleship', author: 'Dietrich Bonhoeffer', themes: ['costly grace vs cheap grace', 'radical discipleship', 'following Christ into suffering', 'the Sermon on the Mount', 'the church as community under the cross'] },
  { name: "Pilgrim's Progress", author: 'John Bunyan', themes: ['the narrow way', 'the Slough of Despond', 'Doubting Castle', 'Vanity Fair', 'the Celestial City', 'perseverance of the saints'] },
  { name: 'Napoleon on Jesus', author: 'Napoleon Bonaparte', themes: ['Christ as unlike any man in history', 'love conquering where armies failed', 'the empire of the heart', 'the resurrection changing the world'] },
  { name: 'Mere Christianity', author: 'C.S. Lewis', themes: ['the moral argument for God', 'pride as the great sin', 'putting on Christ', 'the three-personal God', 'the new man'] },
  { name: 'Systematic Theology', author: 'Wayne Grudem', themes: ['the attributes of God', 'justification by faith', 'sanctification', 'the perseverance of the saints', 'the nature of Scripture'] },
  { name: 'The Reason for God', author: 'Tim Keller', themes: ['doubt as the path to deeper faith', 'the justice and love of God', 'the meaning of the cross', 'why suffering points to God'] },
];

function getAllDates() {
  const dates = [];
  const year = 2026; // non-leap for safety; Feb 29 handled gracefully
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      dates.push(`${mm}-${dd}`);
    }
  }
  return dates; // 365 dates
}

function getMonthName(mm) {
  const names = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
  return names[parseInt(mm) - 1];
}

async function generateDevotion(monthDay) {
  const [mm, dd] = monthDay.split('-');
  const monthName = getMonthName(mm);
  const dayNum = parseInt(dd);

  // Rotate sources so different ones are featured on different days
  const dayOfYear = (parseInt(mm) - 1) * 30 + parseInt(dd);
  const primarySource = SOURCES[dayOfYear % SOURCES.length];
  const secondarySource = SOURCES[(dayOfYear + 2) % SOURCES.length];
  const tertiarySource = SOURCES[(dayOfYear + 4) % SOURCES.length];

  const prompt = `You are crafting one of 365 daily Christian devotionals for a young adults group (ages 19-40) in Vienna, Austria. Today's date in the devotional cycle is ${monthName} ${dayNum}.

Primary source to draw from deeply: "${primarySource.name}" by ${primarySource.author}
Key themes from this source: ${primarySource.themes.join(', ')}

Secondary source: "${secondarySource.name}" by ${secondarySource.author}
Tertiary source: "${tertiarySource.name}" by ${tertiarySource.author}

REQUIREMENTS:
- Scripture must be real, exact, and appropriate for the theme
- Meditation must be theologically serious, not shallow — challenge the reader
- The reflection questions must be POINTED and personal — not vague. They should cause the reader to stop and examine their actual life today.
- The prayer should sound like it was written by someone who truly fears God
- The call to action must be specific and costly — Bonhoeffer would not approve of comfortable Christianity
- Weave the source authors naturally — don't just quote them, let their ideas breathe through the text

Make this specific to ${monthName} ${dayNum} — reference the season, the time of year if appropriate.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "scripture_reference": "Book Chapter:Verse",
  "scripture_text": "The exact verse text",
  "theme": "A short powerful theme title (6-9 words)",
  "meditation": "Three rich paragraphs of theological reflection separated by \\n\\n. Each paragraph at least 4 sentences. Deep, serious, transformational.",
  "quote_text": "A real, striking quote from one of the three source authors",
  "quote_author": "Full name and work title",
  "reflection_questions": [
    {"topic": "Short topic label", "question": "A specific, searching question about the reader's actual life right now"},
    {"topic": "Short topic label", "question": "A second pointed question that goes deeper"},
    {"topic": "Short topic label", "question": "A third question that leads toward action or surrender"}
  ],
  "prayer": "A sincere, theologically rich closing prayer of 4-6 sentences. Address God directly.",
  "call_to_action": "One specific, costly, concrete spiritual challenge for today. Not vague. What must they actually DO or STOP or SURRENDER today?",
  "sources": ["${primarySource.name}", "${secondarySource.name}"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('✝  THE ETERNAL WORD — Devotional Generator');
  console.log('━'.repeat(50));

  // Fetch already-generated dates
  const { data: existing } = await supabase.from('devotionals').select('month_day');
  const done = new Set((existing || []).map(r => r.month_day));
  console.log(`✓  Already in DB: ${done.size} devotionals`);

  const allDates = getAllDates();
  const remaining = allDates.filter(d => !done.has(d));
  console.log(`→  To generate: ${remaining.length} devotionals\n`);

  let success = 0;
  let failed = [];

  for (let i = 0; i < remaining.length; i++) {
    const monthDay = remaining[i];
    const [mm, dd] = monthDay.split('-');
    process.stdout.write(`[${i+1}/${remaining.length}] ${getMonthName(mm)} ${parseInt(dd).toString().padStart(2)}... `);

    try {
      const devotion = await generateDevotion(monthDay);

      const { error } = await supabase.from('devotionals').upsert({
        month_day:            monthDay,
        scripture_reference:  devotion.scripture_reference,
        scripture_text:       devotion.scripture_text,
        theme:                devotion.theme,
        meditation:           devotion.meditation,
        quote_text:           devotion.quote_text,
        quote_author:         devotion.quote_author,
        reflection_questions: devotion.reflection_questions,
        prayer:               devotion.prayer,
        call_to_action:       devotion.call_to_action,
        sources:              devotion.sources,
      }, { onConflict: 'month_day' });

      if (error) throw error;

      success++;
      console.log(`✓  ${devotion.theme}`);
    } catch (err) {
      console.log(`✗  FAILED — ${err.message}`);
      failed.push(monthDay);
    }

    if (i < remaining.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`✝  Complete. ${success} generated. ${failed.length} failed.`);
  if (failed.length > 0) {
    console.log(`   Failed dates: ${failed.join(', ')}`);
    console.log(`   Re-run the script to retry failed dates.`);
  }
}

main().catch(console.error);
