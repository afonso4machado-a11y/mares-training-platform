/**
 * MARE Atelier — App Controller
 * Handles view routing, shared-element transitions, parallax, modal sheets, and event coordination.
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

  // ── Day Map ──
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };
  const TODAY_INDEX = (() => {
    const d = new Date().getDay();
    // 0=Sun, 1=Mon..5=Fri, 6=Sat
    if (d >= 1 && d <= 5) return d - 1;
    return 0; // Default to Monday on weekends
  })();

  // ── Helpers ──
  function getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function getDayOfWeek() {
    return DAYS[TODAY_INDEX];
  }

  // ── View Router ──
  function navigateTo(viewId, triggerEl) {
    if (transitionLock || viewId === currentView) return;
    transitionLock = true;

    const fromView = $('#view-' + currentView);
    const toView = $('#view-' + viewId);

    if (!toView) { transitionLock = false; return; }

    // Shared element transition from home cards
    if (currentView === 'home' && triggerEl) {
      const rect = triggerEl.getBoundingClientRect();

      // Create transition clone
      const clone = triggerEl.cloneNode(true);
      clone.classList.add('card-transitioning');
      clone.style.position = 'fixed';
      clone.style.top = rect.top + 'px';
      clone.style.left = rect.left + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.zIndex = '999';
      clone.style.margin = '0';
      document.body.appendChild(clone);

      // Animate clone to full screen
      requestAnimationFrame(() => {
        clone.style.transition = 'all 380ms cubic-bezier(0.32, 0.72, 0, 1)';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '100vw';
        clone.style.height = '100vh';
        clone.style.borderRadius = '0';
        clone.style.opacity = '0.15';
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
        }, 320);
      }, 350);
    } else {
      // Fade transition for back navigation
      fromView.classList.add('view-exiting');

      setTimeout(() => {
        fromView.classList.remove('view-active', 'view-exiting');
        toView.classList.add('view-active', 'view-entering');
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
        }, 320);
      }, 180);
    }
  }

  function goHome() {
    navigateTo('home', null);
  }

  // ── Home Screen ──
  function renderHome() {
    const todayDay = getDayOfWeek();
    const volume = MareEditor.getActiveVolume();
    const volKey = volume === 'custom' ? 'vol1' : volume;
    const volData = MARE_DATA.volumes[volKey];
    const dayData = volData ? volData.days[todayDay] : null;

    const todayLabel = $('#home-today-label');
    if (todayLabel && dayData) {
      todayLabel.textContent = DAY_NAMES[todayDay] + ' — ' + dayData.title;
    }
  }

  function animateHomeCards() {
    const cards = $$('.home-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 70 * i);
    });
  }

  // ── Parallax (Gyroscope) ──
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

  // ── Workouts View ──
  function onViewEnter(viewId) {
    if (viewId === 'workouts') {
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
    const day = activeDay || getDayOfWeek();
    activeDay = day;

    // Update volume toggle buttons
    $$('.vol-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.volume === volume);
    });

    // Update day chips
    $$('.day-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.day === day);
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

    if (dayMeta && dayMeta.type === 'cardio') {
      renderCardioDay(listEl, dayMeta, volKey);
      return;
    }

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
      card.style.transform = 'translateY(10px)';
      setTimeout(() => {
        card.style.transition = 'opacity 250ms ease-out, transform 250ms ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 40 * i);
    });
  }

  function createExerciseCard(ex, index, volume, day) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = ex.id;

    const imgSrc = ex.image ? 'images/' + ex.image : '';
    const imgHtml = imgSrc
      ? `<div class="ex-thumb-wrapper" data-ex-img="${imgSrc}" data-ex-title="${ex.name}" data-ex-target="${ex.target || ''}" data-ex-notes="${ex.notes || ''}">
           <img class="ex-thumb" src="${imgSrc}" alt="${ex.name}" loading="lazy" />
         </div>`
      : `<div class="ex-thumb-wrapper ex-thumb-placeholder">
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
             <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`;

    const setsCount = Number(ex.sets) || 3;
    const noteHtml = ex.notes ? `<p class="ex-note">${ex.notes}</p>` : '';
    const personalNote = MareEditor.getNote(ex.id);
    const personalNoteHtml = personalNote ? `<p class="ex-personal-note">${personalNote}</p>` : '';
    const supersetHtml = ex.supersetWith ? '<span class="ex-badge badge-superset">Superset</span>' : '';
    const circuitHtml = ex.isCircuit ? '<span class="ex-badge badge-circuit">Circuit</span>' : '';

    // Sister swap button (clean SVG exchange icon)
    const hasSister = MARE_DATA.sisterMap && (MARE_DATA.sisterMap[ex.id] || MARE_DATA.sisterMap[ex._originalId]);
    const swapHtml = hasSister ? `
      <button class="ex-swap-btn" data-exercise="${ex.id}" aria-label="Swap with alternative exercise" title="Swap exercise">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      </button>` : '';

    card.innerHTML = `
      <div class="ex-header">
        ${imgHtml}
        <div class="ex-info">
          <div class="ex-title-row">
            <span class="ex-number">${index + 1}</span>
            <h3 class="ex-name">${ex.name}</h3>
            ${supersetHtml}${circuitHtml}
          </div>
          <p class="ex-target">${ex.target || ''}</p>
          ${noteHtml}
          ${personalNoteHtml}
        </div>
        <div class="ex-meta">
          <span class="ex-prescription">${ex.sets || ''} &times; ${ex.reps || ''}</span>
          <span class="ex-rep-unit">${ex.repUnit || 'reps'}</span>
          ${swapHtml}
        </div>
      </div>
      <div class="ex-sets-container" id="sets-${ex.id}"></div>
    `;

    // Render set tracking grid with current volume and day
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

    // Tap thumbnail to open photo modal
    const thumbWrapper = card.querySelector('.ex-thumb-wrapper[data-ex-img]');
    if (thumbWrapper) {
      thumbWrapper.addEventListener('click', () => {
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

  // ── Exercise Detail Modal ──
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

  // ── Log View ──
  function renderLog() {
    const container = $('#log-content');
    if (!container) return;

    const allData = JSON.parse(localStorage.getItem('mare_workout_log') || '{"sessions":{}}');
    const sessions = allData.sessions || {};
    const dates = Object.keys(sessions).sort().reverse();

    if (dates.length === 0) {
      container.innerHTML = '<p class="empty-state">No sessions logged yet. Check off your sets in Workouts to record your history.</p>';
      return;
    }

    let html = '';
    dates.slice(0, 30).forEach((date) => {
      const session = sessions[date];
      const summary = MareTracker.getSessionSummary(date);

      const volLabel = session.volume === 'vol1' ? 'Volume I' : session.volume === 'vol2' ? 'Volume II' : 'Custom';
      const dayLabel = DAY_NAMES[session.day] || 'Training Day';

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
        if (confirm('Reset all custom routine modifications and exercise swaps? Logged session history will be preserved.')) {
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
    // Register Service Worker for offline PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    // Initialize modules
    MareTimer.init();

    // Render home
    renderHome();
    animateHomeCards();

    // Bind events
    bindEvents();

    // Unlock AudioContext and request Gyroscope on first touch
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
    getDayOfWeek,
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
