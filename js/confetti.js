/**
 * MARE Planning — Physical 3D Canvas Confetti Engine (v13)
 * Elegant, physics-based 3D particle celebration with solid spheres and tumbling matte cylinders.
 * Strictly platform palette tokens, zero external libraries, zero emojis.
 */
const MareConfetti = (function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let animationId = null;
  let particles = [];
  let startTime = 0;
  const DURATION_MS = 3200;

  // Platform palette tokens
  const PALETTE = [
    { hex: '#d89f95', dark: '#b87c72', light: '#f7ece9' }, // Blush
    { hex: '#b87c72', dark: '#915d55', light: '#e8beb8' }, // Deep Blush
    { hex: '#67826a', dark: '#4f6852', light: '#eaf0eb' }, // Sage
    { hex: '#faf7f4', dark: '#d5c8be', light: '#ffffff' }, // Creme
    { hex: '#beb4ad', dark: '#8a7e78', light: '#e8e2dc' }  // Stone Light
  ];

  function getCanvas() {
    if (!canvas && typeof document !== 'undefined') {
      canvas = document.getElementById('confetti-canvas');
      if (canvas) {
        ctx = canvas.getContext('2d');
      }
    }
    return canvas;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function createParticle(w, h) {
    const isSphere = Math.random() < 0.45;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const size = isSphere ? (5 + Math.random() * 4) : (7 + Math.random() * 5);

    // Initial position staggered across top horizontal zone
    const x = w * (0.1 + Math.random() * 0.8);
    const y = -10 - Math.random() * 60;

    // Velocities: initial burst upwards/outwards then falling with gravity
    const angle = (Math.random() - 0.5) * 1.2;
    const speed = 2 + Math.random() * 5;

    return {
      type: isSphere ? 'sphere' : 'cylinder',
      x,
      y,
      vx: Math.sin(angle) * speed * 1.5,
      vy: Math.cos(angle) * speed * 0.8 + 1.5,
      gravity: 0.18 + Math.random() * 0.08,
      drag: 0.985,
      size,
      width: size * (1.2 + Math.random() * 0.6),
      height: size * (0.55 + Math.random() * 0.35),
      color,
      rx: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 0.12,
      ry: Math.random() * Math.PI * 2,
      vry: 0.06 + Math.random() * 0.14,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05
    };
  }

  function drawSphere(context, p, alpha) {
    const r = p.size;
    const grad = context.createRadialGradient(
      p.x - r * 0.35, p.y - r * 0.35, r * 0.1,
      p.x, p.y, r
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, p.color.hex);
    grad.addColorStop(1, p.color.dark);

    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, alpha));
    context.fillStyle = grad;
    context.beginPath();
    context.arc(p.x, p.y, r, 0, Math.PI * 2);
    context.fill();

    // Subtle 3D shadow rim
    context.strokeStyle = p.color.dark;
    context.lineWidth = 0.5;
    context.stroke();
    context.restore();
  }

  function drawCylinder(context, p, alpha) {
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, alpha));
    context.translate(p.x, p.y);
    context.rotate(p.rx);

    // Simulate 3D tilt with cosine scale
    const tilt = Math.cos(p.ry);
    const absTilt = Math.abs(tilt);
    const scaleY = Math.max(0.12, absTilt);

    context.scale(1, scaleY);

    // Draw main solid cylinder body
    context.fillStyle = tilt >= 0 ? p.color.hex : p.color.dark;
    context.beginPath();
    context.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
    context.fill();

    // Specular highlight rim
    context.strokeStyle = p.color.light;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = elapsed / DURATION_MS;

    if (progress >= 1) {
      cleanup();
      return;
    }

    // Alpha stays 1 for the first 65%, then linearly fades to 0
    let globalAlpha = 1;
    if (progress > 0.65) {
      globalAlpha = 1 - (progress - 0.65) / 0.35;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics update
      p.vx *= p.drag;
      p.vy += p.gravity;
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.8;
      p.y += p.vy;

      p.rx += p.vrx;
      p.ry += p.vry;

      // Render particle
      if (p.type === 'sphere') {
        drawSphere(ctx, p, globalAlpha);
      } else {
        drawCylinder(ctx, p, globalAlpha);
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  function launch() {
    if (typeof window === 'undefined') return;
    const cvs = getCanvas();
    if (!cvs || !ctx) return;

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    resizeCanvas();

    const w = window.innerWidth;
    const h = window.innerHeight;
    particles = [];
    const count = 55;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(w, h));
    }

    startTime = 0;
    cvs.style.display = 'block';
    animationId = requestAnimationFrame(loop);
  }

  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
    particles = [];
    startTime = 0;
  }

  // Handle window resizing
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      if (animationId) resizeCanvas();
    });
  }

  return {
    launch,
    cleanup
  };
})();

if (typeof window !== 'undefined') {
  window.MareConfetti = MareConfetti;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MareConfetti = MareConfetti;
}
