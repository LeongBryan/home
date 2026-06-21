'use strict';

// ═══════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════

const SECTIONS = [
  { name: 'Home',     num: '00', tint: [0,   245, 212, 0.015] },
  { name: 'Music',    num: '01', tint: [180, 100,  35, 0.018] },
  { name: 'Code',     num: '02', tint: [57,  255, 20,  0.015] },
  { name: 'Projects', num: '03', tint: [255, 214, 10,  0.015] },
];

const PANEL_COUNT = 4;

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

let sfRaw      = 0;   // raw section float (0–3) from scroll
let sfLerp     = 0;   // smoothed section float for rendering
let rafRunning = false;

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setupPanels();
  startRenderLoop();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', debounce(setupPanels, 200));

  setupCustomCursor();
  setupHeroWave();
  setupRoleCycler();
  setupHeroCanvas();
  setupCodeCanvas();
  setupCorkCanvas();
  setupDustCanvas();
  setupFairyLights();
  setupVinylCrackle();
  setupPinboardEntry();
  setupBoardAnimations();
  setupTypewriter();
  setupNavDots();
  setupPillScrollLinks();
});

// ═══════════════════════════════════════════════════════════
//  BACKGROUND PANELS
// ═══════════════════════════════════════════════════════════

function setupPanels() {
  // Panels are flat overlays — clear any stale 3D transforms
  document.querySelectorAll('.bg-panel').forEach(p => { p.style.transform = ''; });
  const scene = document.getElementById('bgScene');
  scene.style.perspective = '';
  scene.style.perspectiveOrigin = '';
}

// ── Scroll → section float ────────────────────────────────

function onScroll() {
  const scrolled  = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress  = maxScroll > 0 ? Math.min(scrolled / maxScroll, 1) : 0;

  sfRaw = progress * (PANEL_COUNT - 1); // 0 to 3

  const bar = document.getElementById('scrollBar');
  if (bar) bar.style.width = `${progress * 100}%`;

  const idx = Math.min(Math.round(sfRaw), PANEL_COUNT - 1);
  updateSectionUI(idx, progress);
}

// ── RAF render loop ───────────────────────────────────────

function startRenderLoop() {
  if (rafRunning) return;
  rafRunning = true;

  const panels    = document.querySelectorAll('.bg-panel');
  const vinylTilt = document.querySelector('.vinyl-tilt');

  (function loop() {
    // Smooth the section float
    sfLerp += (sfRaw - sfLerp) * 0.065;

    // ── Panel cross-fades ──────────────────────────────────
    panels.forEach((p, i) => {
      const d  = sfLerp - i;
      let op = d < -1 || d > 1 ? 0 : d < 0 ? 1 + d : d > 0 ? 1 - d : 1;
      // Code panel lingers invisible until you're deep into the transition
      if (i === 2 && d < 0) op = Math.pow(op, 2.5);
      p.style.opacity = op;
    });

    // ── Vinyl disc entry / exit ────────────────────────────
    if (vinylTilt) {
      let rx, ty;
      if (sfLerp <= 1) {
        const t = sfLerp;           // 0 → 1  (entry: falling into place)
        rx = 62 - 22 * t;          // 62° → 40°
        ty = 60 * (1 - t);         // +60px → 0
      } else if (sfLerp <= 2) {
        const t = sfLerp - 1;      // 0 → 1  (exit: rising away)
        rx = 40 - 22 * t;          // 40° → 18°
        ty = -60 * t;              // 0 → -60px
      } else {
        rx = 40; ty = 0;
      }
      vinylTilt.style.transform = `rotateX(${rx}deg) translateY(${ty}px)`;
    }

    requestAnimationFrame(loop);
  })();
}

// ── Section UI updates ────────────────────────────────────

function updateSectionUI(idx, progress) {
  const s = SECTIONS[idx];

  // Badge
  const num  = document.getElementById('badgeNum');
  const name = document.getElementById('badgeName');
  if (num)  num.textContent  = s.num;
  if (name) name.textContent = s.name;

  // Nav dots
  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('active', i === idx)
  );

  // CSS tint
  const root = document.documentElement;
  root.style.setProperty('--tint-r', s.tint[0]);
  root.style.setProperty('--tint-g', s.tint[1]);
  root.style.setProperty('--tint-b', s.tint[2]);
  root.style.setProperty('--tint-a', s.tint[3]);
}

// ═══════════════════════════════════════════════════════════
//  CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════

