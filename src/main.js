import Lenis from 'lenis';
import { WORKS, FILMS, SYSTEMS, LAB, STATS, CV } from './data.js';
import { createHeroField } from './scene.js';

const BASE = import.meta.env.BASE_URL;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const pad2 = (n) => String(n).padStart(2, '0');
const fmtDur = (s) => `${pad2(Math.floor(s / 60))}:${pad2(Math.round(s % 60))}`;
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------
   smooth scroll
   ------------------------------------------------------------ */
let lenis = null;
if (!REDUCED) {
  lenis = new Lenis({
    lerp: 0.092,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
    smoothWheel: true,
  });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

window.__lenis = lenis;

const scrollTo = (target, offset = 0) => {
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.5 });
  else {
    const el = typeof target === 'string' ? $(target) : target;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
  }
};

/* ------------------------------------------------------------
   loader
   ------------------------------------------------------------ */
let booted = false;

/* pelican legs: two-link IK on the crank */
const pedal = (() => {
  const BB = [210, 182];
  const CR = 21;
  const HIP = [204, 108];
  const L1 = 46;
  const L2 = 54;
  const el = {
    legN: $('#legNear'),
    crankN: $('#crankNear'),
    pedalN: $('#pedalNear'),
    footN: $('#footNear'),
  };
  const ik = (fx, fy) => {
    const dx = fx - HIP[0];
    const dy = fy - HIP[1];
    const d = Math.hypot(dx, dy) || 1;
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const ux = dx / d;
    const uy = dy / d;
    return [HIP[0] + a * ux + h * uy, HIP[1] + a * uy - h * ux];
  };
  const pose = (ph, off, leg, crank, ped, foot) => {
    const th = ph + off;
    const fx = BB[0] + Math.cos(th) * CR;
    const fy = BB[1] + Math.sin(th) * CR;
    const k = ik(fx, fy);
    const p = `${fx.toFixed(1)} ${fy.toFixed(1)}`;
    leg.setAttribute('d', `M${HIP[0]} ${HIP[1]}L${k[0].toFixed(1)} ${k[1].toFixed(1)}L${p}`);
    crank.setAttribute('d', `M${BB[0]} ${BB[1]}L${p}`);
    ped.setAttribute('d', `M${(fx - 6).toFixed(1)} ${(fy + 1.5).toFixed(1)}h12`);
    if (foot) foot.setAttribute('d', `M${p}l10 2M${p}l9 5M${p}l5 6`);
  };
  let raf = 0;
  let last = 0;
  let ph = 0;
  return {
    start() {
      if (raf || !el.legN || REDUCED) return;
      last = performance.now();
      const loop = (now) => {
        const dt = Math.min(64, now - last);
        last = now;
        ph += (dt / 1100) * Math.PI * 2;
        pose(ph, 0, el.legN, el.crankN, el.pedalN, el.footN);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
})();

const boot = () => {
  if (booted) return;
  booted = true;
  const pct = $('#loaderPct');
  const DUR = REDUCED ? 500 : 3500;
  const start = performance.now();

  document.body.classList.add('boot');
  pedal.start();

  const tick = (now) => {
    const t = Math.min(1, (now - start) / DUR);
    if (pct) pct.textContent = pad2(Math.round(t * 100));
    if (t < 1) requestAnimationFrame(tick);
    else {
      pedal.stop();
      document.body.classList.add('is-loaded');
      cycleWord.start();
      setTimeout(() => { $('#loader').style.display = 'none'; }, 1500);
    }
  };
  requestAnimationFrame(tick);
};

/* ------------------------------------------------------------
   hero word cycle
   ------------------------------------------------------------ */
const cycleWord = (() => {
  const cell = $('.hero__cycle');
  const stack = cell && cell.querySelector('.hero__cycle-in');
  if (!cell || !stack || REDUCED) return { start() {} };
  const items = stack.children.length;
  let i = 0;
  let visible = true;

  const paint = (n, animate) => {
    if (!animate) {
      stack.style.transition = 'none';
      stack.style.setProperty('--cyc', n);
      void stack.offsetHeight;
      stack.style.transition = '';
    } else {
      stack.style.setProperty('--cyc', n);
    }
  };

  const tick = () => {
    if (!visible) return;
    i += 1;
    if (i >= items - 1) {
      paint(items - 1, true);
      setTimeout(() => { i = 0; paint(0, false); }, 640);
    } else {
      paint(i, true);
    }
  };

  return {
    start() {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cell);
      }
      setTimeout(() => { setInterval(tick, 2000); }, 1100);
    },
  };
})();

/* ------------------------------------------------------------
   text splitting
   ------------------------------------------------------------ */
function splitChars(el) {
  if (!el || el.dataset.split === '1') return;
  el.dataset.split = '1';
  const walk = (node, state) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        Array.from(child.textContent).forEach((ch) => {
          if (ch === ' ' || ch === '\n') {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const wrap = document.createElement('span');
          wrap.className = 'split-word';
          const inner = document.createElement('i');
          inner.textContent = ch;
          inner.style.setProperty('--d', `${state.delay.toFixed(3)}s`);
          state.delay += 0.022;
          wrap.appendChild(inner);
          frag.appendChild(wrap);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child, state);
      }
    });
  };
  walk(el, { delay: 0 });
}

