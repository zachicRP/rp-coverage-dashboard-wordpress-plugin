#!/usr/bin/env bash
set -euo pipefail

PLUGIN_SLUG="rp-coverage-dashboard"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="$ROOT/release"
STAGE_DIR="$RELEASE_DIR/$PLUGIN_SLUG"
ZIP_PATH="$RELEASE_DIR/$PLUGIN_SLUG.zip"

cd "$ROOT"

echo "Building React assets..."
npm run build

echo "Preparing release folder..."
rm -rf "$STAGE_DIR" "$ZIP_PATH"
mkdir -p "$STAGE_DIR"

cp "$ROOT/rp-coverage-dashboard.php" "$STAGE_DIR/"
cp "$ROOT/index.php" "$STAGE_DIR/"
cp "$ROOT/README.txt" "$STAGE_DIR/"
cp -R "$ROOT/dist" "$STAGE_DIR/"

cd "$RELEASE_DIR"
echo "Creating plugin zip..."
zip -qr "$ZIP_PATH" "$PLUGIN_SLUG"
echo "Created $ZIP_PATH"