function setupCustomCursor() {
  const dot   = document.getElementById('cursor');
  const trail = document.getElementById('cursorTrail');
  if (!dot || !trail) return;

  let mx = -100, my = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top  = `${my}px`;
  });

  // Trail lags slightly (handled by CSS transition on top/left)
  document.addEventListener('mousemove', e => {
    trail.style.left = `${e.clientX}px`;
    trail.style.top  = `${e.clientY}px`;
  });
}

// ═══════════════════════════════════════════════════════════
//  ANIMATED WAVEFORM (SVG, Hero)
// ═══════════════════════════════════════════════════════════

function setupHeroWave() {
  const container = document.getElementById('heroWave');
  if (!container) return;

  const NS  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width',  '100%');
  svg.setAttribute('height', '100%');

  // Gradient
  const defs = document.createElementNS(NS, 'defs');
  const grad = document.createElementNS(NS, 'linearGradient');
  grad.id = 'wg';
  [
    [0,   '#00f5d4', 0],
    [0.5, '#00f5d4', 1],
    [1,   '#c77dff', 0],
  ].forEach(([o, c, a]) => {
    const s = document.createElementNS(NS, 'stop');
    s.setAttribute('offset', o);
    s.setAttribute('stop-color', c);
    s.setAttribute('stop-opacity', a);
    grad.appendChild(s);
  });
  defs.appendChild(grad);
  svg.appendChild(defs);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'url(#wg)');
  path.setAttribute('stroke-width', '1.5');
  svg.appendChild(path);
  container.appendChild(svg);

  let t = 0;
  (function animWave() {
    t += 0.018;
    const W = container.offsetWidth  || 560;
    const H = container.offsetHeight || 56;
    const cy = H / 2;
    const N  = 120;
    const pts = [];

    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      const y = cy
        + Math.sin(i * 0.18 + t)          * 13
        + Math.sin(i * 0.42 + t * 1.4)    * 7
        + Math.sin(i * 0.07  + t * 0.65)  * 18
        + Math.sin(i * 0.9   + t * 2.1)   * 3;
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    path.setAttribute('d', pts.join(' '));
    requestAnimationFrame(animWave);
  })();
}

// ═══════════════════════════════════════════════════════════
//  ROLE CYCLER
// ═══════════════════════════════════════════════════════════

function setupRoleCycler() {
  const el = document.getElementById('roleCycler');
  if (!el) return;

  const roles = [
    'DevOps',
    'Music',
    'Worship',
    'Sociology',
  ];
  let i = 0;

  setInterval(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      i = (i + 1) % roles.length;
      el.textContent   = roles[i];
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 280);
  }, 2600);

  el.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
}

// ═══════════════════════════════════════════════════════════
//  HERO CANVAS — floating code + music symbols
// ═══════════════════════════════════════════════════════════

const FLOAT_SYMBOLS = [
  '{ }', '</>', '()', '=>', '[]', '//', '∑', 'fn',
  '♪',  '♫',  '♩',  '𝄞',  '∿',  '||',  '&&', 'λ',
];

function setupHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  let particles = Array.from({ length: 65 }, () => spawnParticle(canvas, true));

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.life -= p.decay;

      if (p.life <= 0 || p.y < -40 || p.x < -60 || p.x > canvas.width + 60) {
        particles[i] = spawnParticle(canvas, false);
        return;
      }

      const alpha = Math.max(0, p.life * 0.35);
      ctx.globalAlpha = alpha;
      ctx.font        = `${p.size}px 'JetBrains Mono', monospace`;
      ctx.fillStyle   = p.isMusic ? '#c77dff' : '#00f5d4';
      ctx.fillText(p.sym, p.x, p.y);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  })();
}

function spawnParticle(canvas, random) {
  const sym = FLOAT_SYMBOLS[Math.floor(Math.random() * FLOAT_SYMBOLS.length)];
  return {
    x:       random ? Math.random() * canvas.width  : Math.random() * canvas.width,
    y:       random ? Math.random() * canvas.height : canvas.height + 20,
    vx:      (Math.random() - 0.5) * 0.35,
    vy:      -(Math.random() * 0.45 + 0.15),
    sym,
    size:    Math.random() * 10 + 8,
    life:    1,
    decay:   Math.random() * 0.0008 + 0.0004,
    isMusic: sym.includes('♪') || sym.includes('♫') || sym.includes('♩') || sym.includes('𝄞'),
  };
}

// ═══════════════════════════════════════════════════════════
//  CODE CANVAS — matrix rain
// ═══════════════════════════════════════════════════════════

