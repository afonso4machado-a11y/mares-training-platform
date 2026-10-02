const MARE_DATA = {
  volumes: {
    vol1: {
      name: 'Volume I',
      days: {
        mon: {
          id: 'vol1_mon',
          label: 'Monday',
          title: 'Push Day',
          focus: 'Chest, Shoulders, Triceps',
          accent: 'accent-push',
          type: 'strength',
          exercises: [
            { id: 'vol1_mon_1', name: 'Dumbbell Crossbody Raises', target: 'Shoulders', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_mon_2', name: 'DB Chest Press', target: 'Chest', sets: 4, reps: '8-10', repUnit: 'reps', image: null },
            { id: 'vol1_mon_3', name: 'DB Shoulder Press', target: 'Shoulders', sets: 4, reps: '8-10', repUnit: 'reps', image: null },
            { id: 'vol1_mon_4', name: 'DB Lateral Raises', target: 'Shoulders', sets: 4, reps: '10', repUnit: 'reps', supersetWith: 'vol1_mon_5', image: null },
            { id: 'vol1_mon_5', name: 'DB Skull Crushers', target: 'Triceps', sets: 4, reps: '10', repUnit: 'reps', supersetWith: 'vol1_mon_4', notes: 'Paired with the lateral raises — no rest between the two.', image: null },
            { id: 'vol1_mon_6', name: 'Seated Hammer Front Raise', target: 'Shoulders', sets: 3, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_mon_7', name: 'Cable Rope Pushdown', target: 'Triceps', sets: 3, reps: '10', repUnit: 'reps', image: null }
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
            { id: 'vol1_tue_1', name: 'Leg Press', target: 'Quads & Glutes', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_tue_2', name: 'Hip Thrusts', target: 'Glutes', sets: 4, reps: '8', repUnit: 'reps', supersetWith: 'vol1_tue_3', image: null },
            { id: 'vol1_tue_3', name: 'KAS Glute Bridge', target: 'Glutes', sets: 4, reps: '8', repUnit: 'reps', supersetWith: 'vol1_tue_2', notes: 'Perform directly after hip thrusts with no rest between them.', image: null },
            { id: 'vol1_tue_4', name: 'Dumbbell RDLs', target: 'Hamstrings & Glutes', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_tue_5', name: 'Glute-Focused Back Extension', target: 'Glutes', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_tue_6', name: 'Deficit Reverse Lunges', target: 'Legs', sets: 4, reps: '8', repUnit: 'reps / leg', image: null }
          ]
        },
        wed: {
          id: 'vol1_wed',
          label: 'Wednesday',
          title: 'Cardio & Recovery',
          focus: 'Low-impact active recovery session',
          accent: 'accent-cardio',
          type: 'cardio',
          intro: 'Wednesday is reserved for active recovery and low-intensity movement. Select an option below for 20 to 40 minutes at a steady pace, or take a full rest day.',
          cardioOptions: [
            { title: 'Brisk Walking', desc: 'Outdoor walk or incline treadmill. Restores blood flow with zero joint stress.', badge: '20-40 min, Steady pace', image: null },
            { title: 'Stationary Cycling', desc: 'Low-resistance spinning. Flushes leg fatigue and elevates core temperature.', badge: '20-30 min, Light resistance', image: null },
            { title: 'Swimming', desc: 'Gentle laps or pool walking. Decompresses the spine and loosens tight shoulders.', badge: '20-30 min, Relaxed rhythm', image: null },
            { title: 'Yoga & Mobility', desc: 'Focused stretching and joint mobilization for hips, hamstrings, and thoracic spine.', badge: '25-35 min, Mat routine', image: null },
            { title: 'Light Jog', desc: 'Easy aerobic jogging on flat terrain or cushioned treadmill deck.', badge: '20-25 min, Zone 2 heart rate', image: null }
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
            { id: 'vol1_thu_1', name: 'Lat Pulldown', target: 'Back', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_thu_2', name: 'Single Arm Cable High Row / Pulldown', target: 'Back', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_thu_3', name: 'Seated Neutral Grip Cable Row', target: 'Back', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_thu_4', name: 'Isometric Bicep Curl', target: 'Biceps', sets: 4, reps: '1', repUnit: 'rounds', notes: '5 full reps + 5 lower range + 5 upper range + 5-second hold.', image: null },
            { id: 'vol1_thu_5', name: 'Bent Over Row (Supinated Grip)', target: 'Back', sets: 4, reps: '10', repUnit: 'reps', image: null },
            { id: 'vol1_thu_6', name: 'Bent Over Crossbody Hammer Curls', target: 'Biceps', sets: 4, reps: '10', repUnit: 'reps', image: null }
          ]
        },
        fri: {
          id: 'vol1_fri',
          label: 'Friday',
          title: 'Lower Body & Ab Circuit',
          focus: 'Glutes, Quads, Core',
          accent: 'accent-circuit',
          type: 'strength',
          circuitTip: 'Start Friday session with 10-12 minutes of steady-state cardio before moving into the lower body work. Rest 60-90 seconds between rounds of the ab circuit.',
          exercises: [
            { id: 'vol1_fri_1', name: 'Goblet Squats', target: 'Lower Body', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/goblet_squat.png' },
            { id: 'vol1_fri_2', name: 'Leg Extension', target: 'Lower Body', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/leg_extension.png' },
            { id: 'vol1_fri_3', name: 'Split Squats', target: 'Lower Body', sets: 3, reps: '12', repUnit: 'reps / leg', image: 'plan_a/split_squat.png' },
            { id: 'vol1_fri_4', name: 'Hip Adductions', target: 'Lower Body', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_a/hip_adduction.png' },
            { id: 'vol1_fri_5', name: 'DB Lat Pullover to Suitcase Crunch', target: 'Core', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: null },
            { id: 'vol1_fri_6', name: 'Weighted Sit-up + Extend', target: 'Core', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: null },
            { id: 'vol1_fri_7', name: 'Russian Twist', target: 'Core', sets: 3, reps: '8', repUnit: 'reps', isCircuit: true, notes: 'No rest between exercises within a round.', image: null }
          ]
        }
      }
    },
    vol2: {
      name: 'Volume II',
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
          focus: 'Low-impact active recovery session',
          accent: 'accent-cardio',
          type: 'cardio',
          intro: 'Wednesday is reserved for active recovery and low-intensity movement. Choose either option below for 20 to 30 minutes at a steady pace, or take a full rest day.',
          cardioOptions: [
            { title: 'Treadmill', desc: 'Incline walking or gentle jogging. Steady cardiovascular conditioning with zero joint impact.', badge: '20-30 min, Incline 6-10%, 4.5-5.5 km/h', image: 'plan_b/cardio_1_treadmill.jpg' },
            { title: 'Stairs / Stairmaster', desc: 'Steady step climbing. Consistent glute activation and aerobic conditioning.', badge: '15-25 min, Moderate rhythm', image: 'plan_b/cardio_2_stairs.jpg' }
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
          circuitTip: 'Move through the 3 ab exercises back-to-back on your mat, then rest 60-90 seconds before starting the next round.',
          exercises: [
            { id: 'vol2_fri_1', name: 'Dumbbell Sumo Squat', target: 'Inner Thighs & Glutes', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_1_sumo_squat.png' },
            { id: 'vol2_fri_2', name: 'Seated Machine Leg Press', target: 'Quads & Glutes', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_2_seated_leg_press.png' },
            { id: 'vol2_fri_3', name: 'Static Dumbbell Split Squat', target: 'Glutes & Quads', sets: 3, reps: '10', repUnit: 'reps / leg', image: 'plan_b/lower_3_static_split_squat.png' },
            { id: 'vol2_fri_4', name: 'Seated Machine Hip Adduction', target: 'Inner Thighs (Adductors)', sets: 3, reps: '12', repUnit: 'reps', image: 'plan_b/lower_4_seated_hip_adduction.png' },
            { id: 'vol2_fri_5', name: 'Lying Leg Raises', target: 'Lower Abdominals', sets: 3, reps: '10', repUnit: 'reps', isCircuit: true, image: 'plan_b/abs_1_lying_leg_raise.jpg' },
            { id: 'vol2_fri_6', name: 'Bicycle Crunches', target: 'Obliques & Core', sets: 3, reps: '12', repUnit: 'total reps', isCircuit: true, image: 'plan_b/abs_2_bicycle_crunches.jpg' },
            { id: 'vol2_fri_7', name: 'Forearm Plank Hold', target: 'Core Pillar', sets: 3, reps: '30-45s', repUnit: 'hold', isCircuit: true, image: 'plan_b/abs_3_forearm_plank.jpg' }
          ]
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

if (typeof window !== 'undefined') {
  window.MARE_DATA = MARE_DATA;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MARE_DATA = MARE_DATA;
}
