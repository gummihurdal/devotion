"""
indexnow.py — pings IndexNow API to request immediate indexing.

Bing and Yandex index within hours. Google uses IndexNow via Bing's partnership.

Required env vars: none (key is public in repo)
"""
import sys
import os
import requests

SITE_URL = "https://graceforevery.day"
INDEXNOW_KEY = "9793c2adce9d4657b387ed5dbabbbcb1"  # already in repo as .txt file

URLS_TO_PING = [
    f"{SITE_URL}/",
    f"{SITE_URL}/devotion.html",
    f"{SITE_URL}/topics.html",
    f"{SITE_URL}/learn.html",
    f"{SITE_URL}/blog.html",
    f"{SITE_URL}/sermons.html",
    f"{SITE_URL}/archive.html",
    f"{SITE_URL}/music.html",
    f"{SITE_URL}/well.html",
]


def ping_indexnow():
    """Submit all URLs to IndexNow (Bing endpoint)."""
    payload = {
        "host": "graceforevery.day",
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": URLS_TO_PING,
    }

    resp = requests.post(
        "https://api.indexnow.org/indexnow",
        json=payload,
        timeout=15,
    )

    if resp.status_code in (200, 202):
        print(f"[IndexNow] ✅ Submitted {len(URLS_TO_PING)} URLs — HTTP {resp.status_code}")
    else:
        print(f"[IndexNow] ⚠️  HTTP {resp.status_code}: {resp.text}")

    return resp.status_code


if __name__ == "__main__":
    ping_indexnow()