const MATRIX_CHARS = 'アイウエオカキクケコ01{}[]<>()=>/\\|&%#@λ∑∿+-*'.split('');

function setupCodeCanvas() {
  const canvas = document.getElementById('codeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    drops.length = 0;
    for (let i = 0; i < Math.floor(canvas.width / COL_W); i++) {
      drops.push(Math.random() * -50);
    }
  });

  const COL_W = 20;
  const drops  = Array.from(
    { length: Math.floor(canvas.width / COL_W) },
    () => Math.random() * -50
  );

  (function drawMatrix() {
    ctx.fillStyle = 'rgba(2,11,5,0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px JetBrains Mono';

    drops.forEach((y, i) => {
      const ch    = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      const x     = i * COL_W;
      const alpha = Math.random();

      if (alpha > 0.97) {
        ctx.fillStyle = '#ffffff';
      } else if (alpha > 0.88) {
        ctx.fillStyle = '#39ff14';
      } else {
        ctx.fillStyle = `rgba(57,255,20,${alpha * 0.28 + 0.04})`;
      }
      ctx.fillText(ch, x, y * COL_W);

      if (y * COL_W > canvas.height && Math.random() > 0.974) drops[i] = 0;
      drops[i] += 0.55;
    });

    requestAnimationFrame(drawMatrix);
  })();
}

// ═══════════════════════════════════════════════════════════
//  STARS CANVAS — constellation field
// ═══════════════════════════════════════════════════════════

function setupStarsCanvas() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  const stars = Array.from({ length: 220 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    r:     Math.random() * 1.5 + 0.3,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.008 + 0.003,
  }));

  (function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Constellation lines
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < 75) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = `rgba(255,214,10,${(1 - d / 75) * 0.09})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    // Stars
    stars.forEach(s => {
      s.phase += s.speed;
      const a = Math.sin(s.phase) * 0.3 + 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,235,255,${a})`;
      ctx.fill();
    });

    requestAnimationFrame(drawStars);
  })();
}

// ═══════════════════════════════════════════════════════════
//  CORK CANVAS — Projects background (drawn once, static)
// ═══════════════════════════════════════════════════════════

function setupCorkCanvas() {
  const canvas = document.getElementById('corkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);

  const W = canvas.width, H = canvas.height;

  // Base warm cork gradient
  const base = ctx.createRadialGradient(W * 0.45, H * 0.35, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.7);
  base.addColorStop(0,   '#c07838');
  base.addColorStop(0.5, '#aa6428');
  base.addColorStop(1,   '#844e18');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Fine grain — tiny dots of varying warmth
  for (let i = 0; i < W * H / 2.8; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.3 + 0.15;
    const a = Math.random() * 0.14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.55
      ? `rgba(255,195,100,${a})`
      : `rgba(0,0,0,${a * 1.6})`;
    ctx.fill();
  }

  // Cork fibers — short angled strokes, mostly horizontal
  ctx.lineCap = 'round';
  for (let i = 0; i < 2200; i++) {
    const x     = Math.random() * W;
    const y     = Math.random() * H;
    const len   = Math.random() * 22 + 5;
    const angle = (Math.random() - 0.5) * 0.55;
    const a     = Math.random() * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = Math.random() > 0.5
      ? `rgba(255,175,70,${a})`
      : `rgba(0,0,0,${a * 1.5})`;
    ctx.lineWidth = Math.random() * 1.6 + 0.2;
    ctx.stroke();
  }

  // Edge vignette — darkens the border of the board
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// ═══════════════════════════════════════════════════════════
//  PINBOARD — physics sway + parallax + entry
// ═══════════════════════════════════════════════════════════

function setupPinboardEntry() {
  const section = document.getElementById('s3');
  if (!section) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      section.classList.add('cards-in');
      obs.disconnect();
    }
  }, { threshold: 0.12 });

  obs.observe(section);
}

