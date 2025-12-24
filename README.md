# TaskPro

> A premium, gamified task tracker rebuilt as a modern React + TypeScript app.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active--rebuild-brightgreen.svg)

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Redux Toolkit (state)
- Dexie (IndexedDB persistence)
- date-fns + zod (dates + validation)

## Current scope (v3)

- Tasks: create/edit/delete, search, status filters
- Gamification: XP, levels, streaks, badges, weekly challenge
- Local-first persistence (no backend)

## 🚀 Quick start (v3)

### Prerequisites

- Node.js 18+

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build & preview

```bash
npm run build
npm run preview
```

## Notes

- Dark-only UI (by design)
- Local-first: data is stored in IndexedDB via Dexie
- No backend / no auth

## Legacy v2 docs

The previous vanilla JS implementation is archived in [docs/legacy-v2.md](docs/legacy-v2.md).
├── styles.css                 # Design system, responsive utilities, animations
├── src/
│   ├── main.js                # Entry: init + wiring (no business logic)
│   ├── data/
│   │   └── storage.js         # IndexedDB persistence + schema meta + sanitizers
│   ├── models/
│   │   ├── task.js            # Task creation, parsing, recurrence helpers
│   │   └── gamification.js    # XP rules, levels, streaks, badges (testable)
│   ├── ui/
│   │   ├── state/
│   │   │   ├── store.js       # Pure state container
│   │   │   ├── actions.js     # Mutations (no DOM/storage)
│   │   │   └── selectors.js   # Derived data helpers (filtering/sorting)
│   │   ├── state.js           # Shim re-export (backward compatible)
│   │   ├── renderers.js       # DOM rendering for list/board/calendar/analytics
│   │   ├── animations.js      # XP bubbles + level-up confetti
│   │   └── onboarding.js      # First-time guided tooltips (focus-trapped)
│   └── utils/
│       ├── dates.js           # Date normalization utilities
│       ├── dom.js             # DOM helpers + focus trap
│       ├── toast.js           # Toast notification system with actions
│       ├── debounce.js        # Performance utility for search
│       ├── loading.js         # Loading state management
│       └── shortcuts.js       # Keyboard shortcuts system
└── README.md                  # This file
```

### Key Engineering Choices

- ✅ **Strict ES Modules** across all files (tree-shakeable)
- ✅ **State split** (store/actions/selectors) for clarity and testability
- ✅ **Async persistence** with schema versioning + sanitizers
- ✅ **Gamification hardening** (explicit XP constants, normalized dates, guards)
- ✅ **Inline editing & undo** with non-blocking toasts
- ✅ **Batch actions** (selection mode) without side effects in state layer
- ✅ **Accessibility** (ARIA labels, focus trap, keyboard navigation)
- ✅ **Performance** (debounced search, loading indicators, efficient re-renders)
- ✅ **Visual polish** (SVG icons, micro-interactions, XP animations)
- ✅ **Unit tests** for selectors and gamification rules (Node.js test runner)
- ✅ **Responsive design** including compact density and collapsed sidebar
- ✅ **PWA ready** with manifest, service worker, and offline support
- ✅ **Production builds** with esbuild for ~70% size reduction
- ✅ **CSS Layers** for organized cascade control

### Animation System

**XP Gain Visualization:**
- Floating bubble with `+XP` appears at task element
- Lightweight CSS animation (`@keyframes xpFloat`)
- Auto-removes after animation completes

**Level-Up Celebration:**
- Optional confetti burst via `canvas-confetti` CDN
- Lazy-loaded on first level-up (performance)
- Can be disabled by commenting out import

**Performance Considerations:**
- CSS animations use `transform` and `opacity` (GPU-accelerated)
- `will-change` hint for smooth button interactions
- Debounced search (250ms) reduces re-renders
- Loading overlay prevents UI jank during async operations

## 📊 Data Model

Each task object contains:

```javascript
{
  id: number,              // Unique timestamp-based ID
  name: string,            // Task title (required)
  description: string,     // Detailed notes (optional)
  priority: string,        // 'Low' | 'Medium' | 'High'
  project: string,         // 'work' | 'personal' | 'learning'
  status: string,          // 'todo' | 'in_progress' | 'done'
  dueDate: string,         // ISO date format (YYYY-MM-DD)
  recurrence: string,      // 'none' | 'daily' | 'weekly' | 'monthly'
  tags: array,             // Array of tag strings
  completed: boolean,      // Completion status
  order: number,           // Manual ordering value
  createdAt: string        // ISO datetime of creation
}
```

Gamification state:

```javascript
{
  xp: number,              // Total experience points
   level: number,           // Current level (explicit XP_PER_LEVEL)
  streak: number,          // Current daily streak
  lastCompletionDate: string, // Last task completion date
  badges: array,           // Unlocked badge IDs
  weeklyChallenge: {       // Weekly quest
   target: number,        // High-priority tasks to complete (capped)
    progress: number,      // Current progress
    weekStart: string      // Week start date
  }
   }
