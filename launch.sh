#!/bin/bash

# Set up essential environment variables
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="${HOME:-$(echo ~)}"

# Function to display error dialog with instructions
show_error() {
  local title="$1"
  local message="$2"
  local instructions="$3"
  
  osascript -e "display dialog \"$message\n\n$instructions\" buttons {\"OK\"} default button \"OK\" with icon stop with title \"$title\""
}

# Check if kubectl is available
if ! which kubectl &>/dev/null; then
  show_error "K-Porter: kubectl Not Found" \
    "kubectl command was not found in your PATH. K-Porter requires kubectl to interact with your Kubernetes clusters." \
    "Installation instructions:\n1. Install kubectl using Homebrew: brew install kubectl\n2. Or download from kubernetes.io/docs/tasks/tools/"
  exit 1
fi

# Check if kubeconfig exists
if [ ! -f "${KUBECONFIG:-$HOME/.kube/config}" ]; then
  show_error "K-Porter: Kubernetes Configuration Not Found" \
    "Kubernetes configuration not found at ~/.kube/config." \
    "Please set up your kubeconfig file by:\n1. Creating ~/.kube directory: mkdir -p ~/.kube\n2. Copying your cluster config to ~/.kube/config\n3. Or setting the KUBECONFIG environment variable"
  exit 1
fi

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Write a timestamp to log
echo "$(date): K-Porter launched via shell script" >> "$HOME/.k-porter-launcher.log"

# Start the app with proper environment
open "$DIR/K-Porter.app" --args --verbose 