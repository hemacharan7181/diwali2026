(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  const context = canvas.getContext("2d", { alpha: true });
  const slides = [...document.querySelectorAll(".slide")];
  const openButton = document.getElementById("openButton");
  const replayButton = document.getElementById("replayButton");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = document.getElementById("soundLabel");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colors = ["#ffd7ee", "#f7b4dc", "#d9ceff", "#fff4d6", "#f9c5a6"];
  const rockets = [];
  const particles = [];
  let slideIndex = 0;
  let animationFrame = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let audioContext = null;
  let audioGain = null;
  let ambientNodes = [];
  let soundOn = false;

  const random = (min, max) => Math.random() * (max - min) + min;
  const choose = (items) => items[Math.floor(Math.random() * items.length)];

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function createBurst(x, y, color, size = 1) {
    const count = Math.round((width < 600 ? 38 : 62) * size);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + random(-0.035, 0.035);
      const speed = random(1.2, 4.1) * size;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: random(42, 84), maxLife: 84, size: random(1, 2.4) * size,
        color, gravity: random(0.018, 0.045), drag: 0.985
      });
    }
    if (soundOn) playPop();
  }

  function launch(x = random(width * 0.12, width * 0.88), targetY = random(height * 0.15, height * 0.42), size = 1) {
    rockets.push({ x, y: height + 12, targetY, vy: random(-8.8, -10.8), color: choose(colors), size, trail: [] });
  }

  function update(delta) {
    const step = Math.min(delta / 16.67, 2);
    rockets.forEach((rocket, index) => {
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 10) rocket.trail.shift();
      rocket.y += rocket.vy * step;
      rocket.vy += 0.055 * step;
      if (rocket.y <= rocket.targetY || rocket.vy >= -1) {
        createBurst(rocket.x, rocket.y, rocket.color, rocket.size);
        rockets.splice(index, 1);
      }
    });
    particles.forEach((particle, index) => {
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vx *= Math.pow(particle.drag, step);
      particle.vy = particle.vy * Math.pow(particle.drag, step) + particle.gravity * step;
      particle.life -= step;
      if (particle.life <= 0) particles.splice(index, 1);
    });
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    rockets.forEach((rocket) => {
      context.beginPath();
      rocket.trail.forEach((point, index) => {
        context.globalAlpha = index / rocket.trail.length;
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.strokeStyle = rocket.color;
      context.lineWidth = 1.5;
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = "#fff8fb";
      context.shadowBlur = 12;
      context.shadowColor = rocket.color;
      context.fillRect(rocket.x - 1, rocket.y - 1, 2, 2);
      context.shadowBlur = 0;
    });
    particles.forEach((particle) => {
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.shadowBlur = 8;
      context.shadowColor = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  function animate(timestamp) {
    const delta = timestamp - lastFrame;
    lastFrame = timestamp;
    update(delta || 16.67);
    draw();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function scheduleAtmosphere() {
    if (reduceMotion.matches) return;
    window.setTimeout(() => {
      if (slideIndex > 0) launch(undefined, random(height * 0.18, height * 0.45), 0.65);
      scheduleAtmosphere();
    }, random(1700, 3200));
  }

  function showSlide(nextIndex) {
    slideIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
    slides.forEach((slide, index) => {
      const active = index === slideIndex;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    if (slideIndex === slides.length - 1 && !reduceMotion.matches) {
      for (let i = 0; i < 7; i += 1) window.setTimeout(() => launch(random(width * 0.08, width * 0.92), random(height * 0.12, height * 0.4), 1.1), i * 220);
    }
  }

  function playPop() {
    if (!audioContext || !audioGain) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(random(280, 420), audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(90, audioContext.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.connect(gain).connect(audioGain);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  function startAmbient() {
    if (!audioContext || ambientNodes.length) return;
    const frequencies = [220, 277.18, 329.63];
    ambientNodes = frequencies.map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.018;
      oscillator.connect(gain).connect(audioGain);
      oscillator.start();
      return oscillator;
    });
  }

  function stopAmbient() {
    ambientNodes.forEach((oscillator) => {
      oscillator.stop();
      oscillator.disconnect();
    });
    ambientNodes = [];
  }

  function toggleSound() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioGain = audioContext.createGain();
      audioGain.gain.value = 0.28;
      audioGain.connect(audioContext.destination);
    }
    soundOn = !soundOn;
    if (soundOn) {
      audioContext.resume();
      startAmbient();
    } else {
      stopAmbient();
      audioContext.suspend();
    }
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.setAttribute("aria-label", soundOn ? "Turn ambient sound off" : "Turn ambient sound on");
    soundLabel.textContent = soundOn ? "Sound on" : "Sound off";
  }

  openButton.addEventListener("click", () => {
    showSlide(1);
    if (!reduceMotion.matches) {
      for (let i = 0; i < 10; i += 1) window.setTimeout(() => launch(width * (0.12 + (i % 5) * 0.19), random(height * 0.12, height * 0.42), 1.05), i * 100);
    }
  });
  document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => showSlide(slideIndex + 1)));
  replayButton.addEventListener("click", () => {
    rockets.length = 0;
    particles.length = 0;
    showSlide(0);
  });
  soundToggle.addEventListener("click", toggleSound);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && slideIndex > 0) showSlide(slideIndex + 1);
    if (event.key === "ArrowLeft" && slideIndex > 0) showSlide(slideIndex - 1);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    }
  });

  resizeCanvas();
  showSlide(0);
  animationFrame = window.requestAnimationFrame(animate);
  scheduleAtmosphere();
})();
