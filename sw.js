const CACHE_NAME = 'mare-v5';

const BASE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './css/transitions.css',
  './js/app.js',
  './js/data.js',
  './js/tracker.js',
  './js/timer.js',
  './js/editor.js',
  './images/icons/icon-192.png',
  './images/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap'
];

const PLAN_B_IMAGES = [
  'push_1_cable_lateral_raise.jpg', 'push_2_incline_db_press.jpg',
  'push_3_arnold_press.jpg', 'push_4_machine_lateral_raise.jpg',
  'push_5_overhead_rope_extension.jpg', 'push_6_plate_front_raise.jpg',
  'push_7_db_tricep_kickback.jpg',
  'leg_1_hack_squat.jpg', 'leg_2_smith_hip_thrust.jpg',
  'leg_3_seated_hip_abduction.jpg', 'leg_4_smith_rdl.jpg',
  'leg_5_cable_kickback.jpg', 'leg_6_walking_lunges.jpg',
  'cardio_1_treadmill.jpg', 'cardio_2_stairs.jpg',
  'pull_1_close_grip_pulldown.jpg', 'pull_2_straight_arm_pulldown.jpg',
  'pull_3_incline_chest_supported_row.jpg', 'pull_4_incline_bicep_curl.jpg',
  'pull_5_seated_wide_cable_row.jpg', 'pull_6_cable_hammer_curl.jpg',
  'lower_1_sumo_squat.png', 'lower_2_seated_leg_press.png',
  'lower_3_static_split_squat.png', 'lower_4_seated_hip_adduction.png',
  'abs_1_lying_leg_raise.jpg', 'abs_2_bicycle_crunches.jpg',
  'abs_3_forearm_plank.jpg'
];

const PLAN_A_IMAGES = [
  'push_1_crossbody_raise.jpg', 'push_2_db_chest_press.jpg',
  'push_3_db_shoulder_press.jpg', 'push_4_db_lateral_raise.jpg',
  'push_5_skull_crushers.jpg', 'push_6_hammer_front_raise.jpg',
  'push_7_cable_rope_pushdown.jpg',
  'leg_1_leg_press.jpg', 'leg_2_barbell_hip_thrust.jpg',
  'leg_3_kas_glute_bridge.jpg', 'leg_4_dumbbell_rdl.jpg',
  'leg_5_back_extension.jpg', 'leg_6_reverse_lunges.jpg',
  'pull_1_lat_pulldown.jpg', 'pull_2_single_arm_cable_row.jpg',
  'pull_3_seated_cable_row.jpg', 'pull_4_isometric_bicep_curl.jpg',
  'pull_5_bent_over_row.jpg', 'pull_6_hammer_curls.jpg',
  'goblet_squat.png', 'leg_extension.png',
  'split_squat.png', 'hip_adduction.png',
  'abs_1_pullover_crunch.jpg', 'abs_2_weighted_situp.jpg',
  'abs_3_russian_twist.jpg'
];

const IMAGE_ASSETS = [
  ...PLAN_B_IMAGES.map(f => './images/plan_b/' + f),
  ...PLAN_A_IMAGES.map(f => './images/plan_a/' + f)
];

const ALL_ASSETS = [...BASE_ASSETS, ...IMAGE_ASSETS];

// Install: cache all assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ALL_ASSETS.map((url) => cache.add(url).catch((err) => {
          console.warn('Asset failed to pre-cache:', url, err);
        }))
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first with network fallback
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('/index.html');
        }
        return new Response('', { status: 408 });
      });
    })
  );
});
