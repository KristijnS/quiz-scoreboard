# Release Notes - v1.3.0

**Release Date:** October 27, 2025

## 🎯 Overview

Version 1.3.0 introduces a comprehensive **Ex Aequo (Tiebreaker)** system for handling ties in quiz competitions. This feature allows quiz masters to add a special tiebreaker question that only affects ranking when teams have equal total scores, with the team whose answer is closest to the target value placing highest.

---

## ✨ New Features

### 🎬 Leaderboard Page (NEW!)

An entirely new presentation view for dramatic team reveal:

#### Features
- **Click-to-Reveal**: Click anywhere on screen to progressively reveal teams
- **Bottom-to-Top Animation**: Teams are revealed from 5th place to 1st place
- **Progressive Width Sizing**: 
  - 1st place: 100% width (widest)
  - 2nd place: 95% width
  - 3rd place: 90% width
  - 4th-5th place: 85% width
  - 6th+ place: 78% width
- **Trophy & Medal Icons**: 
  - 🏆 Gold trophy for 1st place with pulse animation
  - 🥈 Silver medal for 2nd place with pulse animation
  - 🥉 Bronze medal for 3rd place with pulse animation
- **Gradient Colors**: Gold, silver, bronze backgrounds for top 3 (when gradient enabled)
- **Auto-scroll**: Automatically scrolls to bottom when revealing teams beyond top 5
- **Smooth Animations**: Fade-in-up effect with scale hover interactions
- **Dynamic Team Count**: Works perfectly with any number of teams (not just 5)
- **Completion Message**: "All teams revealed! 🎉" when all teams are shown

#### Use Case
Perfect for live quiz events where you want to build suspense by revealing the final rankings one team at a time, starting from the bottom positions and working up to the winner.

### Ex Aequo Tiebreaker System

A complete tiebreaker mechanism for handling tied scores:

#### Quiz Setup
- **Ex Aequo Toggle**: New checkbox in Quiz Management to enable/disable the Ex Aequo round
- **Target Value**: Configurable numeric target value that teams try to guess
- **Visual Indicator**: Balance scale icon (⚖️) clearly marks the Ex Aequo setting
- **Automatic Round Creation**: Enabling Ex Aequo automatically creates a special round with unlimited score capacity (999999 points)

#### Round Management
- **Locked Position**: Ex Aequo round is always positioned last and cannot be moved
- **Protected from Editing**: Ex Aequo round name and max score cannot be modified
- **Smart Insertion**: New rounds automatically insert before the Ex Aequo round
- **Disabled Controls**: Edit and arrow buttons are disabled for Ex Aequo rounds to prevent accidental modifications

#### Ranking Logic
- **Excluded from Totals**: Ex Aequo scores do not count toward team total scores
- **Tiebreaker Only**: Ex Aequo values are only used when teams have identical total scores
- **Closest Wins**: When tied, the team with the answer closest to the target value ranks higher
- **Mathematical Precision**: Uses `Math.abs(teamAnswer - targetValue)` to determine proximity

#### UI Integration
- **Scoreboard**: Displays rankings with Ex Aequo tiebreaking applied
- **Leaderboard**: Animated reveal respects tiebreaker order
- **Top 5 View**: Progressive reveal honors tiebreaker rankings
- **Chart View**: Visual rankings reflect tiebreaker logic

---

## 🔧 Technical Improvements

### Backend Changes
- **Quiz Entity**: Added `exAequoEnabled` (boolean) and `exAequoValue` (float) fields
- **Round Entity**: Added `isExAequo` (boolean) flag to identify the special tiebreaker round
- **API Routes**: Updated quiz and round endpoints to support Ex Aequo data
- **Database Schema**: Automatic migration support via TypeORM

### Frontend Changes
- **New Leaderboard Page**: Created complete `Leaderboard.tsx` component with click-to-reveal functionality
- **Type Definitions**: Extended Quiz and Round interfaces with Ex Aequo properties
- **State Management**: Quiz context automatically refreshes on page navigation
- **API Integration**: Updated service layer to handle Ex Aequo settings
- **Sorting Logic**: Implemented two-tier sorting (total score → tiebreaker proximity)
- **Routing**: Added `/leaderboard` route in App.tsx navigation

### UI/UX Enhancements
- **Consistent Icons**: Used Material-UI BalanceIcon for tiebreaker identification
- **Disabled States**: Visual feedback for non-editable Ex Aequo controls
- **Edge Case Handling**: Proper behavior with fewer than 5 teams
- **Button Styling**: Consistent color scheme across all navigation buttons

---

## 🐛 Bug Fixes

### Data Refresh Issues
- **Fixed**: Scoreboard not refreshing after adding scores
- **Solution**: Added automatic refresh on page navigation via `location.pathname` effect

### Edge Case - Small Team Count
- **Fixed**: Leaderboard and Top 5 pages breaking with fewer than 5 teams
- **Solution**: Dynamic team count handling with `Math.min(5, allTeamsSorted.length)`

### UI Consistency
- **Fixed**: Leaderboard button appearing white in dark mode
- **Solution**: Added proper color, variant, and disabled props

---

## 📦 Files Changed

### Backend
- `backend/src/entities/Quiz.ts` - Added Ex Aequo fields
- `backend/src/entities/Round.ts` - Added isExAequo flag
- `backend/src/routes/quiz.routes.ts` - Ex Aequo API support
- `backend/src/routes/round.routes.ts` - Round creation with Ex Aequo