/* ------------------------------------------------------------
   render: works
   ------------------------------------------------------------ */
const workList = $('#workList');
WORKS.forEach((w, i) => {
  const li = document.createElement('li');
  li.className = 'work';
  li.innerHTML = `
    <a class="work__row" href="${BASE}media/player/${w.slug}.mp4" data-i="${i}" data-cursor="播放">
      <span class="work__no">${pad2(i + 1)}</span>
      <span class="work__title">${w.title}<em>${w.en}</em></span>
      <span class="work__cat">${w.cat}</span>
      <span class="work__len">${fmtDur(w.dur)}</span>
      <span class="work__arrow">↗</span>
    </a>`;
  li.style.setProperty('--i', i);
  workList.appendChild(li);
});

/* ------------------------------------------------------------
   render: archive marquee
   ------------------------------------------------------------ */
const reelTrack = $('#reelTrack');
if (reelTrack) {
  const items = Object.entries(FILMS);
  const make = (slug, i) => `
    <a class="reel__item" href="${BASE}media/player/${slug}.mp4" data-slug="${slug}" data-cursor="看">
      <img src="${BASE}media/poster/${slug}.jpg" alt="${FILMS[slug].title}" loading="lazy" decoding="async" />
      <span><b>${pad2((i % items.length) + 1)}</b><b>${FILMS[slug].title}</b></span>
    </a>`;
  reelTrack.innerHTML = items.map(([s], i) => make(s, i)).join('') + items.map(([s], i) => make(s, i)).join('');
}

/* ------------------------------------------------------------
   render: systems
   ------------------------------------------------------------ */
