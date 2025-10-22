# Git Repository Guide

## Repository Status

✅ **Git repository successfully initialized!**

- **Initial Commit:** `7eda90e`
- **Branch:** `main`
- **Files Tracked:** 70 files
- **Total Lines:** 19,145+ lines of code

---

## What's Included

### Source Code
- ✅ Backend (TypeScript + Express + TypeORM)
- ✅ Frontend (React + TypeScript + Material-UI + Chart.js)
- ✅ Electron desktop app configuration
- ✅ All TypeScript configuration files
- ✅ Package configuration files

### Documentation
- ✅ README files (QUICK_START, SETUP, WINDOWS_GUIDE, etc.)
- ✅ Optimization guides (CHART_OPTIMIZATION, PROJECTOR_OPTIMIZATION)
- ✅ Code review summary
- ✅ Version manifest

### Assets
- ✅ Application icons (all formats)
- ✅ Scripts (setup, cleanup, verification)

### Excluded (via .gitignore)
- ❌ `node_modules/` directories
- ❌ Build outputs (`dist/`, `build/`)
- ❌ Database files (`*.sqlite`, `*.db`)
- ❌ Electron distributables (`*.exe`, `*.dmg`, `*.zip`)
- ❌ IDE configuration (`.vscode/`, `.idea/`)
- ❌ OS files (`.DS_Store`, `Thumbs.db`)
- ❌ Log files

---

## Common Git Commands

### Check Repository Status
```bash
git status
```

### View Commit History
```bash
git log --oneline
```

### Create a New Commit
```bash
# Stage all changes
git add .

# Or stage specific files
git add frontend/src/pages/ChartView.tsx

# Commit with message
git commit -m "Your commit message here"
```

### View Changes
```bash
# See what files changed
git status

# See detailed changes
git diff

# See changes for a specific file
git diff frontend/src/pages/ChartView.tsx
```

### Undo Changes
```bash
# Discard changes to a file (revert to last commit)
git checkout -- <file>

# Unstage a file (keep changes, remove from staging)
git reset HEAD <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - CAREFUL!
git reset --hard HEAD~1
```

### Branches
```bash
# Create a new branch
git branch feature/my-feature

# Switch to a branch
git checkout feature/my-feature

# Create and switch in one command
git checkout -b feature/my-feature

# List all branches
git branch -a

# Merge a branch into current branch
git merge feature/my-feature

# Delete a branch
git branch -d feature/my-feature
```

### Tags (for Releases)
```bash
# Create a tag for a release
git tag -a v1.0.0 -m "Release version 1.0.0"

# List all tags
git tag

# Push tags to remote
git push origin --tags
```

---

## Recommended Workflow

### 1. **Before Making Changes**
```bash
# Check current status
git status

# Optional: Create a feature branch
git checkout -b feature/new-optimization
```

### 2. **After Making Changes**
```bash
# See what changed
git status
git diff

# Stage your changes
git add .

# Commit with descriptive message
git commit -m "Add performance optimization for large team lists"
```

### 3. **Semantic Commit Messages**
Use clear, descriptive commit messages:

**Good examples:**
- `Fix: Resolve scaling bug in ChartView for excluded rounds`
- `Feature: Add projector-optimized font sizes`
- `Refactor: Extract wrapLabel function for reusability`
- `Docs: Update QUICK_START with new installation steps`
- `Chore: Update dependencies to latest versions`

**Bad examples:**
- `fix stuff`
- `changes`
- `update`

---

## Setting Up Remote Repository (GitHub/GitLab)

### If you want to push to GitHub:

1. **Create a repository on GitHub** (don't initialize with README)

2. **Add remote and push:**
```bash
# Add remote repository
git remote add origin https://github.com/your-username/quiz-scoreboard.git

# Push to remote
git push -u origin main
```

### If you want to push to GitLab:
```bash
git remote add origin https://gitlab.com/your-username/quiz-scoreboard.git
git push -u origin main
```

---

## Useful Git Aliases (Optional)

Add these to your `~/.gitconfig` for shortcuts:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all --decorate
```

Then use:
- `git st` instead of `git status`
- `git co` instead of `git checkout`
- `git visual` for a nice commit graph

---

## Current Repository Info

**Repository Path:**
```
/Users/krso/Documents/Personal/De Spooklinde/Scorebord
```

**Git Configuration (Local):**
```
user.name: krso
user.email: krso@local.dev
```

**Initial Commit Hash:** `7eda90e`

---

## What to Commit

### ✅ Always Commit:
- Source code files (`.ts`, `.tsx`, `.js`, etc.)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`.md` files)
- Scripts (`.sh` files)
- Static assets (icons, images used in app)

### ❌ Never Commit:
- `node_modules/` folders
- Build outputs (`dist/`, `build/`)
- Database files (they contain user data)
- `.env` files (may contain secrets)
- IDE-specific files
- OS-specific files (`.DS_Store`)
- Large binary files (distributables like `.exe`, `.dmg`)

---

## Backup Strategy

### Local Backups
Your Git repository itself is a backup of your code history. Each commit is a snapshot.

### Remote Backups (Recommended)
Push to a remote service:
- **GitHub** (free for public/private repos)
- **GitLab** (free for public/private repos)
- **Bitbucket** (free for small teams)
- **Self-hosted** (Gitea, GitLab CE)

---

## Emergency Recovery

### Lost uncommitted changes?
```bash
# If you accidentally reset, check reflog
git reflog

# Restore from a previous state
git reset --hard HEAD@{1}
```

### Need to recover deleted branch?
```bash
# Find the commit hash
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

---

## Next Steps

1. ✅ Git repository is initialized and ready
2. 🔄 Make changes to your code
3. 💾 Commit regularly with clear messages
4. 🚀 (Optional) Push to a remote repository for backup/collaboration
5. 🏷️ Tag releases when you build distributables

**Happy coding! 🎉**
