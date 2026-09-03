# lift-moar-app

**Functional Lift Tracker** — a mobile-first weightlifting app for building workout
templates, scheduling a training week, running guided sessions with a rest timer,
and tracking progress over time.

Live: https://lift-moar.netlify.app/

## Stack

- [Vite](https://vite.dev/) + React 18
- Installable **PWA** (`vite-plugin-pwa` / Workbox) — offline-capable, add-to-home-screen
- Tailwind CSS 3, CSS-variable-driven dark/light theming
- [Framer Motion](https://www.framer.com/motion/) (`LazyMotion` + `m`) — subtle fade / stagger animations, honours reduced-motion
- Chart.js chunk code-split behind the Progress tab
- [Chart.js](https://www.chartjs.org/) via `react-chartjs-2` (Progress dashboard)
- [dnd-kit](https://dndkit.com/) — drag-to-reorder exercises mid-workout (touch + mouse)
- All data is stored locally in the browser (`localStorage`) — no backend
- ~155-exercise starter library + a ready-made Upper/Lower/Bodyweight plan
- 20-workout pre-made library (`premadeTemplates.js`) — assignable, duplicable
- Post-workout summary (duration, volume, sets, e1RM personal records)
- First-run onboarding walkthrough + a generated sample training block

## Getting started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Deployment (Netlify)

Configured in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: all routes → `/index.html`

The service worker only registers over HTTPS (or localhost), so installability /
offline support kicks in on the deployed site, not in a plain `file://` preview.

## PWA icons

`public/` holds the generated barbell icons (`pwa-192/512`, maskable variants,
`apple-touch-icon`, `favicon-16/32`, `favicon.svg`). Regenerate them from the
mark with:

```bash
node scripts/generate-icons.mjs   # needs the `sharp` devDependency
```

## Project structure

```
index.html              Vite entry HTML
src/
  main.jsx              React bootstrap
  App.jsx               Root component: state, persistence, view routing
  index.css             Tailwind layers + global styles
  lib/
    storage.js          localStorage helpers, LS_KEYS, SCHEMA_VERSION
    settings.js          get / patch the flt_settings_v1 object
    migrations.js        One-time data migration (folds new defaults into old installs)
    theme.js             Dark/light theme persistence + <html data-theme> application
    constants.js        DAYS, MUSCLES, MUSCLE_STYLE
    motion.js           Shared framer-motion variants (fade / fadeUp / stagger)
    exercises.js        Exercise library, user templates, weekly schedule, muscleLoad()
    premadeTemplates.js 20 read-only built-in workouts (never persisted)
    mockHistory.js      Generated ~10-week sample training block (fresh-install seed)
    audio.js            Rest-timer chime + time formatting
    analytics.js        Progress dashboard + post-workout summary derivation
  components/
    BottomNav.jsx       Primary tab bar (Schedule / Templates / Progress / Settings)
    Header.jsx
    Pill.jsx            Muscle-group chip
    TargetingBars.jsx   Muscle-load mini bar chart
    WeeklyCoverage.jsx  Whole-week muscle-group coverage bar chart (Schedule page)
    TemplateSummaryCard.jsx  Reusable template card (name, theme, counts, bars)
    ConfirmButton.jsx   Two-tap button for destructive actions (no window.confirm)
    Onboarding.jsx      First-run walkthrough (replayable from Settings)
    RestTimer.jsx
    ExercisePickerModal.jsx
    NewExerciseModal.jsx
    SwapModal.jsx
    WorkoutExerciseCard.jsx  Draggable exercise card used in a live workout
    WorkoutDetailModal.jsx   Full set-by-set breakdown + delete
  views/
    ScheduleView.jsx
    TemplatePickerPage.jsx   Full-page assign flow (Your Templates + Pre-Made)
    TemplatesView.jsx        Two sections: user-made, then pre-made
    TemplateEditor.jsx
    ExerciseLibraryManager.jsx
    HistoryView.jsx     Logged workouts, tap a row for full detail
    ActiveWorkout.jsx
    WorkoutSummary.jsx  Post-workout recap (duration, volume, sets, PRs)
    DashboardView.jsx   Progress dashboard (Quick Read + charts + recent workouts)
    SettingsView.jsx    Theme toggle, workout-history JSON import/export
```

## Data model (localStorage)

| Key                 | Contents                                        |
| ------------------- | ---------------------------------------------- |
| `flt_exercises_v1`  | Exercise library (`{id, name, equipment, muscles[]}`) |
| `flt_templates_v1`  | Workout templates                              |
| `flt_schedule_v1`   | Day → template id map                          |
| `flt_history_v1`    | Completed workouts (source for the dashboard)  |
| `flt_settings_v1`   | `{ theme, onboarded }`                          |
| `flt_schema_v`      | Migration schema version                       |

A fresh install (no stored history) starts seeded with the generated sample
block from `mockHistory.js`; existing installs keep their real data.

## History & Settings

- The **History** list is reached from the Progress tab ("View all") or Settings.
  Tapping any workout opens a set-by-set breakdown — weight, reps and RPE per set.
- Delete a single workout from its detail view or the trash control on any
  History / Recent Workouts row (two-tap confirm, no browser dialog).
- **Settings**: dark/light theme, JSON **export / import** of the full history,
  **load sample data**, and a **Danger zone** "Delete all workout history".

## Progress dashboard

The **Progress** tab derives everything from `flt_history_v1`:

- **Quick Read** — colour-coded `good` / `watch` / `flag` callouts for volume
  trends, plateaus, and suspicious data entries.
- **Muscle Group Volume Over Time** — best set (weight × reps) summed across
  Upper Pull, Upper Push, Lower Body, and Core per workout.
- **Upper Body Lift Progression** — heaviest working weight per session for
  row / curl / shrug / overhead-press variants.
- **Specific Lift Progression** — heaviest working weight over time for any one
  logged exercise, chosen from a dropdown.