const FIGURES = {
  timeline: `
    <svg viewBox="0 0 340 92" role="img" aria-label="时间线示意">
      <text x="0" y="10" class="fig-text">TIMELINE / 24 FPS</text>
      <line x1="0" y1="26" x2="340" y2="26" class="fig-dash" />
      <g class="fig-slide">
        <rect x="0" y="34" width="78" height="24" class="fig-fill" />
        <rect x="86" y="34" width="52" height="24" class="fig-fill" />
        <rect x="146" y="34" width="104" height="24" class="fig-fill" />
        <rect x="258" y="34" width="58" height="24" class="fig-stroke" />
        <rect x="146" y="34" width="2" height="24" class="fig-red" />
        <rect x="238" y="34" width="2" height="24" class="fig-red" />
      </g>
      <path class="fig-stroke" d="M0 76v-6h8v6h7v-6h5v6h11v-6h6v6h9v-6h13v6h7v-6h5v6h10v-6h6v6h12v-6h8v6h9v-6h6v6h10v-6h7v6h8v-6h5v6h12v-6h9v6h7v-6h6v6h11v-6h8v6h9v-6h5v6h12v-6h7" />
    </svg>`,
  frames: `
    <svg viewBox="0 0 340 92" role="img" aria-label="图生视频示意">
      <text x="0" y="10" class="fig-text">STILL → SEQUENCE</text>
      <rect x="0" y="22" width="58" height="58" class="fig-fill" />
      <rect x="0" y="22" width="58" height="58" class="fig-stroke" />
      <path class="fig-stroke" d="M68 51h26" />
      <path class="fig-stroke" d="M88 46l7 5-7 5" />
      <g class="fig-slide">
        <rect x="112" y="30" width="46" height="50" class="fig-dash" />
        <rect x="166" y="26" width="46" height="54" class="fig-dash" />
        <rect x="220" y="30" width="46" height="50" class="fig-dash" />
        <rect x="274" y="26" width="46" height="54" class="fig-fill" />
        <rect x="274" y="26" width="46" height="54" class="fig-stroke" />
      </g>
      <circle cx="326" cy="16" r="3" class="fig-red" />
    </svg>`,
  cut: `
    <svg viewBox="0 0 340 92" role="img" aria-label="批量剪辑示意">
      <text x="0" y="10" class="fig-text">BATCH / 42 CLIPS</text>
      <g class="fig-slide">
        <rect x="0" y="24" width="46" height="20" class="fig-fill" />
        <rect x="52" y="24" width="30" height="20" class="fig-fill" />
        <rect x="88" y="24" width="64" height="20" class="fig-fill" />
        <rect x="158" y="24" width="38" height="20" class="fig-fill" />
        <rect x="202" y="24" width="72" height="20" class="fig-fill" />
        <rect x="280" y="24" width="50" height="20" class="fig-stroke" />
        <line x1="88" y1="18" x2="88" y2="50" class="fig-stroke" />
        <line x1="202" y1="18" x2="202" y2="50" class="fig-stroke" />
        <line x1="280" y1="18" x2="280" y2="50" class="fig-stroke" />
      </g>
      <path class="fig-stroke" d="M0 68h340" stroke-dasharray="1 5" />
      <text x="0" y="86" class="fig-text">AUTO / SILENCE / FILL</text>
      <circle cx="300" cy="68" r="3" class="fig-red" />
    </svg>`,
  nodes: `
    <svg viewBox="0 0 340 92" role="img" aria-label="节点图示意">
      <text x="0" y="10" class="fig-text">NODE GRAPH / PRESETS</text>
      <path class="fig-dash" d="M38 52H92M132 52h34M206 52h34M280 52h26" />
      <rect x="6" y="38" width="32" height="28" class="fig-fill" />
      <rect x="6" y="38" width="32" height="28" class="fig-stroke" />
      <rect x="92" y="38" width="40" height="28" class="fig-fill" />
      <rect x="92" y="38" width="40" height="28" class="fig-stroke" />
      <rect x="166" y="38" width="40" height="28" class="fig-fill" />
      <rect x="166" y="38" width="40" height="28" class="fig-stroke" />
      <rect x="240" y="30" width="40" height="44" class="fig-stroke" />
      <rect x="306" y="38" width="28" height="28" class="fig-fill" />
      <circle cx="22" cy="38" r="2.5" class="fig-red" />
      <circle cx="112" cy="38" r="2.5" class="fig-red" />
      <circle cx="186" cy="38" r="2.5" class="fig-red" />
      <circle cx="260" cy="30" r="2.5" class="fig-red" />
    </svg>`,
};

