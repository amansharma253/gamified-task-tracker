# TaskPro (Legacy v2 Archive)

This document contains the legacy v2 (vanilla JS) README content preserved for reference.
It does **not** describe the current v3 app (React + Vite + TypeScript).

---

## ✨ Features

### Core Functionality

- ✅ **Create, Read, Update, Delete Tasks** - Full CRUD operations with instant persistence
- ✅ **Task Organization** - Organize tasks by projects (Work, Personal, Learning)
- ✅ **Priority Levels** - Set High/Medium/Low priority for each task
- ✅ **Due Dates** - Track task deadlines with automatic overdue detection
- ✅ **Task Descriptions** - Add detailed notes to any task
- ✅ **Tags/Labels** - Flexible tagging system for better organization (comma-separated)
- ✅ **Recurring Tasks** - Set daily, weekly, or monthly recurrence
- ✅ **PWA Support** - Install as app, works offline with service worker

### Smart Filtering & Sorting

- 🔍 **Real-time Search** - Instantly filter tasks by name or description
- 📊 **Multiple Views** - List, Board (Kanban), Calendar, and Analytics
- 🎯 **Project Filtering** - Filter by Work, Personal, or Learning
- 📈 **Sort Options** - Sort by Due Date, Priority, Name, or Manual order

### Inline Quick Editing

- ✏️ **Double-click Name** - Edit task name inline
- 🎯 **Click Priority** - Cycle through Low → Medium → High
- 📅 **Click Due Date** - Edit with inline date picker
- 🏷️ **Click Tags** - Edit tags inline

### Batch Actions

- ☑️ **Selection Mode** - Toggle to select multiple tasks
- ✅ **Select All** - Select all visible tasks (Cmd/Ctrl+A)
- 🗑️ **Bulk Delete** - Delete selected tasks with undo support
- ✓ **Bulk Complete** - Mark selected tasks as complete

### Undo Support

- ↩️ **Undo Deletions** - Restore accidentally deleted tasks
- ⌨️ **Cmd/Ctrl + Z** - Global undo shortcut
- 🔔 **Toast Actions** - Click "Undo" in toast notifications

### Gamification

- 🎮 **XP System** - Earn XP for completing tasks (10 base + priority bonus)
- 📊 **Leveling** - Level up as you accumulate XP
- 🔥 **Streaks** - Build daily completion streaks
- 🏅 **Badges** - Unlock achievements (First Task, 10 Tasks, 50 Tasks, 100 Tasks, High Priority Hunter, Streak Master)
- 🎯 **Weekly Quests** - Complete high-priority tasks challenge

### Analytics & Insights

- 📈 **Completion Rate** - Track your task completion percentage
- 🎯 **Productivity Score** - Calculated score (0-100) based on completion and priority
- 📅 **Weekly Activity** - See how many tasks you created/completed this week
- 🏆 **Priority Analysis** - Understand your workload intensity
- 🏷️ **Top Tags** - Discover your most-used tags
- 📊 **Project Breakdown** - Visualize task distribution across projects

### User Experience

- 🌑 **Premium Dark UI** - Dark theme by default (single theme)
- 📐 **Compact Mode** - Dense layout for power users
- ⌨️ **Keyboard Shortcuts** - Power-user shortcuts for efficiency
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- 💾 **Offline First** - All data stored locally with IndexedDB
- 🎨 **Modern UI** - Clean, professional design with smooth animations
- 🎓 **Step-by-Step Onboarding** - Guided tour for new users

### Data Management

- 📥 **Import Backup** - Upload a backup file you previously exported
- 📤 **Export Backup** - Download a TaskPro backup file (for backup/transfer)
- 💾 **Auto-save** - All changes are automatically saved
- 🔒 **Data Privacy** - Your data never leaves your device

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ (for building production version)
- No installation required for development!

### Running Locally (Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/amansharma253/gamified-task-tracker.git
   cd gamified-task-tracker
   ```

2. **Start a local server**

   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Or using npm
   npm run dev

   # Or using Node.js
   npx http-server

   # Or using PHP
   php -S localhost:8000
   ```

