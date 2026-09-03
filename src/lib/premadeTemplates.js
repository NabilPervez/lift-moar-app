import { DEFAULT_EXERCISES } from './exercises'

/**
 * Pre-made workout library (from PreMade_Workouts_Library_V3).
 * These are read-only built-ins — they are never written to localStorage.
 * A user assigns one to a day, starts it, or duplicates it into their own
 * editable templates. Shape matches user templates plus `premade` + `theme`.
 */

const idByName = Object.fromEntries(DEFAULT_EXERCISES.map((e) => [e.name, e.id]))

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

// isolation / conditioning themes get lighter loads + shorter rest
const isLight = (theme) =>
  /core|isolation|recovery|circuit|oblique|explosive|pump|interval/i.test(theme)

function make(name, theme, exerciseNames) {
  const light = isLight(theme)
  const targetSets = 3
  const reps = light ? 12 : 8
  const rest = light ? 60 : 90
  return {
    id: 'pm_' + slug(name),
    name,
    theme,
    premade: true,
    exercises: exerciseNames
      .map((n) => idByName[n])
      .filter(Boolean)
      .map((exerciseId) => ({ exerciseId, targetSets, reps, rest })),
  }
}

export const PREMADE_TEMPLATES = [
  make('Barbell Power', 'Full Body Barbell', [
    'Front Squats', 'Trap Bar Deadlift', 'Flat Bench Press', 'Pendlay Rows', 'Push Press',
  ]),
  make('Dumbbell Hypertrophy', 'Upper Body Dumbbell', [
    'Incline DB Press', 'Bent-Over Dumbbell Rows', 'Arnold Press', 'Dumbbell Pullover',
    'Incline Dumbbell Curls', 'Tate Press',
  ]),
  make('Sub-Maximal Bodyweight', 'Bodyweight Circuit / RPE Focus', [
    'Pistol Squats', 'Spiderman Push-ups', 'V-Ups', 'Inverted Rows', 'Hollow Body Hold', 'Bear Crawls',
  ]),
  make('Kettlebell Crusher', 'Functional Kettlebell', [
    'Kettlebell Swings', 'Goblet Squats', 'Turkish Get-Ups', 'Suitcase Carry',
  ]),
  make('Machine Muscle', 'Lower Body Machine', [
    'Leg Press', 'Hack Squat Machine', 'Lying Leg Curls', 'Leg Extensions', 'Seated Calf Raises',
  ]),
  make('Cable Core & Arms', 'Cable Isolation', [
    'Pallof Press', 'Cable Crunches', 'Tricep Pushdowns', 'Cable Curls', 'Woodchoppers',
  ]),
  make('Push Day', 'Chest / Shoulders / Triceps', [
    'Flat Bench Press', 'Overhead Tricep Extension', 'Lateral Raises', 'Tricep Dips',
    'Machine Flyes', 'Skullcrushers',
  ]),
  make('Pull Day', 'Back / Biceps', [
    'Weighted Pull-ups', 'Lat Pulldown', 'Seated Cable Row', 'Hammer Curls', 'Face Pulls',
  ]),
  make('Posterior Chain Power', 'Hamstrings / Glutes', [
    'Romanian Deadlift', 'Hip Thrusts', 'Good Mornings', 'Nordic Curls', 'Back Extensions',
  ]),
  make('Quad Dominator', 'Quads', [
    'Front Squats', 'Bulgarian Split Squats', 'Sissy Squats', 'Walking Lunges', 'Leg Extensions',
  ]),
  make('Sub-Maximal Strength', 'RPE 7-8 Focus', [
    'Trap Bar Deadlift', 'Flat Bench Press', 'Barbell Shrugs', 'Preacher Curls', 'Ab Wheel Rollout',
  ]),
  make('Core & Carry', 'Functional Core', [
    "Farmer's Walk", 'Suitcase Carry', 'Plank', 'L-Sit', 'Hanging Leg Raises',
  ]),
  make('Dumbbell Leg Day', 'Lower Body Dumbbell', [
    'Dumbbell Reverse Lunges', 'Bulgarian Split Squats', 'Single-Leg RDL', 'Step-ups', 'Calf Raises',
  ]),
  make('Functional Interval', 'Active Recovery', [
    'Kettlebell Swings', 'Bird Dog', 'Superman', 'Flutter Kicks', 'Mountain Climbers', 'Woodchoppers',
  ]),
  make('Upper Body Machine Pump', 'Upper Body Machine', [
    'Machine Shoulder Press', 'Pec Deck Fly', 'Machine Flyes', 'Reverse Pec Deck',
  ]),
  make('Barbell Push-Pull', 'Compound Focus', [
    'Front Squats', 'Push Press', 'Pendlay Rows', 'Close-Grip Bench Press', 'T-Bar Rows',
  ]),
  make('Home Gym Minimalist', 'Dumbbell / Bodyweight', [
    'Neutral Grip Dumbbell Press', 'Bent-Over Dumbbell Rows', 'Deficit Push-ups', 'Inverted Rows',
    'Goblet Squats',
  ]),
  make('Core Crusher', 'Abs & Obliques', [
    'Russian Twists', 'V-Ups', 'Dead Bug', 'Cable Crunches', 'Bicycle Crunches', 'Hollow Body Hold',
  ]),
  make('Plyo & Power', 'Explosive Bodyweight', [
    'Jump Squats', 'Lunge Jumps', 'Spiderman Push-ups', 'Mountain Climbers', 'Scissor Kicks',
  ]),
  make('Arm Annihilation', 'Biceps / Triceps', [
    'EZ-Bar Curls', 'Skullcrushers', 'Cable Curls', 'Rope Tricep Extensions', 'Hammer Curls',
    'Tricep Dips',
  ]),
]

export const premadeById = (id) => PREMADE_TEMPLATES.find((t) => t.id === id)
