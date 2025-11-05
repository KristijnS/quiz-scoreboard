# Build Instructions

This document explains how to build the Quiz Scoreboard application for distribution.

## Prerequisites

- Node.js installed
- npm installed
- All dependencies installed (`npm run install:all` from root)

## Complete Build Process

### Option 1: Using the build script (Recommended)

Run the automated build script from the root directory:

```bash
./build-all.sh
```

This script will:
1. Build the backend (TypeScript → JavaScript)
2. Build the frontend (React + Vite → optimized bundle)
3. Build Electron apps for both Mac and Windows

### Option 2: Using npm scripts

From the root directory:

```bash
# Build backend and frontend only
npm run build

# Build everything including Mac Electron app
npm run build:electron:mac

# Build everything including Windows Electron app
npm run build:electron:win

# Build everything including both Mac and Windows Electron apps
npm run build:electron:all
```

### Option 3: Manual step-by-step

```bash
# 1. Build backend
cd backend
npm run build
cd ..

# 2. Build frontend
cd frontend
npm run build
cd ..

# 3. Build Electron apps
cd electron
npm run build:mac        # Mac only
npm run build:win        # Windows only
npm run build:all        # Both platforms
cd ..
```

## Output Files

After building, you'll find the following files in `electron/dist/`:

### Mac
- `Quiz Scoreboard-1.3.0-arm64.dmg` - Disk image installer (~107 MB)
- `Quiz Scoreboard-1.3.0-arm64-mac.zip` - Zip archive (~81 MB)

### Windows
- `Quiz Scoreboard Setup 1.3.0.exe` - Installer (~109 MB)
- `Quiz Scoreboard-1.3.0-portable.exe` - Portable version (~91 MB)

## Important Notes

### ⚠️ Always Build in Order

The Electron build **requires** both backend and frontend to be built first:

1. **Backend must be built** → Creates `backend/dist/` with compiled JavaScript
2. **Frontend must be built** → Creates `frontend/dist/` with optimized web assets
3. **Electron packages both** → Creates platform-specific installers

### ⚠️ Build Both Platforms

When releasing a new version, always build **both** Mac and Windows versions:

```bash
npm run build:electron:all
```

Or use the automated script:

```bash
./build-all.sh
```

### ⚠️ Check for Errors

- The backend build should complete without TypeScript errors
- The frontend build should complete without Vite errors
- The Electron build will show warnings about code signing (normal for unsigned builds)

## Troubleshooting

### "Failed to load resource: net::ERR_CONNECTION_REFUSED"

This error occurs when the backend is not included in the Electron build.

**Solution:** Make sure to build the backend before building Electron:
```bash
cd backend
npm run build
cd ../electron
npm run build:all
```

### Backend files missing

If `backend/dist/` doesn't exist, run:
```bash
cd backend
npm run build
```

### Frontend files missing

If `frontend/dist/` doesn't exist, run:
```bash
cd frontend
npm run build
```

## What Gets Packaged

The Electron build includes:

- **Backend compiled code:** `backend/dist/`
- **Backend dependencies:** `backend/node_modules/`
- **Frontend built assets:** `frontend/dist/`
- **Electron main process:** `electron/main.js`
- **Electron preload script:** `electron/preload.js`
- **Database file:** `backend/quiz.sqlite`
- **Application icons:** `electron/icon.*`

## Version Updates

When updating the version number, update it in all three package.json files:

1. `package.json` (root)
2. `backend/package.json`
3. `frontend/package.json`
4. `electron/package.json`

Then rebuild everything:

```bash
./build-all.sh
```

## Release Checklist

Before releasing a new version:

- [ ] Update version in all package.json files
- [ ] Test all features in development mode
- [ ] Run `./build-all.sh` to build all platforms
- [ ] Test the Mac app (.dmg)
- [ ] Test the Windows app (.exe)
- [ ] Verify tiebreaker features work correctly
- [ ] Update release notes
- [ ] Commit and push to git
- [ ] Tag the release in git
- [ ] Upload installers to distribution location