3. **Open in your browser**

   ```
   http://localhost:8000
   ```

### Building for Production

```bash
# Install dependencies
npm install

# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

**Build output:**
- Minified JavaScript bundle (~60-70% smaller)
- Minified CSS
- Optimized for deployment
- Service worker for offline support

That's it! No complex build configuration needed.

## 💡 Usage Guide

### Creating a Task

1. Click **"+ New Task"** button or press **Cmd/Ctrl + N**
2. Fill in the task details:
   - **Task Name** (required)
   - **Description** (optional)
   - **Priority** (Low, Medium, High)
   - **Project** (Work, Personal, Learning)
   - **Due Date** (optional)
   - **Tags** (comma-separated, e.g., "urgent, backend, design")
3. Click **"Save Task"**

### Managing Tasks

- **Mark Complete** - Click the checkbox next to a task
- **Edit** - Click the ✏️ icon
- **Delete** - Click the 🗑️ icon
- **Search** - Use the search bar to find tasks instantly
- **Filter** - Select a project or view from the sidebar

### Sorting & Filtering

- **Sort by Due Date** - See what's coming up
- **Sort by Priority** - Focus on important work
- **Sort by Name** - Alphabetical organization
- **Filter by View** - Today/Pending/Completed
- **Filter by Project** - Stay focused on one area

### Analytics

1. Click the **📊 Analytics** button in the header
2. View your:
   - Completion rate percentage
   - Productivity score
   - Weekly activity metrics
   - Priority analysis
   - Top used tags
   - Project distribution
   - Gamification stats (XP, level, streaks, badges)

### Visual Feedback

- **XP Bubbles** - Animated XP gain appears when completing tasks
- **Level-Up Confetti** - Optional celebration when reaching a new level
- **Toast Notifications** - Smooth slide-in messages for actions (with undo support)
- **Micro-interactions** - Subtle button lifts, smooth transitions

### Importing & Exporting

- **Export Backup** - Click **⬇️** to download a TaskPro backup file
- **Import Backup** - Click **⬆️** to upload a backup you previously exported
- Perfect for backup or switching devices

### Keyboard Shortcuts

| Shortcut               | Action                               |
| ---------------------- | ------------------------------------ |
| **Cmd/Ctrl + N**       | Create new task                      |
| **Cmd/Ctrl + K**       | Focus search                         |
| **Cmd/Ctrl + Z**       | Undo last deletion                   |
| **?**                  | Show keyboard shortcuts help         |
| **Esc**                | Close modal / Exit selection mode    |

Press **?** to view all shortcuts in-app.

### Quick Add Syntax

Use the quick add input for rapid task creation:

| Syntax                     | Example                    | Effect          |
| -------------------------- | -------------------------- | --------------- |
| `#project`                 | `#work`, `#personal`       | Sets project    |
| `!priority`                | `!high`, `!medium`, `!low` | Sets priority   |
| `@tag`                     | `@urgent @backend`         | Adds tags       |
| `today`                    | `Finish report today`      | Due today       |
| `tomorrow`                 | `Call client tomorrow`     | Due tomorrow    |
| `next week`                | `Review docs next week`    | Due in 7 days   |
| `daily`/`weekly`/`monthly` | `Standup daily`            | Sets recurrence |

**Example:** `Design review tomorrow #work !high @ui @frontend`

### Theme

- Click **🌙** in the sidebar to toggle dark mode
- Click **Compact** to toggle compact density mode
- Your preferences are saved automatically

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Vanilla JavaScript (ES modules)
- **Storage**: IndexedDB via `idb@7` ESM CDN (local persistence)
- **Styling**: CSS3 (Grid, Flexbox, CSS Variables, modern animations)
- **Design**: Responsive Mobile-First approach + accessible ARIA
- **Animations**: Lightweight `canvas-confetti` via CDN (optional)
- **Compatibility**: No frameworks, no build step required

### Project Structure

```
├── index.html                 # HTML structure & ARIA-ready modals
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

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Aman Sharma**

- GitHub: [@amansharma253](https://github.com/amansharma253)

---

Made with vanilla JavaScript (legacy v2).
