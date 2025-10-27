# Release Notes — v1.3.0

Release date: 2025-10-27

Summary
-------
This release introduces the long-requested Ex Aequo (tiebreaker) feature and several UX, data-refresh and ranking improvements. Electron/macOS binaries were produced for v1.3.0 and are available in `electron/dist/` on the build machine (not committed into git by default).

Highlights
----------
- Feature: Ex Aequo tiebreaker
  - A dedicated Ex Aequo round can be enabled per quiz. It does not count toward teams' total scores.
  - When enabled, the quiz stores a target value (Ex Aequo value). If teams are tied on total score, the team whose Ex Aequo answer is closest to that target wins the tie.
  - Backend: `Quiz` entity now has `exAequoEnabled: boolean` and `exAequoValue?: number`. `Round` entity has `isExAequo: boolean` to flag the special round.
  - Frontend: UI to enable/disable Ex Aequo in `QuizManagement`, plus a Balance icon and numeric target field when enabled.

- UX: Ex Aequo round locked as last round
  - The Ex Aequo round is always displayed last and cannot be reordered.
  - Creation of new rounds inserts them before the Ex Aequo round.
  - The Ex Aequo round cannot be edited (name or max score) via the round edit pencil; it can only be removed by toggling the Ex Aequo checkbox in quiz settings.

- Ranking and scoring
  - All ranking views (Scoreboard, Leaderboard, Top5, ChartView) exclude the Ex Aequo round from total calculations.
  - Tiebreaker logic implemented: if `quiz.exAequoEnabled` and `quiz.exAequoValue` are set, tied teams are ordered by the smallest absolute difference between their Ex Aequo answer and the target value.

- Data refresh and stability
  - Improved data refresh on navigation: score data refreshes when navigating to the scoreboard/leaderboard pages to avoid requiring a manual browser reload.
  - Fixed edge cases for fewer than 5 teams in Top5/Leaderboard (dynamic sizing and reveal logic).

- Styling and minor UI fixes
  - Leaderboard button styling adjusted to match other navigation buttons.
  - Icon: Ex Aequo setting uses a balance/tie icon for clarity.

Build & Artifacts
-----------------
- The repo package versions have been bumped to `1.3.0` for root, backend, frontend and electron packages.
- Electron/macOS artifacts were produced by the `build:electron:mac` task and can be found locally at:

  - `electron/dist/Quiz Scoreboard-1.3.0-arm64.dmg`
  - `electron/dist/Quiz Scoreboard-1.3.0-arm64-mac.zip`

  (Note: the `electron/dist/` folder is ignored by git via `.gitignore` and therefore not committed into the repository. Upload these files to a GitHub Release or artifact store instead of committing large binaries.)

Upgrade notes
-------------
- Database: The new `Round.isExAequo` and `Quiz.exAequo*` fields are nullable/defaulted; if your backend uses TypeORM synchronize=true the fields will be created automatically on startup. If you manage schema migrations manually, add equivalent migration scripts.

- Frontend: No config changes expected. If you use caching proxies, clear browser cache after updating to see UI changes.

How to reproduce locally
------------------------
1. Pull the `main` branch at the v1.3.0 tag:

   git fetch --tags && git checkout v1.3.0

2. Build the app and Electron mac artifact (mac machine required):

   npm run install:all
   npm run build:electron:mac

3. Built artifacts will be available in `electron/dist/`.

Notes and follow-ups
--------------------
- I did not force-add the generated binaries to git (the `electron/dist` path is ignored by `.gitignore`). Recommended distribution path: create a GitHub Release for tag `v1.3.0` and upload the DMG/ZIP there.
- Suggested follow-up: add a small CI workflow to produce and publish the Electron artifacts automatically (recommended: GitHub Actions + upload to releases or S3).

Changelog (technical)
---------------------
- backend: add `exAequoEnabled`, `exAequoValue` to `Quiz` entity; add `isExAequo` to `Round` entity; update quiz/round routes to accept new fields.
- frontend: add Ex Aequo UI to `QuizManagement`, update ranking logic in `Scoreboard`, `Leaderboard`, `Top5`, `ChartView` to exclude Ex Aequo and apply tiebreakers; disable editing/moving of Ex Aequo round in UI.
- other: bump package versions to 1.3.0; built Electron/mac artifacts.

Acknowledgements
----------------
Thanks for the detailed feedback during the Ex Aequo feature implementation — it helped catch edge cases (refreshing data, top5 reveal behavior, and UI feedback while locking the Ex Aequo round).

— The Build Bot
