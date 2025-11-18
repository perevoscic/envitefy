#!/bin/bash

# Script to optimize birthday template images for web using ffmpeg
# Optimizes images to WebP format with quality 85 and max width 1920px

BIRTHDAYS_DIR="public/templates/birthdays"
OUTPUT_DIR="public/templates/birthdays"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Process each JPEG file in the birthdays directory
for img in "$BIRTHDAYS_DIR"/*.jpeg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img" .jpeg)
        output_path="$OUTPUT_DIR/${filename}.webp"
        
        echo "Optimizing: $filename.jpeg -> ${filename}.webp"
        
        # Convert to WebP with optimization:
        # - Quality 85 (good balance between size and quality)
        # - Max width 1920px (maintains aspect ratio)
        # - Strip metadata
        ffmpeg -i "$img" \
            -vf "scale='min(1920,iw)':-1" \
            -quality 85 \
            -compression_level 6 \
            -y \
            "$output_path" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
            new_size=$(stat -f%z "$output_path" 2>/dev/null || stat -c%s "$output_path" 2>/dev/null)
            savings=$((100 - (new_size * 100 / original_size)))
            echo "  ✓ Optimized: ${original_size} bytes -> ${new_size} bytes (${savings}% reduction)"
        else
            echo "  ✗ Failed to optimize $filename"
        fi
    fi
done

# Also create optimized JPEG versions (fallback for browsers that don't support WebP)
for img in "$BIRTHDAYS_DIR"/*.jpeg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img" .jpeg)
        output_path="$OUTPUT_DIR/${filename}-optimized.jpeg"
        
        echo "Creating optimized JPEG: ${filename}-optimized.jpeg"
        
        # Create optimized JPEG:
        # - Quality 85
        # - Max width 1920px
        # - Progressive encoding
        # - Strip metadata
        ffmpeg -i "$img" \
            -vf "scale='min(1920,iw)':-1" \
            -q:v 3 \
            -progressive 1 \
            -y \
            "$output_path" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
            new_size=$(stat -f%z "$output_path" 2>/dev/null || stat -c%s "$output_path" 2>/dev/null)
            savings=$((100 - (new_size * 100 / original_size)))
            echo "  ✓ Optimized JPEG: ${original_size} bytes -> ${new_size} bytes (${savings}% reduction)"
        else
            echo "  ✗ Failed to optimize JPEG $filename"
        fi
    fi
done

echo ""
echo "Optimization complete!"
echo "WebP files are ready for modern browsers."
echo "Optimized JPEG files are available as fallbacks."

