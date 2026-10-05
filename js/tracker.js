/**
 * MARE Planning — Tracker Module (v13 Granular History & Physical Done Mechanic)
 * Handles set logging, weight/rep input, ghost data placeholders, granular history archiving,
 * and progressive overload tracking.
 */
const MareTracker = (function () {
  'use strict';

  const STORAGE_KEY = 'mare_workout_log';
  let data = { sessions: {}, completedSessions: [] };
  let saveTimeout = null;
  let lastCompletedBackup = null;

  function loadData() {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        data = {
          sessions: parsed.sessions || {},
          completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : []
        };
      } catch (e) {
        console.warn('MareTracker: corrupt data, resetting');
        data = { sessions: {}, completedSessions: [] };
      }
    } else {
      data = { sessions: {}, completedSessions: [] };
    }
  }

  function saveData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
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
      data.sessions[dateString] = { plan: 'plan1', volume: 'plan1', day: 'mon', exercises: {} };
    }
    return data.sessions[dateString];
  }

  function getExerciseMeta(exerciseId, plan, day) {
    if (typeof window !== 'undefined' && window.MARE_DATA) {
      const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
      if (plansSource) {
        const planKey = (plan === 'custom' || plan === 'plan1' || plan === 'vol1') ? 'plan1' : 'plan2';
        const p = plansSource[planKey];
        if (p && p.days && p.days[day] && Array.isArray(p.days[day].exercises)) {
          const found = p.days[day].exercises.find((e) => e.id === exerciseId);
          if (found) return found;
        }
        for (const pk in plansSource) {
          const pl = plansSource[pk];
          if (pl && pl.days) {
            for (const dk in pl.days) {
              const d = pl.days[dk];
              if (d && Array.isArray(d.exercises)) {
                const found = d.exercises.find((e) => e.id === exerciseId);
                if (found) return found;
              }
            }
          }
        }
      }
    }
    return null;
  }

  function getExerciseName(exerciseId, plan, day) {
    const meta = getExerciseMeta(exerciseId, plan, day);
    if (meta && meta.name) return meta.name;
    return exerciseId.replace(/^(vol\d+_|plan\d+_)/, '').replace(/_/g, ' ');
  }

  function getDayTitle(plan, day) {
    if (typeof window !== 'undefined' && window.MARE_DATA) {
      const planKey = (plan === 'custom' || plan === 'plan1' || plan === 'vol1') ? 'plan1' : 'plan2';
      const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
      const p = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
      if (p && p.days && p.days[day]) {
        return p.days[day].title;
      }
    }
    const dayNames = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
    return dayNames[day] || 'Training';
  }

  function ensureExercise(session, exerciseId, setsCount, exMeta) {
    const isCardio = (exMeta && exMeta.inputType === 'cardio') || (exerciseId && exerciseId.startsWith('cardio_'));
    const count = isCardio ? 1 : (Number(setsCount) || 4);
    if (!session.exercises[exerciseId]) {
      session.exercises[exerciseId] = { sets: [] };
      for (let i = 0; i < count; i++) {
        if (isCardio) {
          session.exercises[exerciseId].sets.push({ time: '', speed: '', incline: '', completed: false });
        } else {
          session.exercises[exerciseId].sets.push({ kg: '', reps: '', completed: false });
        }
      }
      saveData();
    } else {
      if (isCardio) {
        if (session.exercises[exerciseId].sets.length === 0) {
          session.exercises[exerciseId].sets.push({ time: '', speed: '', incline: '', completed: false });
          saveData();
        } else if (session.exercises[exerciseId].sets.length > 1) {
          session.exercises[exerciseId].sets = [session.exercises[exerciseId].sets[0]];
          saveData();
        }
        const s0 = session.exercises[exerciseId].sets[0];
        if (s0.time === undefined) s0.time = '';
        if (s0.speed === undefined) s0.speed = '';
        if (s0.incline === undefined) s0.incline = '';
      } else if (session.exercises[exerciseId].sets.length < count) {
        while (session.exercises[exerciseId].sets.length < count) {
          session.exercises[exerciseId].sets.push({ kg: '', reps: '', completed: false });
        }
        saveData();
      }
    }
    return session.exercises[exerciseId];
  }

  function findPreviousSession(volume, day, exerciseId) {
    // 1. Search data.completedSessions (newest first)
    if (Array.isArray(data.completedSessions)) {
      for (const sess of data.completedSessions) {
        if (sess && Array.isArray(sess.exercises)) {
          const ex = sess.exercises.find((e) => e.id === exerciseId);
          if (ex && Array.isArray(ex.sets)) {
            const hasData = ex.sets.some((s) => (s.kg !== '' && s.kg !== undefined) || (s.time !== '' && s.time !== undefined));
            if (hasData) {
              return { sets: ex.sets };
            }
          }
        }
      }
    }

    // 2. Search legacy data.sessions
    if (data.sessions) {
      const dates = Object.keys(data.sessions).sort().reverse();
      const today = getTodayKey();
      for (const d of dates) {
        if (d === today) continue;
        const s = data.sessions[d];
        if (s && s.exercises && s.exercises[exerciseId] && Array.isArray(s.exercises[exerciseId].sets)) {
          const sets = s.exercises[exerciseId].sets;
          const hasData = sets.some((st) => (st.kg !== '' && st.kg !== undefined) || (st.time !== '' && st.time !== undefined));
          if (hasData) {
            return s.exercises[exerciseId];
          }
        }
      }
    }
    return null;
  }

  function getPreviousExerciseData(volume, day, exerciseId) {
    return findPreviousSession(volume, day, exerciseId);
  }

  // ── Complete Current Workout & State Clearing ──
  function completeCurrentWorkout(plan, day) {
    const todayKey = getTodayKey();
    const activeSession = data.sessions[todayKey];

    const now = new Date();
    const timestamp = now.getTime();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const id = 'session_' + timestamp;

    // Snapshot before clearing for Undo protection
    lastCompletedBackup = {
      dateKey: todayKey,
      sessionCopy: activeSession ? JSON.parse(JSON.stringify(activeSession)) : null,
      completedId: id
    };

    const planKey = (plan === 'custom' || plan === 'plan1' || plan === 'vol1') ? 'plan1' : (plan || 'plan1');
    const dayKey = day || (activeSession && activeSession.day) || 'mon';
    const dayTitle = getDayTitle(planKey, dayKey);

    const compiledExercises = [];
    if (activeSession && activeSession.exercises) {
      for (const exId of Object.keys(activeSession.exercises)) {
        const exObj = activeSession.exercises[exId];
        if (!exObj || !Array.isArray(exObj.sets)) continue;

        const meta = getExerciseMeta(exId, planKey, dayKey);
        const isCardio = (meta && meta.inputType === 'cardio') || exId.startsWith('cardio_');

        const sets = exObj.sets.map((s, idx) => ({
          setNumber: idx + 1,
          kg: s.kg !== undefined ? s.kg : '',
          reps: s.reps !== undefined ? s.reps : '',
          time: s.time !== undefined ? s.time : '',
          speed: s.speed !== undefined ? s.speed : '',
          incline: s.incline !== undefined ? s.incline : '',
          completed: Boolean(s.completed)
        }));

        const hasActivity = sets.some((s) => s.completed || (s.kg !== '' && s.kg !== undefined) || (s.time !== '' && s.time !== undefined));
        if (hasActivity) {
          compiledExercises.push({
            id: exId,
            name: meta && meta.name ? meta.name : getExerciseName(exId, planKey, dayKey),
            target: meta && meta.target ? meta.target : '',
            isCardio,
            sets
          });
        }
      }
    }

    const completedRecord = {
      id,
      timestamp,
      date: todayKey,
      time: timeStr,
      plan: planKey,
      day: dayKey,
      title: dayTitle,
      exercises: compiledExercises
    };

    if (!Array.isArray(data.completedSessions)) {
      data.completedSessions = [];
    }
    data.completedSessions.unshift(completedRecord);

    // Wipe values and check states from the day's active inputs
    if (activeSession && activeSession.exercises) {
      for (const exId of Object.keys(activeSession.exercises)) {
        const exObj = activeSession.exercises[exId];
        if (exObj && Array.isArray(exObj.sets)) {
          exObj.sets.forEach((s) => {
            s.kg = '';
            s.reps = '';
            s.time = '';
            s.speed = '';
            s.incline = '';
            s.completed = false;
          });
        }
      }
    }

    saveData();
    return completedRecord;
  }

  function undoLastCompletion() {
    if (!lastCompletedBackup) return false;

    const { dateKey, sessionCopy, completedId } = lastCompletedBackup;

    if (completedId && Array.isArray(data.completedSessions)) {
      data.completedSessions = data.completedSessions.filter((s) => s.id !== completedId);
    }

    if (dateKey && sessionCopy) {
      data.sessions[dateKey] = sessionCopy;
    }

    saveData();
    lastCompletedBackup = null;
    return true;
  }

  function getCompletedSessions() {
    const list = Array.isArray(data.completedSessions) ? [...data.completedSessions] : [];

    // Synthesize legacy sessions if not present in completedSessions
    if (data.sessions) {
      const existingDates = new Set(list.map((s) => s.date));
      const dates = Object.keys(data.sessions).sort().reverse();
      for (const d of dates) {
        if (existingDates.has(d)) continue;
        const s = data.sessions[d];
        if (!s || !s.exercises) continue;

        const compiledExercises = [];
        for (const exId in s.exercises) {
          const ex = s.exercises[exId];
          if (ex && Array.isArray(ex.sets)) {
            const hasActivity = ex.sets.some((st) => st.completed || (st.kg !== '' && st.kg !== undefined) || (st.time !== '' && st.time !== undefined));
            if (hasActivity) {
              compiledExercises.push({
                id: exId,
                name: getExerciseName(exId, s.plan || s.volume, s.day),
                sets: ex.sets.map((st, idx) => ({
                  setNumber: idx + 1,
                  kg: st.kg !== undefined ? st.kg : '',
                  reps: st.reps !== undefined ? st.reps : '',
                  time: st.time !== undefined ? st.time : '',
                  speed: st.speed !== undefined ? st.speed : '',
                  incline: st.incline !== undefined ? st.incline : '',
                  completed: Boolean(st.completed)
                }))
              });
            }
          }
        }

        if (compiledExercises.length > 0) {
          list.push({
            id: 'legacy_' + d,
            timestamp: new Date(d + 'T12:00:00').getTime(),
            date: d,
            time: '12:00',
            plan: s.plan || s.volume || 'plan1',
            day: s.day || 'mon',
            title: getDayTitle(s.plan || s.volume, s.day) || 'Training Session',
            exercises: compiledExercises,
            isLegacy: true
          });
        }
      }
    }

    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
  }

  // ── Progressive Overload Checker ──
  function isProgressiveOverload(exerciseId, setIndex, currentKg, sessionTimestamp) {
    const curr = parseFloat(currentKg);
    if (isNaN(curr) || curr <= 0) return false;

    // Check prior completed sessions strictly before sessionTimestamp
    if (Array.isArray(data.completedSessions)) {
      for (const sess of data.completedSessions) {
        if (sessionTimestamp && sess.timestamp && sess.timestamp >= sessionTimestamp) continue;

        if (sess && Array.isArray(sess.exercises)) {
          const ex = sess.exercises.find((e) => e.id === exerciseId);
          if (ex && Array.isArray(ex.sets)) {
            const prevSet = ex.sets[setIndex];
            if (prevSet && prevSet.kg !== '' && prevSet.kg !== undefined) {
              const prev = parseFloat(prevSet.kg);
              if (!isNaN(prev) && prev > 0) {
                return curr > prev;
              }
            }
          }
        }
      }
    }

    // Fallback to legacy sessions
    if (data.sessions) {
      const dates = Object.keys(data.sessions).sort().reverse();
      for (const d of dates) {
        if (sessionTimestamp && new Date(d + 'T23:59:59').getTime() >= sessionTimestamp) continue;
        const s = data.sessions[d];
        if (s && s.exercises && s.exercises[exerciseId] && Array.isArray(s.exercises[exerciseId].sets)) {
          const prevSet = s.exercises[exerciseId].sets[setIndex];
          if (prevSet && prevSet.kg !== '' && prevSet.kg !== undefined) {
            const prev = parseFloat(prevSet.kg);
            if (!isNaN(prev) && prev > 0) {
              return curr > prev;
            }
          }
        }
      }
    }

    return false;
  }

  // ── Render Set Tracking Grid ──
  function renderSets(exerciseId, containerEl, setsCount, currentVol, currentDay, exMeta) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const dateString = getTodayKey();
    const session = getSession(dateString);

    if (currentVol) session.volume = currentVol;
    if (currentDay) session.day = currentDay;

    const isCardio = (exMeta && exMeta.inputType === 'cardio') || (exerciseId && exerciseId.startsWith('cardio_'));
    const exData = ensureExercise(session, exerciseId, setsCount, exMeta);
    const prevData = findPreviousSession(session.volume, session.day, exerciseId);

    const grid = document.createElement('div');
    grid.className = 'ex-sets-grid';

    if (isCardio) {
      const cardioType = (exMeta && exMeta.cardioType) || (exerciseId.includes('stairs') ? 'stairs' : 'treadmill');
      const isStairs = cardioType === 'stairs';

      const header = document.createElement('div');
      header.className = 'sets-header ' + (isStairs ? 'sets-header-cardio-2' : 'sets-header-cardio-3');
      if (isStairs) {
        header.innerHTML = `
          <span class="set-label-header">#</span>
          <span class="set-label-header">Time</span>
          <span class="set-label-header">Level</span>
          <span class="set-label-header"></span>
        `;
      } else {
        header.innerHTML = `
          <span class="set-label-header">#</span>
          <span class="set-label-header">Time</span>
          <span class="set-label-header">Km/h</span>
          <span class="set-label-header">Inc %</span>
          <span class="set-label-header"></span>
        `;
      }
      grid.appendChild(header);

      const set = exData.sets[0] || { time: '', speed: '', incline: '', completed: false };
      const prevSet = prevData && prevData.sets && prevData.sets[0] ? prevData.sets[0] : null;

      const row = document.createElement('div');
      row.className = 'set-row ' + (isStairs ? 'set-row-cardio-2' : 'set-row-cardio-3') + (set.completed ? ' set-completed' : '');
      row.dataset.setIndex = 0;

      const checkIcon = set.completed
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : '';

      if (isStairs) {
        row.innerHTML = `
          <span class="set-number">1</span>
          <div class="set-input-wrap">
            <input type="number" class="set-input set-input-time" inputmode="numeric"
                   value="${set.time !== undefined ? set.time : ''}" placeholder="${prevSet && prevSet.time ? prevSet.time : 'min'}"
                   data-exercise="${exerciseId}" data-index="0" data-field="time"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <div class="set-input-wrap">
            <input type="number" class="set-input set-input-speed" inputmode="numeric"
                   value="${set.speed !== undefined ? set.speed : ''}" placeholder="${prevSet && prevSet.speed ? prevSet.speed : 'level'}"
                   data-exercise="${exerciseId}" data-index="0" data-field="speed"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <button class="set-check ${set.completed ? 'checked' : ''}"
                  data-exercise="${exerciseId}" data-index="0"
                  aria-label="Complete cardio session">
            ${checkIcon}
          </button>
        `;
      } else {
        row.innerHTML = `
          <span class="set-number">1</span>
          <div class="set-input-wrap">
            <input type="number" class="set-input set-input-time" inputmode="numeric"
                   value="${set.time !== undefined ? set.time : ''}" placeholder="${prevSet && prevSet.time ? prevSet.time : 'min'}"
                   data-exercise="${exerciseId}" data-index="0" data-field="time"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <div class="set-input-wrap">
            <input type="number" step="0.1" class="set-input set-input-speed" inputmode="decimal"
                   value="${set.speed !== undefined ? set.speed : ''}" placeholder="${prevSet && prevSet.speed ? prevSet.speed : 'km/h'}"
                   data-exercise="${exerciseId}" data-index="0" data-field="speed"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <div class="set-input-wrap">
            <input type="number" class="set-input set-input-incline" inputmode="numeric"
                   value="${set.incline !== undefined ? set.incline : ''}" placeholder="${prevSet && prevSet.incline ? prevSet.incline : '%'}"
                   data-exercise="${exerciseId}" data-index="0" data-field="incline"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <button class="set-check ${set.completed ? 'checked' : ''}"
                  data-exercise="${exerciseId}" data-index="0"
                  aria-label="Complete cardio session">
            ${checkIcon}
          </button>
        `;
      }
      grid.appendChild(row);

    } else {
      // Standard Strength Rows
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
        const prevSet = prevData && prevData.sets && prevData.sets[idx] ? prevData.sets[idx] : null;

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
                   value="${set.kg !== undefined ? set.kg : ''}" placeholder="${prevSet && (prevSet.kg !== '' && prevSet.kg !== undefined) ? prevSet.kg : '--'}"
                   data-exercise="${exerciseId}" data-index="${idx}" data-field="kg"
                   ${set.completed ? 'disabled' : ''} />
          </div>
          <div class="set-input-wrap">
            <input type="number" class="set-input set-input-reps" inputmode="numeric"
                   value="${set.reps !== undefined ? set.reps : ''}" placeholder="${prevSet && (prevSet.reps !== '' && prevSet.reps !== undefined) ? prevSet.reps : '--'}"
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
    }

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
        renderSets(exId, containerEl, setsCount, currentVol, currentDay, exMeta);
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
    exData.sets[setIndex][field] = value !== '' ? (isNaN(Number(value)) ? value : Number(value)) : '';
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
      if (typeof window !== 'undefined' && window.MareTimer) MareTimer.start();
    } else {
      if (typeof window !== 'undefined' && window.MareTimer && MareTimer.isRunning()) MareTimer.skip();
    }

    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('mare_set_toggled', {
        detail: { exerciseId, setIndex, completed: set.completed }
      }));
    }
  }

  function getSessionSummary(dateString) {
    const session = data.sessions[dateString];
    if (!session) return { completedSets: 0, totalVolume: 0, totalCardioMin: 0, title: '' };

    let completedSets = 0;
    let totalVolume = 0;
    let totalCardioMin = 0;

    let title = '';
    if (typeof window !== 'undefined' && window.MARE_DATA && (session.plan || session.volume) && session.day) {
      const p = session.plan || session.volume;
      const planKey = (p === 'custom' || p === 'plan1' || p === 'vol1') ? 'plan1' : 'plan2';
      const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
      const plan = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
      if (plan && plan.days && plan.days[session.day]) {
        title = plan.days[session.day].title;
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
            if (set.time) {
              totalCardioMin += Number(set.time);
            }
          }
        });
      }
    }

    return { completedSets, totalVolume: Math.round(totalVolume), totalCardioMin, title };
  }

  function getHistory(exerciseId, limit) {
    limit = limit || 5;
    const history = [];

    // Search completed sessions first
    if (Array.isArray(data.completedSessions)) {
      for (const sess of data.completedSessions) {
        if (sess && Array.isArray(sess.exercises)) {
          const ex = sess.exercises.find((e) => e.id === exerciseId);
          if (ex) {
            history.push({ date: sess.date, data: ex, timestamp: sess.timestamp });
            if (history.length >= limit) return history;
          }
        }
      }
    }

    // Legacy fallback
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
    if (parsed && (parsed.sessions || parsed.completedSessions)) {
      data = {
        sessions: parsed.sessions || {},
        completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : []
      };
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
    importData,
    findPreviousSession,
    getPreviousExerciseData,
    completeCurrentWorkout,
    undoLastCompletion,
    getCompletedSessions,
    isProgressiveOverload
  };

  return api;
})();

if (typeof window !== 'undefined') {
  window.MareTracker = MareTracker;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareTracker = MareTracker;
}