const sysGrid = $('#sysGrid');
SYSTEMS.forEach((s) => {
  const el = document.createElement('article');
  el.className = 'sys-card';
  el.innerHTML = `
    <div class="sys-card__top">
      <span class="sys-card__no">${s.no}</span>
      <span class="sys-card__en">${s.en}</span>
    </div>
    <h3 class="sys-card__name">${s.name}</h3>
    <p class="sys-card__desc">${s.desc}</p>
    <div class="sys-card__fig">${FIGURES[s.fig] || ''}</div>
    <div class="sys-card__tags">${s.tags.map((t) => `<span>${t}</span>`).join('')}</div>`;
  sysGrid.appendChild(el);
});

const labList = $('#labList');
LAB.forEach(([name, note]) => {
  const li = document.createElement('li');
  li.innerHTML = `<b>${name}</b><span>${note}</span>`;
  labList.appendChild(li);
});

const statsEl = $('#stats');
STATS.forEach((s) => {
  const d = document.createElement('div');
  d.className = 'stat';
  d.innerHTML = `
    <p class="stat__v"><span data-count="${s.value}">0</span><span class="stat__u">${s.suffix}</span></p>
    <p class="stat__l">${s.label}</p>`;
  statsEl.appendChild(d);
});

const cvList = $('#cvList');
CV.forEach(([date, org, role, note]) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <span class="cv__date">${date}</span>
    <div><p class="cv__org">${org}</p><p class="cv__role">${role}</p></div>
    <p class="cv__note">${note}</p>`;
  cvList.appendChild(li);
});

/* ------------------------------------------------------------
   clock
   ------------------------------------------------------------ */
const clock = $('#clock');
const tickClock = () => {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  if (clock) clock.textContent = `${t} HKT`;
};
tickClock();
setInterval(tickClock, 20000);

/* ------------------------------------------------------------
   hero scene + beam
   ------------------------------------------------------------ */
if (REDUCED) {
  const v = $('#heroFilm');
  if (v) { v.pause(); v.removeAttribute('autoplay'); }
}

const heroCanvas = $('#gl');
if (heroCanvas) {
  createHeroField(heroCanvas, { reduced: REDUCED });
  const hero = $('.hero');
  const beam = $('#beam');
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    beam.style.setProperty('--bx', `${x}%`);
    beam.style.setProperty('--by', `${y}%`);
  });
}


/* ------------------------------------------------------------
   cursor
   ------------------------------------------------------------ */
const cursor = $('#cursor');
const label = $('#cursorLabel');
if (cursor && FINE) {
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let cx = mx;
  let cy = my;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      visible = true;
      cursor.classList.add('is-on');
    }
  });

  const hoverables = () => $$('a, button, [data-cursor], .work__row');
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('a, button, [data-cursor]');
    if (el) {
      cursor.classList.add('is-hover');
      const text = el.dataset.cursor || (el.tagName === 'BUTTON' ? '点击' : '查看');
      label.textContent = text;
    }
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('a, button, [data-cursor]')) {
      cursor.classList.remove('is-hover');
      label.textContent = '';
    }
  });

  const loop = () => {
    cx = lerp(cx, mx, 0.18);
    cy = lerp(cy, my, 0.18);
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  hoverables();
}

/* ------------------------------------------------------------
   reveal on scroll
   ------------------------------------------------------------ */
const revealTargets = $$('[data-reveal], .split-word, .rule, .sec-head, .work, .sys-card, .stat, .cv li');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    io.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

const splitEls = $$('.statement__text, .about__big');
splitEls.forEach((el) => {
  splitChars(el);
  io.observe(el);
});
$$('.sec-head, .work, .sys-card, .stat, .cv li, .graph, .reel, .about__portrait').forEach((el) => {
  el.setAttribute('data-reveal', '');
  io.observe(el);
});

/* graph activation */
const graph = $('#graph');
if (graph) {
  const gio = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { graph.classList.add('is-live'); gio.disconnect(); } });
  }, { threshold: 0.4 });
  gio.observe(graph);
}

/* stat count-up */
const countIO = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = Number(el.dataset.count);
    const t0 = performance.now();
    const dur = 1600;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    countIO.unobserve(el);
  });
}, { threshold: 0.8 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* ------------------------------------------------------------
   nav + progress + edge states
   ------------------------------------------------------------ */
const nav = $('#nav');
const systemsSec = $('#systems');
const progressBar = $('#progressBar');
const scrollBar = () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
  progressBar.style.transform = `scaleX(${p})`;
  if (systemsSec && nav) {
    const r = systemsSec.getBoundingClientRect();
    nav.classList.toggle('is-light', r.top < 70 && r.bottom > 70);
  }
  nav?.classList.toggle('is-scrolled', window.scrollY > 60);
};
window.addEventListener('scroll', scrollBar, { passive: true });
scrollBar();

let lastY = 0;
const navWatch = () => {
  const y = window.scrollY;
  if (nav) {
    if (y > 720 && y > lastY + 8) nav.classList.add('is-hidden');
    else if (y < lastY - 0.5 || y < 320) nav.classList.remove('is-hidden');
  }
  lastY = y;
};
window.addEventListener('scroll', navWatch, { passive: true });
document.addEventListener('pointermove', (e) => {
  if (e.clientY < 96 && nav) nav.classList.remove('is-hidden');
}, { passive: true });

/* ------------------------------------------------------------
   magnetic
   ------------------------------------------------------------ */
$$('[data-magnetic]').forEach((el) => {
  const strength = Number(el.dataset.magnetic) || 0.08;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate3d(${x * strength}px, ${y * strength * 1.4}px, 0)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ------------------------------------------------------------
   hero parallax
   ------------------------------------------------------------ */
const heroEl = $('.hero');
const heroFilm = $('#heroFilm');
const heroTitle = $('.hero__title');
let heroT = 0;
let heroC = 0;
if (heroEl && !REDUCED) {
  const readHero = () => {
    heroT = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
  };
  window.addEventListener('scroll', readHero, { passive: true });
  readHero();
  const heroLoop = () => {
    heroC = lerp(heroC, heroT, 0.09);
    if (heroFilm) {
      heroFilm.style.transform = `translate3d(0, ${(heroC * 74).toFixed(2)}px, 0) scale(${(1.04 + heroC * 0.07).toFixed(4)})`;
    }
    if (heroTitle) {
      heroTitle.style.transform = `translate3d(0, ${(-heroC * 46).toFixed(2)}px, 0)`;
      heroTitle.style.opacity = String(Math.max(0, 1 - heroC * 1.25));
    }
    requestAnimationFrame(heroLoop);
  };
  requestAnimationFrame(heroLoop);
}

/* ------------------------------------------------------------
   anchors
   ------------------------------------------------------------ */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(target, -10);
  });
});
$('#toTop')?.addEventListener('click', () => scrollTo(0, 0));

/* ------------------------------------------------------------
   floating preview
   ------------------------------------------------------------ */
const peek = document.createElement('div');
peek.className = 'peek';
peek.innerHTML = '<video muted loop playsinline preload="none"></video>';
document.body.appendChild(peek);
const peekVideo = peek.querySelector('video');

if (FINE) {
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let active = false;

  const movePeek = () => {
    px = lerp(px, tx, 0.16);
    py = lerp(py, ty, 0.16);
    peek.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${active ? 1 : 0.94})`;
    requestAnimationFrame(movePeek);
  };
  requestAnimationFrame(movePeek);

  const attach = (row) => {
    row.addEventListener('pointerenter', () => {
      const slug = row.getAttribute('href').split('/').pop().replace('.mp4', '');
      peekVideo.src = `${BASE}media/loop/${slug}.mp4`;
      peekVideo.play().catch(() => {});
      peek.classList.add('is-on');
      active = true;
    });
    row.addEventListener('pointerleave', () => {
      peek.classList.remove('is-on');
      active = false;
      setTimeout(() => { if (!active) { peekVideo.pause(); } }, 400);
    });
  };

  $$('.work__row').forEach(attach);

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  window.addEventListener('pointermove', (e) => {
    const halfW = 130;
    const halfH = 215;
    if (!active) { px = tx = e.clientX + 220; py = ty = e.clientY; return; }
    let nx = e.clientX + Math.min(window.innerWidth * 0.21, 300);
    if (nx > window.innerWidth - halfW - 18) nx = e.clientX - 300;
    tx = clamp(nx, halfW + 18, window.innerWidth - halfW - 18);
    ty = clamp(e.clientY, halfH + 14, window.innerHeight - halfH - 14);
  });
  // initial position off-screen
  px = tx = window.innerWidth - 300;
  py = ty = window.innerHeight / 2;
}

