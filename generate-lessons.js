#!/usr/bin/env node
// ============================================================
// THE ETERNAL WORD — Topic Lesson Generator
// Generates 7 lessons per topic (70 total) and inserts into Supabase
//
// Run via GitHub Actions or locally:
//   node generate-lessons.js
// Safe to re-run — skips lessons already in DB
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_KEY;
const DELAY_MS          = 3000;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOPICS = [
  {
    slug: 'christian-identity',
    title: 'Christian Identity',
    lessons: [
      'Who Am I? The Question Before All Questions',
      'Chosen Before the Foundation of the World',
      'Adopted into the Family of God',
      'The Exchanged Life — Dying to Find Your True Self',
      'Beloved: What It Means to Be Loved by God',
      'Identity Under Pressure — When the World Defines You',
      'Living from Identity, Not for Identity',
    ]
  },
  {
    slug: 'the-cross',
    title: 'The Cross',
    lessons: [
      'The Axis of History — Why the Cross Changes Everything',
      'The Wrath and Love of God Meeting at Golgotha',
      'Substitution — He Took Our Place',
      'The Cross as Liberation — Watchman Nee on Co-Crucifixion',
      'Bonhoeffer at the Gallows — The Cross as Discipleship',
      'The Foolishness of the Cross — Paul Against the World',
      'Carrying Your Cross Daily',
    ]
  },
  {
    slug: 'discipleship',
    title: 'Discipleship',
    lessons: [
      'Cheap Grace — The Deadly Enemy of the Church',
      'Costly Grace — What Bonhoeffer Died For',
      'The Sermon on the Mount as a Real Command',
      'Single-Minded Obedience — The Narrow Way',
      'Bunyan\'s Pilgrim — The Long Road to the Celestial City',
      'Suffering as Discipleship — Not a Detour but the Path',
      'The Community of Disciples — No Lone Rangers',
    ]
  },
  {
    slug: 'apologetics',
    title: 'Apologetics',
    lessons: [
      'The Moral Law — C.S. Lewis and the Argument from Conscience',
      'Napoleon on Jesus — What a Conqueror Saw That We Miss',
      'The Trilemma — Liar, Lunatic, or Lord',
      'The Problem of Evil — The Argument That Cuts Both Ways',
      'The Resurrection — History\'s Most Examined Claim',
      'Ravi Zacharias on Why Every Heart Seeks God',
      'Answering Honest Doubt with Honest Faith',
    ]
  },
  {
    slug: 'prayer',
    title: 'Prayer',
    lessons: [
      'Why We Do Not Pray — The Honest Diagnosis',
      'The Lord\'s Prayer as Architecture for the Soul',
      'Watchman Nee on Praying in the Spirit',
      'Intercession — The Ministry of Standing in the Gap',
      'Silence and Waiting — When God Seems Absent',
      'Praying the Psalms — Grief, Rage, and Praise Before God',
      'A Life of Prayer — Not an Hour but an Orientation',
    ]
  },
  {
    slug: 'suffering',
    title: 'Suffering',
    lessons: [
      'The Problem of Pain — Lewis Faces the Hardest Question',
      'The Refining Fire — Why God Does Not Always Remove Suffering',
      'Bunyan in Prison — Creating Beauty in the Dark',
      'Bonhoeffer\'s Letters from Prison — Theology Under Pressure',
      'Lament — The Bible\'s Permission to Cry Out',
      'Keller on Suffering as the Path to Compassion',
      'The Resurrection Answer — Suffering Is Not the Last Word',
    ]
  },
  {
    slug: 'holy-spirit',
    title: 'The Holy Spirit',
    lessons: [
      'The Person of the Spirit — Not a Force but a Friend',
      'Watchman Nee on the Spirit-Filled Life',
      'The Spirit and the Word — Illumination and Authority',
      'Grieving and Quenching the Spirit',
      'The Fruit of the Spirit as Character, Not Performance',
      'The Spirit in Community — The Church as Temple',
      'Walking in the Spirit — Moment by Moment Surrender',
    ]
  },
  {
    slug: 'sin-and-grace',
    title: 'Sin and Grace',
    lessons: [
      'Total Depravity — The Most Misunderstood Doctrine',
      'Pride — C.S. Lewis on the Great Sin',
      'The Doctrine of Justification — Grudem\'s Masterful Exposition',
      'Repentance — Not Feeling Bad but Turning Around',
      'Forgiveness — What It Costs God to Forgive',
      'Sanctification — The Long, Slow Work of Grace',
      'Perseverance — Will You Make It to the End?',
    ]
  },
  {
    slug: 'the-church',
    title: 'The Church',
    lessons: [
      'Life Together — Bonhoeffer\'s Vision of Christian Community',
      'The Body of Christ — Not a Metaphor but a Reality',
      'Bearing One Another\'s Burdens — Real Community is Costly',
      'The Church as Contrast Society — Different by Design',
      'Confession and Accountability — The Disciplines We Avoid',
      'Worship — What Happens When the Church Gathers',
      'The Church\'s Mission — Sent into the World',
    ]
  },
  {
    slug: 'eternity',
    title: 'Eternity',
    lessons: [
      'The Weight of Glory — Lewis on What Awaits',
      'The Celestial City — Bunyan\'s Vision of Heaven',
      'Death — The Last Enemy Already Defeated',
      'The Resurrection Body — What Scripture Actually Says',
      'Judgment — The Doctrine We Would Rather Ignore',
      'The New Creation — Not Escape but Renewal',
      'Living Backwards — How Eternity Changes Today',
    ]
  },
];