function setupBoardAnimations() {
  const section = document.getElementById('s3');
  if (!section) return;

  const wraps = [...section.querySelectorAll('.card-scatter .sway-wrap')];

  // Spring-damper physics per card
  const phys = wraps.map(() => ({
    angle:     (Math.random() - 0.5) * 0.8,
    vel:       (Math.random() - 0.5) * 0.6,
    omega:     0.65 + Math.random() * 0.55,   // natural frequency (rad/s)
    damp:      0.055 + Math.random() * 0.045, // damping ratio
    nextGust:  1.5 + Math.random() * 4,       // s until next gust
    gustTimer: Math.random() * 3,
  }));

  // Mouse parallax state
  let mx = 0, my = 0, px = 0, py = 0;
  section.addEventListener('mousemove', e => {
    const r = section.getBoundingClientRect();
    mx = (e.clientX - r.left - r.width  * 0.5) / (r.width  * 0.5);
    my = (e.clientY - r.top  - r.height * 0.5) / (r.height * 0.5);
  });
  section.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  // Kick cards when they first drop in
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    phys.forEach((p, i) => {
      const ed = parseFloat(wraps[i].style.getPropertyValue('--ed') || '0');
      setTimeout(() => { p.vel += (Math.random() - 0.5) * 4; }, (ed + 0.55) * 1000);
    });
  }, { threshold: 0.12 }).observe(section);

  let lastT = performance.now();

  (function loop(now) {
    const dt = Math.min((now - lastT) * 0.001, 0.05);
    lastT = now;

    // Parallax lerp
    px += (mx - px) * 0.07;
    py += (my - py) * 0.07;

    wraps.forEach((w, i) => {
      const p = phys[i];

      // Wind gust impulse
      p.gustTimer += dt;
      if (p.gustTimer >= p.nextGust) {
        p.vel      += (Math.random() - 0.46) * 2.8; // slight directional bias
        p.gustTimer = 0;
        p.nextGust  = 2 + Math.random() * 5.5;
      }

      // Spring-damper integration
      const f  = -(p.omega * p.omega) * p.angle - 2 * p.damp * p.omega * p.vel;
      p.vel   += f * dt;
      p.angle += p.vel * dt;

      const depth = 0.5 + i * 0.12;
      w.style.transform = `rotate(${p.angle.toFixed(3)}deg)`;
      w.style.translate  = `${(px * 14 * depth).toFixed(2)}px ${(py * 8 * depth).toFixed(2)}px`;
    });

    requestAnimationFrame(loop);
  })(performance.now());
}

// ═══════════════════════════════════════════════════════════
//  DUST MOTES — cork board atmosphere
// ═══════════════════════════════════════════════════════════

function setupDustCanvas() {
  const canvas = document.getElementById('dustCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  const motes = Array.from({ length: 38 }, () => makeMote(canvas, true));

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now() * 0.001;

    motes.forEach((m, i) => {
      m.x  += m.vx + Math.sin(now * m.wx + m.wp) * 0.1;
      m.y  += m.vy;
      m.life -= m.decay;

      if (m.life <= 0 || m.y < -8 || m.x < -8 || m.x > canvas.width + 8) {
        motes[i] = makeMote(canvas, false);
        return;
      }

      const a = Math.sin(m.life * Math.PI) * m.alpha;
      if (a <= 0.005) return;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,210,140,${a.toFixed(3)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  })();
}

function makeMote(canvas, scattered) {
  return {
    x:      Math.random() * canvas.width,
    y:      scattered ? Math.random() * canvas.height : canvas.height + 5,
    vx:     (Math.random() - 0.5) * 0.16,
    vy:     -(Math.random() * 0.2 + 0.05),
    r:      Math.random() * 1.3 + 0.25,
    life:   scattered ? Math.random() * 0.8 + 0.1 : 0.04,
    decay:  Math.random() * 0.0005 + 0.00018,
    alpha:  Math.random() * 0.38 + 0.14,
    wx:     Math.random() * 0.4 + 0.1,
    wp:     Math.random() * Math.PI * 2,
  };
}

// ═══════════════════════════════════════════════════════════
//  FAIRY LIGHTS — warm amber string across cork board top
// ═══════════════════════════════════════════════════════════

function setupFairyLights() {
  const wrap = document.querySelector('.light-string');
  if (!wrap) return;

  const NS = 'http://www.w3.org/2000/svg';
  const N  = 24;

  // Single drooping wire
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'string-wire');
  svg.setAttribute('viewBox', '0 0 1000 60');
  svg.setAttribute('preserveAspectRatio', 'none');
  const wire = document.createElementNS(NS, 'path');
  wire.setAttribute('d', 'M 0,15 Q 500,48 1000,15');
  wire.setAttribute('fill', 'none');
  wire.setAttribute('stroke', '#2a1808');
  wire.setAttribute('stroke-width', '1.3');
  wire.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(wire);
  wrap.appendChild(svg);

  // Warm amber dots placed along the quadratic bezier
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // Quadratic bezier: P0=(0,15), P1=(500,48), P2=(1000,15)
    const bx = (1-t)*(1-t)*0   + 2*(1-t)*t*50  + t*t*100; // % of 1000
    const by = (1-t)*(1-t)*15  + 2*(1-t)*t*48  + t*t*15;  // px in 60px tall

    const dot = document.createElement('span');
    dot.className = 'fairy-dot';
    dot.style.left = `${bx.toFixed(1)}%`;
    dot.style.top  = `${(by / 60 * 100).toFixed(1)}%`;
    dot.style.setProperty('--fd', `${(Math.random() * 4).toFixed(2)}s`);
    wrap.appendChild(dot);
  }
}

