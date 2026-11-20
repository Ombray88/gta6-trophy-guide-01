#!/usr/bin/env bash
set -euo pipefail

mkdir -p shots-tmp screenshots

# Start server
node serve.ts --port 8080 &
SERVER_PID=$!

cleanup() {
  kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server up to 20s
echo "Waiting for server to start..."
for i in {1..40}; do
  if curl -s -o /dev/null http://127.0.0.1:8080/; then
    echo "Server is up!"
    break
  fi
  sleep 0.5
done

# Find chromium binary
CHROME="$HOME/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
if [ ! -f "$CHROME" ]; then
  PLAYWRIGHT_DIR="$HOME/.cache/ms-playwright"
  if [ -d "$PLAYWRIGHT_DIR" ]; then
    FOUND_CHROME=$(find "$PLAYWRIGHT_DIR" -type f -name "chrome" | head -n 1)
    if [ -n "$FOUND_CHROME" ]; then
      CHROME="$FOUND_CHROME"
    fi
  fi
fi

if [ ! -f "$CHROME" ]; then
  echo "Error: Chromium binary not found." >&2
  exit 1
fi

echo "Using Chrome: $CHROME"

# Take screenshots
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --screenshot=shots-tmp/1-checklist.png 'http://127.0.0.1:8080/?view=rows'
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --screenshot=shots-tmp/2-roadmap.png 'http://127.0.0.1:8080/?view=roadmap'
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --screenshot=shots-tmp/3-guide.png 'http://127.0.0.1:8080/?search=Positive%20Mental%20Attitude&view=rows'
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --screenshot=shots-tmp/4-silver.png 'http://127.0.0.1:8080/?grade=silver&view=rows'

# Ensure pillow is installed
python3 -c "import PIL" 2>/dev/null || python3 -m pip install --quiet pillow

# Convert PNG to JPEG with size limit 262144 bytes using Python + Pillow
python3 -c '
import os
from PIL import Image

mapping = [
    ("shots-tmp/1-checklist.png", "screenshots/1-checklist.jpg"),
    ("shots-tmp/2-roadmap.png", "screenshots/2-roadmap.jpg"),
    ("shots-tmp/3-guide.png", "screenshots/3-guide.jpg"),
    ("shots-tmp/4-silver.png", "screenshots/4-silver.jpg"),
]

for png_path, jpg_path in mapping:
    img = Image.open(png_path).convert("RGB")
    for quality in [82, 70, 55, 40]:
        img.save(jpg_path, "JPEG", quality=quality)
        size = os.path.getsize(jpg_path)
        print(f"Saved {jpg_path} at quality {quality}: {size} bytes")
        if size <= 262144:
            break
'

ls -la screenshots/
