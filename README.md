# lift-moar-app

**Functional Lift Tracker** — a mobile-first weightlifting app for building workout
templates, scheduling a training week, running guided sessions with a rest timer,
and tracking progress over time.

Live: https://lift-moar.netlify.app/

## Stack

- [Vite](https://vite.dev/) + React 18
- Tailwind CSS 3
- [Chart.js](https://www.chartjs.org/) via `react-chartjs-2` (Progress dashboard)
- All data is stored locally in the browser (`localStorage`) — no backend

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

## Project structure

```
index.html              Vite entry HTML
src/
  main.jsx              React bootstrap
  App.jsx               Root component: state, persistence, view routing
  index.css             Tailwind layers + global styles
  lib/
    storage.js          localStorage helpers + LS_KEYS
    constants.js        DAYS, MUSCLES, MUSCLE_STYLE
    exercises.js        Default exercise library, templates, schedule
    audio.js            Rest-timer chime + time formatting
    analytics.js        Progress dashboard data derivation
  components/
    BottomNav.jsx       Primary tab bar (Schedule / Templates / History / Progress)
    Header.jsx
    Pill.jsx            Muscle-group chip
    RestTimer.jsx
    ExercisePickerModal.jsx
    NewExerciseModal.jsx
    SwapModal.jsx
  views/
    ScheduleView.jsx
    TemplatesView.jsx
    TemplateEditor.jsx
    ExerciseLibraryManager.jsx
    HistoryView.jsx
    ActiveWorkout.jsx
    DashboardView.jsx   Progress dashboard (Quick Read + charts)
```

## Data model (localStorage)

| Key                 | Contents                                        |
| ------------------- | ---------------------------------------------- |
| `flt_exercises_v1`  | Exercise library (`{id, name, muscles[]}`)     |
| `flt_templates_v1`  | Workout templates                              |
| `flt_schedule_v1`   | Day → template id map                          |
| `flt_history_v1`    | Completed workouts (source for the dashboard)  |

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
