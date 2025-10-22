#!/bin/bash

echo "🔍 Quiz Scoreboard - Setup Verification"
echo "========================================"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check npm
echo ""
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found!"
    exit 1
fi

# Check dependencies
echo ""
echo "📂 Checking dependencies..."

if [ -d "node_modules" ]; then
    echo "✅ Root dependencies installed"
else
    echo "⚠️  Root dependencies missing - run: npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies missing"
fi

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies missing"
fi

if [ -d "electron/node_modules" ]; then
    echo "✅ Electron dependencies installed"
else
    echo "⚠️  Electron dependencies missing"
fi

# Check project structure
echo ""
echo "📁 Checking project structure..."

REQUIRED_DIRS=("frontend" "backend" "electron" "frontend/src" "backend/src")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ missing!"
    fi
done

# Check key files
echo ""
echo "📄 Checking key files..."

REQUIRED_FILES=(
    "package.json"
    "frontend/package.json"
    "backend/package.json"
    "electron/package.json"
    "electron/main.js"
    "electron/preload.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing!"
    fi
done

# Summary
echo ""
echo "========================================"
echo "📋 Next Steps:"
echo ""
echo "If dependencies are missing:"
echo "  npm run install:all"
echo ""
echo "To run in development mode:"
echo "  npm run electron:dev"
echo ""
echo "To build for distribution:"
echo "  npm run build:electron:mac    # macOS"
echo "  npm run build:electron:win    # Windows"
echo "  npm run build:electron:all    # Both"
echo ""
echo "See QUICK_START.md for more info!"
echo "========================================"
