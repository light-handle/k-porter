# Building K-Porter

This directory contains assets needed for building distributable packages of K-Porter.

## macOS Build Requirements

For macOS builds, you'll need the following files:

1. `icons/icon.icns` - An macOS icon file for the application
   - Create this from a 1024x1024 PNG file using tools like iconutil or online converters
   - Follow Apple's [guidelines for app icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)

2. `background.png` - The background image for the DMG installer
   - Create a 540x380 PNG file
   - Include visual instructions showing how to drag the app to the Applications folder
   - Use transparency for better visual appearance

## Creating macOS Icons

To create a proper macOS icon from a PNG:

1. Create PNG images in the following sizes:
   - 16x16
   - 32x32
   - 64x64
   - 128x128
   - 256x256
   - 512x512
   - 1024x1024

2. Create an iconset folder with these images named according to Apple's requirements:
   ```
   MyIcon.iconset/
     icon_16x16.png
     icon_16x16@2x.png
     icon_32x32.png
     icon_32x32@2x.png
     icon_128x128.png
     icon_128x128@2x.png
     icon_256x256.png
     icon_256x256@2x.png
     icon_512x512.png
     icon_512x512@2x.png
   ```

3. Use the iconutil command to create the .icns file:
   ```
   iconutil -c icns MyIcon.iconset
   ```

4. Copy the resulting .icns file to `build/icon.icns`

## Building the App

Once you have all the necessary assets in place:

1. Build for macOS: `npm run build:mac`
2. The built application will be in the `dist` directory

## Troubleshooting macOS Builds

If you encounter issues with macOS builds:

1. Make sure the icon.icns file is properly formatted and in the correct location
2. Verify that your macOS code signing certificates are set up correctly
3. If testing notarization, make sure you have proper Apple Developer credentials
4. For distribution outside the App Store, ensure hardened runtime and entitlements are configured correctly

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