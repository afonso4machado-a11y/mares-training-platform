/**
 * MARE Planning — Editor Module (v2 Custom Routine Engine)
 * Handles routine customization: exercise reordering, sister-exercise swapping,
 * adding custom exercises, and personal notes with zero dead clicks.
 */
const MareEditor = (function () {
  'use strict';

  const STORAGE_KEY = 'mare_custom_routines';

  let state = {
    activePlan: 'plan1',
    activeVolume: 'plan1',
    customDays: {},
    notes: {},
    swappedExercises: {}
  };

  // ── Persistence ──
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed };
        if (state.activeVolume && !state.activePlan) {
          state.activePlan = state.activeVolume === 'vol2' ? 'plan2' : (state.activeVolume === 'custom' ? 'custom' : 'plan1');
        }
      } catch (e) {
        console.warn('MareEditor: corrupt state, resetting');
      }
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── Base Data Access ──
  function getBaseDayExercises(dayId) {
    let plan = state.activePlan || state.activeVolume || 'plan1';
    if (plan === 'custom' || plan === 'vol1') plan = 'plan1';
    if (plan === 'vol2') plan = 'plan2';
    const plans = (window.MARE_DATA && (MARE_DATA.plans || MARE_DATA.volumes)) || {};
    const planData = plans[plan] || plans['plan1'] || plans['vol1'];
    if (!planData || !planData.days) return [];
    const dayData = planData.days[dayId];
    if (!dayData || !dayData.exercises) return [];
    return JSON.parse(JSON.stringify(dayData.exercises));
  }

  function findExerciseById(exId) {
    if (!window.MARE_DATA || !MARE_DATA.volumes) return null;
    for (const volKey in MARE_DATA.volumes) {
      const vol = MARE_DATA.volumes[volKey];
      for (const dayKey in vol.days) {
        const day = vol.days[dayKey];
        if (!day.exercises) continue;
        const found = day.exercises.find((e) => e.id === exId);
        if (found) return JSON.parse(JSON.stringify(found));
      }
    }
    return null;
  }

  // ── Bi-directional Sister Exercise Swap ──
  function swapExercise(exerciseId) {
    if (!window.MARE_DATA || !MARE_DATA.sisterMap) return false;

    // Direct key swap toggle
    if (state.swappedExercises[exerciseId]) {
      delete state.swappedExercises[exerciseId];
      save();
      return true;
    }

    // Origin swap toggle
    for (const originId in state.swappedExercises) {
      if (state.swappedExercises[originId] === exerciseId) {
        delete state.swappedExercises[originId];
        save();
        return true;
      }
    }

    // Fresh swap
    const sisterId = MARE_DATA.sisterMap[exerciseId];
    if (!sisterId) return false;
    state.swappedExercises[exerciseId] = sisterId;
    save();
    return true;
  }

  // ── Reorder ──
  function moveExercise(dayId, fromIndex, toIndex) {
    ensureCustomDay(dayId);
    const exercises = state.customDays[dayId].exercises;
    if (fromIndex < 0 || fromIndex >= exercises.length || toIndex < 0 || toIndex >= exercises.length) return false;
    const [moved] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, moved);
    save();
    return true;
  }

  function ensureCustomDay(dayId) {
    if (!state.customDays[dayId]) {
      state.customDays[dayId] = {
        exercises: getBaseDayExercises(dayId)
      };
    }
  }

  // ── Add / Remove Custom Exercises ──
  function addExercise(dayId, exData) {
    ensureCustomDay(dayId);
    const id = 'custom_' + Date.now();
    const newEx = {
      id: id,
      name: exData.name || 'Custom Exercise',
      target: exData.target || 'General Muscle Focus',
      sets: Number(exData.sets) || 3,
      reps: String(exData.reps || '10'),
      repUnit: exData.repUnit || 'reps',
      image: null
    };
    if (exData.notes) {
      state.notes[id] = exData.notes;
    }
    state.customDays[dayId].exercises.push(newEx);
    save();
    return id;
  }

  function removeExercise(dayId, exerciseId) {
    ensureCustomDay(dayId);
    state.customDays[dayId].exercises = state.customDays[dayId].exercises.filter(
      (e) => e.id !== exerciseId
    );
    save();
    return true;
  }

  // ── Notes ──
  function setNote(exerciseId, text) {
    if (text && text.trim()) {
      state.notes[exerciseId] = text.trim();
    } else {
      delete state.notes[exerciseId];
    }
    save();
  }

  function getNote(exerciseId) {
    return state.notes[exerciseId] || '';
  }

  // ── Active Plan ──
  function setActivePlan(plan) {
    const normalized = (plan === 'plan2' || plan === 'vol2') ? 'plan2' : (plan === 'custom' ? 'custom' : 'plan1');
    state.activePlan = normalized;
    state.activeVolume = normalized;
    save();
  }

  function getActivePlan() {
    return state.activePlan || state.activeVolume || 'plan1';
  }

  function setActiveVolume(volume) {
    setActivePlan(volume);
  }

  function getActiveVolume() {
    return getActivePlan();
  }

  // ── Get Effective Day (Primary routine provider for Workouts) ──
  function getEffectiveDay(dayId) {
    let baseExercises;

    if (state.activeVolume === 'custom') {
      if (state.customDays[dayId] && state.customDays[dayId].exercises) {
        baseExercises = JSON.parse(JSON.stringify(state.customDays[dayId].exercises));
      } else {
        baseExercises = getBaseDayExercises(dayId);
      }
    } else {
      baseExercises = getBaseDayExercises(dayId);
    }

    // Apply active sister swaps
    return baseExercises.map((ex) => {
      if (state.swappedExercises[ex.id]) {
        const sisterId = state.swappedExercises[ex.id];
        const sister = findExerciseById(sisterId);
        if (sister) {
          return { ...sister, _originalId: ex.id };
        }
      }
      return ex;
    });
  }

  // ── Reset ──
  function resetToDefaults() {
    state = {
      activePlan: 'plan1',
      activeVolume: 'plan1',
      customDays: {},
      notes: {},
      swappedExercises: {}
    };
    save();
    return true;
  }

  // ── Weekend Day Management ──
  function getWeekendExercises(dayId) {
    if (!['sat', 'sun'].includes(dayId)) return [];
    if (state.customDays[dayId] && state.customDays[dayId].exercises) {
      return JSON.parse(JSON.stringify(state.customDays[dayId].exercises));
    }
    return [];
  }

  function addWeekendExercise(dayId, exData) {
    if (!['sat', 'sun'].includes(dayId)) return;
    if (!state.customDays[dayId]) {
      state.customDays[dayId] = { exercises: [] };
    }
    const id = 'weekend_' + dayId + '_' + Date.now();
    state.customDays[dayId].exercises.push({
      id,
      name: exData.name || 'Exercise',
      target: exData.target || 'General',
      sets: Number(exData.sets) || 3,
      reps: String(exData.reps || '10'),
      repUnit: 'reps',
      image: null
    });
    save();
  }

  function clearWeekendExercises(dayId) {
    if (!['sat', 'sun'].includes(dayId)) return;
    if (state.customDays[dayId]) {
      state.customDays[dayId] = { exercises: [] };
      save();
    }
  }

  // ── Customize View Renderer ──
  function renderCustomizeView(containerEl) {
    if (!containerEl) return;

    const DAYS = [
      { id: 'mon', name: 'Monday' },
      { id: 'tue', name: 'Tuesday' },
      { id: 'wed', name: 'Wednesday' },
      { id: 'thu', name: 'Thursday' },
      { id: 'fri', name: 'Friday' },
      { id: 'sat', name: 'Saturday' },
      { id: 'sun', name: 'Sunday' }
    ];

    let selectedDay = 'mon';

    containerEl.innerHTML = `
      <div class="customize-content">
        <div class="customize-day-select">
          <label class="customize-label">Select Day to Edit</label>
          <div class="weekday-track">
            ${DAYS.map((d, i) => `<button class="day-chip editor-day-chip ${i === 0 ? 'active' : ''}" data-day="${d.id}">${d.name.slice(0, 3)}</button>`).join('')}
          </div>
        </div>

        <div id="editor-exercise-list" class="editor-exercise-list"></div>

        <div class="editor-add-form" id="editor-form-box">
          <h3 class="editor-form-title">Add Exercise</h3>
          <input type="text" id="add-ex-name" class="editor-input" placeholder="Exercise name" autocomplete="off" />
          <input type="text" id="add-ex-target" class="editor-input" placeholder="Target muscle group" autocomplete="off" />
          <div class="editor-input-row">
            <input type="number" id="add-ex-sets" class="editor-input editor-input-small" placeholder="Sets" value="3" min="1" max="10" />
            <input type="text" id="add-ex-reps" class="editor-input editor-input-small" placeholder="Reps (e.g. 10 or 8-12)" value="10" />
          </div>
          <button class="btn-primary editor-add-btn" id="editor-add-btn">Add to Routine</button>
        </div>

        <button class="btn-outline btn-danger editor-reset-btn" id="editor-reset-btn">Reset All Customizations</button>
      </div>
    `;

    function renderExerciseList() {
      const listEl = containerEl.querySelector('#editor-exercise-list');
      const formBox = containerEl.querySelector('#editor-form-box');
      if (!listEl) return;

      if (selectedDay === 'wed') {
        listEl.innerHTML = '<p class="empty-state">Wednesday is dedicated to low-impact cardio and recovery.</p>';
        if (formBox) formBox.classList.add('hidden');
        return;
      }

      // Weekend days use dedicated weekend storage
      if (selectedDay === 'sat' || selectedDay === 'sun') {
        if (formBox) formBox.classList.remove('hidden');
        const wkExs = getWeekendExercises(selectedDay);
        if (!wkExs || wkExs.length === 0) {
          listEl.innerHTML = '<p class="empty-state">No exercises — this day is currently in Rest Mode. Use the form below to add optional exercises.</p>';
          return;
        }
        listEl.innerHTML = wkExs.map((ex, i) => `
          <div class="editor-exercise-row" data-id="${ex.id}">
            <span class="editor-ex-number">${i + 1}</span>
            <div class="editor-ex-info">
              <span class="editor-ex-name">${ex.name}</span>
              <span class="editor-ex-sub">${ex.target || 'General'} &middot; ${ex.sets} &times; ${ex.reps}</span>
            </div>
            <div class="editor-ex-actions">
              <button class="editor-action-btn editor-delete-btn" data-action="remove-weekend" data-id="${ex.id}" aria-label="Delete exercise">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        `).join('');
        listEl.querySelectorAll('[data-action="remove-weekend"]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const exId = btn.dataset.id;
            const current = getWeekendExercises(selectedDay);
            if (state.customDays[selectedDay]) {
              state.customDays[selectedDay].exercises = current.filter((e) => e.id !== exId);
              save();
            }
            renderExerciseList();
          });
        });
        return;
      }

      if (formBox) formBox.classList.remove('hidden');

      // Ensure custom day object exists when viewing in customize mode
      ensureCustomDay(selectedDay);
      const exercises = state.customDays[selectedDay].exercises;

      if (!exercises || exercises.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No exercises configured for this day. Use the form below to add an exercise.</p>';
        return;
      }

      listEl.innerHTML = exercises.map((ex, i) => `
        <div class="editor-exercise-row" data-id="${ex.id}">
          <span class="editor-ex-number">${i + 1}</span>
          <div class="editor-ex-info">
            <span class="editor-ex-name">${ex.name}</span>
            <span class="editor-ex-sub">${ex.target || 'General'} &middot; ${ex.sets} &times; ${ex.reps}</span>
          </div>
          <div class="editor-ex-actions">
            <button class="editor-action-btn btn-move-up" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move exercise up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
            <button class="editor-action-btn btn-move-down" data-action="down" data-index="${i}" ${i === exercises.length - 1 ? 'disabled' : ''} aria-label="Move exercise down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <button class="editor-action-btn editor-delete-btn" data-action="remove" data-id="${ex.id}" aria-label="Delete exercise">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      // Bind actions with direct delegation
      listEl.querySelectorAll('.editor-action-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'up') {
            const idx = parseInt(btn.dataset.index, 10);
            moveExercise(selectedDay, idx, idx - 1);
          } else if (action === 'down') {
            const idx = parseInt(btn.dataset.index, 10);
            moveExercise(selectedDay, idx, idx + 1);
          } else if (action === 'remove') {
            removeExercise(selectedDay, btn.dataset.id);
          }
          renderExerciseList();
        });
      });
    }

    // Day chip selector
    containerEl.querySelectorAll('.editor-day-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedDay = chip.dataset.day;
        containerEl.querySelectorAll('.editor-day-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderExerciseList();
      });
    });

    // Add exercise form submission
    const addBtn = containerEl.querySelector('#editor-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const nameInput = containerEl.querySelector('#add-ex-name');
        const targetInput = containerEl.querySelector('#add-ex-target');
        const setsInput = containerEl.querySelector('#add-ex-sets');
        const repsInput = containerEl.querySelector('#add-ex-reps');

        const name = nameInput.value.trim();
        if (!name) {
          nameInput.focus();
          return;
        }

        if (selectedDay === 'sat' || selectedDay === 'sun') {
          addWeekendExercise(selectedDay, {
            name,
            target: targetInput.value.trim(),
            sets: parseInt(setsInput.value, 10) || 3,
            reps: repsInput.value.trim() || '10'
          });
        } else {
          addExercise(selectedDay, {
            name,
            target: targetInput.value.trim(),
            sets: parseInt(setsInput.value, 10) || 3,
            reps: repsInput.value.trim() || '10'
          });
        }

        nameInput.value = '';
        targetInput.value = '';
        renderExerciseList();
      });
    }

    // Reset button
    const resetBtn = containerEl.querySelector('#editor-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all custom modifications and reorders to original plans? Logged workout history will be preserved.')) {
          resetToDefaults();
          renderExerciseList();
        }
      });
    }

    renderExerciseList();
  }

  load();

  const api = {
    swapExercise,
    moveExercise,
    addExercise,
    removeExercise,
    getWeekendExercises,
    addWeekendExercise,
    clearWeekendExercises,
    setNote,
    getNote,
    setActivePlan,
    getActivePlan,
    setActiveVolume,
    getActiveVolume,
    getEffectiveDay,
    resetToDefaults,
    renderCustomizeView
  };

  return api;
})();

if (typeof window !== 'undefined') {
  window.MareEditor = MareEditor;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareEditor = MareEditor;
}
