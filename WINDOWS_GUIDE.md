# Quiz Scoreboard - Windows Distribution Guide

## For End Users (Windows)

### Installing the App

1. **Download** one of these files:
   - `Quiz Scoreboard Setup 1.0.0.exe` - **Recommended** (Installs to Program Files)
   - `Quiz Scoreboard-1.0.0-portable.exe` - Portable version (runs without installing)

2. **Install or Run:**
   - **Installer version:** Double-click the Setup.exe and follow the wizard
   - **Portable version:** Double-click the .exe file to run directly

3. **Start using!** The app will open automatically after installation.

### System Requirements

- Windows 10 or later
- 4GB RAM minimum
- 100MB free disk space

### Data Storage

Your quiz data is saved locally on your computer in a database file. The app works completely offline.

## For Developers (Building for Windows)

### Prerequisites

- Node.js 18 or later
- npm
- **Optional but recommended:** Wine (for building Windows apps on macOS)

### Building on Windows

```bash
# Install dependencies
npm run install:all

# Build the Windows executable
npm run build:electron:win
```

Output files will be in `electron/dist/`:
- `Quiz Scoreboard Setup 1.0.0.exe` - NSIS installer
- `Quiz Scoreboard-1.0.0-portable.exe` - Portable executable

### Building on macOS (Cross-Platform)

Install Wine first:
```bash
brew install --cask wine-stable
```

Then build:
```bash
npm run build:electron:win
```

### Testing Before Distribution

1. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```

2. **Test the built app:**
   - Navigate to `electron/dist/`
   - Run the portable .exe or install with the Setup.exe
   - Test all features

### Troubleshooting Build Issues

**Error: "Cannot find module 'wine'"**
- Install Wine: `brew install --cask wine-stable`

**Error: "ENOENT: no such file or directory"**
- Run `npm run build` first to build backend and frontend
- Make sure all dependencies are installed: `npm run install:all`

**Build succeeds but app doesn't start**
- Check that ports 3000 and 5173 are not blocked by firewall
- Verify backend/dist and frontend/dist folders exist
- Check electron/main.js for the correct file paths

### Customizing the Build

Edit `electron/package.json` to change:

```json
{
  "build": {
    "appId": "com.yourcompany.scorebord",
    "productName": "Your Quiz App Name",
    "win": {
      "icon": "icon.ico",  // 256x256 ICO file
      "target": ["nsis", "portable"]
    }
  }
}
```

### Creating a Windows Installer Icon

1. Create a 256x256 PNG image
2. Convert to ICO using online tools:
   - https://cloudconvert.com/png-to-ico
   - https://icoconvert.com/
3. Save as `electron/icon.ico`
4. Rebuild: `npm run build:electron:win`

## Distribution Checklist

Before sharing the app:

- [ ] Test the installer on a clean Windows machine
- [ ] Test the portable version
- [ ] Verify database saves correctly
- [ ] Test all CRUD operations (create, read, update, delete)
- [ ] Check that the app closes cleanly
- [ ] Include a README for end users
- [ ] Consider code signing (optional, prevents security warnings)

## File Size

Expected file sizes:
- Installer: ~100-150 MB
- Portable: ~100-150 MB

Large size is normal for Electron apps as they bundle Chromium and Node.js.

## Security Notes

### Windows SmartScreen Warning

Users may see "Windows protected your PC" when running the installer. This is normal for unsigned apps.

To bypass:
1. Click "More info"
2. Click "Run anyway"

**To avoid this warning:** Purchase a code signing certificate and sign your executable.

### Antivirus False Positives

Some antivirus software may flag the portable .exe. This is a false positive common with Electron apps.

**Solutions:**
- Use the installer version (less likely to be flagged)
- Request users to whitelist the app
- Consider code signing

## Updates

To release a new version:

1. Update version in `electron/package.json`
2. Build: `npm run build:electron:win`
3. Rename old dist folder: `mv electron/dist electron/dist-old`
4. Distribute the new .exe files
5. Users must uninstall old version and install new one

**Future improvement:** Implement auto-updates with electron-updater

## Support

If users report issues:

1. Ask them to check Windows version (must be Windows 10+)
2. Ask them to try the portable version instead of installer
3. Check if their antivirus is blocking the app
4. Verify they have enough disk space (100MB+)
5. Ask them to restart their computer

## License

Private project for De Spooklinde
