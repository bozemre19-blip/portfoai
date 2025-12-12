#!/bin/sh

# Fail on any error
set -e

# Install Node.js if not present (Apple Silicon machines usually need Homebrew or nvm)
# However, Xcode Cloud images might have node. Let's try installing dependencies directly.
# If node is missing, we might need: brew install node

echo "Installing Node.js dependencies..."
npm ci --legacy-peer-deps

echo "Building web assets..."
npm run build

echo "Syncing Capacitor..."
npx cap sync ios
