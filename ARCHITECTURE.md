# Quiz Scoreboard - Complete Architecture Documentation

**Last Updated:** October 23, 2025  
**Version:** 1.0.0

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [Backend API](#backend-api)
5. [Frontend Architecture](#frontend-architecture)
6. [Key Features](#key-features)
7. [Performance Optimizations](#performance-optimizations)
8. [File Structure](#file-structure)

---

## Overview

Quiz Scoreboard is a full-stack Electron application for managing and displaying quiz/trivia game scores in real-time. Supports up to 40+ teams with 20+ rounds, with live updates and visual scoreboard displays.

### Primary Use Cases:
- Live quiz events with projector display
- Team-based trivia competitions
- Score tracking with multiple rounds/categories
- Real-time scoreboard updates
- Score normalization across different round scales

---

## Technology Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js (REST API)
- **ORM:** TypeORM (database management)
- **Database:** SQLite (embedded, no external server needed)
- **Dev Tool:** ts-node-dev (hot reload)

### Frontend
- **Framework:** React 18.2 with TypeScript 5.0.2
- **UI Library:** Material-UI (MUI) v5
- **State Management:** React Context API (QuizContext)
- **Routing:** React Router v6
- **Charts:** Chart.js with react-chartjs-2
- **Build Tool:** Vite 4.5
- **HTTP Client:** Axios

### Desktop Application
- **Platform:** Electron 28
- **Build Tool:** electron-builder
- **Supported OS:** macOS (ARM64), Windows (x64)

---

## Database Architecture

### Entity Relationship Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│  Quiz   │◄────────┤ TeamQuiz │────────►│  Team   │
└────┬────┘         └────┬─────┘         └─────────┘
     │                   │
     │                   │
     │              ┌────▼────┐
     │              │  Score  │
     │              └────┬────┘
     │                   │
┌────▼────┐              │
│  Round  │◄─────────────┘
└─────────┘
```

### Entities

#### 1. **Quiz** (`backend/src/entities/Quiz.ts`)
Main quiz/game session entity.

**Fields:**
- `id` (PK): Auto-generated ID
- `name`: Quiz title (e.g., "Championship 2025")
- `scaleConversionEnabled`: Enable score normalization
- `standardScale`: Target scale for normalization (e.g., 10)
- `gradientEnabled`: Enable color gradients for rankings
- `creationDate`: Auto-timestamp

**Relationships:**
- Has many `Round` (cascade delete)
- Has many `TeamQuiz` (cascade delete)

**Use Cases:**
- Create new quiz sessions
- Configure scoring rules
- Enable/disable visual features

---

#### 2. **Team** (`backend/src/entities/Team.ts`)
Reusable team entity across multiple quizzes.

**Fields:**
- `id` (PK): Auto-generated ID
- `name`: Team name (e.g., "The Champions")

**Relationships:**
- Has many `TeamQuiz` (participations in different quizzes)

**Architecture Note:**
- Teams are "global" - can participate in multiple quizzes
- Team numbering stored in `TeamQuiz`, NOT here
- Allows same team to have different numbers in different quizzes

---

#### 3. **TeamQuiz** (`backend/src/entities/TeamQuiz.ts`)
Junction table linking teams to quizzes with quiz-specific data.

**Fields:**
- `id` (PK): Auto-generated ID
- `nr`: Team number/position within THIS quiz (indexed)
- `team` (FK): Reference to Team entity
- `quiz` (FK): Reference to Quiz entity

**Relationships:**
- Belongs to one `Team`
- Belongs to one `Quiz`
- Has many `Score` (one per round, cascade delete)

**Indexes:**
- Composite index on `(quiz, team)` - O(log n) lookups
- Individual indexes on `teamId`, `quizId`, `nr`

**Why Junction Table?**
- Enables many-to-many relationship (team ↔ quiz)
- Stores quiz-specific data (team number, scores)
- Same team can have different numbers in different quizzes

**Example:**
```
Team "Champions" in Quiz 1: TeamQuiz(nr=3, team=1, quiz=1)
Team "Champions" in Quiz 2: TeamQuiz(nr=1, team=1, quiz=2)
```

---

#### 4. **Round** (`backend/src/entities/Round.ts`)
Quiz round/question/category.

**Fields:**
- `id` (PK): Auto-generated ID
- `title`: Round name (e.g., "General Knowledge")
- `nr`: Display order number (indexed for sorting)
- `maxScore`: Maximum possible points
- `excludeFromScale`: If true, don't normalize this round's scores
- `quiz` (FK): Parent quiz

**Relationships:**
- Belongs to one `Quiz`
- Has many `Score` (cascade delete)

**Indexes:**
- Index on `nr` - fast sorting (ORDER BY nr ASC)
- Index on `quizId` - fast joins

**Scale Conversion:**
- Normal rounds: `convertedScore = (points / maxScore) * standardScale`
- Excluded rounds: `convertedScore = points` (no conversion)

---

#### 5. **Score** (`backend/src/entities/Score.ts`)
Individual score entry: "Team X scored Y points in Round Z"

**Fields:**
- `id` (PK): Auto-generated ID
- `points`: Raw score value
- `round` (FK): Which round
- `teamQuiz` (FK): Which team (in which quiz)

**Relationships:**
- Belongs to one `Round`
- Belongs to one `TeamQuiz`

**Indexes:**
- Composite index on `(round, teamQuiz)` - scoreboard queries
- Individual indexes on `roundId`, `teamQuizId`

**Scale:**
- 40 teams × 20 rounds = 800 score entries per quiz

---

### Database Optimization

#### Indexes (O(log n) Lookups)
1. **Composite Indexes:**
   - `team_quiz(quiz, team)` - Prevent duplicate team participations
   - `score(round, teamQuiz)` - Fast scoreboard data fetching

2. **Foreign Key Indexes:**
   - All FK columns indexed for fast joins
   - Enables efficient QueryBuilder operations

3. **Sorting Indexes:**
   - `round.nr` - Round ordering
   - `teamQuiz.nr` - Team ordering within quiz

#### Query Optimization
- **Before:** Nested `findOne` with relations - 7 seconds for 40 teams
- **After:** TypeORM QueryBuilder with indexed joins - ~500ms
- **Improvement:** 14x faster (93% reduction)

---

## Backend API

### Base URL: `http://localhost:3000/api`

### Quiz Endpoints (`backend/src/routes/quiz.routes.ts`)

#### `GET /quizzes/:id`
Fetch complete quiz data with all teams, rounds, and scores.

**Query Optimization:**
```typescript
// Uses QueryBuilder instead of nested findOne
.leftJoinAndSelect('quiz.rounds', 'rounds')
.leftJoinAndSelect('quiz.teamQuizzes', 'teamQuizzes')
.leftJoinAndSelect('teamQuizzes.team', 'team')
.leftJoinAndSelect('teamQuizzes.scores', 'scores')
.orderBy('rounds.nr', 'ASC')
.addOrderBy('teamQuizzes.nr', 'ASC')
```

**Response:**
```json
{
  "id": 1,
  "name": "Championship 2025",
  "scaleConversionEnabled": true,
  "standardScale": 10,
  "gradientEnabled": true,
  "rounds": [...],
  "teamQuizzes": [...]
}
```

#### `GET /quizzes`
List all quizzes (sorted by creation date, newest first).

#### `POST /quizzes`
Create new quiz.

**Request Body:**
```json
{
  "name": "My Quiz",
  "scaleConversionEnabled": false,
  "gradientEnabled": true
}
```

#### `PUT /quizzes/:id`
Update quiz settings.

#### `DELETE /quizzes/:id`
Delete quiz (cascades to rounds, team participations, scores).

---

### Team Endpoints (`backend/src/routes/team.routes.ts`)

#### `POST /quizzes/:quizId/teams`
Add team to quiz with auto-incremented number.

**Logic:**
```typescript
// Find highest team number in this quiz
const maxNrTeamQuiz = await teamQuizRepository
  .orderBy('teamQuiz.nr', 'DESC')
  .where('teamQuiz.quizId = :quizId')
  .getOne();

// Assign next sequential number
teamQuiz.nr = maxNrTeamQuiz ? maxNrTeamQuiz.nr + 1 : 1;
```

#### `PUT /quizzes/:quizId/teams/order`
Reorder teams within quiz (swap team numbers).

#### `DELETE /quizzes/:quizId/teams/:teamQuizId`
Remove team from quiz.

---

### Round Endpoints (`backend/src/routes/round.routes.ts`)

#### `POST /quizzes/:quizId/rounds`
Add new round to quiz.

#### `PUT /rounds/:id`
Update round settings.

#### `DELETE /rounds/:id`
Delete round (cascades to scores).

---

### Score Endpoints (`backend/src/routes/score.routes.ts`)

#### `POST /scores`
Create or update score.

**Request Body:**
```json
{
  "roundId": 1,
  "teamQuizId": 5,
  "points": 8
}
```

**Logic:**
- Checks if score already exists (round + teamQuiz combination)
- If exists: updates points
- If not: creates new score entry

---

## Frontend Architecture

### State Management

#### QuizContext (`frontend/src/context/QuizContext.tsx`)
Centralized quiz data management to eliminate duplicate API calls.

**Problem Solved:**
- Before: Each page fetched quiz data independently (2+ API calls per navigation)
- After: Single fetch cached in context (1 API call, shared across pages)

**Features:**
```typescript
interface QuizContextType {
  quiz: Quiz | null;          // Current quiz data
  loading: boolean;           // Loading state
  error: string | null;       // Error message
  refreshQuiz: () => void;    // Manual refresh after mutations
}
```

**Deduplication:**
```typescript
// Prevents duplicate calls in React.StrictMode
const loadingRef = useRef(false);
const currentIdRef = useRef<string | null>(null);

if (loadingRef.current && currentIdRef.current === id) return; // Skip duplicate
```

---

### Routing (`frontend/src/App.tsx`)

```typescript
<QuizProvider>  // Wraps entire app
  <Routes>
    <Route path="/" element={<StartQuiz />} />
    <Route path="/create" element={<CreateQuiz />} />
    <Route path="/load" element={<LoadQuiz />} />
    <Route path="/quiz/:id" element={<QuizManagement />} />
    <Route path="/quiz/:id/scoreboard" element={<Scoreboard />} />
    <Route path="/quiz/:id/chart" element={<ChartView />} />
    <Route path="/quiz/:id/add-score" element={<AddScore />} />
  </Routes>
</QuizProvider>
```

---

### Pages

#### 1. **Scoreboard** (`frontend/src/pages/Scoreboard.tsx`)
Main score display with full-width table.

**Features:**
- Real-time score display
- Color-coded rankings (gradient green → red)
- All rounds visible without horizontal scrolling
- Sticky header for large datasets

**Performance Optimizations:**
```typescript
// Pre-calculate team totals (O(n) instead of O(n×m))
const teamTotalsMap = useMemo(() => {
  // Map: teamQuizId → total score
}, [quiz]);

// Pre-calculate ranks (O(n log n) sort once)
const teamRanksMap = useMemo(() => {
  // Map: teamQuizId → rank (1, 2, 3, ...)
}, [teamTotals]);

// Pre-calculate score lookups (O(1) instead of O(n))
const teamScoresMap = useMemo(() => {
  // Map: `${teamQuizId}-${roundId}` → score
}, [quiz]);
```

**Result:**
- Before: 800 `Array.find()` calls for 40 teams × 20 rounds
- After: 800 Map lookups (O(1) each)
- **85% faster rendering**

---

#### 2. **ChartView** (`frontend/src/pages/ChartView.tsx`)
Bar chart visualization of team totals.

**Features:**
- Gradient-colored bars (rankings)
- Two-tier labels: Large team numbers + rotated team names
- Custom Chart.js plugin for label positioning
- Max score reference line

**Custom Label Plugin:**
```typescript
const teamNamePlugin = useMemo(() => ({
  id: 'teamNames',
  afterDraw: (chart: any) => {
    // Draw team names at 45° angle below team numbers
    sortedTeams.forEach((team, index) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4); // 45° rotation
      ctx.fillText(team.teamQuiz.team.name, 0, 0);
      ctx.restore();
    });
  }
}), [sortedTeams, isDarkMode]);
```

---

#### 3. **AddScore** (`frontend/src/pages/AddScore.tsx`)
Score entry interface.

**Features:**
- Dropdown round selection
- Table of all teams with input fields
- Real-time validation (max score)
- Bulk save operation

---

#### 4. **QuizManagement** (`frontend/src/pages/QuizManagement.tsx`)
Quiz configuration and team/round management.

**Features:**
- Add/remove teams
- Reorder teams (drag-and-drop style with up/down buttons)
- Add/remove rounds
- Update quiz settings

---

#### 5. **CreateQuiz** (`frontend/src/pages/CreateQuiz.tsx`)
New quiz creation wizard.

---

#### 6. **LoadQuiz** (`frontend/src/pages/LoadQuiz.tsx`)
Quiz selection from database.

---

### Type Definitions (`frontend/src/types.ts`)

```typescript
interface Quiz {
  id: number;
  name: string;
  scaleConversionEnabled: boolean;
  standardScale?: number;
  gradientEnabled: boolean;
  creationDate: string;
  rounds: Round[];
  teamQuizzes: TeamQuiz[];
}

interface TeamQuiz {
  id: number;
  nr: number;              // Quiz-specific team number
  team: Team;
  scores: Score[];
}

interface Team {
  id: number;
  name: string;
  // Note: 'nr' removed - now in TeamQuiz
}

interface Round {
  id: number;
  title: string;
  nr: number;
  maxScore: number;
  excludeFromScale: boolean;
}

interface Score {
  id: number;
  points: number;
  round: Round;
}
```

---

## Key Features

### 1. Score Scale Conversion
Normalizes scores from different round scales to a standard scale.

**Example:**
- Round 1: Max 20 points → Team scores 16
- Round 2: Max 10 points → Team scores 8
- Standard scale: 10 points

**Conversion:**
- Round 1: `(16 / 20) × 10 = 8 points`
- Round 2: `(8 / 10) × 10 = 8 points`
- Total: 16 points (normalized)

**Without conversion:**
- Total: 24 points (raw, unfair comparison)

**Exclusions:**
- Bonus rounds with `excludeFromScale=true` count full value

---

### 2. Color Gradients
Visual ranking indicator from green (1st) to red (last).

**Algorithm:**
```typescript
// Position in sorted list (0 = 1st place, 1 = last place)
const position = index / (totalTeams - 1);

// Green → Yellow → Red gradient
if (position < 0.5) {
  // First half: Green (76,175,80) → Yellow (255,235,59)
  const t = position * 2;
  r = 76 + (255 - 76) * t;
  g = 175 + (235 - 175) * t;
  b = 80 + (59 - 80) * t;
} else {
  // Second half: Yellow (255,235,59) → Red (255,82,82)
  const t = (position - 0.5) * 2;
  r = 255;
  g = 235 - (235 - 82) * t;
  b = 59 - (59 - 82) * t;
}
```

---

### 3. Lazy Loading
Code splitting to reduce initial bundle size.

**Implementation:**
```typescript
// Dynamic imports with React.lazy()
const Scoreboard = lazy(() => import('./pages/Scoreboard'));
const ChartView = lazy(() => import('./pages/ChartView'));

// Wrapped in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Scoreboard />
</Suspense>
```

**Result:**
- 60% smaller initial bundle
- 81% faster first page load
- Pages load on-demand as needed

---

## Performance Optimizations

### Frontend React Optimizations

1. **useMemo** - Memoize expensive calculations
   ```typescript
   const teamTotals = useMemo(() => calculateTotals(quiz), [quiz]);
   ```

2. **useCallback** - Memoize function references
   ```typescript
   const handleScoreChange = useCallback((teamId, value) => {
     // ... expensive logic
   }, [quiz]);
   ```

3. **React.memo** - Component-level memoization
   ```typescript
   export default memo(Scoreboard);
   ```

4. **Map Lookups** - O(1) instead of Array.find() O(n)
   ```typescript
   const scoreMap = new Map();  // O(1) lookup
   // vs
   const score = scores.find(s => s.id === id);  // O(n) search
   ```

### Backend Database Optimizations

1. **Indexes** - O(log n) lookups
   - Composite indexes on common query patterns
   - Foreign key indexes for joins
   - Sorting indexes (nr fields)

2. **QueryBuilder** - Single optimized query
   ```typescript
   // Before: Multiple queries, 7 seconds
   const quiz = await findOne({ relations: ['rounds', 'teams', ...] });
   
   // After: Single query, 500ms (14x faster)
   const quiz = await createQueryBuilder('quiz')
     .leftJoinAndSelect(...)
     .where(...)
     .orderBy(...)
     .getOne();
   ```

3. **Pre-sorted Results** - Sort in database
   ```typescript
   .orderBy('rounds.nr', 'ASC')
   .addOrderBy('teamQuizzes.nr', 'ASC')
   // Frontend receives pre-sorted data, no client-side sorting needed
   ```

---

## File Structure

```
Scorebord/
├── backend/
│   ├── src/
│   │   ├── entities/          # TypeORM entities (database models)
│   │   │   ├── Team.ts        # Reusable team entity
│   │   │   ├── Quiz.ts        # Quiz/game session entity
│   │   │   ├── TeamQuiz.ts    # Junction table (team ↔ quiz)
│   │   │   ├── Round.ts       # Quiz round/question entity
│   │   │   └── Score.ts       # Individual score entry
│   │   ├── routes/            # API endpoint handlers
│   │   │   ├── quiz.routes.ts # Quiz CRUD operations
│   │   │   ├── team.routes.ts # Team management
│   │   │   ├── round.routes.ts# Round management
│   │   │   └── score.routes.ts# Score entry/update
│   │   ├── data-source.ts     # TypeORM database configuration
│   │   ├── index.ts           # Express server setup
│   │   └── seed-mock-data.ts  # Generate sample 40-team quiz
│   ├── quiz.sqlite            # SQLite database file (gitignored)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # React page components
│   │   │   ├── Scoreboard.tsx # Main score display (full-width table)
│   │   │   ├── ChartView.tsx  # Bar chart visualization
│   │   │   ├── AddScore.tsx   # Score entry interface
│   │   │   ├── QuizManagement.tsx # Quiz config/team/round management
│   │   │   ├── CreateQuiz.tsx # New quiz wizard
│   │   │   ├── LoadQuiz.tsx   # Quiz selection
│   │   │   └── StartQuiz.tsx  # Landing page
│   │   ├── context/
│   │   │   └── QuizContext.tsx# Centralized quiz state (eliminates duplicate fetches)
│   │   ├── services/
│   │   │   └── api.ts         # Axios API client
│   │   ├── components/
│   │   │   └── ErrorBoundary.tsx # Error handling wrapper
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── App.tsx            # Main app component with routing
│   │   └── main.tsx           # React app entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts         # Vite build configuration
├── electron/
│   ├── main.js                # Electron main process (window management)
│   ├── preload.js             # Secure context bridge
│   ├── package.json
│   └── dist/                  # Built applications (gitignored)
│       ├── mac-arm64/         # macOS build
│       └── win-unpacked/      # Windows build
├── package.json               # Root workspace scripts
├── README.md                  # User documentation
├── ARCHITECTURE.md            # This file - complete technical documentation
├── PERFORMANCE_OPTIMIZATION.md # Performance improvements log
├── DATA_FETCHING_OPTIMIZATION.md # QuizContext documentation
├── CHART_OPTIMIZATION.md      # ChartView custom plugin documentation
└── NAVIGATION_PERFORMANCE.md  # Lazy loading implementation
```

---

## Development Workflow

### Setup
```bash
npm run install:all    # Install all dependencies
```

### Development
```bash
npm run dev            # Start both backend and frontend
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### Build Electron Apps
```bash
npm run build:electron:mac    # macOS (ARM64)
npm run build:electron:win    # Windows (x64)
```

### Seed Sample Data
```bash
cd backend
npx ts-node src/seed-mock-data.ts  # Creates 40-team, 20-round quiz
```

---

## Key Architectural Decisions

### 1. Why SQLite?
- ✅ Zero configuration (no external database server)
- ✅ Embedded in Electron app (portable)
- ✅ Fast enough for quiz scales (100s of teams)
- ✅ ACID compliant (data integrity)
- ❌ Not suitable for: Multi-user concurrent writes, server deployments

### 2. Why Junction Table (TeamQuiz)?
- ✅ Enables team reuse across quizzes
- ✅ Quiz-specific data (team numbers) properly isolated
- ✅ Many-to-many relationship support
- ✅ Same team can have different numbers in different quizzes

### 3. Why React Context instead of Redux?
- ✅ Simpler setup for single-entity state
- ✅ Built-in to React (no external dependency)
- ✅ Sufficient for app scale (not dozens of entities)
- ❌ Redux would be overkill for this use case

### 4. Why Custom Chart.js Plugin?
- ✅ Full control over label positioning
- ✅ Chart.js multi-line labels insufficient for 40+ teams
- ✅ Can rotate labels without overlap
- ✅ Memoized for performance

---

## Future Improvements

### Potential Features
- [ ] WebSocket support for live multi-client updates
- [ ] Export to PDF/Excel
- [ ] Historical quiz statistics
- [ ] Team profiles with logos
- [ ] Sound effects for score updates
- [ ] Mobile responsive design (currently desktop-focused)

### Performance Enhancements
- [ ] Virtual scrolling for 100+ teams
- [ ] Service worker caching
- [ ] Database pagination for quiz list
- [ ] Image optimization for team logos

---

## License

Proprietary - De Spooklinde Quiz Championship

---

**For Questions:** See README.md for user guide and QUICK_START.md for setup instructions.
