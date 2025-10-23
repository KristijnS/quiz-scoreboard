# Quiz Scoreboard v1.0.0 Release Notes

**Release Date:** October 23, 2025

## 🎉 First Official Release

This is the first stable release of Quiz Scoreboard - a cross-platform desktop application for managing quiz scoreboards with teams, rounds, and scores.

## 📦 Downloads

### macOS (Apple Silicon - M1/M2/M3)
- **DMG Installer:** `Quiz Scoreboard-1.0.0-arm64.dmg` (91 MB)
- **ZIP Archive:** `Quiz Scoreboard-1.0.0-arm64-mac.zip` (88 MB)

### Windows (64-bit)
- **NSIS Installer:** `Quiz Scoreboard Setup 1.0.0.exe` (75 MB)
- **Portable:** `Quiz Scoreboard-1.0.0-portable.exe` (72 MB)

*Note: macOS version is not code-signed. You may need to right-click and select "Open" on first launch.*

## ✨ Features

### Quiz Management
- Create and manage multiple quizzes
- Add teams with custom names and numbers
- Define rounds with names and max scores
- Persistent SQLite database storage

### Scoring
- Quick score entry interface
- Real-time score updates
- Score normalization with scale conversion
- Exclude specific rounds from scale conversion

### Visualization
- **Scoreboard View:** Live rankings with gradient colors
- **Chart View:** Interactive bar chart with team performance
- **Projector Mode:** Optimized font sizes for presentations
- Dark mode support

### Performance
- Optimized for 40+ teams with 20+ rounds
- ~85% faster rendering with React optimization patterns
- Database indexes for O(log n) query performance
- Eliminated duplicate API calls with React Context

## 🔧 Technical Highlights

### Frontend
- React 18.2 + TypeScript 5.0.2
- Material-UI v5 components
- Chart.js with custom plugins
- useMemo/useCallback optimization
- React Context for state management
- Lazy loading with code splitting

### Backend
- Express.js REST API
- TypeORM with SQLite database
- TypeScript compilation
- Database indexes on foreign keys
- QueryBuilder for optimized queries

### Desktop
- Electron 31.7.7
- Cross-platform builds
- Native system integration
- Bundled backend and frontend

## 📚 Documentation

Comprehensive documentation included:
- `README.md` - Quick start guide
- `QUICK_START.md` - Detailed usage instructions
- `ELECTRON_README.md` - Desktop app guide
- `ARCHITECTURE.md` - Technical architecture
- `CHART_OPTIMIZATION.md` - Chart performance details
- `PERFORMANCE_OPTIMIZATION.md` - React optimization guide
- `WINDOWS_GUIDE.md` - Windows-specific instructions
- `GIT_GUIDE.md` - Version control guide

## 🐛 Known Issues

### macOS
- Application is not code-signed (requires right-click > Open on first launch)
- HFS+ unavailable warning (uses APFS, requires macOS 10.12+)

### Windows
- Windows Defender may show a warning for unsigned executables
- Use "More info" > "Run anyway" if prompted

## 🚀 Installation

### macOS
1. Download `Quiz Scoreboard-1.0.0-arm64.dmg`
2. Open the DMG file
3. Drag "Quiz Scoreboard" to Applications
4. Right-click the app and select "Open" (first time only)

### Windows
1. Download `Quiz Scoreboard Setup 1.0.0.exe`
2. Run the installer
3. Click "More info" > "Run anyway" if Windows Defender prompts
4. Follow installation wizard

### Portable (Windows)
1. Download `Quiz Scoreboard-1.0.0-portable.exe`
2. Run directly without installation
3. Data stored in same folder as executable

## 🔄 Upgrade Notes

This is the first release. No upgrade path needed.

## 🙏 Credits

Developed for De Spooklinde quiz events.

## 📝 Changelog

### Features
- ✅ Complete quiz management system
- ✅ Team and round management
- ✅ Score tracking and normalization
- ✅ Gradient color ranking
- ✅ Interactive chart visualization
- ✅ Dark mode support
- ✅ Cross-platform desktop app

### Performance Optimizations
- ✅ React useMemo/useCallback patterns
- ✅ Database indexes for fast queries
- ✅ React Context to eliminate duplicate fetches
- ✅ Chart.js custom plugins for rotated labels
- ✅ Lazy loading for faster initial load

### Documentation
- ✅ Comprehensive README files
- ✅ Architecture documentation
- ✅ Performance optimization guides
- ✅ Git usage guide
- ✅ Backend entity documentation

## 🔮 Future Improvements

Potential enhancements for future releases:
- Export scoreboard to PDF
- Import teams from CSV
- Custom theme colors
- Multi-language support
- Score history visualization
- Team statistics and analytics

## 📞 Support

For issues or questions, please visit:
https://github.com/KristijnS/quiz-scoreboard

---

**Built with:** React • TypeScript • Electron • Material-UI • Chart.js • Express • TypeORM • SQLite
