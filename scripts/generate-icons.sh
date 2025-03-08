#!/bin/bash

# This script generates macOS icon.icns file from a source PNG
# Usage: ./generate-icons.sh path/to/source.png

# Check if source file is provided
if [ -z "$1" ]; then
  echo "Error: Please provide a source PNG file"
  echo "Usage: ./generate-icons.sh path/to/source.png"
  exit 1
fi

SOURCE_FILE=$1
ICONSET_NAME="AppIcon.iconset"

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Source file does not exist: $SOURCE_FILE"
  exit 1
fi

# Check if source file is a PNG
if [[ "$SOURCE_FILE" != *.png ]]; then
  echo "Error: Source file must be a PNG file"
  exit 1
fi

# Create iconset directory
mkdir -p "$ICONSET_NAME"

# Generate icons of different sizes
echo "Generating icons from $SOURCE_FILE..."

# Icon sizes for macOS
sips -z 16 16     "$SOURCE_FILE" --out "$ICONSET_NAME/icon_16x16.png"
sips -z 32 32     "$SOURCE_FILE" --out "$ICONSET_NAME/icon_16x16@2x.png"
sips -z 32 32     "$SOURCE_FILE" --out "$ICONSET_NAME/icon_32x32.png"
sips -z 64 64     "$SOURCE_FILE" --out "$ICONSET_NAME/icon_32x32@2x.png"
sips -z 128 128   "$SOURCE_FILE" --out "$ICONSET_NAME/icon_128x128.png"
sips -z 256 256   "$SOURCE_FILE" --out "$ICONSET_NAME/icon_128x128@2x.png"
sips -z 256 256   "$SOURCE_FILE" --out "$ICONSET_NAME/icon_256x256.png"
sips -z 512 512   "$SOURCE_FILE" --out "$ICONSET_NAME/icon_256x256@2x.png"
sips -z 512 512   "$SOURCE_FILE" --out "$ICONSET_NAME/icon_512x512.png"
sips -z 1024 1024 "$SOURCE_FILE" --out "$ICONSET_NAME/icon_512x512@2x.png"

# Convert iconset to icns
echo "Converting iconset to icns..."
iconutil -c icns "$ICONSET_NAME"

# Move the icon to the build directory
mkdir -p "build"
mv "AppIcon.icns" "build/icon.icns"

# Clean up
rm -rf "$ICONSET_NAME"

echo "Done! Icon file saved to build/icon.icns"
echo "You can now build your macOS app with: npm run build:mac" 