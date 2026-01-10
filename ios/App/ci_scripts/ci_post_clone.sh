#!/bin/sh

# ci_post_clone.sh - Xcode Cloud post-clone script
# This script runs after Xcode Cloud clones the repository
# It installs node_modules needed for Capacitor plugins

set -e

echo "📦 Installing Node.js dependencies..."

# Navigate to project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "✓ npm found"
    npm ci --production
else
    echo "❌ npm not found, trying to install via Homebrew..."
    brew install node
    npm ci --production
fi

echo "✅ Dependencies installed successfully!"
