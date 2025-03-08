# DMG Installer Assets

Place the following files in this directory to create a beautiful DMG installer like Sublime Text:

## Required Files

1. **icon.icns** - The macOS application icon
   - Create a 1024x1024 PNG image
   - Convert to .icns format using `iconutil` or online converters
   - You can use [IconKit](https://github.com/SAP/Mac-IconKit) or similar tools

2. **icon.ico** - The Windows application icon
   - Create a 256x256 PNG image
   - Convert to .ico format using online converters

3. **background.png** - The DMG installer background
   - Create a 540x380 PNG image with your installation instructions
   - Example layout:
     - Left side: Application icon
     - Right side: Applications folder icon
     - Add an arrow pointing from app to Applications folder
     - Add text: "Drag to install"

## Example DMG Background Design

```
+----------------------------------------+
|                                        |
|                                        |
|    +-------+       +-------+           |
|    |       |       |       |           |
|    | Icon  | ----> | Apps  |           |
|    |       |       | Folder|           |
|    +-------+       +-------+           |
|                                        |
|        Drag K-Porter to install        |
|                                        |
+----------------------------------------+
```

## Generating Icons from Source

If you have a high-resolution logo, you can generate all required icon formats using the following steps:

1. For macOS (.icns):
   ```bash
   # Create iconset directory
   mkdir MyIcon.iconset
   
   # Generate various sizes
   sips -z 16 16 icon.png --out MyIcon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out MyIcon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out MyIcon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out MyIcon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out MyIcon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out MyIcon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out MyIcon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out MyIcon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out MyIcon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out MyIcon.iconset/icon_512x512@2x.png
   
   # Convert to icns
   iconutil -c icns MyIcon.iconset -o icon.icns
   ```

2. For Windows, use an online converter to create the .ico file from your PNG. 