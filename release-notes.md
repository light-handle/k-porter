# K-Porter 1.0.0 - Kubernetes Port Forwarding Made Easy

The first official release of K-Porter, a desktop application that simplifies Kubernetes port forwarding.

## What is K-Porter?

K-Porter is a sleek, intuitive desktop application that makes port-forwarding to Kubernetes services effortless. Browse clusters, namespaces, and services with ease, and set up port forwards with just a few clicks.

## Key Features

- 🔍 **Automatic Detection** - Automatically detects all your Kubernetes clusters from your kubeconfig file
- 📋 **Resource Browser** - Easily browse through all namespaces and services in each cluster
- 🔌 **One-Click Port Forwarding** - Set up port forwarding to any service with just a few clicks
- 📊 **Connection Manager** - Manage all your active port forwards from a single dashboard
- 🔄 **Multi-Cluster Support** - Effortlessly switch between different Kubernetes clusters
- 🌓 **Dark Mode Support** - Full light and dark mode support for comfortable viewing

## Installation

### macOS
- Download the DMG file
- Open the DMG file
- Drag K-Porter to your Applications folder
- Open K-Porter from your Applications folder or Launchpad

### Windows
- Download the installer or portable version
- Run the installer or extract the portable version
- Launch K-Porter from the Start menu or desktop shortcut

### Linux
- Download the AppImage or DEB file
- For AppImage: Make executable with `chmod +x` and run directly
- For DEB: Install with `sudo dpkg -i`

## Requirements

- macOS 10.14 or later / Windows 10 or later / Linux
- Kubernetes configuration in `~/.kube/config` or set via `KUBECONFIG` environment variable
- `kubectl` command available in your PATH

## Feedback and Issues

Please report any issues or feature requests in the [GitHub issue tracker](https://github.com/light-handle/k-porter/issues). 