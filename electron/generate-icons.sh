#!/usr/bin/env bash
set -euo pipefail

# Generates icon.png, icon.icns and icon.ico from icon.svg
# Requires: rsvg-convert or convert (ImageMagick), iconutil (macOS), png2ico (optional)

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Prefer a new scoreboard icon if present
if [ -f "$ROOT_DIR/scoreboard_icon_crown.svg" ]; then
  SVG="$ROOT_DIR/scoreboard_icon_crown.svg"
else
  SVG="$ROOT_DIR/icon.svg"
fi
PNG="$ROOT_DIR/icon.png"
ICNS="$ROOT_DIR/icon.icns"
ICO="$ROOT_DIR/icon.ico"

echo "Generating icons from $SVG"

if command -v rsvg-convert >/dev/null 2>&1; then
  echo "Using rsvg-convert to make PNGs"
  rsvg-convert -w 1024 -h 1024 "$SVG" -o "$ROOT_DIR/icon-1024.png"
  rsvg-convert -w 512 -h 512 "$SVG" -o "$ROOT_DIR/icon-512.png"
  rsvg-convert -w 256 -h 256 "$SVG" -o "$ROOT_DIR/icon-256.png"
else
  if command -v convert >/dev/null 2>&1; then
    echo "Using ImageMagick convert to make PNGs"
    convert "$SVG" -resize 1024x1024 "$ROOT_DIR/icon-1024.png"
    convert "$SVG" -resize 512x512 "$ROOT_DIR/icon-512.png"
    convert "$SVG" -resize 256x256 "$ROOT_DIR/icon-256.png"
  else
    echo "No SVG->PNG converter found (rsvg-convert or convert). Please install librsvg or ImageMagick." >&2
    exit 1
  fi
fi

# Create icon.png (512)
cp "$ROOT_DIR/icon-512.png" "$PNG"

# Create ICNS (macOS)
if command -v iconutil >/dev/null 2>&1; then
  echo "Creating ICNS using iconutil"
  ICONSET="$ROOT_DIR/icon.iconset"
  mkdir -p "$ICONSET"
  cp "$ROOT_DIR/icon-1024.png" "$ICONSET/icon_1024x1024.png"
  cp "$ROOT_DIR/icon-512.png" "$ICONSET/icon_512x512.png"
  cp "$ROOT_DIR/icon-512.png" "$ICONSET/icon_512x512@2x.png"
  cp "$ROOT_DIR/icon-256.png" "$ICONSET/icon_256x256.png"
  # optional sizes if generated
  cp "$ROOT_DIR/icon-128.png" "$ICONSET/icon_128x128.png" 2>/dev/null || true
  cp "$ROOT_DIR/icon-64.png" "$ICONSET/icon_64x64.png" 2>/dev/null || true
  cp "$ROOT_DIR/icon-32.png" "$ICONSET/icon_32x32.png" 2>/dev/null || true
  cp "$ROOT_DIR/icon-16.png" "$ICONSET/icon_16x16.png" 2>/dev/null || true
  # also copy @2x variants if present
  cp "$ROOT_DIR/icon-256.png" "$ICONSET/icon_128x128@2x.png" 2>/dev/null || true
  cp "$ROOT_DIR/icon-128.png" "$ICONSET/icon_64x64@2x.png" 2>/dev/null || true
  iconutil -c icns "$ICONSET" -o "$ICNS"
  rm -rf "$ICONSET"
else
  echo "iconutil not found; skipping .icns generation (macOS only)"
fi

# Create ICO (Windows)
if command -v png2ico >/dev/null 2>&1; then
  echo "Creating ICO using png2ico"
  png2ico "$ICO" "$ROOT_DIR/icon-256.png" "$ROOT_DIR/icon-128.png" "$ROOT_DIR/icon-64.png" "$ROOT_DIR/icon-32.png" 2>/dev/null || true
elif command -v convert >/dev/null 2>&1; then
  echo "Creating ICO using ImageMagick convert"
  convert "$ROOT_DIR/icon-256.png" "$ROOT_DIR/icon-128.png" "$ROOT_DIR/icon-64.png" "$ROOT_DIR/icon-32.png" "$ICO" || true
else
  echo "png2ico or ImageMagick convert not found; skipping .ico generation" >&2
fi

echo "Icons generated (or skipped where tools are missing). Files in $ROOT_DIR:"
ls -la "$ROOT_DIR" | grep icon || true
