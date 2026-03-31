"""
copy_gen.py — uses Claude API to write platform-specific captions.
"""
import os
import requests

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]


def _claude(prompt: str, max_tokens: int = 300) -> str:
    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["content"][0]["text"].strip()


def twitter_caption(devotional: dict) -> str:
    """Generate a Twitter/X post under 280 chars with scripture + link."""
    prompt = f"""Write a single Twitter/X post for a Christian devotional site.

Devotional title: {devotional['title']}
Scripture: {devotional['scripture_ref']} — "{devotional['scripture_text'][:200]}"
Topic summary: {devotional['body'][:300]}

Rules:
- Maximum 240 characters (leave room for the URL)
- Start with the scripture reference and a short powerful phrase
- End with relevant hashtags: #DailyDevotional #Bible and 1-2 topical ones
- No emojis unless they fit naturally
- Tone: reverent, warm, Protestant

Output ONLY the tweet text. No explanation."""
    return _claude(prompt, max_tokens=120)


def reddit_post(devotional: dict) -> dict:
    """Generate a Reddit post title + body for r/Christianity or r/Reformed."""
    prompt = f"""Write a Reddit post for r/Christianity sharing a daily devotional.

Devotional title: {devotional['title']}
Scripture: {devotional['scripture_ref']} — "{devotional['scripture_text'][:300]}"
Body excerpt: {devotional['body'][:500]}

Rules:
- Title: compelling, question or reflection, under 100 chars
- Body: 2-3 short paragraphs, genuine and not promotional
- End with: "Full reflection at graceforevery.day"
- Tone: thoughtful Christian, not preachy
- No markdown headers

Return JSON with keys "title" and "body". ONLY JSON, no explanation."""
    import json
    raw = _claude(prompt, max_tokens=400)
    try:
        return json.loads(raw)
    except Exception:
        # Fallback if JSON parsing fails
        return {
            "title": devotional["title"],
            "body": f"{devotional['scripture_ref']} — {devotional['scripture_text']}\n\nFull reflection at graceforevery.day",
        }


def email_subject(devotional: dict) -> str:
    """Generate an email subject line."""
    prompt = f"""Write an email subject line for a daily Christian devotional newsletter.

Title: {devotional['title']}
Scripture: {devotional['scripture_ref']}

Rules:
- Under 60 characters
- Warm and inviting, not clickbait
- Can reference the scripture or a key theme
- No emojis

Output ONLY the subject line."""
    return _claude(prompt, max_tokens=60)