// ═══════════════════════════════════════════════════════════
//  VINYL CRACKLE — subtle surface noise on music panel
// ═══════════════════════════════════════════════════════════

function setupVinylCrackle() {
  const canvas = document.getElementById('crackleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grain: sparse warm dots scattered across the surface
    const n = 18 + Math.floor(Math.random() * 12);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const a = Math.random() * 0.05 + 0.01;
      const r = Math.random() * 0.9 + 0.15;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,235,190,${a})`;
      ctx.fill();
    }

    // Occasional crackle streak
    if (Math.random() < 0.012) {
      const x  = Math.random() * canvas.width;
      const y  = Math.random() * canvas.height;
      const dx = (Math.random() - 0.5) * 55;
      const dy = (Math.random() - 0.5) * 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.strokeStyle = `rgba(255,230,180,${Math.random() * 0.07 + 0.02})`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  })();
}

// ═══════════════════════════════════════════════════════════
//  MINI PIANO (Music section decoration)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  TYPEWRITER (Code section terminal)
// ═══════════════════════════════════════════════════════════

const TERM_SCRIPT = [
  { type: 'cmd',  text: 'whoami' },
  { type: 'out',  text: 'bryan-leong  //  devops · music · code' },
  { type: 'cmd',  text: 'ls ./projects' },
  { type: 'out',  text: 'HymnOps/   Mossie-Wipeout/   BibleQuizarium/' },
  { type: 'out',  text: 'Kubernomics/   Inky/   home/' },
  { type: 'cmd',  text: 'cat manifesto.txt' },
  { type: 'out',  text: 'Build systems that sing.' },
  { type: 'cmd',  text: 'echo $STACK' },
  { type: 'out',  text: 'Kubernetes · Docker · Terraform · CI/CD · JS · Python' },
];

function setupTypewriter() {
  const target = document.getElementById('typeTarget');
  const body   = document.getElementById('termBody');
  if (!target || !body) return;

  let lineIdx = 0;
  let charIdx = 0;
  let running = false;

  function addLine(text, cls) {
    const div = document.createElement('div');
    div.className = 'tline ' + cls;
    if (cls === 'output') {
      div.textContent = text;
    } else {
      div.innerHTML = `<span class="tprompt">$</span>${text}`;
    }
    // Insert before the active line
    body.insertBefore(div, body.querySelector('.tline.active'));
  }

  function typeNext() {
    if (lineIdx >= TERM_SCRIPT.length) {
      // Reset
      Array.from(body.querySelectorAll('.tline:not(.active)')).forEach(el => el.remove());
      lineIdx = 0;
      charIdx = 0;
      target.textContent = '';
      setTimeout(typeNext, 800);
      return;
    }

    const line = TERM_SCRIPT[lineIdx];
    const spd  = line.type === 'out' ? 18 : 60;

    if (charIdx < line.text.length) {
      target.textContent += line.text[charIdx++];
      setTimeout(typeNext, spd + Math.random() * spd * 0.5);
    } else {
      // Commit line
      addLine(line.text, line.type === 'out' ? 'output' : '');
      target.textContent = '';
      charIdx = 0;
      lineIdx++;
      setTimeout(typeNext, line.type === 'cmd' ? 280 : 120);
    }
  }

  // Start when section enters view
  const section = document.getElementById('s2');
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !running) {
      running = true;
      typeNext();
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(section);
}

// ═══════════════════════════════════════════════════════════
//  NAV DOTS
// ═══════════════════════════════════════════════════════════

function setupNavDots() {
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx       = parseInt(dot.dataset.idx, 10);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target    = (idx / (PANEL_COUNT - 1)) * maxScroll;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  PILL SCROLL LINKS (Hero CTAs)
// ═══════════════════════════════════════════════════════════

function setupPillScrollLinks() {
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const idx       = parseInt(el.dataset.section, 10);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target    = (idx / (PANEL_COUNT - 1)) * maxScroll;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════

function resizeCanvas(canvas) {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
