/**
 * MARE Atelier — Tracker Module
 * Handles set logging, weight/rep input, and localStorage persistence.
 */
const MareTracker = (function () {
  'use strict';

  const STORAGE_KEY = 'mare_workout_log';
  let data = { sessions: {} };
  let saveTimeout = null;

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.warn('MareTracker: corrupt data, resetting');
        data = { sessions: {} };
      }
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveData, 400);
  }

  function getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  function getSession(dateString) {
    if (!data.sessions[dateString]) {
      data.sessions[dateString] = { volume: 'vol1', day: 'mon', exercises: {} };
    }
    return data.sessions[dateString];
  }

  function ensureExercise(session, exerciseId, setsCount) {
    const count = Number(setsCount) || 4;
    if (!session.exercises[exerciseId]) {
      session.exercises[exerciseId] = { sets: [] };
      for (let i = 0; i < count; i++) {
        session.exercises[exerciseId].sets.push({ kg: '', reps: '', completed: false });
      }
      saveData();
    } else if (session.exercises[exerciseId].sets.length < count) {
      while (session.exercises[exerciseId].sets.length < count) {
        session.exercises[exerciseId].sets.push({ kg: '', reps: '', completed: false });
      }
      saveData();
    }
    return session.exercises[exerciseId];
  }

  function findPreviousSession(volume, day, exerciseId) {
    const dates = Object.keys(data.sessions).sort().reverse();
    const today = getTodayKey();
    for (const d of dates) {
      if (d === today) continue;
      const s = data.sessions[d];
      if (s.exercises && s.exercises[exerciseId] && s.exercises[exerciseId].sets) {
        return s.exercises[exerciseId];
      }
    }
    return null;
  }

  // ── Render Set Tracking Grid ──
  function renderSets(exerciseId, containerEl, setsCount, currentVol, currentDay) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const dateString = getTodayKey();
    const session = getSession(dateString);

    if (currentVol) session.volume = currentVol;
    if (currentDay) session.day = currentDay;

    const exData = ensureExercise(session, exerciseId, setsCount);
    const prevData = findPreviousSession(session.volume, session.day, exerciseId);

    const grid = document.createElement('div');
    grid.className = 'ex-sets-grid';

    const header = document.createElement('div');
    header.className = 'sets-header';
    header.innerHTML = `
      <span class="set-label-header">Set</span>
      <span class="set-label-header">kg</span>
      <span class="set-label-header">reps</span>
      <span class="set-label-header"></span>
    `;
    grid.appendChild(header);

    exData.sets.forEach((set, idx) => {
      const prevSet = prevData && prevData.sets[idx] ? prevData.sets[idx] : null;

      const row = document.createElement('div');
      row.className = 'set-row' + (set.completed ? ' set-completed' : '');
      row.dataset.setIndex = idx;

      const checkIcon = set.completed
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : '';

      row.innerHTML = `
        <span class="set-number">${idx + 1}</span>
        <div class="set-input-wrap">
          <input type="number" class="set-input set-input-kg" inputmode="decimal"
                 value="${set.kg !== undefined ? set.kg : ''}" placeholder="${prevSet && prevSet.kg ? prevSet.kg : '--'}"
                 data-exercise="${exerciseId}" data-index="${idx}" data-field="kg"
                 ${set.completed ? 'disabled' : ''} />
        </div>
        <div class="set-input-wrap">
          <input type="number" class="set-input set-input-reps" inputmode="numeric"
                 value="${set.reps !== undefined ? set.reps : ''}" placeholder="${prevSet && prevSet.reps ? prevSet.reps : '--'}"
                 data-exercise="${exerciseId}" data-index="${idx}" data-field="reps"
                 ${set.completed ? 'disabled' : ''} />
        </div>
        <button class="set-check ${set.completed ? 'checked' : ''}"
                data-exercise="${exerciseId}" data-index="${idx}"
                aria-label="Toggle set ${idx + 1} completion">
          ${checkIcon}
        </button>
      `;

      grid.appendChild(row);
    });

    containerEl.appendChild(grid);

    updateCardCompletedState(containerEl, exData);

    grid.querySelectorAll('.set-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        saveInput(e.target.dataset.exercise, parseInt(e.target.dataset.index, 10), e.target.dataset.field, e.target.value);
      });
    });

    grid.querySelectorAll('.set-check').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const exId = btn.dataset.exercise;
        const setIdx = parseInt(btn.dataset.index, 10);
        toggleSet(exId, setIdx);
        renderSets(exId, containerEl, setsCount, currentVol, currentDay);
      });
    });
  }

  function updateCardCompletedState(containerEl, exData) {
    const card = containerEl.closest('.exercise-card');
    if (card && exData && exData.sets.length > 0) {
      const allDone = exData.sets.every((s) => s.completed);
      card.classList.toggle('completed', allDone);
    }
  }

  function saveInput(exerciseId, setIndex, field, value) {
    const session = getSession(getTodayKey());
    const exData = ensureExercise(session, exerciseId);
    if (!exData.sets[setIndex]) return;
    exData.sets[setIndex][field] = value !== '' ? Number(value) : '';
    debouncedSave();
  }

  function toggleSet(exerciseId, setIndex) {
    const session = getSession(getTodayKey());
    const exData = ensureExercise(session, exerciseId);
    if (!exData.sets[setIndex]) return;

    const set = exData.sets[setIndex];
    set.completed = !set.completed;
    saveData();

    if (set.completed) {
      if (navigator.vibrate) navigator.vibrate(40);
      if (window.MareTimer) MareTimer.start();
    } else {
      if (window.MareTimer && MareTimer.isRunning()) MareTimer.skip();
    }

    document.dispatchEvent(new CustomEvent('mare_set_toggled', {
      detail: { exerciseId, setIndex, completed: set.completed }
    }));
  }

  function getSessionSummary(dateString) {
    const session = data.sessions[dateString];
    if (!session) return { completedSets: 0, totalVolume: 0, title: '' };

    let completedSets = 0;
    let totalVolume = 0;

    let title = '';
    if (window.MARE_DATA && session.volume && session.day) {
      const volKey = session.volume === 'custom' ? 'vol1' : session.volume;
      const vol = MARE_DATA.volumes[volKey];
      if (vol && vol.days[session.day]) {
        title = vol.days[session.day].title;
      }
    }

    for (const exId in session.exercises) {
      const ex = session.exercises[exId];
      if (ex.sets) {
        ex.sets.forEach((set) => {
          if (set.completed) {
            completedSets++;
            if (set.kg && set.reps) {
              totalVolume += Number(set.kg) * Number(set.reps);
            }
          }
        });
      }
    }

    return { completedSets, totalVolume: Math.round(totalVolume), title };
  }

  function getHistory(exerciseId, limit) {
    limit = limit || 5;
    const history = [];
    const dates = Object.keys(data.sessions).sort().reverse();

    for (const d of dates) {
      const s = data.sessions[d];
      if (s.exercises && s.exercises[exerciseId]) {
        history.push({ date: d, data: s.exercises[exerciseId] });
        if (history.length >= limit) break;
      }
    }
    return history;
  }

  function clearSession(dateString) {
    if (data.sessions[dateString]) {
      delete data.sessions[dateString];
      saveData();
    }
  }

  function exportData() {
    return JSON.stringify(data, null, 2);
  }

  function importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.sessions) {
      data = parsed;
      saveData();
      return true;
    }
    throw new Error('Invalid data format');
  }

  // Initialize
  loadData();

  const api = {
    renderSets,
    saveInput,
    toggleSet,
    getSessionSummary,
    getHistory,
    clearSession,
    exportData,
    importData
  };

  return api;
})();

if (typeof window !== 'undefined') {
  window.MareTracker = MareTracker;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareTracker = MareTracker;
}