### Frontend
- `frontend/src/types.ts` - Extended type definitions
- `frontend/src/services/api.ts` - API integration
- `frontend/src/context/QuizContext.tsx` - Navigation-based refresh
- `frontend/src/pages/QuizManagement.tsx` - Complete Ex Aequo UI and logic
- `frontend/src/pages/Scoreboard.tsx` - Ranking with tiebreaker
- `frontend/src/pages/Leaderboard.tsx` - **NEW FILE** - Click-to-reveal animated leaderboard
- `frontend/src/pages/Top5.tsx` - Progressive reveal with tiebreaker
- `frontend/src/pages/ChartView.tsx` - Chart rankings with tiebreaker
- `frontend/src/App.tsx` - Leaderboard navigation and button styling fixes

---

## 🎮 Usage Guide

### Using the Leaderboard Page

1. **Navigate to Leaderboard**: Click the "Leaderboard" button in the main navigation
2. **Click to Reveal**: Click anywhere on the screen to reveal the next team
3. **Reveal Order**: Teams appear from bottom to top (5th → 4th → 3rd → 2nd → 1st)
4. **Auto-scroll**: For more than 5 teams, the page automatically scrolls to show new teams
5. **Watch Animations**: Enjoy the fade-in and pulse effects on trophy/medal icons
6. **Completion**: When all teams are revealed, a celebration message appears

**Pro Tip**: Use Leaderboard mode for live quiz events to build suspense. Use Scoreboard mode for quick reference during the quiz.

### Setting Up Ex Aequo

1. **Navigate to Quiz Management**
2. **Enable Ex Aequo**: Check the ⚖️ Ex Aequo checkbox
3. **Set Target Value**: Enter the numeric target value (e.g., "365" for days in a year)
4. **Add Rounds**: Create regular quiz rounds - they will automatically appear before Ex Aequo
5. **Enter Scores**: Add scores for both regular rounds and the Ex Aequo round

### How Tiebreaking Works

**Scenario**: Team A and Team B both have 100 points total
- **Target Value**: 365
- **Team A's Ex Aequo Answer**: 350 (difference: 15)
- **Team B's Ex Aequo Answer**: 380 (difference: 15)
- **Result**: Teams remain tied (same difference)

**Scenario**: Team A and Team B both have 100 points total
- **Target Value**: 365
- **Team A's Ex Aequo Answer**: 370 (difference: 5)
- **Team B's Ex Aequo Answer**: 350 (difference: 15)
- **Result**: Team A ranks higher (smaller difference wins)

---

## 🚀 Upgrade Instructions

### From v1.2.0 to v1.3.0

1. **Pull Latest Code**:
   ```bash
   git pull origin main
   git checkout v1.3.0
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ../electron && npm install
   cd ..
   ```

3. **Database Migration** (Automatic):
   - TypeORM will automatically add new columns when the backend starts
   - No manual migration required if `synchronize: true` is enabled

4. **Build and Run**:
   ```bash
   npm run build
   npm run dev
   ```

5. **Existing Quizzes**:
   - All existing quizzes will have `exAequoEnabled: false` by default
   - No changes to existing quiz behavior
   - Enable Ex Aequo per quiz as needed

---

## 📥 Download

### macOS (Apple Silicon - M1/M2/M3)
- **DMG Installer**: `Quiz Scoreboard-1.3.0-arm64.dmg` (95.4 MB)
- **ZIP Archive**: `Quiz Scoreboard-1.3.0-arm64-mac.zip` (92.2 MB)

### Installation
1. Download the DMG or ZIP file
2. For DMG: Open and drag to Applications folder
3. For ZIP: Extract and move to Applications folder
4. First launch: Right-click → Open (to bypass Gatekeeper)

---

## 🔮 What's Next

### Planned for v1.4.0
- Windows and Linux binary builds
- Multiple Ex Aequo rounds support
- Custom tiebreaker rules (percentage-based, time-based)
- Export quiz results with tiebreaker details
- Leaderboard customization options (animation speed, reveal order)
- Full-screen presentation mode

---

## 🙏 Acknowledgments

Thank you to all users who requested the tiebreaker feature and provided feedback during development!

---

## 📝 Full Changelog

```
feat: Add Leaderboard page with click-to-reveal animation
  - New page at /leaderboard route
  - Progressive reveal from bottom to top (5th → 1st)
  - Trophy and medal icons with pulse animations
  - Progressive width sizing (1st widest, decreasing to 6th+)
  - Auto-scroll for teams beyond top 5
  - Works with any number of teams

feat: Add Ex Aequo tiebreaker system
  - Quiz Management: Ex Aequo checkbox and target value input
  - Round Management: Locked last position for Ex Aequo round
  - Ranking Logic: Two-tier sorting with tiebreaker
  - UI Integration: All views updated with tiebreaker support

fix: Data refresh on page navigation
  - Added location.pathname-based refresh in QuizContext

fix: Edge cases with fewer than 5 teams
  - Dynamic team count handling in Leaderboard and Top 5

fix: Button styling consistency
  - Leaderboard button color in dark mode

chore: Version bump to 1.3.0
  - Updated package.json in root, backend, frontend, electron
```

---

**For questions or issues, please visit**: https://github.com/KristijnS/quiz-scoreboard/issues
