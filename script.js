(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const starsCanvas = document.getElementById("stars-canvas");
  const starsCtx = starsCanvas.getContext("2d", { alpha: true });
  const fxCanvas = document.getElementById("fx-canvas");
  const fxCtx = fxCanvas.getContext("2d", { alpha: true });

  const keyboardEl = document.getElementById("keyboard");
  const keyElements = Array.from(keyboardEl.querySelectorAll(".key"));
  const keyByNote = new Map(keyElements.map((key) => [key.dataset.note, key]));
  const audioByNote = new Map(
    Array.from(document.querySelectorAll("audio[data-note]")).map((audio) => [audio.dataset.note, audio])
  );

  const keyboardLayout = {
    z: "c",
    s: "csharp",
    x: "d",
    d: "dsharp",
    c: "e",
    v: "f",
    g: "fsharp",
    b: "g",
    h: "gsharp",
    n: "a",
    j: "asharp",
    m: "b",
    ",": "c2",
    l: "c2sharp"
  };

  const projectsToggle = document.getElementById("projects-toggle");
  const projectsList = document.getElementById("projects-list");
  let projectsOpen = false;

  let dpr = 1;
  let width = 0;
  let height = 0;
  let starCount = 0;
  let starX = new Float32Array(0);
  let starY = new Float32Array(0);
  let starZ = new Float32Array(0);
  let starAlpha = new Float32Array(0);
  let driftX = 0;
  let driftY = 0;
  let targetX = 0;
  let targetY = 0;
  let starAnimationId = 0;

  const particles = [];
  let particleAnimationId = 0;
  let lastParticleTime = 0;

  function resizeCanvas(canvas, context) {
    const targetWidth = Math.floor(window.innerWidth * dpr);
    const targetHeight = Math.floor(window.innerHeight * dpr);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetStar(index) {
    starX[index] = (Math.random() - 0.5) * width;
    starY[index] = (Math.random() - 0.5) * height;
    starZ[index] = 0.1 + Math.random() * 0.9;
    starAlpha[index] = 0.25 + Math.random() * 0.55;
  }

  function setupStars() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    resizeCanvas(starsCanvas, starsCtx);
    resizeCanvas(fxCanvas, fxCtx);

    starCount = Math.max(90, Math.min(260, Math.floor((width * height) / 9000)));
    starX = new Float32Array(starCount);
    starY = new Float32Array(starCount);
    starZ = new Float32Array(starCount);
    starAlpha = new Float32Array(starCount);

    for (let i = 0; i < starCount; i += 1) {
      resetStar(i);
    }

    drawStarFrame(16);
  }

  function drawStarFrame(dt) {
    starsCtx.clearRect(0, 0, width, height);

    driftX += (targetX - driftX) * 0.055;
    driftY += (targetY - driftY) * 0.055;

    const zoomStep = (prefersReducedMotion ? 0.002 : 0.01) * (dt / 16);

    for (let i = 0; i < starCount; i += 1) {
      starZ[i] -= zoomStep;
      if (starZ[i] <= 0.06) {
        resetStar(i);
      }

      const invZ = 1 / starZ[i];
      const screenX = starX[i] * invZ + width * 0.5 + driftX * 28;
      const screenY = starY[i] * invZ + height * 0.5 + driftY * 28;

      if (screenX < -60 || screenX > width + 60 || screenY < -60 || screenY > height + 60) {
        resetStar(i);
        continue;
      }

      const tail = 0.7 + invZ * 0.7;
      const opacity = Math.min(0.92, starAlpha[i] + invZ * 0.12);
      starsCtx.strokeStyle = `rgba(183, 235, 255, ${opacity.toFixed(3)})`;
      starsCtx.lineWidth = Math.min(2.2, 0.4 + invZ * 0.5);
      starsCtx.beginPath();
      starsCtx.moveTo(screenX, screenY);
      starsCtx.lineTo(screenX - driftX * tail - 0.14, screenY - driftY * tail - 0.14);
      starsCtx.stroke();
    }
  }

  function animateStars(timestamp) {
    if (!animateStars.last) {
      animateStars.last = timestamp;
    }
    const dt = Math.min(34, timestamp - animateStars.last);
    animateStars.last = timestamp;

    drawStarFrame(dt);
    starAnimationId = window.requestAnimationFrame(animateStars);
  }

  function sparkPalette() {
    return ["#ffe9b4", "#9ef5dc", "#6cd3ff"];
  }

  function spawnSparks(x, y) {
    const colors = sparkPalette();
    const count = prefersReducedMotion ? 12 : 28;

    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 3 : 5),
        vy: -Math.random() * (prefersReducedMotion ? 3.5 : 6.5) - 1,
        life: 0.7 + Math.random() * 0.35,
        size: 1.4 + Math.random() * 2,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }

    if (!particleAnimationId) {
      lastParticleTime = performance.now();
      particleAnimationId = window.requestAnimationFrame(animateParticles);
    }
  }

  function animateParticles(timestamp) {
    const dt = Math.min(34, timestamp - lastParticleTime);
    const factor = dt / 16;
    lastParticleTime = timestamp;

    fxCtx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= 0.026 * factor;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.vy += 0.18 * factor;
      p.vx *= 0.995;
      p.x += p.vx * factor;
      p.y += p.vy * factor;

      fxCtx.globalAlpha = Math.max(0, p.life);
      fxCtx.fillStyle = p.color;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fxCtx.fill();
    }

    fxCtx.globalAlpha = 1;

    if (particles.length > 0) {
      particleAnimationId = window.requestAnimationFrame(animateParticles);
    } else {
      particleAnimationId = 0;
      fxCtx.clearRect(0, 0, width, height);
    }
  }

  function flashKey(key) {
    key.classList.add("is-active");
    clearTimeout(key.flashTimer);
    key.flashTimer = window.setTimeout(() => {
      key.classList.remove("is-active");
    }, 110);
  }

  function playNote(note, keyElement) {
    const audio = audioByNote.get(note);
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        /* ignore autoplay interruption */
      });
    }

    if (keyElement) {
      flashKey(keyElement);
      const rect = keyElement.getBoundingClientRect();
      spawnSparks(rect.left + rect.width / 2, Math.min(rect.bottom, height - 6));
    }
  }

  function setProjectsState(isOpen) {
    projectsOpen = isOpen;
    projectsToggle.textContent = isOpen ? "Hide Projects" : "Show Projects";
    projectsToggle.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      projectsList.hidden = false;
      projectsList.classList.add("is-open");
      document.body.classList.add("projects-open");
      return;
    }

    projectsList.classList.remove("is-open");
    document.body.classList.remove("projects-open");

    window.setTimeout(() => {
      if (!projectsOpen) {
        projectsList.hidden = true;
      }
    }, 300);
  }

  projectsToggle.addEventListener("click", () => {
    setProjectsState(!projectsOpen);
  });

  keyboardEl.addEventListener("pointerdown", (event) => {
    const key = event.target.closest(".key");
    if (!key) {
      return;
    }

    event.preventDefault();
    playNote(key.dataset.note, key);
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA") {
      return;
    }

    const note = keyboardLayout[event.key.toLowerCase()];
    if (!note) {
      return;
    }

    const key = keyByNote.get(note);
    playNote(note, key);
  });

  window.addEventListener(
    "pointermove",
    (event) => {
      const xRatio = event.clientX / Math.max(1, width) - 0.5;
      const yRatio = event.clientY / Math.max(1, height) - 0.5;
      targetX = xRatio * 2;
      targetY = yRatio * 2;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  let resizePending = false;
  window.addEventListener("resize", () => {
    if (resizePending) {
      return;
    }

    resizePending = true;
    window.requestAnimationFrame(() => {
      resizePending = false;
      setupStars();
    });
  });

  setupStars();
  starAnimationId = window.requestAnimationFrame(animateStars);
})();