/* ------------------------------------------------------------
   player
   ------------------------------------------------------------ */
const player = $('#player');
const playerVideo = $('#playerVideo');
const playerBar = $('#playerBar');
const playerToggle = $('#playerToggle');
let current = 0;

const fillPlayer = (w, idxLabel, durLabel) => {
  $('#playerIdx').textContent = idxLabel;
  $('#playerTitle').textContent = w.title;
  $('#playerEn').textContent = w.en;
  $('#playerDesc').textContent = w.desc;
  $('#playerCat').textContent = w.cat;
  $('#playerDur').textContent = durLabel;
  $('#playerYear').textContent = String(w.year);
  playerVideo.src = `${BASE}media/player/${w.slug}.mp4`;
  playerVideo.load();
  player.classList.add('is-open');
  player.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  if (lenis) lenis.stop();
  playerVideo.play().catch(() => {});
  playerToggle.textContent = '⏸';
};

const openPlayer = (i) => {
  const w = WORKS[i];
  if (!w) return;
  current = i;
  fillPlayer(w, `${pad2(i + 1)} / ${pad2(WORKS.length)}`, fmtDur(w.dur));
};

const openArchive = (slug) => {
  const f = FILMS[slug];
  if (!f) return;
  fillPlayer({
    title: f.title,
    en: f.en,
    cat: '影像档案',
    year: 2026,
    slug,
    desc: '同一套产线上长出来的一条片子。生成、剪辑、字幕、成片，全部跑在自己的工作流里。',
  }, 'ARCHIVE / 13', '—');
};

