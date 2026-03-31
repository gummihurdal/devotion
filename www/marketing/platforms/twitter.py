"""
twitter.py — posts today's devotional to X/Twitter via Tweepy.

Required env vars:
    TWITTER_API_KEY
    TWITTER_API_SECRET
    TWITTER_ACCESS_TOKEN
    TWITTER_ACCESS_SECRET
"""
import os
import sys
import tweepy

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from supabase_client import get_today_devotional
from content.copy_gen import twitter_caption

SITE_URL = "https://graceforevery.day"


def post_twitter():
    devotional = get_today_devotional()
    if not devotional:
        print("[Twitter] No devotional found for today — skipping.")
        return

    caption = twitter_caption(devotional)
    tweet_text = f"{caption}\n\n{SITE_URL}"

    # Truncate if over 280
    if len(tweet_text) > 280:
        tweet_text = tweet_text[:277] + "..."

    client = tweepy.Client(
        consumer_key=os.environ["TWITTER_API_KEY"],
        consumer_secret=os.environ["TWITTER_API_SECRET"],
        access_token=os.environ["TWITTER_ACCESS_TOKEN"],
        access_token_secret=os.environ["TWITTER_ACCESS_SECRET"],
    )

    response = client.create_tweet(text=tweet_text)
    print(f"[Twitter] Posted tweet ID: {response.data['id']}")
    print(f"[Twitter] Text: {tweet_text}")
    return response.data["id"]


if __name__ == "__main__":
    post_twitter()
