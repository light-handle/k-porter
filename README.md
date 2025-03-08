# K-Porter: Kubernetes Port Forwarder

K-Porter is a desktop application for macOS, Windows, and Linux that makes it easy to port-forward to Kubernetes services. It provides a simple interface to view your Kubernetes clusters, namespaces, and services, and allows you to quickly set up and manage port forwards.

[![GitHub Release](https://img.shields.io/github/v/release/light-handle/k-porter?style=flat-square)](https://github.com/light-handle/k-porter/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## Features

- 🔍 Automatic detection of Kubernetes clusters from your kubeconfig file
- 📋 Browse all namespaces and services in each cluster
- 🔌 Port forward to services with just a few clicks
- 📊 Track and manage all active port forwards
- 🔄 Easy toggling between clusters
- 🌓 Light and dark mode support

## Installation

### macOS

1. Download the latest `K-Porter-x.x.x-mac.dmg` file from the [Releases](https://github.com/light-handle/k-porter/releases) page or [downloads site](https://light-handle.github.io/k-porter/)
2. Open the DMG file
3. Drag K-Porter to your Applications folder

**⚠️ Important for macOS Users:**
To open K-Porter the first time, run this command in Terminal:
```
sudo xattr -rd com.apple.quarantine /Applications/K-Porter.app
```
This removes the macOS security block. You'll only need to do this once.

If you prefer not to use Terminal, you can try:
1. Right-click (or Control+click) on the K-Porter app in Finder
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears
4. The app should now open and remember this choice

### Using the K-Porter Launcher (macOS)

K-Porter comes with a launcher application that helps ensure all required environment variables and dependencies are properly set up. This is especially helpful if you encounter issues when launching K-Porter directly.

To use the launcher:
1. In the Applications folder, you'll find `K-Porter-Launcher.app` alongside `K-Porter.app`
2. Double-click `K-Porter-Launcher.app` to start K-Porter with the proper environment
3. The launcher will verify that kubectl is installed and that your kubeconfig exists
4. If any prerequisites are missing, the launcher will show a helpful error message with instructions

**If you encounter issues with K-Porter not opening when double-clicked, always try using the launcher instead.**

### Windows

1. Download the latest `K-Porter-Setup-x.x.x.exe` (installer) or `K-Porter-x.x.x.exe` (portable) from the [Releases](https://github.com/light-handle/k-porter/releases) page or [downloads site](https://light-handle.github.io/k-porter/)
2. If using the installer, run the .exe and follow the installation wizard
3. If using the portable version, extract and run directly
4. Launch K-Porter from the Start menu or desktop shortcut

### Linux

1. Download the latest `k-porter_x.x.x_amd64.deb` (Debian/Ubuntu) or `K-Porter-x.x.x.AppImage` from the [Releases](https://github.com/light-handle/k-porter/releases) page or [downloads site](https://light-handle.github.io/k-porter/)
2. For .deb: `sudo dpkg -i k-porter_x.x.x_amd64.deb`
3. For AppImage: Make executable with `chmod +x K-Porter-x.x.x.AppImage` and run directly

## Building from Source

1. Clone this repository
   ```
   git clone https://github.com/light-handle/k-porter.git
   cd k-porter
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the application
   ```
   npm start
   ```

4. To build a distributable app
   ```
   # For your current platform
   npm run build
   
   # For a specific platform
   npm run build:mac
   npm run build:win
   npm run build:linux
   ```
   The built application will be in the `dist` directory.

## Windows Support

For Windows users:

1. Make sure kubectl.exe is in your PATH
2. If you're building from source for Windows, create an icon file:
   ```
   mkdir -p build
   # Add a 256x256 icon.ico file in the build directory
   ```
3. Windows builds will produce both installer (.exe) and portable versions

## macOS Direct Installation

K-Porter uses a direct installation method similar to Sublime Text:

1. No App Store required - simply download the .dmg file
2. Drag and drop installation to your Applications folder
3. The app can be updated by downloading a new .dmg and reinstalling
4. Your settings and configurations are preserved between updates

## Usage

1. Launch the K-Porter application
2. The app will automatically detect your Kubernetes clusters from your kubeconfig
3. Select a cluster from the left sidebar
4. Select a namespace from the namespaces panel
5. Browse the services in the selected namespace
6. Click the "Port Forward" button next to a service to start port forwarding
7. Configure the local and remote ports in the modal dialog
8. Active port forwards will be displayed at the bottom of the app
9. Click the "Stop" button to stop a port forward

## Development

### Available Scripts

- `npm start` - Start the Electron application
- `npm run build` - Build the application for your current platform
- `npm run build:mac` - Build for macOS
- `npm run build:win` - Build for Windows
- `npm run build:linux` - Build for Linux

## Releases

K-Porter uses GitHub Actions to automatically build and release the application for all supported platforms. When a new tag is pushed with the format `vX.Y.Z`, the action will:

1. Create a new draft release
2. Build the application for macOS, Windows, and Linux
3. Upload all build artifacts to the release
4. The release can then be published manually after reviewing

### Creating a New Release

```bash
# Update version in package.json first, then:
git add .
git commit -m "Prepare release vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

## Troubleshooting

### Common Issues

1. **No clusters showing up**
   - Ensure your kubeconfig file exists at the default location or is specified in the `KUBECONFIG` environment variable
   - On Windows: `%USERPROFILE%\.kube\config`
   - On macOS/Linux: `~/.kube/config`
   - Verify you have valid contexts in your kubeconfig

2. **Port forwarding fails**
   - Check that kubectl is installed and working correctly
   - Verify you have the necessary permissions to access the service
   - Ensure the local port isn't already in use

3. **App crashes on startup**
   - Check the logs for errors
   - Verify that all dependencies are correctly installed

4. **App doesn't open when double-clicked (macOS)**
   - Use the K-Porter-Launcher.app instead, which will set up the proper environment
   - The launcher will check for kubectl and kubeconfig and provide helpful error messages
   - Run `sudo xattr -rd com.apple.quarantine /Applications/K-Porter.app /Applications/K-Porter-Launcher.app` to remove quarantine attributes
   - Check the log files in your home directory: `~/.k-porter-error.log` and `~/.k-porter-launcher.log`
   - Try running the app from Terminal with `open -a K-Porter --stdout` to see console output

5. **Windows-specific issues**
   - If kubectl.exe isn't found, make sure it's in your PATH
   - Try running kubectl commands from Command Prompt to verify it works

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## GitHub Pages Setup

K-Porter uses GitHub Pages to host a downloads website:

1. The website source is in the `docs` directory
2. It is automatically deployed via GitHub Actions when changes are pushed
3. To customize the site:
   - Edit files in the `docs` directory
   - Add screenshots to `docs/screenshots`
   - Push changes to GitHub
   - The site will be available at `https://light-handle.github.io/k-porter/` 