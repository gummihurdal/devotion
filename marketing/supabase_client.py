"""
Supabase client — fetches today's devotional for Katherina.
"""
import os
import datetime
import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def get_today_devotional() -> dict | None:
    """Return today's devotional row from Supabase, or None if not found."""
    today = datetime.date.today()
    month_day = today.strftime("%m-%d")  # e.g. "03-19"

    url = f"{SUPABASE_URL}/rest/v1/devotionals"
    params = {
        "date_key": f"eq.{month_day}",
        "select": "date_key,title,scripture_ref,scripture_text,body,study_topic_slug",
    }

    resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
    resp.raise_for_status()
    rows = resp.json()
    return rows[0] if rows else None
