#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TARGET="${1:-}"

# ----------------------------------------------------------------
# check prerequisites
# ----------------------------------------------------------------
if ! command -v node &>/dev/null; then
  echo "error: node is required" >&2
  exit 1
fi

# ----------------------------------------------------------------
# generate icons from buddy art if missing
# ----------------------------------------------------------------
if [ ! -f build/icons/icon.png ]; then
  echo ">> generating icons from assets/buddyArt/idle.png ..."
  SRC="assets/buddyArt/idle.png"
  if [ ! -f "$SRC" ]; then
    echo "error: $SRC not found, cannot generate icons" >&2
    exit 1
  fi
  mkdir -p build/icons
  magick "$SRC" -resize 256x256 -background none -gravity center -extent 256x256 build/icons/256x256.png
  magick "$SRC" -resize 512x512 -background none -gravity center -extent 512x512 build/icons/512x512.png
  cp build/icons/512x512.png build/icons/icon.png
  echo ">> icons generated"
fi

# ----------------------------------------------------------------
# install dependencies
# ----------------------------------------------------------------
if [ ! -d node_modules ]; then
  echo ">> installing dependencies ..."
  npm install --ignore-scripts=false
fi

# ----------------------------------------------------------------
# build
# ----------------------------------------------------------------
case "$TARGET" in
  deb)
    echo ">> building deb ..."
    npx electron-builder --linux deb
    ;;
  AppImage)
    echo ">> building AppImage ..."
    npx electron-builder --linux AppImage
    ;;
  dir)
    echo ">> building directory (unpacked) ..."
    npx electron-builder --linux dir
    ;;
  *)
    echo ">> building all targets (deb, AppImage, dir) ..."
    npx electron-builder --linux deb AppImage dir
    ;;
esac

echo ""
echo "done. artifacts in dist/"
ls -lh dist/ 2>/dev/null || true
