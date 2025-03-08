# K-Porter: Kubernetes Port Forwarder

K-Porter is a desktop application for macOS, Windows, and Linux that makes it easy to port-forward to Kubernetes services. It provides a simple interface to view your Kubernetes clusters, namespaces, and services, and allows you to quickly set up and manage port forwards.

[![GitHub Release](https://img.shields.io/github/v/release/yourusername/k-porter?style=flat-square)](https://github.com/yourusername/k-porter/releases/latest)
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

1. Download the latest `K-Porter-x.x.x.dmg` file from the [Releases](https://github.com/yourusername/k-porter/releases) page or [downloads site](https://yourusername.github.io/k-porter/)
2. Open the DMG file
3. Drag K-Porter to your Applications folder
4. Open K-Porter from your Applications folder or Launchpad

### Windows

1. Download the latest `K-Porter-Setup-x.x.x.exe` (installer) or `K-Porter-x.x.x.exe` (portable) from the [Releases](https://github.com/yourusername/k-porter/releases) page or [downloads site](https://yourusername.github.io/k-porter/)
2. If using the installer, run the .exe and follow the installation wizard
3. If using the portable version, extract and run directly
4. Launch K-Porter from the Start menu or desktop shortcut

### Linux

1. Download the latest `k-porter_x.x.x_amd64.deb` (Debian/Ubuntu) or `K-Porter-x.x.x.AppImage` from the [Releases](https://github.com/yourusername/k-porter/releases) page or [downloads site](https://yourusername.github.io/k-porter/)
2. For .deb: `sudo dpkg -i k-porter_x.x.x_amd64.deb`
3. For AppImage: Make executable with `chmod +x K-Porter-x.x.x.AppImage` and run directly

## Building from Source

1. Clone this repository
   ```
   git clone https://github.com/yourusername/k-porter.git
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

## Building K-Porter for Distribution

### Building for macOS

K-Porter uses electron-builder to create distributable packages:

1. Install dependencies:
   ```
   npm install
   ```

2. Create icons (if you have a source PNG):
   ```
   # Create source PNG icon at 1024x1024 pixels
   npm run generate-icons source-icon.png
   ```

3. Build for macOS:
   ```
   npm run build:mac
   ```

4. Find the distributable files in the `dist` directory:
   - `K-Porter-x.x.x-x64.dmg` - Installer disk image
   - `K-Porter-x.x.x-x64.zip` - Zipped application

### Signing and Notarizing (for distribution)

For proper distribution, you'll need to:

1. Obtain an Apple Developer certificate
2. Configure signing in your environment
3. Use electron-notarize to notarize your app
4. See the [electron-builder documentation](https://www.electron.build/code-signing) for details

## GitHub Pages Setup

K-Porter uses GitHub Pages to host a downloads website:

1. The website source is in the `docs` directory
2. It is automatically deployed via GitHub Actions when changes are pushed
3. To customize the site:
   - Edit files in the `docs` directory
   - Add screenshots to `docs/screenshots`
   - Push changes to GitHub
   - The site will be available at `https://[yourusername].github.io/k-porter/`

### Setting Up GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" under "Code and automation" in the sidebar
3. For "Source", select "GitHub Actions" 
4. The workflow in `.github/workflows/pages.yml` will handle deployment

## Releasing New Versions

To create a new release:

1. Update the version in `package.json`
2. Commit your changes
3. Create and push a new tag with the format `vX.Y.Z`:
   ```
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The GitHub Actions workflow will automatically build the app for all platforms
5. Go to the Releases page on GitHub, edit the draft release, and publish

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

4. **Windows-specific issues**
   - If kubectl.exe isn't found, make sure it's in your PATH
   - Try running kubectl commands from Command Prompt to verify it works

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 