```

## 🛠️ Testing

### Run Unit Tests

```bash
# Test selectors
node --test src/ui/state/selectors.test.js

# Test gamification
node --test src/models/gamification.test.js

# Run all tests
node --test src/**/*.test.js
```

Tests cover:
- Filtering logic (project, view, search)
- Sorting algorithms (priority, date, name, manual)
- XP calculation and level-up thresholds
- Streak mechanics and badge unlocking
- Weekly challenge progression

## 🧭 Why Vanilla JS

- Demonstrates mastery of core web platform without framework overhead
- Easier to reason about for small teams and educational purposes
- Showcases clean module boundaries and accessibility considerations
- No build step = instant development feedback
- Smaller bundle size and faster load times
- ✅ **Completed:** State architecture split, gamification animations, unit tests, PWA support, production builds
- 🔄 **In Progress:** Enhanced analytics with trend visualization
- 📋 **Planned:** Cloud sync with encryption (optional)
- ✅ **Completed:** State architecture split, gamification animations, unit tests
- 🔄 **In Progress:** Enhanced analytics with trend visualization
- 📋 **Planned:** Cloud sync with encryption (optional), mobile PWA with offline support

## 🎨 Color Palette

| Element    | Light Mode | Dark Mode |
| ---------- | ---------- | --------- |
| Primary    | #2563eb    | #3b82f6   |
| Success    | #10b981    | #10b981   |
| Warning    | #f59e0b    | #fbbf24   |
| Danger     | #ef4444    | #f87171   |
| Background | #f8fafc    | #0f172a   |
| Text       | #0f172a    | #f1f5f9   |

## 🔐 Privacy & Security

- **100% Client-Side** - All data stays on your device
- **No Server** - No data is ever sent to any server
- **No Tracking** - No analytics, cookies, or tracking
- **Open Source** - Code is transparent and verifiable
- **HTTPS Ready** - Can be deployed over HTTPS

## 📈 Performance

- **First Load** - ~50KB (minified bundle)
- **Average Task Operation** - <5ms
- **Search Speed** - Real-time (<1ms with debounce)
- **Memory Usage** - ~2MB for 1000 tasks
- **Offline Support** - Full functionality via service worker
- **Browser Support** - All modern browsers (ES2020+)

## 🚢 Deployment

### Prerequisites

- No build step required
- Works with any static file host
- HTTPS recommended for service workers (future PWA)

### Deploy to Netlify (Recommended)

1. Push to GitHub
2. Connect repository to Netlify
3. Build command: `(leave empty)`
4. Publish directory: `.` or `/`
5. Deploy with one click

**Advanced:** Add `netlify.toml` for redirects:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy to GitHub Pages

```bash
# Push your code to GitHub
git push origin main

# Enable GitHub Pages in repository settings
# Choose 'main' branch as source
# Access at: https://yourusername.github.io/gamified-task-tracker
```

### Deploy to Vercel

1. Import project from GitHub
2. Framework preset: Other
3. No build command needed
4. Deploy with one click

### Deploy to Any Static Host

Simply upload all files to your web hosting. Requirements:
- Serve `index.html` as default
- Enable HTTPS (recommended)
- Set correct MIME types for `.js` files (`application/javascript`)

## 🐛 Known Issues

None currently! If you find any, please open an issue.

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the MIT License. See LICENSE file for details.

## 👨‍💻 Author

**Aman Sharma**

- GitHub: [@amansharma253](https://github.com/amansharma253)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

## 🎯 Roadmap

### Short-term (1-4 weeks)

- Polish UX (board interactions, keyboard navigation) and microcopy
- Tune XP rewards, streak edge cases, and badge notifications
- Improve onboarding hints and contextual tooltips

### Medium-term (1-3 months)

- Add optional auth + cloud sync (multi-device continuity)
- Encrypted backups and team spaces with shared projects
- Calendar heatmap and richer analytics exports

### Long-term (3-9 months)

- Social features: leaderboards, peer challenges, shared quests
- AI task suggestions and smart prioritization
- Mobile companion apps and offline-first sync queues

## 🐛 Known Issues

None currently! If you find any, please open an issue.

## 🤝 Contributing

Contributions are welcome! Feel free to:

Have questions or need help?

- Open an issue on GitHub
- Check the Usage Guide above
- Review the code comments

## 🙏 Acknowledgments

- Inspired by modern productivity tools
- Built with attention to UX and accessibility
- Icons from Unicode emoji set
- Color palette from Tailwind CSS

---

**Made with ❤️ using vanilla JavaScript**

⭐ If you find this project useful, please consider starring it on GitHub!
