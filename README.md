# lift-moar-app

**Functional Lift Tracker** — a mobile-first weightlifting app for building workout
templates, scheduling a training week, running guided sessions with a rest timer,
and tracking progress over time.

Live: https://lift-moar.netlify.app/

## Stack

- [Vite](https://vite.dev/) + React 18
- Installable **PWA** (`vite-plugin-pwa` / Workbox) — offline-capable, add-to-home-screen
- Tailwind CSS 3, CSS-variable-driven dark/light theming
- CSS-only motion — screen fades, staggered list entrances, animated bar-graph
  fills; resting state is always visible so a throttled tab can't get stuck
- [Chart.js](https://www.chartjs.org/) via `react-chartjs-2`, in a shared code-split chunk
- [dnd-kit](https://dndkit.com/) — drag-to-reorder templates, template exercises, and lifts mid-workout
- All data is stored locally in the browser (`localStorage`) — no backend
- ~155-exercise starter library + a ready-made Upper/Lower/Bodyweight plan
- 20-workout pre-made library (`premadeTemplates.js`) — assignable, duplicable
- In-progress workouts persist across reloads; wall-clock rest timer with notification
- Post-workout summary (duration, volume, sets, e1RM personal records) with
  Copy / Text / WhatsApp / Save-to-file sharing (`lib/share.js`)
- Per-exercise history + progression chart, reachable from any lift name
- Bodyweight log, consistency streak + heatmap, per-workout / per-exercise notes
- Undo toasts on every delete; first-run onboarding + a generated sample block

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
    exercises.js        Exercise library, user templates, weekly schedule, muscleLoad()
    premadeTemplates.js 20 read-only built-in workouts (never persisted)
    mockHistory.js      Generated ~10-week sample training block (fresh-install seed)
    audio.js            Rest-timer chime + time formatting
    haptics.js           Vibration helper, gated by settings.haptics
    notify.js            Rest-timer Notification permission + dispatch
    share.js              Share-text builder + copy/sms/whatsapp/download helpers
    analytics.js        Progress dashboard + post-workout summary + consistency/bodyweight derivation
  components/
    BottomNav.jsx       Primary tab bar (Schedule / Templates / Progress / Settings)
    Header.jsx
    Pill.jsx            Muscle-group chip
    TargetingBars.jsx   Muscle-load mini bar chart (animated fill)
    WeeklyCoverage.jsx  Whole-week muscle-group coverage bar chart (Schedule page)
    TemplateSummaryCard.jsx  Reusable template card (name, theme, counts, bars)
    ConfirmButton.jsx   Two-tap button for destructive actions (no window.confirm)
    Toast.jsx             Bottom toast with an optional Undo action
    Onboarding.jsx      First-run walkthrough (replayable from Settings)
    A2HSBanner.jsx        Dismissible install prompt (Android beforeinstallprompt / iOS card)
    ConsistencyCard.jsx   Week streak + this-week/month + 12-week heatmap
    BodyweightCard.jsx    Latest weight, 7d/30d change, trend chart
    LogBodyweightModal.jsx
    LiftLineChart.jsx     Shared themed Chart.js line chart (Progress + exercise detail)
    RestTimer.jsx
    ExercisePickerModal.jsx
    NewExerciseModal.jsx
    SwapModal.jsx
    WorkoutExerciseCard.jsx  Draggable exercise card used in a live workout
    WorkoutDetailModal.jsx   Full set-by-set breakdown, repeat, delete
  views/
    ScheduleView.jsx
    TemplatePickerPage.jsx   Full-page assign flow (Your Templates + Pre-Made)
    TemplatesView.jsx        Two sections: user-made (drag-reorderable), then pre-made
    TemplateEditor.jsx        Drag-reorder exercises (dnd-kit)
    ExerciseLibraryManager.jsx
    ExerciseDetailModal.jsx   Best set / e1RM / progression chart / session history for one lift
    HistoryView.jsx     Logged workouts, tap a row for full detail
    ActiveWorkout.jsx    Persists to flt_active_v1; wall-clock rest timer; notes
    WorkoutSummary.jsx  Post-workout recap (duration, volume, sets, PRs) + share row
    DashboardView.jsx   Progress dashboard (consistency, Quick Read, bodyweight, charts, recent workouts)
    SettingsView.jsx    Theme toggle, workout-history JSON import/export
```

## Data model (localStorage)

| Key                 | Contents                                        |
| ------------------- | ---------------------------------------------- |
| `flt_exercises_v1`  | Exercise library (`{id, name, equipment, muscles[]}`) |
| `flt_templates_v1`  | Workout templates                              |
| `flt_schedule_v1`   | Day → template id map                          |
| `flt_history_v1`    | Completed workouts (`{id, date, durationMs, notes, exercises[]}`) |
| `flt_active_v1`     | In-progress workout session (cleared on finish/cancel) |
| `flt_bodyweight_v1` | `{id, date, weight}[]`                          |
| `flt_settings_v1`   | `{ theme, onboarded, haptics, notifyAsked, dragTipSeen, a2hsDismissedAt }` |
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
