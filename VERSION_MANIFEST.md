# Quiz Scoreboard - Version Manifest

**Version:** 1.0.0  
**Release Date:** October 2025  
**Platform:** Cross-platform (macOS, Windows)  
**Status:** ✅ Production Ready

## Application Stack

### Frontend
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.5.3
- **UI Library:** Material-UI (MUI) v5
- **Charts:** Chart.js with react-chartjs-2
- **Routing:** React Router v6
- **Build Tool:** Vite 5.4.1
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 4.19.2
- **Language:** TypeScript 5.5.3
- **Database:** SQLite 3
- **ORM:** TypeORM 0.3.20
- **Development:** ts-node, nodemon

### Desktop
- **Framework:** Electron 31.0.0
- **Builder:** electron-builder 24.13.3
- **Packaging:** NSIS (Windows), DMG (macOS)

## Features

### Core Functionality
- ✅ Create and manage quizzes
- ✅ Add and organize teams
- ✅ Create rounds with max scores
- ✅ Enter and track scores
- ✅ Real-time scoreboard updates
- ✅ Persistent SQLite database

### Advanced Features
- ✅ Scale conversion (normalize to standard scale)
- ✅ Gradient coloring (visual ranking: green → yellow → red)
- ✅ Exclude rounds from scale calculation
- ✅ Team ordering (move up/down)
- ✅ Round ordering (move up/down)
- ✅ Chart visualization (line graph)
- ✅ Delete confirmations with dependency warnings
- ✅ Cascade deletion (cleanup related data)
- ✅ Dark mode interface (default)
- ✅ Quiz name in app bar

### Technical Features
- ✅ Foreign key constraints enabled
- ✅ Manual cascade deletion for SQLite
- ✅ Optional chaining for undefined safety
- ✅ TypeScript strict mode
- ✅ RESTful API design
- ✅ CORS enabled
- ✅ JSON request/response
- ✅ Express error handling

## API Endpoints

### Quizzes
- GET `/api/quizzes` - List all quizzes
- GET `/api/quizzes/:id` - Get quiz by ID
- POST `/api/quizzes` - Create quiz
- PUT `/api/quizzes/:id` - Update quiz settings
- DELETE `/api/quizzes/:id` - Delete quiz (cascade)

### Teams
- GET `/api/teams/quiz/:quizId` - List teams for quiz
- POST `/api/teams/quiz/:quizId` - Add team to quiz
- PUT `/api/teams/:teamId` - Update team
- DELETE `/api/teams/quiz/:quizId/team/:teamId` - Remove team

### Rounds
- GET `/api/rounds/quiz/:quizId` - List rounds for quiz
- POST `/api/rounds` - Create round
- PUT `/api/rounds/:id` - Update round
- PUT `/api/rounds/:id/order` - Update round order
- DELETE `/api/rounds/:id` - Delete round (cascade)

### Scores
- GET `/api/scores/round/:roundId` - Get scores for round
- PUT `/api/scores` - Update or create score

## Database Schema

### Tables
1. **quiz**
   - id, name, creationDate
   - scaleConversionEnabled, standardScale, gradientEnabled

2. **team**
   - id, name, nr (order number)

3. **round**
   - id, title, nr, maxScore, excludeFromScale, quizId

4. **team_quiz** (junction table)
   - id, teamId, quizId

5. **score**
   - id, points, roundId, teamQuizId

### Relations
- Quiz → Rounds (one-to-many)
- Quiz → TeamQuizzes (one-to-many)
- Team → TeamQuizzes (one-to-many)
- Round → Scores (one-to-many)
- TeamQuiz → Scores (one-to-many)

## File Structure

```
quiz-scoreboard/
├── backend/
│   ├── src/
│   │   ├── entities/        # TypeORM entities
│   │   ├── routes/          # Express routes
│   │   ├── data-source.ts   # Database config
│   │   └── index.ts         # Server entry
│   ├── package.json
│   ├── tsconfig.json
│   └── quiz.sqlite          # Database file
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service
│   │   ├── App.tsx          # Main app
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script
│   └── package.json         # Build config
├── package.json             # Root scripts
├── cleanup.sh               # Process cleanup
├── verify-setup.sh          # Setup verification
└── *.md                     # Documentation

```

## Build Outputs

### macOS
- **DMG:** Disk image installer
- **ZIP:** Compressed app bundle
- **Location:** `electron/dist/`
- **Size:** ~100-150 MB each

### Windows
- **NSIS:** Setup wizard installer
- **Portable:** Standalone executable
- **Location:** `electron/dist/`
- **Size:** ~100-150 MB each

## Configuration Files

### TypeScript
- `tsconfig.json` (3 files: root, backend, frontend)
- Strict mode enabled
- ES2020 target
- ESNext module

### Build
- `vite.config.ts` - Frontend build
- `electron/package.json` - Electron build
- Proxy: /api → localhost:3000

### Development
- Hot reload: Frontend (Vite)
- Auto-restart: Backend (nodemon)
- Manual restart: Electron

## Known Limitations

1. **Database:** SQLite (single file, not for concurrent users)
2. **Offline only:** No cloud sync
3. **Single instance:** Cannot run multiple quizzes simultaneously
4. **No auto-update:** Manual installation of new versions required
5. **Code signing:** Not included (Windows SmartScreen warnings)

## System Requirements

### Development
- Node.js 18+
- npm 8+
- macOS, Windows, or Linux
- 4GB RAM
- 500MB disk space

### End Users
- **macOS:** 10.13+ (High Sierra or later)
- **Windows:** Windows 10 or later
- 4GB RAM minimum
- 100MB free disk space
- No Node.js installation required

## Security

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Preload script for API exposure
- ✅ CORS configured
- ✅ No eval() usage
- ⚠️  No code signing (optional enhancement)
- ⚠️  No auto-updates (optional enhancement)

## Testing

### Manual Testing Checklist
- [ ] Create quiz
- [ ] Add teams
- [ ] Add rounds
- [ ] Enter scores
- [ ] View scoreboard
- [ ] Enable scale conversion
- [ ] Test gradient coloring
- [ ] View chart
- [ ] Delete team (check dependencies)
- [ ] Delete round (check dependencies)
- [ ] Delete quiz (check cascade)
- [ ] Close and reopen (data persists)

### Build Testing
- [ ] Build succeeds
- [ ] App installs correctly
- [ ] Database initializes
- [ ] All features work
- [ ] App closes cleanly
- [ ] Data persists after restart

## Future Enhancements

### Potential Features
- [ ] Export quiz results to PDF/CSV
- [ ] Import quiz data
- [ ] Multiple quiz instances
- [ ] Cloud backup
- [ ] Auto-updates (electron-updater)
- [ ] Code signing
- [ ] Internationalization (i18n)
- [ ] Custom themes
- [ ] Sound effects
- [ ] Timer per round
- [ ] Team photos/avatars
- [ ] Bonus points system

### Technical Improvements
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database migrations
- [ ] API versioning
- [ ] GraphQL API option

## Change Log

### Version 1.0.0 (October 2025)
- Initial release
- Core quiz management functionality
- Scale conversion and gradient coloring
- Chart visualization
- Delete with cascade
- Electron desktop app
- macOS and Windows builds
- Dark mode interface
- Comprehensive documentation

## Credits

**Developed for:** De Spooklinde  
**Development:** October 2025  
**Tech Stack:** React, TypeScript, Express, SQLite, Electron  

## License

Private project for De Spooklinde

---

**For support or questions, see QUICK_START.md and other documentation files.**
