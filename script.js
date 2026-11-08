(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const canvas = $("#sky");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d", { alpha: true }) : null;
  const slides = $$(".slide");
  const openButton = $("#openButton");
  const replayButton = $("#replayButton");
  const soundToggle = $("#soundToggle");
  const soundLabel = $("#soundLabel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!slides.length || !openButton || !replayButton) {
    console.error("Diwali experience: required HTML elements are missing.");
    return;
  }

  const colors = ["#ffd7ee", "#f7b4dc", "#d9ceff", "#fff4d6", "#f9c5a6", "#ffffff"];
  const rockets = [];
  const particles = [];
  const MAX_ROCKETS = 18;
  const MAX_PARTICLES = 1500;
  let currentSlide = 0;
  let rafId = 0;
  let lastTime = 0;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let audioContext = null;
  let masterGain = null;
  let ambientOscillators = [];
  let soundEnabled = false;
  let lastLaunch = 0;
  let pageVisible = !document.hidden;

  const random = (min, max) => Math.random() * (max - min) + min;
  const pick = (array) => array[Math.floor(Math.random() * array.length)];

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (!canvas || !ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function launchRocket(x, targetY, scale = 1) {
    if (!ctx || rockets.length >= MAX_ROCKETS) return;
    rockets.push({
      x: x == null ? random(width * 0.08, width * 0.92) : x,
      y: height + 12,
      targetY: targetY == null ? random(height * 0.12, height * 0.42) : targetY,
      vx: random(-0.45, 0.45),
      vy: random(-9.5, -12.2) * scale,
      color: pick(colors),
      scale,
      trail: []
    });
  }

  function burst(x, y, color, scale = 1) {
    const count = Math.round((width < 600 ? 65 : 105) * scale);
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const angle = Math.PI * 2 * i / count + random(-0.04, 0.04);
      const speed = random(1.5, 5.0) * scale;
      particles.push({
        x, y, px: x, py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(48, 88), maxLife: 88,
        radius: random(0.8, 2.1) * scale,
        color, gravity: random(0.025, 0.055), drag: 0.985
      });
    }
    // Bright inner glitter makes the aerial burst read as a large sky-shot.
    for (let i = 0; i < 20 && particles.length < MAX_PARTICLES; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(0.7, 2.2) * scale;
      particles.push({
        x, y, px: x, py: y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: random(28, 55), maxLife: 55, radius: random(1, 2.4),
        color: "#fff8e9", gravity: 0.025, drag: 0.98
      });
    }
    if (soundEnabled) playPop();
  }

  function update(delta) {
    const step = Math.min(Math.max(delta / 16.67, 0.4), 2);
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 12) r.trail.shift();
      r.x += r.vx * step;
      r.y += r.vy * step;
      r.vy += 0.055 * step;
      if (r.y <= r.targetY || r.vy >= -0.8) {
        burst(r.x, r.y, r.color, r.scale);
        rockets.splice(i, 1);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.px = p.x; p.py = p.y;
      p.x += p.vx * step; p.y += p.vy * step;
      p.vx *= Math.pow(p.drag, step);
      p.vy = p.vy * Math.pow(p.drag, step) + p.gravity * step;
      p.life -= step;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const r of rockets) {
      if (r.trail.length > 1) {
        ctx.beginPath();
        r.trail.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 14;
        ctx.shadowColor = r.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = "#fff8fb";
      ctx.shadowBlur = 13;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 7;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function frame(timestamp) {
    if (!pageVisible) return;
    const delta = lastTime ? timestamp - lastTime : 16.67;
    lastTime = timestamp;

    if (!reducedMotion.matches) {
      const interval = currentSlide === 0 ? 2100 : currentSlide === slides.length - 1 ? 650 : 1150;
      if (timestamp - lastLaunch > interval) {
        launchRocket(undefined, random(height * 0.12, height * 0.42), currentSlide === 0 ? 0.95 : 1.15);
        lastLaunch = timestamp;
      }
    }
    update(delta);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function showSlide(index) {
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => {
      const active = i === currentSlide;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      slide.inert = !active;
    });
    if (currentSlide === slides.length - 1 && !reducedMotion.matches) {
      for (let i = 0; i < 9; i++) {
        window.setTimeout(() => launchRocket(random(width * 0.06, width * 0.94), random(height * 0.10, height * 0.38), 1.25), i * 180);
      }
    }
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  }

  function playPop() {
    if (!audioContext || !masterGain || audioContext.state !== "running") return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(random(300, 440), now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.19);
    oscillator.addEventListener("ended", () => { oscillator.disconnect(); gain.disconnect(); }, { once: true });
  }

  function startAmbient() {
    if (!audioContext || ambientOscillators.length) return;
    [220, 277.18, 329.63].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.012;
      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start();
      ambientOscillators.push({ oscillator, gain });
    });
  }

  function stopAmbient() {
    ambientOscillators.forEach(({ oscillator, gain }) => {
      try { oscillator.stop(); } catch (_) {}
      oscillator.disconnect();
      gain.disconnect();
    });
    ambientOscillators = [];
  }

  async function toggleSound() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      soundLabel.textContent = "Audio unavailable";
      return;
    }
    try {
      if (!audioContext) {
        audioContext = new AudioCtor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioContext.destination);
      }
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        await audioContext.resume();
        startAmbient();
      } else {
        stopAmbient();
        await audioContext.suspend();
      }
      soundToggle.setAttribute("aria-pressed", String(soundEnabled));
      soundToggle.setAttribute("aria-label", soundEnabled ? "Turn ambient sound off" : "Turn ambient sound on");
      soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
    } catch (error) {
      soundEnabled = false;
      soundLabel.textContent = "Sound unavailable";
      console.warn("Ambient audio could not start:", error);
    }
  }

  openButton.addEventListener("click", () => {
    showSlide(1);
    if (!reducedMotion.matches) {
      for (let i = 0; i < 12; i++) {
        window.setTimeout(() => launchRocket(width * (0.06 + (i % 6) * 0.17), random(height * 0.10, height * 0.4), 1.25), i * 115);
      }
    }
  });

  // Delegated navigation is resilient if slide contents are later edited.
  $("#experience").addEventListener("click", (event) => {
    const nextButton = event.target.closest("[data-next]");
    if (nextButton) showSlide(currentSlide + 1);
  });

  replayButton.addEventListener("click", () => {
    rockets.length = 0;
    particles.length = 0;
    lastLaunch = 0;
    showSlide(0);
  });

  if (soundToggle) soundToggle.addEventListener("click", toggleSound);

  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && currentSlide < slides.length - 1) showSlide(currentSlide + 1);
    if (event.key === "ArrowLeft" && currentSlide > 0) showSlide(currentSlide - 1);
  });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (!pageVisible) {
      cancelAnimationFrame(rafId);
      lastTime = 0;
    } else if (!rafId || pageVisible) {
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    }
  });

  resizeCanvas();
  showSlide(0);
  if (ctx) rafId = requestAnimationFrame(frame);
  else console.warn("Canvas is unavailable; slide navigation will still work.");
  console.info("Harshi Diwali experience initialized:", slides.length, "slides.");
})();