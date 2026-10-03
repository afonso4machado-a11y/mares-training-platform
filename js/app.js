/**
 * MARE Atelier — App Controller (v2 Matte 3D & Day-Aware)
 * Handles view routing, day-aware auto-selection, physical transitions, and modal sheets.
 */
const MareApp = (function () {
  'use strict';

  // ── State ──
  let currentView = 'home';
  let activeDay = null;
  let transitionLock = false;

  // ── DOM Cache ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

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

  // ── View Router with Physical Shared-Element Zoom ──
  function navigateTo(viewId, triggerEl) {
    if (transitionLock || viewId === currentView) return;
    transitionLock = true;

    const fromView = $('#view-' + currentView);
    const toView = $('#view-' + viewId);

    if (!toView) { transitionLock = false; return; }

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

        onViewEnter(viewId);

        setTimeout(() => {
          toView.classList.remove('view-entering');
          transitionLock = false;
        }, 340);
      }, 360);
    } else {
      // Physical exit transition for back navigation
      fromView.classList.add('view-exiting');

      setTimeout(() => {
        fromView.classList.remove('view-active', 'view-exiting');
        toView.classList.add('view-active');
        toView.classList.add('view-entering');
        currentView = viewId;

        if (viewId === 'home') {
          renderHome();
          animateHomeCards();
        } else {
          onViewEnter(viewId);
        }

        setTimeout(() => {
          toView.classList.remove('view-entering');
          transitionLock = false;
        }, 340);
      }, 190);
    }
  }

  function goHome() {
    navigateTo('home', null);
  }

  // ── Home Screen ──
  function renderHome() {
    const todayKey = getTodayKey();
    const volume = MareEditor.getActiveVolume();
    const volKey = volume === 'custom' ? 'vol1' : volume;
    const volData = MARE_DATA.volumes[volKey];
    const dayData = volData ? volData.days[todayKey] : null;

    const todayLabel = $('#home-today-label');
    if (todayLabel && dayData) {
      todayLabel.textContent = DAY_NAMES[todayKey] + ' — ' + dayData.title;
    }
  }

  function animateHomeCards() {
    const cards = $$('.home-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.96)';
      setTimeout(() => {
        card.style.transition = 'opacity 450ms cubic-bezier(0.2, 0.9, 0.3, 1), transform 450ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, 70 * i);
    });
  }

  // ── Parallax ──
  function initParallax() {
    if (!window.DeviceOrientationEvent) return;

    window.addEventListener('deviceorientation', (e) => {
      const cards = $$('.home-card');
      if (!cards.length || currentView !== 'home') return;

      const tiltX = (e.gamma || 0) / 45;
      const tiltY = (e.beta || 0) / 45;

      cards.forEach((card, i) => {
        const depth = (i + 1) * 2;
        card.style.transform = `translate3d(${tiltX * depth}px, ${tiltY * depth}px, 0)`;
      });
    }, { passive: true });
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
    const volume = MareEditor.getActiveVolume();
    const day = activeDay || getTodayKey();
    activeDay = day;

    // Update volume toggle buttons
    $$('.vol-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.volume === volume);
    });

    // Update day chips & scroll active day chip into center view
    $$('#workout-weekday-track .day-chip').forEach((chip) => {
      const isAct = chip.dataset.day === day;
      chip.classList.toggle('active', isAct);
      if (isAct) {
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    const volKey = volume === 'custom' ? 'vol1' : volume;
    const volData = MARE_DATA.volumes[volKey];
    const dayMeta = volData ? volData.days[day] : null;

    const titleEl = $('#workout-day-title');
    const focusEl = $('#workout-day-focus');
    const listEl = $('#exercise-list');

    if (titleEl && dayMeta) titleEl.textContent = dayMeta.title;
    if (focusEl && dayMeta) focusEl.textContent = dayMeta.focus;
    if (!listEl) return;

    listEl.innerHTML = '';

    // Handle Weekend Days (Saturday & Sunday)
    if (day === 'sat' || day === 'sun') {
      renderWeekendCard(listEl, dayMeta);
      return;
    }

    // Handle Wednesday Cardio
    if (dayMeta && dayMeta.type === 'cardio') {
      renderCardioDay(listEl, dayMeta, volKey);
      return;
    }

    // Strength Days
    const exercises = MareEditor.getEffectiveDay(day);

    if (!exercises || exercises.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No exercises configured for this day.</p>';
      return;
    }

    if (day === 'fri') {
      renderFridayDay(listEl, exercises, dayMeta, volume, day);
    } else {
      exercises.forEach((ex, i) => {
        listEl.appendChild(createExerciseCard(ex, i, volume, day));
      });
    }

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

  // ── Weekend Rest Screen (3D Solid Breathing Sphere) ──
  function renderWeekendCard(container, dayMeta) {
    const isSat = dayMeta.id.includes('sat');
    const wrap = document.createElement('div');
    wrap.className = 'weekend-rest-container';

    wrap.innerHTML = `
      <div class="weekend-rest-card">
        <div class="breathing-sphere-wrap">
          <div class="breathing-sphere"></div>
        </div>
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
      </div>
    `;

    container.appendChild(wrap);
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
          <span class="ex-prescription">${ex.sets || ''} &times; ${ex.reps || ''}</span>
          <span class="ex-rep-unit">${ex.repUnit || 'reps'}</span>
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
      MareTracker.renderSets(ex.id, setsContainer, setsCount, volume, day);
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

  function renderCardioDay(container, dayMeta, volKey) {
    const volData = MARE_DATA.volumes[volKey];
    const dayData = volData ? volData.days['wed'] : null;

    if (!dayData || !dayData.cardioOptions) return;

    let html = '';

    if (dayData.intro) {
      html += `<p class="cardio-intro">${dayData.intro}</p>`;
    }

    html += '<div class="cardio-grid">';

    dayData.cardioOptions.forEach((opt) => {
      const imgHtml = opt.image
        ? `<img class="cardio-img" src="images/${opt.image}" alt="${opt.title}" loading="lazy" />`
        : '';

      html += `
        <div class="cardio-option-card">
          ${imgHtml}
          <div class="cardio-option-body">
            <h3 class="cardio-option-title">${opt.title}</h3>
            ${opt.desc ? `<p class="cardio-option-desc">${opt.desc}</p>` : ''}
            ${opt.badge ? `<span class="cardio-badge">${opt.badge}</span>` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
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

      const volKey = volume === 'custom' ? 'vol1' : volume;
      const volData = MARE_DATA.volumes[volKey];
      if (volData && volData.days.fri && volData.days.fri.circuitTip) {
        const tip = document.createElement('div');
        tip.className = 'coaching-tip';
        tip.innerHTML = `<strong>Circuit Protocol:</strong> ${volData.days.fri.circuitTip}`;
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

  // ── History View (Strictly Named 'History') ──
  function renderLog() {
    const container = $('#log-content');
    if (!container) return;

    const allData = JSON.parse(localStorage.getItem('mare_workout_log') || '{"sessions":{}}');
    const sessions = allData.sessions || {};
    const dates = Object.keys(sessions).sort().reverse();

    if (dates.length === 0) {
      container.innerHTML = '<p class="empty-state">No workout history recorded yet. Complete sets in Workouts to populate your archive.</p>';
      return;
    }

    let html = '';
    dates.slice(0, 30).forEach((date) => {
      const session = sessions[date];
      const summary = MareTracker.getSessionSummary(date);

      const volLabel = session.volume === 'vol1' ? 'Volume I' : session.volume === 'vol2' ? 'Volume II' : 'Custom';
      const dayLabel = DAY_NAMES[session.day] || 'Training Session';

      html += `
        <div class="log-card">
          <div class="log-date-header">
            <span class="log-date">${formatDate(date)}</span>
            <span class="log-volume">${volLabel}</span>
          </div>
          <p class="log-day-title">${dayLabel} — ${summary.title || 'Completed Session'}</p>
          <div class="log-stats">
            <span class="log-stat">${summary.completedSets} sets recorded</span>
            ${summary.totalVolume > 0 ? `<span class="log-stat">${summary.totalVolume} kg volume</span>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return d.toLocaleDateString('en-GB', options);
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
          <p class="install-step"><strong>Android / Chrome:</strong></p>
          <ol class="install-steps-list">
            <li>Tap the three-dot menu in Chrome</li>
            <li>Select "Add to Home screen" or "Install App"</li>
          </ol>
        </div>
      </div>

      <div class="settings-group">
        <p class="settings-credit">MARE • Atelier — Dedicated Training Companion</p>
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
    // Home card clicks
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

      // Volume toggle buttons
      const volBtn = e.target.closest('.vol-btn');
      if (volBtn) {
        MareEditor.setActiveVolume(volBtn.dataset.volume);
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    MareTimer.init();
    renderHome();
    animateHomeCards();
    bindEvents();

    const unlockHandler = () => {
      if (window.MareTimer && window.MareTimer.unlockAudio) {
        window.MareTimer.unlockAudio();
      }
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((perm) => {
          if (perm === 'granted') initParallax();
        }).catch(() => {});
      } else {
        initParallax();
      }
    };
    document.addEventListener('touchstart', unlockHandler, { once: true });
    document.addEventListener('click', unlockHandler, { once: true });
  }

  // ── Public API ──
  return {
    init,
    navigateTo,
    goHome,
    renderWorkouts,
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

// Boot
document.addEventListener('DOMContentLoaded', MareApp.init);
