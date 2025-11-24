#!/bin/bash

# Generate PNG icons from SVG for PWA manifest
# Requires ImageMagick (install via: brew install imagemagick)

ICONS_DIR="public/icons"
SIZES=(72 96 128 144 152 192 384 512)

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Install it using: brew install imagemagick"
    exit 1
fi

# Use 'magick' command if available (ImageMagick 7+), otherwise 'convert' (ImageMagick 6)
CONVERT_CMD="magick"
if ! command -v magick &> /dev/null; then
    CONVERT_CMD="convert"
fi

echo "Generating PNG icons from SVG..."

for size in "${SIZES[@]}"; do
    input_file="${ICONS_DIR}/icon-${size}x${size}.svg"
    output_file="${ICONS_DIR}/icon-${size}x${size}.png"
    
    if [ ! -f "$input_file" ]; then
        echo "Warning: $input_file not found, skipping..."
        continue
    fi
    
    echo "Converting ${size}x${size}..."
    $CONVERT_CMD -background none -density 300 -resize ${size}x${size} "$input_file" "$output_file"
    
    if [ $? -eq 0 ]; then
        echo "✓ Created $output_file"
    else
        echo "✗ Failed to create $output_file"
    fi
done

echo ""
echo "Icon generation complete!"
echo ""
echo "Verifying generated files..."

missing_count=0
for size in "${SIZES[@]}"; do
    output_file="${ICONS_DIR}/icon-${size}x${size}.png"
    if [ -f "$output_file" ]; then
        file_size=$(du -h "$output_file" | cut -f1)
        echo "✓ ${output_file} (${file_size})"
    else
        echo "✗ ${output_file} - MISSING"
        missing_count=$((missing_count + 1))
    fi
done

echo ""
if [ $missing_count -eq 0 ]; then
    echo "✓ All PNG icons generated successfully!"
    echo "You can now commit these files to your repository."
else
    echo "⚠ $missing_count icon(s) are missing. Please check the errors above."
    exit 1
fi
