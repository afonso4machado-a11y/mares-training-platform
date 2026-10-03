const MARE_DATA = {
  plans: {
    plan1: {
      name: 'Plan 1',
      days: {
        mon: {
          id: 'vol1_mon',
          label: 'Monday',
          title: 'Push Day',
          focus: 'Chest, Shoulders, Triceps',
          accent: 'accent-push',
          type: 'strength',
          exercises: [
            { id: 'vol1_mon_1', name: 'Dumbbell Crossbody Raises', target: 'Lateral Deltoids', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/push_1_crossbody_raise.jpg' },
            { id: 'vol1_mon_2', name: 'DB Chest Press', target: 'Pectorals & Front Delts', sets: 4, reps: '8-10', repUnit: 'reps', image: 'plan_a/push_2_db_chest_press.jpg' },
            { id: 'vol1_mon_3', name: 'DB Shoulder Press', target: 'Shoulders & Triceps', sets: 4, reps: '8-10', repUnit: 'reps', image: 'plan_a/push_3_db_shoulder_press.jpg' },
            { id: 'vol1_mon_4', name: 'DB Lateral Raises', target: 'Side Deltoids', sets: 4, reps: '10', repUnit: 'reps', supersetWith: 'vol1_mon_5', image: 'plan_a/push_4_db_lateral_raise.jpg' },
            { id: 'vol1_mon_5', name: 'DB Skull Crushers', target: 'Triceps Isolation', sets: 4, reps: '10', repUnit: 'reps', supersetWith: 'vol1_mon_4', notes: 'Paired with lateral raises — zero rest between exercises.', image: 'plan_a/push_5_skull_crushers.jpg' },
            { id: 'vol1_mon_6', name: 'Seated Hammer Front Raise', target: 'Anterior Deltoids', sets: 3, reps: '10', repUnit: 'reps', image: 'plan_a/push_6_hammer_front_raise.jpg' },
            { id: 'vol1_mon_7', name: 'Cable Rope Pushdown', target: 'Triceps (Long Head)', sets: 3, reps: '10', repUnit: 'reps', image: 'plan_a/push_7_cable_rope_pushdown.jpg' }
          ]
        },
        tue: {
          id: 'vol1_tue',
          label: 'Tuesday',
          title: 'Leg Day',
          focus: 'Glutes, Hamstrings, Quads',
          accent: 'accent-legs',
          type: 'strength',
          exercises: [
            { id: 'vol1_tue_1', name: 'Leg Press', target: 'Quads & Glutes', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/leg_1_leg_press.jpg' },
            { id: 'vol1_tue_2', name: 'Hip Thrusts', target: 'Gluteus Maximus', sets: 4, reps: '8', repUnit: 'reps', supersetWith: 'vol1_tue_3', image: 'plan_a/leg_2_barbell_hip_thrust.jpg' },
            { id: 'vol1_tue_3', name: 'KAS Glute Bridge', target: 'Upper Glute Isolation', sets: 4, reps: '8', repUnit: 'reps', supersetWith: 'vol1_tue_2', notes: 'Perform directly after hip thrusts with zero rest.', image: 'plan_a/leg_3_kas_glute_bridge.jpg' },
            { id: 'vol1_tue_4', name: 'Dumbbell RDLs', target: 'Hamstrings & Posterior Chain', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/leg_4_dumbbell_rdl.jpg' },
            { id: 'vol1_tue_5', name: 'Glute-Focused Back Extension', target: 'Glute & Lower Back', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/leg_5_back_extension.jpg' },
            { id: 'vol1_tue_6', name: 'Deficit Reverse Lunges', target: 'Quads & Glutes', sets: 4, reps: '8', repUnit: 'reps / leg', image: 'plan_a/leg_6_reverse_lunges.jpg' }
          ]
        },
        wed: {
          id: 'vol1_wed',
          label: 'Wednesday',
          title: 'Cardio & Recovery',
          focus: 'Cardio & Recovery',
          accent: 'accent-cardio',
          type: 'cardio',
          intro: 'Wednesday is dedicated to gentle, feel-good movement. Choose either option below depending on what you feel like doing today — 20 to 30 minutes at an easy, enjoyable pace. And if you need complete rest, take it!',
          exercises: [
            {
              id: 'cardio_treadmill',
              name: 'Treadmill Walk / Jog',
              target: 'Cardio & Energy Burn',
              sets: 1,
              reps: '20-30 min',
              repUnit: 'min',
              inputType: 'cardio',
              cardioType: 'treadmill',
              image: 'plan_b/cardio_1_treadmill.jpg',
              notes: 'Incline walking or gentle jogging. Great for burning energy with zero joint impact. Incline 6-10%, 4.5-5.5 km/h.'
            },
            {
              id: 'cardio_stairs',
              name: 'Stairs / Stairmaster',
              target: 'Glutes & Conditioning',
              sets: 1,
              reps: '15-25 min',
              repUnit: 'min',
              inputType: 'cardio',
              cardioType: 'stairs',
              image: 'plan_b/cardio_2_stairs.jpg',
              notes: 'Steady step climbing. Amazing for glute activation and gentle cardiovascular conditioning. Moderate, steady rhythm.'
            }
          ]
        },
        thu: {
          id: 'vol1_thu',
          label: 'Thursday',
          title: 'Pull Day',
          focus: 'Back, Biceps, Core',
          accent: 'accent-pull',
          type: 'strength',
          exercises: [
            { id: 'vol1_thu_1', name: 'Lat Pulldown', target: 'Lats & Upper Back', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/pull_1_lat_pulldown.jpg' },
            { id: 'vol1_thu_2', name: 'Single Arm Cable High Row / Pulldown', target: 'Lat Unilateral', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/pull_2_single_arm_cable_row.jpg' },
            { id: 'vol1_thu_3', name: 'Seated Neutral Grip Cable Row', target: 'Rhomboids & Mid-Back', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/pull_3_seated_cable_row.jpg' },
            { id: 'vol1_thu_4', name: 'Isometric Bicep Curl', target: 'Biceps Peak', sets: 4, reps: '1', repUnit: 'rounds', notes: '5 full reps + 5 lower range + 5 upper range + 5-second hold.', image: 'plan_a/pull_4_isometric_bicep_curl.jpg' },
            { id: 'vol1_thu_5', name: 'Bent Over Row (Supinated Grip)', target: 'Lats & Biceps', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/pull_5_bent_over_row.jpg' },
            { id: 'vol1_thu_6', name: 'Bent Over Crossbody Hammer Curls', target: 'Brachialis & Forearms', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_a/pull_6_hammer_curls.jpg' }
          ]
        },
        fri: {
          id: 'vol1_fri',
          label: 'Friday',
          title: 'Lower Body & Ab Circuit',
          focus: 'Glutes, Quads, Core',
          accent: 'accent-circuit',
          type: 'strength',
          circuitTip: 'Move through the 3 ab exercises back-to-back on your mat, then take 60-90 seconds of rest before starting the next round.',
          exercises: [
            { id: 'vol1_fri_1', name: 'Goblet Squats', target: 'Quads & Inner Thighs', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/goblet_squat.png' },
            { id: 'vol1_fri_2', name: 'Leg Extension', target: 'Quadriceps Isolation', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/leg_extension.png' },
            { id: 'vol1_fri_3', name: 'Split Squats', target: 'Glutes & Quads', sets: 3, reps: '12', repUnit: 'reps / leg', image: 'plan_a/split_squat.png' },
            { id: 'vol1_fri_4', name: 'Hip Adductions', target: 'Inner Thighs (Adductors)', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/hip_adduction.png' },
            { id: 'vol1_fri_5', name: 'DB Lat Pullover to Suitcase Crunch', target: 'Upper & Lower Core', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: 'plan_a/abs_1_pullover_crunch.jpg' },
            { id: 'vol1_fri_6', name: 'Weighted Sit-up + Extend', target: 'Core Anterior', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: 'plan_a/abs_2_weighted_situp.jpg' },
            { id: 'vol1_fri_7', name: 'Russian Twist', target: 'Obliques & Rotation', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: 'plan_a/abs_3_russian_twist.jpg' }
          ]
        },
        sat: {
          id: 'vol1_sat',
          label: 'Saturday',
          title: 'Rest & Recovery',
          focus: 'Active recovery, hydration & mobility',
          accent: 'accent-cardio',
          type: 'rest',
          intro: 'Saturday is dedicated to full physical restoration. Hydrate well, take a gentle walk outside if you wish, and let your muscular system adapt and recover.'
        },
        sun: {
          id: 'vol1_sun',
          label: 'Sunday',
          title: 'Rest & Reset',
          focus: 'Full nervous system recovery & prep',
          accent: 'accent-cardio',
          type: 'rest',
          intro: 'Sunday completes the weekly training cycle. Prioritize restorative rest, quality sleep, and prepare your body for Monday Push session.'
        }
      }
    },
    plan2: {
      name: 'Plan 2',
      days: {
        mon: {
          id: 'vol2_mon',
          label: 'Monday',
          title: 'Push Day',
          focus: 'Chest, Shoulders, Triceps',
          accent: 'accent-push',
          type: 'strength',
          exercises: [
            { id: 'vol2_mon_1', name: 'Cable Lean-Away Lateral Raise', target: 'Lateral Deltoids', sets: 4, reps: '10', repUnit: 'reps / arm', image: 'plan_b/push_1_cable_lateral_raise.jpg' },
            { id: 'vol2_mon_2', name: 'Incline Dumbbell Chest Press', target: 'Upper Chest & Front Delts', sets: 4, reps: '8-10', repUnit: 'reps', image: 'plan_b/push_2_incline_db_press.jpg' },
            { id: 'vol2_mon_3', name: 'Seated Dumbbell Arnold Press', target: 'Shoulders & Rotators', sets: 4, reps: '8-10', repUnit: 'reps', image: 'plan_b/push_3_arnold_press.jpg' },
            { id: 'vol2_mon_4', name: 'Machine Lateral Raise', target: 'Side Deltoids', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/push_4_machine_lateral_raise.jpg' },
            { id: 'vol2_mon_5', name: 'Overhead Cable Rope Extension', target: 'Triceps (Long Head)', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/push_5_overhead_rope_extension.jpg' },
            { id: 'vol2_mon_6', name: 'Standing Weight Plate Front Raise', target: 'Front Deltoids', sets: 3, reps: '10', repUnit: 'reps', image: 'plan_b/push_6_plate_front_raise.jpg' },
            { id: 'vol2_mon_7', name: 'Dumbbell Tricep Kickbacks', target: 'Triceps (Lateral Head)', sets: 3, reps: '10', repUnit: 'reps / arm', image: 'plan_b/push_7_db_tricep_kickback.jpg' }
          ]
        },
        tue: {
          id: 'vol2_tue',
          label: 'Tuesday',
          title: 'Leg Day',
          focus: 'Glutes, Hamstrings, Quads',
          accent: 'accent-legs',
          type: 'strength',
          exercises: [
            { id: 'vol2_tue_1', name: 'Hack Squat', target: 'Quads & Glutes', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/leg_1_hack_squat.jpg' },
            { id: 'vol2_tue_2', name: 'Smith Machine Hip Thrust', target: 'Gluteus Maximus', sets: 4, reps: '8-10', repUnit: 'reps', image: 'plan_b/leg_2_smith_hip_thrust.jpg' },
            { id: 'vol2_tue_3', name: 'Seated Machine Hip Abduction', target: 'Upper Glute & Medius', sets: 4, reps: '12', repUnit: 'reps', image: 'plan_b/leg_3_seated_hip_abduction.jpg' },
            { id: 'vol2_tue_4', name: 'Smith Machine Romanian Deadlift', target: 'Hamstrings & Posterior Chain', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/leg_4_smith_rdl.jpg' },
            { id: 'vol2_tue_5', name: 'Standing Cable Glute Kickback', target: 'Glute Isolation', sets: 4, reps: '10', repUnit: 'reps / leg', image: 'plan_b/leg_5_cable_kickback.jpg' },
            { id: 'vol2_tue_6', name: 'Dumbbell Walking Lunges', target: 'Quads, Glutes & Balance', sets: 4, reps: '10', repUnit: 'steps / leg', image: 'plan_b/leg_6_walking_lunges.jpg' }
          ]
        },
        wed: {
          id: 'vol2_wed',
          label: 'Wednesday',
          title: 'Cardio & Recovery',
          focus: 'Cardio & Recovery',
          accent: 'accent-cardio',
          type: 'cardio',
          intro: 'Wednesday is dedicated to gentle, feel-good movement. Choose either option below depending on what you feel like doing today — 20 to 30 minutes at an easy, enjoyable pace. And if you need complete rest, take it!',
          exercises: [
            {
              id: 'cardio_treadmill',
              name: 'Treadmill Walk / Jog',
              target: 'Cardio & Energy Burn',
              sets: 1,
              reps: '20-30 min',
              repUnit: 'min',
              inputType: 'cardio',
              cardioType: 'treadmill',
              image: 'plan_b/cardio_1_treadmill.jpg',
              notes: 'Incline walking or gentle jogging. Great for burning energy with zero joint impact. Incline 6-10%, 4.5-5.5 km/h.'
            },
            {
              id: 'cardio_stairs',
              name: 'Stairs / Stairmaster',
              target: 'Glutes & Conditioning',
              sets: 1,
              reps: '15-25 min',
              repUnit: 'min',
              inputType: 'cardio',
              cardioType: 'stairs',
              image: 'plan_b/cardio_2_stairs.jpg',
              notes: 'Steady step climbing. Amazing for glute activation and gentle cardiovascular conditioning. Moderate, steady rhythm.'
            }
          ]
        },
        thu: {
          id: 'vol2_thu',
          label: 'Thursday',
          title: 'Pull Day',
          focus: 'Back, Biceps, Posture',
          accent: 'accent-pull',
          type: 'strength',
          exercises: [
            { id: 'vol2_thu_1', name: 'Neutral Close-Grip Lat Pulldown', target: 'Lats & Mid-Back', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_1_close_grip_pulldown.jpg' },
            { id: 'vol2_thu_2', name: 'Straight-Arm Cable Lat Pulldown', target: 'Lat Isolation', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_2_straight_arm_pulldown.jpg' },
            { id: 'vol2_thu_3', name: 'Chest-Supported Incline DB Row', target: 'Rhomboids & Upper Back', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_3_incline_chest_supported_row.jpg' },
            { id: 'vol2_thu_4', name: 'Incline Dumbbell Bicep Curl', target: 'Biceps (Full Stretch)', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_4_incline_bicep_curl.jpg' },
            { id: 'vol2_thu_5', name: 'Seated Wide-Grip Cable Row', target: 'Upper Back & Rear Delts', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_5_seated_wide_cable_row.jpg' },
            { id: 'vol2_thu_6', name: 'Cable Rope Hammer Curl', target: 'Brachialis & Forearms', sets: 4, reps: '10', repUnit: 'reps', image: 'plan_b/pull_6_cable_hammer_curl.jpg' }
          ]
        },
        fri: {
          id: 'vol2_fri',
          label: 'Friday',
          title: 'Lower Body & Ab Circuit',
          focus: 'Glutes, Legs, Core Finish',
          accent: 'accent-circuit',
          type: 'strength',
          circuitTip: 'Move through the 3 ab exercises back-to-back on your mat, then take 60-90 seconds of rest before starting the next round.',
          exercises: [
            { id: 'vol2_fri_1', name: 'Dumbbell Sumo Squat', target: 'Inner Thighs & Glutes', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_1_sumo_squat.png' },
            { id: 'vol2_fri_2', name: 'Seated Machine Leg Press', target: 'Quads & Glutes', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_2_seated_leg_press.png' },
            { id: 'vol2_fri_3', name: 'Static Dumbbell Split Squat', target: 'Glutes & Quads', sets: 3, reps: '10', repUnit: 'reps / leg', image: 'plan_b/lower_3_static_split_squat.png' },
            { id: 'vol2_fri_4', name: 'Seated Machine Hip Adduction', target: 'Inner Thighs (Adductors)', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_4_seated_hip_adduction.png' },
            { id: 'vol2_fri_5', name: 'Lying Leg Raises', target: 'Lower Abdominals', sets: 3, reps: '10', repUnit: 'reps', isCircuit: true, image: 'plan_b/abs_1_lying_leg_raise.jpg' },
            { id: 'vol2_fri_6', name: 'Bicycle Crunches', target: 'Obliques & Core', sets: 3, reps: '12', repUnit: 'total reps', isCircuit: true, image: 'plan_b/abs_2_bicycle_crunches.jpg' },
            { id: 'vol2_fri_7', name: 'Forearm Plank Hold', target: 'Core Pillar', sets: 3, reps: '30-45s', repUnit: 'hold', isCircuit: true, image: 'plan_b/abs_3_forearm_plank.jpg' }
          ]
        },
        sat: {
          id: 'vol2_sat',
          label: 'Saturday',
          title: 'Rest & Recovery',
          focus: 'Active recovery, hydration & mobility',
          accent: 'accent-cardio',
          type: 'rest',
          intro: 'Saturday is dedicated to full physical restoration. Hydrate well, take a gentle walk outside if you wish, and let your muscular system adapt and recover.'
        },
        sun: {
          id: 'vol2_sun',
          label: 'Sunday',
          title: 'Rest & Reset',
          focus: 'Full nervous system recovery & prep',
          accent: 'accent-cardio',
          type: 'rest',
          intro: 'Sunday completes the weekly training cycle. Prioritize restorative rest, quality sleep, and prepare your body for Monday Push session.'
        }
      }
    }
  },
  sisterMap: {
    'vol1_mon_1': 'vol2_mon_1',
    'vol1_mon_2': 'vol2_mon_2',
    'vol1_mon_3': 'vol2_mon_3',
    'vol1_mon_4': 'vol2_mon_4',
    'vol1_mon_5': 'vol2_mon_5',
    'vol1_mon_6': 'vol2_mon_6',
    'vol1_mon_7': 'vol2_mon_7',
    
    'vol1_tue_1': 'vol2_tue_1',
    'vol1_tue_2': 'vol2_tue_2',
    'vol1_tue_3': 'vol2_tue_3',
    'vol1_tue_4': 'vol2_tue_4',
    'vol1_tue_5': 'vol2_tue_5',
    'vol1_tue_6': 'vol2_tue_6',

    'vol1_thu_1': 'vol2_thu_1',
    'vol1_thu_2': 'vol2_thu_2',
    'vol1_thu_3': 'vol2_thu_3',
    'vol1_thu_4': 'vol2_thu_4',
    'vol1_thu_5': 'vol2_thu_5',
    'vol1_thu_6': 'vol2_thu_6',

    'vol1_fri_1': 'vol2_fri_1',
    'vol1_fri_2': 'vol2_fri_2',
    'vol1_fri_3': 'vol2_fri_3',
    'vol1_fri_4': 'vol2_fri_4',
    'vol1_fri_5': 'vol2_fri_5',
    'vol1_fri_6': 'vol2_fri_6',
    'vol1_fri_7': 'vol2_fri_7',
    
    'vol2_mon_1': 'vol1_mon_1',
    'vol2_mon_2': 'vol1_mon_2',
    'vol2_mon_3': 'vol1_mon_3',
    'vol2_mon_4': 'vol1_mon_4',
    'vol2_mon_5': 'vol1_mon_5',
    'vol2_mon_6': 'vol1_mon_6',
    'vol2_mon_7': 'vol1_mon_7',
    
    'vol2_tue_1': 'vol1_tue_1',
    'vol2_tue_2': 'vol1_tue_2',
    'vol2_tue_3': 'vol1_tue_3',
    'vol2_tue_4': 'vol1_tue_4',
    'vol2_tue_5': 'vol1_tue_5',
    'vol2_tue_6': 'vol1_tue_6',

    'vol2_thu_1': 'vol1_thu_1',
    'vol2_thu_2': 'vol1_thu_2',
    'vol2_thu_3': 'vol1_thu_3',
    'vol2_thu_4': 'vol1_thu_4',
    'vol2_thu_5': 'vol1_thu_5',
    'vol2_thu_6': 'vol1_thu_6',

    'vol2_fri_1': 'vol1_fri_1',
    'vol2_fri_2': 'vol1_fri_2',
    'vol2_fri_3': 'vol1_fri_3',
    'vol2_fri_4': 'vol1_fri_4',
    'vol2_fri_5': 'vol1_fri_5',
    'vol2_fri_6': 'vol1_fri_6',
    'vol2_fri_7': 'vol1_fri_7'
  }
};

// Structural compatibility aliases
MARE_DATA.volumes = MARE_DATA.plans;
MARE_DATA.plans.vol1 = MARE_DATA.plans.plan1;
MARE_DATA.plans.vol2 = MARE_DATA.plans.plan2;
MARE_DATA.volumes.vol1 = MARE_DATA.plans.plan1;
MARE_DATA.volumes.vol2 = MARE_DATA.plans.plan2;

if (typeof window !== 'undefined') {
  window.MARE_DATA = MARE_DATA;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MARE_DATA = MARE_DATA;
}
