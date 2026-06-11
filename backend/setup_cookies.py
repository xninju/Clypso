"""
Run this to set up YouTube cookies for Clypso.

YouTube blocks anonymous requests from server/cloud IPs.
Authenticated requests (with browser cookies) work fine.

QUICK STEPS:
  1. Install "Get cookies.txt LOCALLY" in Chrome:
     https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc

  2. Go to https://www.youtube.com and make sure you are logged in.

  3. Click the extension icon → select "Export" → save as cookies.txt

  4. Paste the file content into backend/cookies.txt  (this script will
     also validate it for you — just drop the file in place and re-run).

  5. For Render deployment: paste the same content into the
     COOKIES_CONTENT environment variable on your Render dashboard.

Usage:
    cd backend && python3 setup_cookies.py [path/to/cookies.txt]
"""

import sys
import os
import subprocess

DEFAULT_PATH = os.path.join(os.path.dirname(__file__), "cookies.txt")


def validate_cookies(path: str) -> bool:
    print(f"\n[*] Validating cookies at: {path}")
    result = subprocess.run(
        [
            sys.executable, "-m", "yt_dlp",
            "--cookies", path,
            "--skip-download",
            "--quiet",
            "--get-title",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode == 0 and result.stdout.strip():
        print(f"[✓] Cookies are VALID — fetched title: {result.stdout.strip()}")
        return True
    else:
        err = (result.stderr or result.stdout or "unknown error").strip()[:200]
        print(f"[✗] Cookies failed: {err}")
        return False


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PATH

    print("=" * 60)
    print("  Clypso — YouTube Cookie Setup")
    print("=" * 60)

    if not os.path.exists(path):
        print(f"""
No cookies.txt found at: {path}

HOW TO EXPORT BROWSER COOKIES
──────────────────────────────
CHROME (recommended):
  1. Install "Get cookies.txt LOCALLY":
     https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
  2. Log in to YouTube (https://www.youtube.com)
  3. Click the extension icon → "Export" → save file as cookies.txt
  4. Copy the file here: {path}
  5. Re-run: python3 setup_cookies.py

FIREFOX:
  1. Install "cookies.txt" addon:
     https://addons.mozilla.org/firefox/addon/cookies-txt/
  2. Log in to YouTube
  3. Click the addon → Export for "youtube.com" → save as cookies.txt
  4. Copy the file here: {path}
  5. Re-run: python3 setup_cookies.py

NOTE: cookies.txt is git-ignored and never committed.
""")
        sys.exit(1)

    if validate_cookies(path):
        with open(path) as f:
            content = f.read()

        print()
        print("=" * 60)
        print("FOR RENDER DEPLOYMENT")
        print("=" * 60)
        print("Copy everything between the dashes and set it as the")
        print("COOKIES_CONTENT environment variable on your Render dashboard:")
        print("-" * 60)
        print(content)
        print("-" * 60)
        print()
        print("Render dashboard → your API service → Environment tab")
        print("Key:   COOKIES_CONTENT")
        print("Value: (paste the text above)")
    else:
        print()
        print("The cookies file exists but failed validation.")
        print("Make sure you are logged into YouTube before exporting cookies.")
        sys.exit(1)


if __name__ == "__main__":
    main()