const SOURCE_MAP = {
  'christian-identity': ['The Normal Christian Life — Watchman Nee', 'Mere Christianity — C.S. Lewis', 'Systematic Theology — Wayne Grudem'],
  'the-cross':          ['The Cost of Discipleship — Dietrich Bonhoeffer', 'The Normal Christian Life — Watchman Nee', 'Systematic Theology — Wayne Grudem'],
  'discipleship':       ['The Cost of Discipleship — Dietrich Bonhoeffer', "Pilgrim's Progress — John Bunyan", 'The Normal Christian Life — Watchman Nee'],
  'apologetics':        ['Mere Christianity — C.S. Lewis', 'Napoleon on Jesus — Bonaparte', 'The Reason for God — Tim Keller'],
  'prayer':             ['The Normal Christian Life — Watchman Nee', 'Systematic Theology — Wayne Grudem', "Pilgrim's Progress — John Bunyan"],
  'suffering':          ['The Problem of Pain — C.S. Lewis', 'The Reason for God — Tim Keller', 'The Cost of Discipleship — Dietrich Bonhoeffer'],
  'holy-spirit':        ['The Normal Christian Life — Watchman Nee', 'Systematic Theology — Wayne Grudem', 'Mere Christianity — C.S. Lewis'],
  'sin-and-grace':      ['The Cost of Discipleship — Dietrich Bonhoeffer', 'Mere Christianity — C.S. Lewis', 'Systematic Theology — Wayne Grudem'],
  'the-church':         ['Life Together — Dietrich Bonhoeffer', 'The Normal Christian Life — Watchman Nee', 'Systematic Theology — Wayne Grudem'],
  'eternity':           ["Pilgrim's Progress — John Bunyan", 'The Weight of Glory — C.S. Lewis', 'Systematic Theology — Wayne Grudem'],
};

async function generateLesson(topic, lessonTitle, lessonNumber) {
  const sources = SOURCE_MAP[topic.slug];

  const prompt = `You are writing a profound Christian theological lesson for young adults (ages 19-40) in Vienna, Austria. This is lesson ${lessonNumber} of 7 in the topic series: "${topic.title}".

Lesson title: "${lessonTitle}"

Primary sources to draw from deeply:
${sources.map(s => `- ${s}`).join('\n')}

REQUIREMENTS:
- This must be theologically serious and transformational — not shallow or motivational
- The meditation should be 3 rich paragraphs — theological depth combined with pastoral warmth
- The key idea is a single sentence that captures the entire lesson's truth
- Reflection questions must be specific and searching — aimed at a person's actual life today
- The scripture must be real and precisely chosen for this lesson
- The quote must be real and from one of the listed sources/authors
- Draw deeply from the listed authors — let their ideas breathe through the text

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "${lessonTitle}",
  "scripture_reference": "Book Chapter:Verse",
  "scripture_text": "The exact verse text",
  "key_idea": "One sentence capturing the entire lesson's central truth",
  "meditation": "Three paragraphs separated by \\n\\n. Rich, serious, 4+ sentences each. Draw from the listed sources.",
  "quote_text": "A real quote from one of the listed authors",
  "quote_author": "Full name and work",
  "reflection_questions": [
    {"topic": "Short label", "question": "A specific searching question about the reader's actual life"},
    {"topic": "Short label", "question": "A deeper second question"},
    {"topic": "Short label", "question": "A question that moves toward action or surrender"}
  ],
  "sources": ["Source 1", "Source 2"]
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
  console.log('✝  THE ETERNAL WORD — Topic Lesson Generator');
  console.log('━'.repeat(50));

  // Fetch already-generated lessons
  const { data: existing } = await supabase
    .from('lessons')
    .select('topic_slug, lesson_number');

  const done = new Set((existing || []).map(r => `${r.topic_slug}:${r.lesson_number}`));
  console.log(`✓  Already in DB: ${done.size} lessons`);

  let total = 0, success = 0, failed = [];

  for (const topic of TOPICS) {
    console.log(`\n── ${topic.title} ──`);
    for (let i = 0; i < topic.lessons.length; i++) {
      const lessonNumber = i + 1;
      const key = `${topic.slug}:${lessonNumber}`;
      if (done.has(key)) {
        console.log(`  [${lessonNumber}/7] skipped (already exists)`);
        continue;
      }

      total++;
      process.stdout.write(`  [${lessonNumber}/7] ${topic.lessons[i].substring(0, 50)}... `);

      try {
        const lesson = await generateLesson(topic, topic.lessons[i], lessonNumber);

        const { error } = await supabase.from('lessons').upsert({
          topic_slug:           topic.slug,
          lesson_number:        lessonNumber,
          title:                lesson.title,
          scripture_reference:  lesson.scripture_reference,
          scripture_text:       lesson.scripture_text,
          key_idea:             lesson.key_idea,
          meditation:           lesson.meditation,
          quote_text:           lesson.quote_text,
          quote_author:         lesson.quote_author,
          reflection_questions: lesson.reflection_questions,
          sources:              lesson.sources,
        }, { onConflict: 'topic_slug,lesson_number' });

        if (error) throw error;

        success++;
        console.log(`✓`);
      } catch (err) {
        console.log(`✗ ${err.message}`);
        failed.push(key);
      }

      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`✝  Done. ${success}/${total} generated. ${failed.length} failed.`);
  if (failed.length > 0) console.log(`   Failed: ${failed.join(', ')}`);
}

main().catch(console.error);
