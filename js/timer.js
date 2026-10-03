/**
 * MARE Atelier — Timer Module
 * Volumetric analog rest timer with circular SVG ring, web audio chime, and haptic feedback.
 */
const MareTimer = (function () {
  'use strict';

  let overlay, timeEl, ring;
  let animationId = null;
  let startTime = null;
  let duration = 0;
  let remaining = 0;
  let preset = 90;
  let audioCtx = null;
  const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54 -> 339.292

  function unlockAudio() {
    if (!audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      } catch (e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function init() {
    if (document.getElementById && document.getElementById('timer-overlay')) return;

    const savedPreset = typeof localStorage !== 'undefined' ? localStorage.getItem('mare_timer_preset') : null;
    if (savedPreset) preset = parseInt(savedPreset, 10);

    const el = document.createElement('div');
    el.className = 'timer-overlay hidden';
    el.id = 'timer-overlay';
    el.innerHTML = `
      <div class="timer-container">
        <svg class="timer-svg" viewBox="0 0 120 120">
          <circle class="timer-bg" cx="60" cy="60" r="54" />
          <circle class="timer-ring" cx="60" cy="60" r="54"
                  stroke-dasharray="${CIRCUMFERENCE}"
                  stroke-dashoffset="0" id="timer-ring-el" />
        </svg>
        <span class="timer-time" id="timer-time">${preset}</span>
      </div>
      <div class="timer-controls">
        <button class="timer-btn" id="timer-extend">+30s</button>
        <button class="timer-btn timer-btn-skip" id="timer-skip">Skip</button>
      </div>
    `;

    if (document.body && document.body.appendChild) {
      document.body.appendChild(el);
    }

    overlay = el;
    timeEl = el.querySelector ? el.querySelector('#timer-time') : null;
    ring = el.querySelector ? el.querySelector('#timer-ring-el') : null;

    const btnExtend = el.querySelector ? el.querySelector('#timer-extend') : null;
    const btnSkip = el.querySelector ? el.querySelector('#timer-skip') : null;

    if (btnExtend) btnExtend.addEventListener('click', () => extend(30));
    if (btnSkip) btnSkip.addEventListener('click', skip);
  }

  function playBeep() {
    try {
      unlockAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  }

  function onComplete() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }
    playBeep();
    setTimeout(hide, 2000);
  }

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    remaining = Math.max(0, duration - elapsed);

    if (timeEl) timeEl.textContent = Math.ceil(remaining);

    const progress = remaining / duration;
    if (ring && ring.style) {
      ring.style.strokeDashoffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);
    }

    if (remaining > 0) {
      animationId = requestAnimationFrame(tick);
    } else {
      animationId = null;
      onComplete();
    }
  }

  function show() {
    if (!overlay) init();
    if (overlay && overlay.classList) overlay.classList.remove('hidden');
  }

  function hide() {
    if (overlay && overlay.classList) overlay.classList.add('hidden');
  }

  function start(seconds) {
    if (!overlay) init();
    duration = seconds || preset;
    startTime = null;
    remaining = duration;

    if (timeEl) timeEl.textContent = Math.ceil(duration);
    if (ring && ring.style) ring.style.strokeDashoffset = '0';

    show();

    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(tick);
  }

  function extend(seconds) {
    if (!isRunning()) return;
    duration += seconds;
    remaining += seconds;
    startTime = performance.now ? performance.now() - ((duration - remaining) * 1000) : Date.now();
  }

  function skip() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    remaining = 0;
    if (timeEl) timeEl.textContent = '0';
    if (ring && ring.style) ring.style.strokeDashoffset = CIRCUMFERENCE;
    hide();
  }

  function isRunning() {
    return animationId !== null;
  }

  function setPreset(seconds) {
    preset = seconds;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mare_timer_preset', String(preset));
    }
  }

  const api = {
    init,
    start,
    extend,
    skip,
    isRunning,
    setPreset,
    unlockAudio
  };

  return api;
})();

if (typeof window !== 'undefined') {
  window.MareTimer = MareTimer;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareTimer = MareTimer;
}
