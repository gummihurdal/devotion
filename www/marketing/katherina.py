"""
katherina.py — main marketing orchestrator for graceforevery.day

Runs daily via GitHub Actions. Executes all enabled platforms in sequence.
Each platform is independent — failure in one does not stop others.

Usage:
    python katherina.py --all
    python katherina.py --twitter
    python katherina.py --indexnow
    python katherina.py --reddit
"""
import argparse
import traceback
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))


def run_platform(name: str, fn):
    print(f"\n{'='*50}")
    print(f"  Katherina → {name}")
    print(f"{'='*50}")
    try:
        fn()
        print(f"[{name}] ✅ Done")
    except Exception as e:
        print(f"[{name}] ❌ Failed: {e}")
        traceback.print_exc()


def main():
    parser = argparse.ArgumentParser(description="Katherina Marketing System")
    parser.add_argument("--all",      action="store_true", help="Run all platforms")
    parser.add_argument("--twitter",  action="store_true", help="Post to X/Twitter")
    parser.add_argument("--indexnow", action="store_true", help="Ping IndexNow")
    parser.add_argument("--reddit",   action="store_true", help="Post to Reddit")
    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
        sys.exit(1)

    if args.all or args.indexnow:
        from platforms.indexnow import ping_indexnow
        run_platform("IndexNow", ping_indexnow)

    if args.all or args.twitter:
        from platforms.twitter import post_twitter
        run_platform("Twitter/X", post_twitter)

    if args.all or args.reddit:
        print("\n[Reddit] Skipped — semi-automated, requires manual approval")

    print("\n✅ Katherina run complete.")


if __name__ == "__main__":
    main()
