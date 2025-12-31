#!/bin/bash
# Image Compression Script
# Creates originals/ backup and compressed JPEG versions
# Usage: ./scripts/compress-images.sh

set -e

IMAGES_DIR="public/images"
ORIGINALS_DIR="$IMAGES_DIR/originals"
JPEG_DIR="$IMAGES_DIR/jpeg"

# Create archive directories
mkdir -p "$ORIGINALS_DIR"
mkdir -p "$JPEG_DIR"

echo "📦 Backing up originals to $ORIGINALS_DIR..."

# Copy compare/after PNGs to originals (preserving structure)
if [ -d "$IMAGES_DIR/compare/after" ]; then
  mkdir -p "$ORIGINALS_DIR/compare-after"
  cp -r "$IMAGES_DIR/compare/after/"*.png "$ORIGINALS_DIR/compare-after/" 2>/dev/null || true
fi

echo "🗜️ Creating compressed JPEG versions..."

# Check if ImageMagick is available
if command -v magick &> /dev/null; then
  # Use ImageMagick
  for png in "$IMAGES_DIR/compare/after/"*.png; do
    if [ -f "$png" ]; then
      filename=$(basename "$png" .png)
      magick "$png" -quality 85 -resize '1200x>' "$JPEG_DIR/${filename}.jpg"
      echo "  Compressed: ${filename}.jpg"
    fi
  done
elif command -v sips &> /dev/null; then
  # Use macOS sips (built-in)
  for png in "$IMAGES_DIR/compare/after/"*.png; do
    if [ -f "$png" ]; then
      filename=$(basename "$png" .png)
      sips -s format jpeg -s formatOptions 85 "$png" --out "$JPEG_DIR/${filename}.jpg" --resampleWidth 1200 2>/dev/null
      echo "  Compressed: ${filename}.jpg"
    fi
  done
else
  echo "❌ No image compression tool found. Install ImageMagick: brew install imagemagick"
  exit 1
fi

# Report savings
echo ""
echo "📊 Size comparison:"
echo "  Original (compare/after): $(du -sh "$IMAGES_DIR/compare/after" | cut -f1)"
echo "  Compressed (jpeg):        $(du -sh "$JPEG_DIR" | cut -f1)"
echo ""
echo "✅ Done! Originals backed up to $ORIGINALS_DIR"
echo ""
echo "Next steps:"
echo "  1. Upload compressed images to Sanity Media Library"
echo "  2. Update image references to use Sanity CDN URLs"
echo "  3. Consider removing the large PNGs from git"
