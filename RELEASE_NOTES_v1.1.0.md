# Release Notes - v1.1.0

**Release Date:** October 23, 2025

## 🎉 Enhanced Chart View Release

Version 1.1.0 brings significant improvements to the Chart View, making it more informative, responsive, and print-friendly.

---

## ✨ New Features

### 📊 Team Score Display on Chart
- Total scores now displayed prominently between team numbers and team names
- Scores shown as whole numbers (rounded) for cleaner presentation
- Clear visual hierarchy: Team # → Score → Team Name

### 🖨️ Print Functionality
- New print button in the app bar (visible only on Chart view)
- Optimized print layout with landscape orientation
- Automatic removal of navigation elements when printing
- Clean, professional print output suitable for distribution

### 📱 Responsive Design
- Chart now fully responsive across all device sizes
- Optimized layouts for mobile (< 600px), tablet (600-960px), and desktop (> 960px)
- Font sizes automatically scale based on screen size and team count
- Adaptive spacing and padding for optimal viewing on any device
- Mobile-optimized: 70% font scaling, compact spacing
- Tablet-optimized: 85% font scaling, balanced layout
- Desktop: Full size with maximum readability

---

## 🐛 Bug Fixes

### Team Names Visibility in Light Mode
- **Fixed:** Critical bug where team names were invisible in light mode
- **Root Cause:** React useMemo was caching stale closure values for isDarkMode
- **Solution:** Removed useMemo wrapper and added Chart key prop to force recreation on theme change
- Team names now correctly display in black (light mode) or white (dark mode)

---

## 🎨 UI/UX Improvements

### Enhanced Readability
- Increased font sizes for team numbers: 16-22px (responsive)
- Increased font sizes for team names: 13-16px (responsive)
- Better spacing between chart elements
- Increased chart area padding to prevent label cutoff
- Right padding increased to 70px (desktop) / 30px (mobile)

### Better Layout
- More vertical space for rotated team names (65px offset)
- Score positioned optimally between number and name (38px offset)
- Team name section height increased for better visibility
- Responsive padding adjustments prevent overlap on all screen sizes

---

## 🔧 Technical Improvements

### Performance & Architecture
- Chart component now properly responds to theme changes
- Force chart recreation on dark/light mode toggle using React key prop
- Fixed stale closure bug in Chart.js plugin
- Optimized rendering with proper dependency management

### Print Optimization
- Landscape page orientation with 0.5cm margins
- Hidden navigation elements during print
- Auto-sized canvas for perfect fit on printed page
- Page break prevention for continuous chart display
- Clean CSS with minimal print-specific styles

### Code Quality
- Removed debug console.log statements (in production)
- Improved component memoization
- Better responsive breakpoint handling
- Cleaner separation of concerns

---

## 📋 Full Changelog

### Added
- Print button with icon next to settings button (Chart view only)
- Total score display on chart (between team number and name)
- Responsive font size calculations based on screen width
- Responsive spacing and padding adjustments
- Print-optimized CSS in index.html
- Chart key prop for theme change handling

### Changed
- Font sizes increased for better readability (team numbers and names)
- Chart container now fully responsive with breakpoints
- Team name positioning adjusted for better spacing
- Score display rounds to whole numbers (no decimals)
- Chart padding increased for better layout
- Paper component height now responsive to screen size

### Fixed
- Team names invisible in light mode (stale closure bug)
- Chart not updating when switching dark/light mode
- Team names and scores overlapping
- Chart cutoff on smaller screens
- Print layout issues (from previous attempts)

### Removed
- useMemo wrapper from teamNamePlugin (caused stale closure)
- Developer Tools toggle (simplified to menu item)
- Unnecessary debug logging

---

## 🚀 Upgrade Instructions

1. Pull the latest changes from the repository
2. No database migrations required
3. No configuration changes needed
4. Clear browser cache for best results
5. Test chart view on different screen sizes
6. Test print functionality from Chart view

---

## 📱 Testing Recommendations

- **Desktop:** Test chart rendering at various window sizes
- **Mobile:** Test on actual mobile devices or browser dev tools
- **Tablet:** Verify layout on iPad or similar devices
- **Print:** Test print preview in different browsers
- **Dark Mode:** Toggle between light and dark modes
- **Team Counts:** Test with 5, 10, 20, 30+ teams

---

## 🙏 Acknowledgments

Thanks to thorough testing and feedback that helped identify the stale closure bug and improve the overall chart experience.

---

## 📞 Support

For issues or questions about this release:
- GitHub Issues: https://github.com/KristijnS/quiz-scoreboard/issues
- Check existing documentation in the repository

---

**Previous Release:** [v1.0.0](./RELEASE_NOTES_v1.0.0.md)
