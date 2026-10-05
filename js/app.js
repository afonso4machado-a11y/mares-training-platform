/**
 * MARE Planning — App Controller (v2 Matte 3D & Day-Aware)
 * Handles view routing, day-aware auto-selection, physical transitions, and modal sheets.
 */
const MareApp = (function () {
  'use strict';

  // ── State ──
  let currentView = 'home';
  let activeDay = null;
  let transitionLock = false;
  let transitionWatchdog = null;
  let initialized = false;
  const preexistingQueue = (typeof window !== 'undefined' && window.MareApp && window.MareApp._queued) ? window.MareApp._queued : null;

  // ── DOM Cache ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Transition Lock with Watchdog ──
  function acquireTransitionLock() {
    transitionLock = true;
    if (transitionWatchdog) clearTimeout(transitionWatchdog);
    transitionWatchdog = setTimeout(() => {
      releaseTransitionLock();
    }, 420);
  }

  function releaseTransitionLock() {
    transitionLock = false;
    if (transitionWatchdog) {
      clearTimeout(transitionWatchdog);
      transitionWatchdog = null;
    }
    document.querySelectorAll('.card-transitioning').forEach((el) => el.remove());
    const toView = $('#view-' + currentView);
    if (toView) toView.classList.remove('view-entering');
  }

  // ── 7-Day Week Mapping ──
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const DAY_NAMES = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday'
  };

  function getTodayKey() {
    const dayIdx = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return DAYS[dayIdx];
  }

  function getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  // ── View Router with Physical Shared-Element Zoom & Safe Watchdog ──
  function navigateTo(viewId, triggerEl) {
    if (typeof window !== 'undefined' && window.MareApp && window.MareApp._queued) {
      window.MareApp._queued = null;
    }
    if (transitionLock || viewId === currentView) return;
    acquireTransitionLock();

    // Remove any leftover transition clones
    document.querySelectorAll('.card-transitioning').forEach((el) => el.remove());

    const fromView = $('#view-' + currentView);
    const toView = $('#view-' + viewId);

    if (!toView) {
      releaseTransitionLock();
      return;
    }

    // Physical card zoom transition from home
    if (currentView === 'home' && triggerEl) {
      const rect = triggerEl.getBoundingClientRect();

      const clone = triggerEl.cloneNode(true);
      clone.classList.add('card-transitioning');
      clone.style.position = 'fixed';
      clone.style.top = rect.top + 'px';
      clone.style.left = rect.left + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.margin = '0';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '100vw';
        clone.style.height = '100vh';
        clone.style.borderRadius = '0';
        clone.style.opacity = '0.08';
      });

      setTimeout(() => {
        clone.remove();
        fromView.classList.remove('view-active');
        toView.classList.add('view-active');
        toView.classList.add('view-entering');
        currentView = viewId;

        try {
          onViewEnter(viewId);
        } catch (err) {
          console.error('Error entering view ' + viewId + ':', err);
        } finally {
          setTimeout(() => {
            toView.classList.remove('view-entering');
            releaseTransitionLock();
          }, 160);
        }
      }, 160);
    } else {
      // Physical exit transition for back navigation
      fromView.classList.add('view-exiting');

      setTimeout(() => {
        fromView.classList.remove('view-active', 'view-exiting');
        toView.classList.add('view-active');
        toView.classList.add('view-entering');
        currentView = viewId;

        try {
          if (viewId === 'home') {
            renderHome();
          } else {
            onViewEnter(viewId);
          }
        } catch (err) {
          console.error('Error entering view ' + viewId + ':', err);
        } finally {
          setTimeout(() => {
            toView.classList.remove('view-entering');
            releaseTransitionLock();
          }, 140);
        }
      }, 140);
    }
  }

  function goHome() {
    navigateTo('home', null);
  }

  // ── Home Screen ──
  function renderHome() {
    const todayKey = getTodayKey();
    const plan = MareEditor.getActivePlan ? MareEditor.getActivePlan() : MareEditor.getActiveVolume();
    const planKey = (plan === 'custom' || plan === 'plan1' || plan === 'vol1') ? 'plan1' : 'plan2';
    const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
    const planData = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
    const dayData = planData ? planData.days[todayKey] : null;

    const todayLabel = $('#home-today-label');
    if (todayLabel && dayData) {
      todayLabel.textContent = DAY_NAMES[todayKey] + ' — ' + dayData.title;
    }
  }

  function onPageResume(persisted) {
    releaseTransitionLock();
    renderHome();
  }

  // ── Workouts View (Day-Aware Auto Routing) ──
  function onViewEnter(viewId) {
    if (viewId === 'workouts') {
      // Automatically default to today's day of week on entry
      activeDay = getTodayKey();
      renderWorkouts();
    } else if (viewId === 'log') {
      renderLog();
    } else if (viewId === 'customize') {
      MareEditor.renderCustomizeView($('#customize-content'));
    } else if (viewId === 'settings') {
      renderSettings();
    }
  }

  function renderWorkouts() {
    const plan = MareEditor.getActivePlan ? MareEditor.getActivePlan() : MareEditor.getActiveVolume();
    const day = activeDay || getTodayKey();
    activeDay = day;

    // Update plan toggle buttons
    $$('.plan-btn, .vol-btn').forEach((btn) => {
      const b = btn.dataset.plan || btn.dataset.volume;
      const isMatch = (b === plan) ||
                      (b === 'plan1' && plan === 'vol1') ||
                      (b === 'plan2' && plan === 'vol2') ||
                      (b === 'vol1' && plan === 'plan1') ||
                      (b === 'vol2' && plan === 'plan2');
      btn.classList.toggle('active', isMatch);
    });

    // Update day chips & scroll active day chip into center view
    $$('#workout-weekday-track .day-chip').forEach((chip) => {
      const isAct = chip.dataset.day === day;
      chip.classList.toggle('active', isAct);
      if (isAct) {
        try {
          if (chip && typeof chip.scrollIntoView === 'function') {
            chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        } catch (e) {}
      }
    });

    const planKey = (plan === 'custom' || plan === 'plan1' || plan === 'vol1') ? 'plan1' : 'plan2';
    const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
    const planData = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
    const dayMeta = planData ? planData.days[day] : null;

    const titleEl = $('#workout-day-title');
    const focusEl = $('#workout-day-focus');
    const listEl = $('#exercise-list');

    if (titleEl && dayMeta) titleEl.textContent = dayMeta.title;
    if (focusEl && dayMeta) focusEl.textContent = dayMeta.focus;
    if (!listEl) return;

    listEl.innerHTML = '';

    // Handle Weekend Days (Saturday & Sunday)
    if (day === 'sat' || day === 'sun') {
      const weekendExercises = MareEditor.getWeekendExercises(day);
      if (weekendExercises && weekendExercises.length > 0) {
        renderWeekendTraining(listEl, weekendExercises, dayMeta, day);
      } else {
        renderWeekendCard(listEl, dayMeta, day);
      }
      return;
    }

    // Handle Wednesday Cardio
    if (dayMeta && dayMeta.type === 'cardio') {
      renderCardioDay(listEl, dayMeta, planKey);
      appendWorkoutDoneButton(listEl, planKey, 'wed');
      return;
    }

    // Strength Days
    const exercises = MareEditor.getEffectiveDay(day);

    if (!exercises || exercises.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No exercises configured for this day.</p>';
      return;
    }

    if (day === 'fri') {
      renderFridayDay(listEl, exercises, dayMeta, plan, day);
    } else {
      exercises.forEach((ex, i) => {
        listEl.appendChild(createExerciseCard(ex, i, plan, day));
      });
    }

    // Append 3D Workout Done button
    appendWorkoutDoneButton(listEl, plan, day);

    // Stagger animation
    const cards = listEl.querySelectorAll('.exercise-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(14px)';
      setTimeout(() => {
        card.style.transition = 'opacity 300ms cubic-bezier(0.2, 0.9, 0.3, 1), transform 300ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50 * i);
    });
  }

  // ── Workout Done Action & Undo Toast ──
  let undoTimeout = null;

  function onWorkoutDoneClick(plan, day) {
    // 1. Dual-textured ascending haptic victory sequence
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 400]);
    }

    // 2. Physical 3D Canvas Confetti celebration
    if (typeof window !== 'undefined' && window.MareConfetti && typeof window.MareConfetti.launch === 'function') {
      window.MareConfetti.launch();
    }

    // 3. Complete and archive session in Tracker
    MareTracker.completeCurrentWorkout(plan, day);

    // 4. Show 4-second floating Undo banner
    showUndoToast(plan, day);

    // 5. Re-render workouts: clean inputs with Ghost Data placeholders
    renderWorkouts();
  }

  function appendWorkoutDoneButton(container, plan, day) {
    const wrap = document.createElement('div');
    wrap.className = 'workout-done-container';
    wrap.innerHTML = `
      <button type="button" class="workout-done-btn" id="btn-workout-done">
        <span>Workout Done!</span>
      </button>
    `;
    container.appendChild(wrap);

    const btn = wrap.querySelector('#btn-workout-done');
    if (btn) {
      btn.addEventListener('click', () => {
        onWorkoutDoneClick(plan, day);
      });
    }
  }

  function showUndoToast(plan, day) {
    const toast = $('#undo-toast');
    if (!toast) return;

    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }

    toast.classList.remove('hidden');
    void toast.offsetWidth;
    toast.classList.add('visible');

    const progressBar = toast.querySelector('.undo-progress-bar');
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '100%';
      void progressBar.offsetWidth;
      progressBar.style.transition = 'width 4000ms linear';
      progressBar.style.width = '0%';
    }

    undoTimeout = setTimeout(() => {
      hideUndoToast();
    }, 4000);
  }

  function hideUndoToast() {
    const toast = $('#undo-toast');
    if (!toast) return;
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 220);
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      undoTimeout = null;
    }
  }

  // ── Weekend Rest Screen (3D Moon & Concentric Gyroscope) ──
  function renderWeekendCard(container, dayMeta, day) {
    if (!dayMeta) {
      dayMeta = {
        id: 'weekend_rest',
        title: 'Rest & Recovery',
        focus: 'Active recovery, hydration & mobility',
        intro: 'Allow muscle fibers to repair, restore glycogen reserves, and replenish central nervous system energy for the upcoming training week.'
      };
    }
    const isSat = (day === 'sat') || (dayMeta.id && dayMeta.id.includes('sat'));
    const wrap = document.createElement('div');
    wrap.className = 'weekend-rest-container';

    const visual3DHtml = isSat
      ? `
        <div class="moon-3d-wrap">
          <div class="moon-body">
            <div class="moon-crater moon-crater-1"></div>
            <div class="moon-crater moon-crater-2"></div>
            <div class="moon-crater moon-crater-3"></div>
            <div class="moon-shadow"></div>
          </div>
        </div>
        <p class="weekend-love-message">I love you from here to the moon liefje</p>
      `
      : `
        <div class="gyroscope-3d-wrap">
          <div class="gyro-ring gyro-ring-outer"></div>
          <div class="gyro-ring gyro-ring-mid"></div>
          <div class="gyro-ring gyro-ring-inner"></div>
        </div>
      `;

    wrap.innerHTML = `
      <div class="weekend-rest-card">
        ${visual3DHtml}
        <h3 class="weekend-rest-title">${dayMeta.title}</h3>
        <p class="weekend-rest-focus">${dayMeta.focus}</p>
        <p class="weekend-rest-desc">${dayMeta.intro || 'Allow muscle fibers to repair, restore glycogen reserves, and replenish central nervous system energy for the upcoming training week.'}</p>
        <div class="weekend-pillars">
          <div class="pillar-item">
            <div class="pillar-title">Hydration & Salt</div>
            <p class="pillar-text">Maintain mineral balance and fluid intake to speed recovery.</p>
          </div>
          <div class="pillar-item">
            <div class="pillar-title">Deep Sleep</div>
            <p class="pillar-text">8-9 hours of restorative sleep to trigger growth hormone release.</p>
          </div>
          <div class="pillar-item">
            <div class="pillar-title">Mobility Walk</div>
            <p class="pillar-text">20-30 min gentle walk to promote blood flow without fatigue.</p>
          </div>
          <div class="pillar-item">
            <div class="pillar-title">Preparation</div>
            <p class="pillar-text">Review upcoming Monday Push session and prepare your schedule.</p>
          </div>
        </div>

        <button class="weekend-add-btn" id="weekend-add-trigger" data-day="${day}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Exercise
        </button>

        <div class="weekend-inline-form hidden" id="weekend-inline-form">
          <h4 class="weekend-form-title">Add Weekend Exercise</h4>
          <input type="text" id="weekend-ex-name" class="editor-input" placeholder="Exercise name (e.g. Mobility Flow)" autocomplete="off" />
          <input type="text" id="weekend-ex-target" class="editor-input" placeholder="Focus (e.g. Hip Mobility)" autocomplete="off" />
          <div class="editor-input-row">
            <input type="number" id="weekend-ex-sets" class="editor-input editor-input-small" placeholder="Sets" value="3" min="1" max="10" />
            <input type="text" id="weekend-ex-reps" class="editor-input editor-input-small" placeholder="Reps (e.g. 10 or 20 min)" value="10" />
          </div>
          <div class="weekend-form-actions">
            <button class="btn-primary weekend-save-btn" id="weekend-save-btn">Add to ${isSat ? 'Saturday' : 'Sunday'}</button>
            <button class="btn-outline weekend-cancel-btn" id="weekend-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(wrap);

    const addTrigger = wrap.querySelector('#weekend-add-trigger');
    const formEl = wrap.querySelector('#weekend-inline-form');
    const saveBtn = wrap.querySelector('#weekend-save-btn');
    const cancelBtn = wrap.querySelector('#weekend-cancel-btn');

    if (addTrigger && formEl) {
      addTrigger.addEventListener('click', () => {
        addTrigger.classList.add('hidden');
        formEl.classList.remove('hidden');
        const nameIn = formEl.querySelector('#weekend-ex-name');
        if (nameIn) nameIn.focus();
      });
    }

    if (cancelBtn && formEl && addTrigger) {
      cancelBtn.addEventListener('click', () => {
        formEl.classList.add('hidden');
        addTrigger.classList.remove('hidden');
      });
    }

    if (saveBtn && formEl) {
      saveBtn.addEventListener('click', () => {
        const nameIn = formEl.querySelector('#weekend-ex-name');
        const targetIn = formEl.querySelector('#weekend-ex-target');
        const setsIn = formEl.querySelector('#weekend-ex-sets');
        const repsIn = formEl.querySelector('#weekend-ex-reps');

        const name = nameIn.value.trim();
        if (!name) {
          nameIn.focus();
          return;
        }

        MareEditor.addWeekendExercise(day, {
          name,
          target: targetIn.value.trim() || 'General Focus',
          sets: parseInt(setsIn.value, 10) || 3,
          reps: repsIn.value.trim() || '10'
        });

        renderWorkouts();
      });
    }
  }

  // ── Weekend Training Screen with Scale-up Reveal & Revert ──
  function renderWeekendTraining(container, exercises, dayMeta, day) {
    const isSat = day === 'sat';
    const dayLabel = isSat ? 'Saturday' : 'Sunday';

    const headerBar = document.createElement('div');
    headerBar.className = 'weekend-training-header';
    headerBar.innerHTML = `
      <div class="weekend-training-badge">Customized ${dayLabel}</div>
      <button class="weekend-revert-btn" data-day="${day}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Back to Rest Day
      </button>
    `;
    container.appendChild(headerBar);

    exercises.forEach((ex, i) => {
      const activePlan = MareEditor.getActivePlan ? MareEditor.getActivePlan() : MareEditor.getActiveVolume();
      const card = createExerciseCard(ex, i, activePlan, day);
      card.style.opacity = '0';
      card.style.transform = 'scale(0.92) translateY(10px)';
      container.appendChild(card);
      setTimeout(() => {
        card.style.transition = 'opacity 320ms cubic-bezier(0.2, 0.9, 0.3, 1), transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1) translateY(0)';
      }, 50 * i);
    });

    headerBar.querySelector('.weekend-revert-btn').addEventListener('click', () => {
      MareEditor.clearWeekendExercises(day);
      renderWorkouts();
    });

    const activePlan = MareEditor.getActivePlan ? MareEditor.getActivePlan() : MareEditor.getActiveVolume();
    appendWorkoutDoneButton(container, activePlan, day);
  }

  // ── Exercise Card with Hero Media & Skeleton Shimmer ──
  function createExerciseCard(ex, index, volume, day) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = ex.id;

    const imgSrc = ex.image ? 'images/' + ex.image : '';
    
    let mediaHtml = '';
    if (imgSrc) {
      mediaHtml = `
        <div class="ex-media-hero skeleton-shimmer" data-ex-img="${imgSrc}" data-ex-title="${ex.name}" data-ex-target="${ex.target || ''}" data-ex-notes="${ex.notes || ''}">
          <img class="img-loading" src="${imgSrc}" alt="${ex.name}" loading="lazy" />
        </div>
      `;
    } else {
      mediaHtml = `
        <div class="ex-media-hero placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      `;
    }

    const setsCount = Number(ex.sets) || 3;
    const noteHtml = ex.notes ? `<p class="ex-note">${ex.notes}</p>` : '';
    const personalNote = MareEditor.getNote(ex.id);
    const personalNoteHtml = personalNote ? `<p class="ex-personal-note">${personalNote}</p>` : '';
    const supersetHtml = ex.supersetWith ? '<span class="ex-badge badge-superset">Superset</span>' : '';
    const circuitHtml = ex.isCircuit ? '<span class="ex-badge badge-circuit">Circuit</span>' : '';

    // Sister exercise swap button (SVG exchange arrows)
    const hasSister = MARE_DATA.sisterMap && (MARE_DATA.sisterMap[ex.id] || MARE_DATA.sisterMap[ex._originalId]);
    const swapHtml = hasSister ? `
      <button class="ex-swap-btn" data-exercise="${ex.id}" aria-label="Swap exercise with counterpart">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </button>` : '';

    card.innerHTML = `
      ${mediaHtml}
      <div class="ex-content-body">
        <div class="ex-info-block">
          <div class="ex-title-row">
            <span class="ex-number-tag">#${index + 1}</span>
            <h3 class="ex-name">${ex.name}</h3>
            ${supersetHtml}${circuitHtml}
          </div>
          <p class="ex-target">${ex.target || ''}</p>
          ${noteHtml}
          ${personalNoteHtml}
        </div>
        <div class="ex-meta-actions">
          <span class="ex-prescription">${ex.inputType === 'cardio' ? (ex.reps || '20-30 min') : (ex.sets || '') + ' &times; ' + (ex.reps || '')}</span>
          <span class="ex-rep-unit">${ex.inputType === 'cardio' ? (ex.repUnit || 'min') : (ex.repUnit || 'reps')}</span>
          ${swapHtml}
        </div>
      </div>
      <div class="ex-sets-container" id="sets-${ex.id}"></div>
    `;

    // Skeleton shimmer removal on image load
    const imgEl = card.querySelector('.ex-media-hero img');
    const heroWrap = card.querySelector('.ex-media-hero');
    if (imgEl && heroWrap) {
      if (imgEl.complete) {
        imgEl.classList.remove('img-loading');
        imgEl.classList.add('img-loaded');
        heroWrap.classList.remove('skeleton-shimmer');
      } else {
        imgEl.addEventListener('load', () => {
          imgEl.classList.remove('img-loading');
          imgEl.classList.add('img-loaded');
          heroWrap.classList.remove('skeleton-shimmer');
        });
      }
    }

    // Render set tracking grid
    const setsContainer = card.querySelector('.ex-sets-container');
    if (setsContainer && !ex.isCircuit) {
      MareTracker.renderSets(ex.id, setsContainer, setsCount, volume, day, ex);
    }

    // Swap button handler
    const swapBtn = card.querySelector('.ex-swap-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        MareEditor.swapExercise(ex.id);
        renderWorkouts();
      });
    }

    // Tap hero image to open solid detail modal
    if (heroWrap && imgSrc) {
      heroWrap.addEventListener('click', () => {
        openDetailModal({
          name: ex.name,
          target: ex.target || '',
          notes: ex.notes || '',
          image: imgSrc
        });
      });
    }

    return card;
  }

  function renderCardioDay(container, dayMeta, planKey) {
    const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
    const planData = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
    const dayData = planData ? planData.days['wed'] : null;

    if (!dayData) return;

    if (dayData.intro) {
      const introP = document.createElement('p');
      introP.className = 'cardio-intro';
      introP.textContent = dayData.intro;
      container.appendChild(introP);
    }

    const exercises = dayData.exercises || [];
    exercises.forEach((ex, i) => {
      container.appendChild(createExerciseCard(ex, i, planKey, 'wed'));
    });
  }

  function renderFridayDay(container, exercises, dayMeta, volume, day) {
    const lowerExercises = exercises.filter((ex) => !ex.isCircuit);
    const absExercises = exercises.filter((ex) => ex.isCircuit);

    // Lower Body
    const lowerSection = document.createElement('div');
    lowerSection.className = 'friday-section';
    lowerSection.innerHTML = '<h3 class="section-label">Lower Body</h3>';
    lowerExercises.forEach((ex, i) => {
      lowerSection.appendChild(createExerciseCard(ex, i, volume, day));
    });
    container.appendChild(lowerSection);

    // Abs Circuit
    if (absExercises.length > 0) {
      const absSection = document.createElement('div');
      absSection.className = 'friday-section';
      absSection.innerHTML = `
        <div class="section-label-row">
          <h3 class="section-label">Ab Circuit</h3>
          <span class="circuit-tag">3 Rounds</span>
        </div>
      `;
      absExercises.forEach((ex, i) => {
        absSection.appendChild(createExerciseCard(ex, lowerExercises.length + i, volume, day));
      });

      const planKey = (volume === 'custom' || volume === 'plan1' || volume === 'vol1') ? 'plan1' : 'plan2';
      const plansSource = (MARE_DATA.plans || MARE_DATA.volumes);
      const planData = plansSource ? (plansSource[planKey] || plansSource['plan1']) : null;
      if (planData && planData.days.fri && planData.days.fri.circuitTip) {
        const tip = document.createElement('div');
        tip.className = 'coaching-tip';
        tip.innerHTML = `<strong>Circuit Protocol:</strong> ${planData.days.fri.circuitTip}`;
        absSection.appendChild(tip);
      }

      container.appendChild(absSection);
    }
  }

  // ── Solid Detail Modal (iPhone 13 mini Optimized) ──
  function openDetailModal(info) {
    const backdrop = $('#detail-backdrop');
    const sheet = $('#detail-sheet');
    const content = $('#detail-modal-content');
    if (!backdrop || !sheet || !content) return;

    content.innerHTML = `
      <div class="detail-sheet-inner">
        ${info.image ? `<img class="detail-sheet-photo" src="${info.image}" alt="${info.name}" />` : ''}
        <h2 class="detail-sheet-title">${info.name}</h2>
        <p class="detail-sheet-target">${info.target}</p>
        ${info.notes ? `<div class="detail-sheet-note"><strong>Execution Cues:</strong><p>${info.notes}</p></div>` : ''}
        <button class="btn-primary detail-close-btn" id="detail-sheet-close">Close</button>
      </div>
    `;

    backdrop.classList.add('active');
    sheet.classList.add('active');

    const closeBtn = content.querySelector('#detail-sheet-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDetailModal);
  }

  function closeDetailModal() {
    const backdrop = $('#detail-backdrop');
    const sheet = $('#detail-sheet');
    if (backdrop) backdrop.classList.remove('active');
    if (sheet) sheet.classList.remove('active');
  }

  // ── History View (Strictly Granular Anatomical Archive) ──
  function renderLog() {
    const container = $('#log-content');
    if (!container) return;

    const completedSessions = MareTracker.getCompletedSessions();

    if (!completedSessions || completedSessions.length === 0) {
      container.innerHTML = '<p class="empty-state">No workout history recorded yet. Complete sets in Workouts to populate your archive.</p>';
      return;
    }

    let html = '';
    completedSessions.slice(0, 40).forEach((sess) => {
      const planLabel = (sess.plan === 'plan2' || sess.volume === 'vol2' || sess.volume === 'plan2')
        ? 'Plan 2'
        : (sess.plan === 'custom' || sess.volume === 'custom')
        ? 'Custom'
        : 'Plan 1';
      const dayLabel = DAY_NAMES[sess.day] || 'Training Session';

      let totalSets = 0;
      if (Array.isArray(sess.exercises)) {
        sess.exercises.forEach((ex) => {
          if (Array.isArray(ex.sets)) {
            totalSets += ex.sets.filter((st) => st.completed || st.kg || st.time).length;
          }
        });
      }

      const dateDisplay = formatDate(sess.date) + (sess.time ? ' • ' + sess.time : '');

      html += `
        <div class="history-session-card" data-session-id="${sess.id}">
          <div class="session-header" role="button" tabindex="0" aria-expanded="false">
            <div class="session-header-meta">
              <span class="session-date">${dateDisplay}</span>
              <span class="session-plan-badge">${planLabel}</span>
            </div>
            <div class="session-header-main">
              <div class="session-title-wrap">
                <h3 class="session-day-title">${dayLabel} — ${sess.title || 'Completed Session'}</h3>
                <span class="session-sets-count">${totalSets} sets recorded</span>
              </div>
              <div class="session-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="session-body">
            <div class="session-exercises">
      `;

      if (Array.isArray(sess.exercises) && sess.exercises.length > 0) {
        sess.exercises.forEach((ex) => {
          const sets = Array.isArray(ex.sets) ? ex.sets : [];
          const isCardio = ex.isCardio || (ex.id && ex.id.startsWith('cardio_'));

          html += `
            <div class="session-ex-block">
              <h4 class="session-ex-name">${ex.name}</h4>
              <table class="session-table">
                <thead>
                  <tr>
                    <th class="th-set">Set</th>
                    <th class="th-load">${isCardio ? 'Speed / Level' : 'Load (kg)'}</th>
                    <th class="th-reps">${isCardio ? 'Time' : 'Reps'}</th>
                  </tr>
                </thead>
                <tbody>
          `;

          sets.forEach((set, setIdx) => {
            const isOverload = !isCardio && MareTracker.isProgressiveOverload(ex.id, setIdx, set.kg, sess.timestamp);
            const overloadBadge = isOverload ? `<span class="overload-pill">+ Overload</span>` : '';

            let loadText = '--';
            if (isCardio) {
              if (set.speed !== '' && set.speed !== undefined) {
                loadText = set.incline ? `${set.speed} km/h (${set.incline}%)` : `${set.speed}`;
              }
            } else {
              if (set.kg !== '' && set.kg !== undefined) {
                loadText = `${set.kg} kg`;
              }
            }

            let repText = '--';
            if (isCardio) {
              if (set.time !== '' && set.time !== undefined) {
                repText = `${set.time} min`;
              }
            } else {
              if (set.reps !== '' && set.reps !== undefined) {
                repText = `${set.reps}`;
              }
            }

            html += `
              <tr class="${set.completed ? 'set-row-completed' : ''}">
                <td class="td-set">${set.setNumber || (setIdx + 1)}</td>
                <td class="td-load">
                  <span class="load-value">${loadText}</span>
                  ${overloadBadge}
                </td>
                <td class="td-reps">${repText}</td>
              </tr>
            `;
          });

          html += `
                </tbody>
              </table>
            </div>
          `;
        });
      } else {
        html += `<p class="session-no-ex">No exercise breakdown recorded for this session.</p>`;
      }

      html += `
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Bind accordion toggles
    container.querySelectorAll('.history-session-card').forEach((card) => {
      const header = card.querySelector('.session-header');
      if (header) {
        header.addEventListener('click', () => {
          const wasExpanded = card.classList.contains('expanded');
          card.classList.toggle('expanded', !wasExpanded);
          header.setAttribute('aria-expanded', String(!wasExpanded));
        });
      }
    });
  }

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      return d.toLocaleDateString('en-GB', options);
    } catch (e) {
      return dateStr;
    }
  }

  // ── Settings View ──
  function renderSettings() {
    const container = $('#settings-content');
    if (!container) return;

    const currentPreset = parseInt(localStorage.getItem('mare_timer_preset') || '90', 10);

    container.innerHTML = `
      <div class="settings-group">
        <h3 class="settings-title">Rest Timer</h3>
        <p class="settings-desc">Default rest duration triggered after completing a set.</p>
        <div class="timer-preset-row">
          <button class="preset-btn ${currentPreset === 60 ? 'active' : ''}" data-preset="60">60s</button>
          <button class="preset-btn ${currentPreset === 90 ? 'active' : ''}" data-preset="90">90s</button>
          <button class="preset-btn ${currentPreset === 120 ? 'active' : ''}" data-preset="120">120s</button>
        </div>
      </div>

      <div class="settings-group">
        <h3 class="settings-title">Data Backup</h3>
        <p class="settings-desc">Export or restore your weights, custom routines, and exercise notes.</p>
        <button class="btn-outline settings-btn" id="btn-export">Export Workout Data</button>
        <button class="btn-outline settings-btn" id="btn-import">Import Workout Data</button>
        <input type="file" id="import-file" accept=".json" class="hidden" />
        <button class="btn-outline settings-btn btn-danger" id="btn-reset">Reset All Customizations</button>
      </div>

      <div class="settings-group">
        <h3 class="settings-title">Home Screen Installation</h3>
        <div class="install-guide">
          <p class="install-step"><strong>iPhone / Safari:</strong></p>
          <ol class="install-steps-list">
            <li>Tap the Share button at the bottom of Safari</li>
            <li>Scroll down and select "Add to Home Screen"</li>
            <li>Tap "Add" in the top right corner</li>
          </ol>
        </div>
      </div>

      <div class="settings-group">
        <p class="settings-credit">MARE • Planning — Dedicated Training Companion</p>
        <p class="settings-love-signature">This app was made with lots of love from your boyfriend</p>
      </div>
    `;

    // Timer presets
    container.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.preset, 10);
        localStorage.setItem('mare_timer_preset', val);
        MareTimer.setPreset(val);
        container.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Export
    const exportBtn = container.querySelector('#btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = MareTracker.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mare_backup_' + getTodayString() + '.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Import
    const importBtn = container.querySelector('#btn-import');
    const importFile = container.querySelector('#import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            MareTracker.importData(ev.target.result);
            alert('Workout data imported successfully.');
            renderSettings();
          } catch (err) {
            alert('Import failed. Invalid JSON format.');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset
    const resetBtn = container.querySelector('#btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all custom routine modifications and exercise swaps? Logged workout history will be preserved.')) {
          MareEditor.resetToDefaults();
          alert('Customizations have been reset to factory defaults.');
        }
      });
    }
  }

  // ── Event Binding ──
  function bindEvents() {
    // Direct binding on all home cards
    $$('.home-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const target = card.dataset.view;
        if (target) navigateTo(target, card);
      });
    });

    // Delegated listener on document for back buttons, volume toggles, day chips
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.home-card');
      if (card) {
        const target = card.dataset.view;
        if (target) navigateTo(target, card);
        return;
      }

      // Back buttons
      if (e.target.closest('.back-btn')) {
        goHome();
        return;
      }

      // Plan toggle buttons
      const planBtn = e.target.closest('.plan-btn, .vol-btn');
      if (planBtn) {
        const selectedPlan = planBtn.dataset.plan || planBtn.dataset.volume;
        if (MareEditor.setActivePlan) {
          MareEditor.setActivePlan(selectedPlan);
        } else {
          MareEditor.setActiveVolume(selectedPlan);
        }
        renderWorkouts();
        return;
      }

      // Day chips
      const dayChip = e.target.closest('.day-chip');
      if (dayChip) {
        activeDay = dayChip.dataset.day;
        renderWorkouts();
        return;
      }

      // Undo Toast button
      const undoBtn = e.target.closest('#undo-toast-btn');
      if (undoBtn) {
        hideUndoToast();
        const success = MareTracker.undoLastCompletion();
        if (success) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
          }
          renderWorkouts();
        }
        return;
      }
    });

    // Close detail modal on backdrop or drag handle click
    const backdrop = $('#detail-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeDetailModal);
    const dragHandle = $('#detail-drag-handle');
    if (dragHandle) dragHandle.addEventListener('click', closeDetailModal);

    // Swipe back gesture (from left edge)
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (diff > 80 && touchStartX < 30 && currentView !== 'home') {
        goHome();
      }
    }, { passive: true });
  }

  // ── Init ──
  function init() {
    if (initialized) {
      releaseTransitionLock();
      renderHome();
      return;
    }
    initialized = true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        // Force immediate check for new versions on every app launch
        if (reg) reg.update();
      }).catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    MareTimer.init();
    renderHome();
    bindEvents();

    // Check if user tapped a card before scripts finished loading
    if (preexistingQueue) {
      setTimeout(() => {
        navigateTo(preexistingQueue.view, preexistingQueue.el);
      }, 40);
    }

    const unlockAudioHandler = () => {
      if (window.MareTimer && window.MareTimer.unlockAudio) {
        window.MareTimer.unlockAudio();
      }
    };
    document.addEventListener('touchstart', unlockAudioHandler, { once: true, passive: true });
    document.addEventListener('click', unlockAudioHandler, { once: true, passive: true });
  }

  // ── Public API ──
  return {
    init,
    navigateTo,
    goHome,
    renderWorkouts,
    onPageResume,
    getTodayKey,
    getTodayString
  };
})();

if (typeof window !== 'undefined') {
  window.MareApp = MareApp;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareApp = MareApp;
}

// ── Immediate & Resilient Boot ──
function bootMareApp() {
  if (typeof MareApp !== 'undefined' && MareApp.init) {
    MareApp.init();
  }
}

// 1. Boot immediately: all DOM elements in index.html above this script are already parsed
bootMareApp();

// 2. Backup listener on DOMContentLoaded
document.addEventListener('DOMContentLoaded', bootMareApp);

// 3. Backup listener on window load
window.addEventListener('load', bootMareApp);

// 4. BFCache / iOS Safari app resume
window.addEventListener('pageshow', (event) => {
  if (typeof MareApp !== 'undefined') {
    MareApp.onPageResume(event.persisted);
  }
});