const closePlayer = () => {
  player.classList.remove('is-open');
  player.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  if (lenis) lenis.start();
  playerVideo.pause();
  setTimeout(() => { playerVideo.removeAttribute('src'); playerVideo.load(); }, 450);
};

$$('.work__row').forEach((row) => {
  row.addEventListener('click', (e) => {
    e.preventDefault();
    openPlayer(Number(row.dataset.i));
  });
});

$$('.reel__item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const slug = item.dataset.slug;
    const i = WORKS.findIndex((w) => w.slug === slug);
    if (i >= 0) openPlayer(i);
    else openArchive(slug);
  });
});

playerVideo.addEventListener('timeupdate', () => {
  if (!playerVideo.duration) return;
  playerBar.style.width = `${(playerVideo.currentTime / playerVideo.duration) * 100}%`;
});
playerVideo.addEventListener('play', () => { playerToggle.textContent = '⏸'; });
playerVideo.addEventListener('pause', () => { playerToggle.textContent = '▶'; });
playerToggle.addEventListener('click', () => {
  if (playerVideo.paused) playerVideo.play().catch(() => {});
  else playerVideo.pause();
});
$('#playerClose').addEventListener('click', closePlayer);
player.addEventListener('click', (e) => {
  if (e.target === player || e.target.classList.contains('player__bg')) closePlayer();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && player.classList.contains('is-open')) closePlayer();
  if (!player.classList.contains('is-open')) return;
  if (e.key === 'ArrowRight') openPlayer((current + 1) % WORKS.length);
  if (e.key === 'ArrowLeft') openPlayer((current - 1 + WORKS.length) % WORKS.length);
});

/* ------------------------------------------------------------
   boot
   ------------------------------------------------------------ */
window.addEventListener('load', boot, { once: true });
setTimeout(() => { if (!document.body.classList.contains('is-loaded')) boot(); }, 2600);
