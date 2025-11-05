#!/bin/bash

# Build script for Quiz Scoreboard
# This script builds the backend, frontend, and both Mac and Windows Electron apps

set -e  # Exit on any error

echo "======================================"
echo "Quiz Scoreboard - Complete Build Script"
echo "======================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Build Backend
echo "Step 1/3: Building backend..."
cd backend
npm run build
echo "✓ Backend built successfully"
echo ""

# Step 2: Build Frontend
echo "Step 2/3: Building frontend..."
cd ../frontend
npm run build
echo "✓ Frontend built successfully"
echo ""

# Step 3: Build Electron Apps (Mac and Windows)
echo "Step 3/3: Building Electron apps (Mac and Windows)..."
cd ../electron
npm run build:all
echo "✓ Electron apps built successfully"
echo ""

echo "======================================"
echo "Build Complete!"
echo "======================================"
echo ""
echo "Built files are located in: electron/dist/"
echo ""
echo "Mac files:"
echo "  - Quiz Scoreboard-1.3.0-arm64.dmg"
echo "  - Quiz Scoreboard-1.3.0-arm64-mac.zip"
echo ""
echo "Windows files:"
echo "  - Quiz Scoreboard Setup 1.3.0.exe"
echo "  - Quiz Scoreboard-1.3.0-portable.exe"
echo ""
