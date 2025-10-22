# Quiz Scoreboard - Electron Desktop Application

A cross-platform desktop application for managing quiz scoreboards with teams, rounds, and scores.

## Features

- Create and manage quizzes
- Add teams and rounds
- Track scores with real-time updates
- Scale conversion to normalize scores
- Gradient coloring for visual ranking
- Chart visualization of team performance
- Cross-platform: Works on macOS and Windows

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Setup

1. Install all dependencies:
```bash
npm run install:all
```

### Running in Development Mode

Run the Electron app in development mode (with hot-reload for frontend):

```bash
npm run electron:dev
```

This will:
- Start the backend server on port 3000
- Start the frontend dev server on port 5173
- Launch the Electron app pointing to the dev servers

## Building for Distribution

### Build for macOS

```bash
npm run build:electron:mac
```

Output will be in `electron/dist/`:
- `.dmg` installer
- `.zip` archive

### Build for Windows

```bash
npm run build:electron:win
```

Output will be in `electron/dist/`:
- NSIS installer (`.exe`)
- Portable executable

### Build for Both Platforms

```bash
npm run build:electron:all
```

**Note:** Building for Windows on macOS requires Wine. Building for macOS on Windows is not supported by electron-builder.

## Project Structure

```
.
├── backend/          # Express API server with SQLite database
├── frontend/         # React + Vite frontend
├── electron/         # Electron main process and build configuration
└── package.json      # Root package with cross-project scripts
```

## Database

The SQLite database (`quiz.sqlite`) is stored in:
- **Development:** `backend/quiz.sqlite`
- **Production:** Bundled with the application

## Scripts Reference

### Root Level

- `npm run install:all` - Install dependencies for all packages
- `npm run dev` - Run backend + frontend in development mode (browser)
- `npm run electron:dev` - Run the Electron app in development mode
- `npm run build` - Build backend and frontend for production
- `npm run build:electron:mac` - Build Electron app for macOS
- `npm run build:electron:win` - Build Electron app for Windows
- `npm run build:electron:all` - Build Electron app for both platforms

### Electron Folder

- `npm start` - Start Electron (requires built backend/frontend)
- `npm run build:mac` - Build for macOS only
- `npm run build:win` - Build for Windows only
- `npm run build:all` - Build for both platforms

## Customization

### App Icons

To customize the app icon:

1. Create icons in the `electron/` folder:
   - `icon.icns` for macOS (512x512 PNG converted to ICNS)
   - `icon.ico` for Windows (256x256 ICO file)
   - `icon.png` for Linux (512x512 PNG)

2. Use tools like:
   - https://cloudconvert.com/png-to-icns (for macOS)
   - https://cloudconvert.com/png-to-ico (for Windows)

### App Metadata

Edit `electron/package.json` to change:
- `build.appId` - Unique application ID
- `build.productName` - Application display name
- `version` - Application version

## Troubleshooting

### Backend won't start

Check that port 3000 is not in use:
```bash
lsof -i :3000
```

### Frontend won't start

Check that port 5173 is not in use:
```bash
lsof -i :5173
```

### Build fails

1. Clear node_modules and reinstall:
```bash
rm -rf node_modules frontend/node_modules backend/node_modules electron/node_modules
npm run install:all
```

2. Clear build caches:
```bash
rm -rf backend/dist frontend/dist electron/dist
```

## License

Private project for De Spooklinde
