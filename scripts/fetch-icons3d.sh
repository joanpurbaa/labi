#!/usr/bin/env bash
# Unduh Fluent Emoji 3D (MIT, microsoft/fluentui-emoji) ke assets/icons3d/.
# Setiap PNG diperkecil agar <= ~30 KB. Menyalin LICENSE ke LICENSE-fluentui-emoji.txt.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main"
OUT="assets/icons3d"
mkdir -p "$OUT"

# nama-output|folder-emoji|basename
ITEMS=(
  "studio-microphone|Studio microphone|studio_microphone"
  "spiral-calendar|Spiral calendar|spiral_calendar"
  "bar-chart|Bar chart|bar_chart"
  "open-book|Open book|open_book"
  "memo|Memo|memo"
  "clipboard|Clipboard|clipboard"
  "bell|Bell|bell"
  "sunrise|Sunrise|sunrise"
  "sun|Sun|sun"
  "hot-beverage|Hot beverage|hot_beverage"
  "crescent-moon|Crescent moon|crescent_moon"
  "red-heart|Red heart|red_heart"
  "sparkles|Sparkles|sparkles"
  "locked|Locked|locked"
)

shrink() {
  local src="$1" dst="$2"
  local max=208
  while [ "$max" -ge 48 ]; do
    sips -Z "$max" -s format png "$src" --out "$dst" >/dev/null 2>&1
    local size
    size=$(stat -f%z "$dst")
    if [ "$size" -le 30720 ]; then
      return 0
    fi
    max=$((max - 32))
  done
}

for item in "${ITEMS[@]}"; do
  IFS='|' read -r name folder base <<<"$item"
  enc="${folder// /%20}"
  url="${BASE}/assets/${enc}/3D/${base}_3d.png"
  tmp="${OUT}/${name}.raw.png"
  dst="${OUT}/${name}.png"
  echo "download ${name} <= ${folder}"
  curl -fsSL "$url" -o "$tmp"
  shrink "$tmp" "$dst"
  rm -f "$tmp"
  printf "  %s -> %s bytes\n" "$name" "$(stat -f%z "$dst")"
done

curl -fsSL "${BASE}/LICENSE" -o "${OUT}/LICENSE-fluentui-emoji.txt"
echo "LICENSE-fluentui-emoji.txt copied."