# Release Notes - Version 1.2.0 "Electric Eggplant"

**Release Date:** October 23, 2025

## 🎉 New Features

### Team Exclusion Feature
Added the ability to **exclude teams from scoring** when they don't show up, while keeping them in quiz records for reference.

#### Key Features:
- **Toggle Switch**: Active/Inactive switch in QuizManagement team list
- **Visual Feedback**: Excluded teams appear dimmed (50% opacity) with tooltip
- **Hidden from Scoring**: Excluded teams are filtered from:
  - Scoreboard (all rankings and calculations)
  - Add Score page (score entry)
  - Chart View (bar chart display)
  - Top 5 presentation page
- **Preserved in Management**: Teams remain visible in QuizManagement with toggle control
- **Database Support**: New `excluded` field in TeamQuiz entity with indexing for performance

### Top 5 Presentation Page
Added a brand new **Top 5** presentation page designed for displaying quiz results during live events with dramatic flair and visual hierarchy.

#### Key Features:
- **Progressive Reveal Animation**: Click to reveal teams one by one from 5th place to 1st place, building suspense
- **Visual Hierarchy**: Cards sized by placement to emphasize winners
  - 1st Place: Largest card (280-320px) with gold trophy icon and pulse animation
  - 2nd Place: Silver medal icon with distinctive sizing (260-300px)
  - 3rd Place: Bronze medal icon (230-270px)
  - 4th & 5th Place: Standard size cards (200-240px)
- **Last Place Recognition**: Special red-themed card with cake icon appears on final click
  - Shows the team in last place with humorous recognition
  - Positioned to the right of top 5 with clear separation
- **Other Teams Display**: Compact grid view for all remaining teams (6th place onwards)
  - Optimized to display up to 60 teams without scrolling on full screen
  - Responsive grid layout with auto-fill columns
  - Each card shows: rank, team name, team number, and score
  - Hover effects for interactivity
- **Fully Responsive**: Adapts to different screen sizes
  - Full screen: All elements visible without scrolling
  - Small screens: Entire page scrollable to access all content
  - Grid columns adjust automatically based on available width

#### Navigation:
Access the Top 5 page from the Quiz Management page via the new "Top 5" button.

## 🐛 Bug Fixes

### Grid Responsiveness
- Simplified the "Other Teams" grid implementation using native CSS Grid auto-fill
- Removed complex column calculation logic that was causing display issues
- Fixed issue where grid always showed 5 columns regardless of screen size
- Improved scrolling behavior on small screens

### Layout Improvements
- Fixed centering of top 5 cards and last place card as a unified group
- Ensured proper spacing between 5th place and last place cards
- Made entire page scrollable to prevent content being cut off on smaller screens

### QuizManagement UI Improvements
- **Column Width Optimization**: Reduced Active column width from 10% to 80px fixed, increased Team Name column space
- **New Team Row**: Fixed alignment to match 4-column structure (Nr, Active, Team Name, Actions)
- **Round Exclude Checkbox**: Enabled functional excludeFromScale checkbox for new rounds during creation

## 🎨 Visual Enhancements

- Trophy icon for 1st place with pulse animation
- Medal icons for 2nd (silver) and 3rd (bronze) place with pulse animations
- Cake icon for last place with flicker animation
- Color-coded cards matching gradient theme (when enabled)
- Progressive size scaling for visual impact
- Smooth fade-in animations for all reveals
- Hover effects on team cards for better interactivity

## 📋 Technical Changes

- Added Top 5 route: `/quiz/:id/top5`
- Implemented click-based progressive reveal system (6 clicks total)
- Optimized card layouts for various screen sizes
- Added ordinal number formatting (1st, 2nd, 3rd, 21st, etc.)
- Improved flexbox and grid layouts for better responsiveness

## 🚀 How to Use

1. Navigate to Quiz Management page
2. Select your active quiz
3. Click the "Top 5" button
4. Click anywhere on the screen to progressively reveal:
   - Click 1-5: Reveal 5th → 4th → 3rd → 2nd → 1st place
   - Click 6: Reveal last place team and all other teams (6th onwards)

## 📝 Notes

- The Top 5 page is designed for presentation during quiz events
- Works best in full screen mode for dramatic effect
- Supports quizzes with any number of teams (minimum 1 team required)
- Last place card only appears when there are 6+ teams

---

**Previous Version:** 1.1.0  
**Current Version:** 1.2.0
