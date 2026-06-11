"""
Run this once to authenticate yt-dlp with your Google account via OAuth2.
It saves a cookies.txt that the backend uses automatically.

Usage:
    cd backend
    python3 setup_cookies.py
"""

import subprocess
import sys
import os

COOKIES_PATH = os.path.join(os.path.dirname(__file__), "cookies.txt")


def main():
    print("=" * 60)
    print("  Clypso — YouTube OAuth2 Setup")
    print("=" * 60)
    print()
    print("This will open a Google device-auth URL in the output below.")
    print("Open that URL in your browser and sign in to your Google account.")
    print()
    print("Starting OAuth2 flow...\n")

    result = subprocess.run(
        [
            sys.executable, "-m", "yt_dlp",
            "--username", "oauth2",
            "--password", "",
            "--cookies", COOKIES_PATH,
            "--skip-download",
            "--quiet",
            "--no-warnings",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ],
        capture_output=False,
        text=True,
    )

    if os.path.exists(COOKIES_PATH):
        with open(COOKIES_PATH, "r") as f:
            content = f.read()

        print()
        print("=" * 60)
        print("SUCCESS! cookies.txt has been saved.")
        print()
        print("For Render deployment, copy everything between the")
        print("lines below and set it as the COOKIES_CONTENT env var:")
        print("-" * 60)
        print(content)
        print("-" * 60)
    else:
        print()
        print("cookies.txt was not created. Authentication may have failed.")
        print("Please try again or check your internet connection.")
        sys.exit(1)


if __name__ == "__main__":
    main()
