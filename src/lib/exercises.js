export const DEFAULT_EXERCISES = [
  { id: 'ex_goblet_squat',       name: 'Goblet Squats',                muscles: ['Quads', 'Glutes', 'Core'] },
  { id: 'ex_trapbar_dl',         name: 'Trap Bar Deadlift',            muscles: ['Hamstrings', 'Glutes', 'Back'] },
  { id: 'ex_db_rev_lunge',       name: 'Dumbbell Reverse Lunges',      muscles: ['Quads', 'Glutes'] },
  { id: 'ex_pallof',             name: 'Pallof Press',                 muscles: ['Core', 'Shoulders'] },
  { id: 'ex_ng_db_press',        name: 'Neutral Grip Dumbbell Press',  muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'ex_bent_row',           name: 'Bent-Over Dumbbell Rows',      muscles: ['Back', 'Biceps'] },
  { id: 'ex_hk_ohp',             name: 'Half-Kneeling Overhead Press', muscles: ['Shoulders', 'Triceps', 'Core'] },
  { id: 'ex_weighted_pullup',    name: 'Weighted Pull-ups',            muscles: ['Back', 'Biceps'] },
  { id: 'ex_kb_swing',           name: 'Kettlebell Swings',            muscles: ['Glutes', 'Hamstrings', 'Core'] },
  { id: 'ex_weighted_pushup',    name: 'Weighted Push-ups',            muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'ex_bulg_split',         name: 'Bulgarian Split Squats',       muscles: ['Quads', 'Glutes'] },
  { id: 'ex_renegade_row',       name: 'Renegade Rows',                muscles: ['Back', 'Core', 'Shoulders'] },
  { id: 'ex_front_squat',        name: 'Front Squats',                 muscles: ['Quads', 'Core'] },
  { id: 'ex_leg_press',          name: 'Leg Press',                    muscles: ['Quads', 'Glutes'] },
  { id: 'ex_walking_lunge',      name: 'Walking Lunges',               muscles: ['Quads', 'Glutes'] },
  { id: 'ex_hip_thrust',         name: 'Hip Thrusts',                  muscles: ['Glutes', 'Hamstrings'] },
  { id: 'ex_rdl',                name: 'Romanian Deadlift',            muscles: ['Hamstrings', 'Glutes'] },
  { id: 'ex_step_up',            name: 'Step-ups',                     muscles: ['Glutes', 'Quads'] },
  { id: 'ex_lat_pulldown',       name: 'Lat Pulldown',                 muscles: ['Back', 'Biceps'] },
  { id: 'ex_single_row',         name: 'Single-Arm Row',               muscles: ['Back', 'Biceps'] },
  { id: 'ex_seated_cable_row',   name: 'Seated Cable Row',             muscles: ['Back', 'Biceps'] },
  { id: 'ex_incline_press',      name: 'Incline DB Press',             muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'ex_flat_bench',         name: 'Flat Bench Press',             muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { id: 'ex_chest_fly',          name: 'Chest Fly',                    muscles: ['Chest'] },
  { id: 'ex_arnold_press',       name: 'Arnold Press',                 muscles: ['Shoulders', 'Triceps'] },
  { id: 'ex_lateral_raise',      name: 'Lateral Raises',               muscles: ['Shoulders'] },
  { id: 'ex_face_pull',          name: 'Face Pulls',                   muscles: ['Shoulders', 'Back'] },
  { id: 'ex_plank',              name: 'Plank',                        muscles: ['Core'] },
  { id: 'ex_dead_bug',           name: 'Dead Bug',                     muscles: ['Core'] },
  { id: 'ex_russian_twist',      name: 'Russian Twists',               muscles: ['Core'] },
  { id: 'ex_nordic_curl',        name: 'Nordic Curls',                 muscles: ['Hamstrings'] },
  { id: 'ex_leg_curl',           name: 'Leg Curls',                    muscles: ['Hamstrings'] },
  { id: 'ex_good_morning',       name: 'Good Mornings',                muscles: ['Hamstrings', 'Glutes'] },
  { id: 'ex_tricep_dip',         name: 'Tricep Dips',                  muscles: ['Triceps', 'Chest'] },
  { id: 'ex_oh_tricep_ext',      name: 'Overhead Tricep Extension',    muscles: ['Triceps'] },
  { id: 'ex_hammer_curl',        name: 'Hammer Curls',                 muscles: ['Biceps'] },
  { id: 'ex_concentration_curl', name: 'Concentration Curls',          muscles: ['Biceps'] },
  { id: 'ex_chinup',             name: 'Chin-ups',                     muscles: ['Biceps', 'Back'] },
  { id: 'ex_calf_raise',         name: 'Calf Raises',                  muscles: ['Calves'] },
]

export const exById = (list, id) => list.find((e) => e.id === id)

export function makeDefaultTemplates() {
  return [
    {
      id: 'tmpl_monday',
      name: 'Lower & Core',
      exercises: [
        { exerciseId: 'ex_goblet_squat', targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_trapbar_dl',   targetSets: 3, reps: 6, rest: 120 },
        { exerciseId: 'ex_db_rev_lunge', targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_pallof',       targetSets: 2, reps: 6, rest: 60 },
      ],
    },
    {
      id: 'tmpl_tuesday',
      name: 'Upper Body',
      exercises: [
        { exerciseId: 'ex_ng_db_press',     targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_bent_row',        targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_hk_ohp',          targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_weighted_pullup', targetSets: 3, reps: 6, rest: 120 },
      ],
    },
    {
      id: 'tmpl_wednesday',
      name: 'Full-Body Integration',
      exercises: [
        { exerciseId: 'ex_kb_swing',       targetSets: 3, reps: 6, rest: 60 },
        { exerciseId: 'ex_weighted_pushup', targetSets: 3, reps: 6, rest: 90 },
        { exerciseId: 'ex_bulg_split',     targetSets: 2, reps: 6, rest: 90 },
        { exerciseId: 'ex_renegade_row',   targetSets: 2, reps: 6, rest: 90 },
      ],
    },
  ]
}

export function makeDefaultSchedule(templates) {
  return {
    Monday: templates[0].id,
    Tuesday: templates[1].id,
    Wednesday: templates[2].id,
    Thursday: null,
    Friday: null,
    Saturday: null,
    Sunday: null,
  }
}
