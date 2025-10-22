# Quick Start Guide - Electron App

## First Time Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

## Development

### Option 1: Run as Desktop App (Electron)

```bash
npm run electron:dev
```

This will:
- Start backend server on http://localhost:3000
- Start frontend dev server on http://localhost:5173
- Launch Electron desktop app

**Benefits:**
- Works like a native desktop application
- No browser required
- Can be distributed to users

### Option 2: Run in Browser (Web App)

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

**Benefits:**
- Easier for development/debugging
- Use browser DevTools
- Faster refresh during development

## Building for Distribution

### Build for macOS

```bash
npm run build:electron:mac
```

Creates:
- `electron/dist/Quiz Scoreboard-1.0.0.dmg` (installer)
- `electron/dist/Quiz Scoreboard-1.0.0-mac.zip` (portable)

### Build for Windows

```bash
npm run build:electron:win
```

Creates:
- `electron/dist/Quiz Scoreboard Setup 1.0.0.exe` (installer)
- `electron/dist/Quiz Scoreboard-1.0.0-portable.exe` (portable)

### Build for Both

```bash
npm run build:electron:all
```

**Note:** Building for Windows on macOS requires Wine. Install with:
```bash
brew install --cask wine-stable
```

## Distribution

After building, share the installers/portable versions from `electron/dist/` folder.

### macOS Users
- Send them the `.dmg` file
- They double-click to mount it
- Drag app to Applications folder

### Windows Users  
- Send them either:
  - Setup `.exe` for installation
  - Portable `.exe` to run without installing

## Troubleshooting

### "Port 3000 already in use"

Kill existing processes:
```bash
pkill -f "npm run dev"
# or
lsof -ti:3000 | xargs kill
```

### "Port 5173 already in use"

```bash
lsof -ti:5173 | xargs kill
```

### Electron window is blank

1. Wait 2-3 seconds for servers to start
2. Check terminal for errors
3. Try refreshing the Electron window (Cmd/Ctrl + R)

### Build fails

Clear everything and reinstall:
```bash
rm -rf node_modules frontend/node_modules backend/node_modules electron/node_modules
rm -rf backend/dist frontend/dist electron/dist
npm run install:all
```

## Development Tips

### Use Browser for Frontend Development
During active frontend development, use `npm run dev` and work in the browser. It's faster and you get better DevTools.

### Use Electron for Testing Distribution
Use `npm run electron:dev` to test how the app will work when distributed.

### Hot Reload
- Frontend: Auto-reloads in both browser and Electron
- Backend: Auto-restarts when you save .ts files
- Electron: Manual restart needed (quit and run again)

## Project URLs

- **Backend API:** http://localhost:3000
- **Frontend Dev:** http://localhost:5173
- **API Docs:** http://localhost:3000

## Database Location

- **Development:** `backend/quiz.sqlite`
- **Production (Electron):** Bundled in app resources

Your quiz data is saved locally in the SQLite database!
