import './style.css';
import { OBJECTS } from './data/objects';
import { Universe, type Placed } from './render/scene';
import { STRINGS, detectLang, type Lang } from './i18n';
import { formatAlt, formatLength, formatRatio, scaleBar } from './format';
import { Ambient } from './audio';

const N = OBJECTS.length;
const SSS = new Set(['sun', 'mercury', 'venus_atmosphere', 'earth_day', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']);
const textureCredit = (tex?: string[]) => {
  if (!tex?.length) return '';
  return SSS.has(tex[0]) ? 'Texture: Solar System Scope (CC BY 4.0)' : 'Texture: NASA / JPL / USGS (public domain)';
};
const EARTH = OBJECTS.find((o) => o.id === 'earth')!;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('gl');
if (new URLSearchParams(location.search).has('clean')) document.body.classList.add('clean');
let universe: Universe;
try {
  universe = new Universe(canvas);
} catch {
  document.body.innerHTML = '<p class="nogl">Size of Space needs WebGL. Please try a modern browser.</p>';
  throw new Error('WebGL unavailable');
}

let lang: Lang = detectLang();
let S = STRINGS[lang];
const ambient = new Ambient();

// ---------- state ----------
const indexOf = (id: string) => OBJECTS.findIndex((o) => o.id === id);
const fromHash = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const i = indexOf(id);
  return i >= 0 ? i : 0;
};
/** `#compare=earth,sun` → [a, b] */
const compareFromHash = (): [number, number] | null => {
  const m = /^#compare=([^,]+),(.+)$/.exec(decodeURIComponent(location.hash));
  if (!m) return null;
  const a = indexOf(m[1]), b = indexOf(m[2]);
  return a >= 0 && b >= 0 ? [a, b] : null;
};
let cmp: { a: number; b: number } | null = null;
let cmpLog = 0; // animated log(small / big diameter)
let target = compareFromHash() ? 0 : fromHash();
let progress = target;
let lastInput = 0;
let panelIndex = -1;
const labelWidths: number[] = [];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const setTarget = (v: number) => {
  target = clamp(v, 0, N - 1);
  lastInput = performance.now();
};
const go = (i: number) => {
  closePanel();
  setTarget(Math.round(i));
};

// ---------- labels ----------
const labelsEl = $('labels');
const labelEls = OBJECTS.map((o, i) => {
  const el = document.createElement('button');
  el.className = 'label';
  el.innerHTML = '<span class="n"></span><span class="s"></span>';
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cmp || (Math.round(progress) === i && Math.abs(progress - i) < 0.05)) openPanel(i);
    else go(i);
  });
  labelsEl.appendChild(el);
  return el;
});

function refreshLabels() {
  OBJECTS.forEach((o, i) => {
    const el = labelEls[i];
    el.querySelector('.n')!.textContent = o.name[lang];
    el.querySelector('.s')!.textContent = formatLength(o.d, lang, S);
  });
}

// ---------- track ----------
const ticks = $('ticks');
OBJECTS.forEach((o, i) => {
  const t = document.createElement('button');
  t.className = 'tick';
  t.style.left = `${(i / (N - 1)) * 100}%`;
  t.dataset.cat = o.cat;
  t.addEventListener('click', (e) => { e.stopPropagation(); go(i); });
  ticks.appendChild(t);
});

const track = $('track');
let dragTrack = false;
const trackTo = (clientX: number) => {
  const rect = track.getBoundingClientRect();
  setTarget(((clientX - rect.left) / rect.width) * (N - 1));
};
track.addEventListener('pointerdown', (e) => {
  dragTrack = true;
  track.setPointerCapture(e.pointerId);
  trackTo(e.clientX);
});
track.addEventListener('pointermove', (e) => dragTrack && trackTo(e.clientX));
track.addEventListener('pointerup', () => { dragTrack = false; setTarget(Math.round(target)); });

// ---------- panel ----------
const panel = $('panel');
function openPanel(i: number) {
  panelIndex = i;
  const o = OBJECTS[i];
  $('p-cat').textContent = S.cat[o.cat];
  $('p-name').textContent = o.name[lang];
  const alt = formatAlt(o.d, lang, S);
  $('p-size').innerHTML = formatLength(o.d, lang, S) + (alt ? `<small>${alt}</small>` : '');
  const e = o.d / EARTH.d;
  $('p-earth').textContent = o.id === 'earth' ? '1×' : e >= 1 ? S.earths(formatRatio(e, lang)) : S.smallerThanEarth(formatRatio(e, lang));
  const dRow = $('p-dist-row');
  if (o.dist === null) dRow.hidden = true;
  else {
    dRow.hidden = false;
    $('p-dist').textContent = o.dist === 0 ? S.youAreHere : formatLength(o.dist, lang, S);
  }
  $('p-ratio').textContent = i > 0 ? S.prevRatio(formatRatio(o.d / OBJECTS[i - 1].d, lang), OBJECTS[i - 1].name[lang]) : '';
  $('p-fact').textContent = o.fact[lang];
  $<HTMLAnchorElement>('p-wiki').href = `https://en.wikipedia.org/wiki/${o.wiki}`;
  $('p-credits').textContent = textureCredit(o.look.tex);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
}
function closePanel() {
  panelIndex = -1;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}
$('panel-close').addEventListener('click', closePanel);

// ---------- compare ----------
const selA = $<HTMLSelectElement>('cmp-a'), selB = $<HTMLSelectElement>('cmp-b');
const cmpInset = $('cmp-inset');

function fillSelects() {
  for (const sel of [selA, selB]) {
    const keep = sel.value;
    sel.innerHTML = '';
    let group: HTMLOptGroupElement | null = null;
    let cat = '';
    OBJECTS.forEach((o, i) => {
      if (o.cat !== cat) {
        cat = o.cat;
        group = document.createElement('optgroup');
        group.label = S.cat[o.cat];
        sel.appendChild(group);
      }
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${o.name[lang]} · ${formatLength(o.d, lang, S)}`;
      group!.appendChild(opt);
    });
    if (keep) sel.value = keep;
  }
}

function updateCompareText() {
  if (!cmp) return;
  selA.value = String(cmp.a);
  selB.value = String(cmp.b);
  const [s, b] = OBJECTS[cmp.a].d <= OBJECTS[cmp.b].d ? [OBJECTS[cmp.a], OBJECTS[cmp.b]] : [OBJECTS[cmp.b], OBJECTS[cmp.a]];
  if (cmp.a === cmp.b) {
    $('cmp-main').textContent = S.cmpSame;
    $('cmp-sub').textContent = '';
  } else {
    const x = b.d / s.d;
    $('cmp-main').textContent = S.cmpWider(b.name[lang], formatRatio(x, lang), s.name[lang]);
    $('cmp-sub').textContent = S.cmpVolume(formatRatio(x ** 3, lang), s.name[lang]);
  }
  history.replaceState(null, '', `#compare=${OBJECTS[cmp.a].id},${OBJECTS[cmp.b].id}`);
}

function enterCompare(a: number, b: number, instant = false) {
  closePanel();
  const fresh = !cmp;
  cmp = { a, b };
  if (fresh) cmpLog = 0;
  if (instant) cmpLog = Math.log(Math.min(OBJECTS[a].d, OBJECTS[b].d) / Math.max(OBJECTS[a].d, OBJECTS[b].d));
  document.body.classList.add('comparing');
  $('compare').hidden = false;
  hashIndex = -1;
  updateCompareText();
}

function exitCompare() {
  if (!cmp) return;
  const back = Math.max(cmp.a, cmp.b);
  cmp = null;
  document.body.classList.remove('comparing');
  $('compare').hidden = true;
  cmpInset.hidden = $('cmp-leader').hidden = $('cmp-dot').hidden = true;
  progress = target = back;
  hashIndex = -1;
}

$('btn-compare').addEventListener('click', (e) => {
  e.stopPropagation();
  if (cmp) { exitCompare(); return; }
  const cur = Math.round(progress);
  const earth = indexOf('earth'), sun = indexOf('sun');
  enterCompare(cur === earth ? earth : cur, cur === earth ? sun : earth);
});
selA.addEventListener('change', () => cmp && enterCompare(+selA.value, cmp.b));
selB.addEventListener('change', () => cmp && enterCompare(cmp.a, +selB.value));
$('cmp-swap').addEventListener('click', () => cmp && enterCompare(cmp.b, cmp.a));
$('cmp-close').addEventListener('click', exitCompare);

// ---------- i18n ----------
function applyLang() {
  S = STRINGS[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const v = S[el.dataset.i18n as keyof typeof S];
    if (typeof v === 'string') el.textContent = v;
  });
  $('btn-lang').textContent = lang === 'en' ? 'RU' : 'EN';
  refreshLabels();
  fillSelects();
  updateCompareText();
  labelWidths.length = 0;
  if (panelIndex >= 0) openPanel(panelIndex);
}
$('btn-lang').addEventListener('click', () => {
  lang = lang === 'en' ? 'ru' : 'en';
  try { localStorage.setItem('sos-lang', lang); } catch { /* ignore */ }
  applyLang();
});
applyLang();

// Music starts with the first click/tap/key press (browsers block autoplay),
// unless the visitor switched it off before.
const soundBtn = $('btn-sound');
let soundPref = 'on';
try { soundPref = localStorage.getItem('sos-sound') ?? 'on'; } catch { /* ignore */ }
const syncSound = () => {
  soundBtn.setAttribute('aria-pressed', String(ambient.on));
  soundBtn.classList.toggle('waiting', !ambient.started && soundPref !== 'off');
};
soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const on = ambient.toggle();
  soundPref = on ? 'on' : 'off';
  try { localStorage.setItem('sos-sound', soundPref); } catch { /* ignore */ }
  syncSound();
});
const firstGesture = () => {
  if (soundPref !== 'off' && !ambient.started) ambient.start();
  syncSound();
  window.removeEventListener('pointerdown', firstGesture, true);
  window.removeEventListener('keydown', firstGesture, true);
};
window.addEventListener('pointerdown', firstGesture, true);
window.addEventListener('keydown', firstGesture, true);
syncSound();
$('btn-prev').addEventListener('click', () => go(Math.round(target) - 1));
$('btn-next').addEventListener('click', () => go(Math.round(target) + 1));
$('btn-restart').addEventListener('click', () => go(0));

// ---------- input ----------
window.addEventListener('wheel', (e) => {
  if ((e.target as HTMLElement).closest('.panel')) return;
  e.preventDefault();
  if (cmp) return;
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const unit = e.deltaMode === 1 ? 30 : e.deltaMode === 2 ? 600 : 1;
  setTarget(target + clamp(d * unit, -120, 120) * 0.0045);
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (cmp) {
    if (e.key === 'Escape') { if (panelIndex >= 0) closePanel(); else exitCompare(); }
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(Math.round(target) + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(Math.round(target) - 1); }
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(N - 1);
  else if (e.key === 'Escape') closePanel();
  else if (e.key === 'Enter' || e.key === 'i') openPanel(Math.round(progress));
});

let drag: { x: number; t: number; moved: boolean } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, t: target, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) > 6) drag.moved = true;
  if (drag.moved && !cmp) setTarget(drag.t - dx / Math.max(universe.width * 0.35, 200));
});
canvas.addEventListener('pointerup', (e) => {
  if (drag && !drag.moved) handleClick(e.clientX, e.clientY);
  drag = null;
});

let placed: Placed[] = [];
function handleClick(cx: number, cy: number) {
  const x = cx - universe.width / 2, y = cy - universe.height / 2;
  // smallest object under the pointer wins
  const hit = placed
    .filter((p) => Math.hypot(p.x - x, p.y - y) < Math.max(p.r, 16))
    .sort((a, b) => a.r - b.r)[0];
  if (!hit) { closePanel(); return; }
  if (cmp || (hit.index === Math.round(progress) && Math.abs(progress - hit.index) < 0.1)) openPanel(hit.index);
  else go(hit.index);
}

window.addEventListener('hashchange', () => {
  const c = compareFromHash();
  if (c) enterCompare(c[0], c[1]);
  else { exitCompare(); go(fromHash()); }
});

// ---------- loop ----------
const intro = $('intro'), hint = $('hint'), outro = $('outro');
const thumb = $('thumb'), fill = $('track-fill'), counter = $('counter');
const bar = $('scale-bar'), barLabel = $('scale-label');
let last = performance.now();
let hashIndex = -1;
const t0 = last;

function compareFrame(now: number, dt: number) {
  const { a, b } = cmp!;
  const want = Math.log(Math.min(OBJECTS[a].d, OBJECTS[b].d) / Math.max(OBJECTS[a].d, OBJECTS[b].d));
  cmpLog += (want - cmpLog) * Math.min(1, dt * 3);
  if (Math.abs(want - cmpLog) < 1e-3) cmpLog = want;
  const res = universe.renderCompare(a, b, Math.exp(cmpLog), (now - t0) / 1000);
  placed = [res.big, ...(a !== b ? [res.small] : [])];
  const shown = new Set<number>();
  for (const p of placed) {
    const el = labelEls[p.index];
    const lx = universe.width / 2 + p.x;
    const ly = universe.height / 2 + p.y + Math.max(p.r * Math.min(p.ext, 1.12), 6) + 14;
    el.style.transform = `translate(${lx}px, ${ly}px) translateX(-50%)`;
    el.style.opacity = '1';
    el.classList.add('focus');
    shown.add(p.index);
  }
  labelEls.forEach((el, i) => {
    el.classList.toggle('show', shown.has(i));
    if (!shown.has(i)) el.classList.remove('focus');
  });
  const leader = $('cmp-leader'), dot = $('cmp-dot');
  if (res.inset) {
    const s = res.inset.size;
    const ix = universe.width / 2 + res.inset.x, iy = universe.height / 2 + res.inset.y;
    const dx = universe.width / 2 + res.small.x, dy = universe.height / 2 + res.small.y;
    cmpInset.hidden = leader.hidden = dot.hidden = false;
    cmpInset.style.cssText = `width:${s}px;height:${s}px;left:${ix - s / 2}px;top:${iy - s / 2}px`;
    leader.style.cssText = `left:${dx}px;top:${iy + s / 2}px;height:${Math.max(0, dy - 8 - (iy + s / 2))}px`;
    dot.style.cssText = `left:${dx}px;top:${dy}px`;
    $('cmp-zoom').textContent = S.cmpZoom(formatRatio(res.inset.zoom, lang));
  } else cmpInset.hidden = leader.hidden = dot.hidden = true;
  ambient.setDepth(Math.max(a, b) / (N - 1));
}

function resize() {
  universe.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (cmp) {
    compareFrame(now, dt);
    requestAnimationFrame(frame);
    return;
  }

  // Gentle snapping to the nearest object once input stops.
  if (now - lastInput > 450 && !dragTrack && !drag) {
    const snap = Math.round(target);
    target += (snap - target) * Math.min(1, dt * 5);
  }
  const before = progress;
  progress += (target - progress) * Math.min(1, dt * 5.5);
  ambient.nudge(Math.abs(progress - before) * 0.5);
  if (Math.abs(target - progress) < 1e-4) progress = target;

  placed = universe.render(progress, (now - t0) / 1000);
  const cur = Math.round(progress);

  // labels: the focused one first, then neighbours, skipping any that would collide
  const visible = new Set<number>();
  const boxes: [number, number, number, number][] = [];
  const order = [...placed].sort((a, b) => Math.abs(a.index - progress) - Math.abs(b.index - progress));
  for (const p of order) {
    if (p.r < 2.5 || (p.r < 9 && p.index !== cur)) continue;
    const el = labelEls[p.index];
    const ly = universe.height / 2 + p.y + p.r * Math.min(p.ext, 1.12) + 14;
    const lx = universe.width / 2 + p.x;
    if (ly > universe.height - 100) continue;
    if (!labelWidths[p.index] && el.offsetWidth) labelWidths[p.index] = el.offsetWidth;
    const w = (labelWidths[p.index] || 120) / 2 + 8;
    const box: [number, number, number, number] = [lx - w, ly, lx + w, ly + 40];
    if (box[2] < 0 || box[0] > universe.width) continue;
    if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    visible.add(p.index);
    const focus = 1 - clamp(Math.abs(progress - p.index), 0, 1);
    el.style.transform = `translate(${lx}px, ${ly}px) translateX(-50%)`;
    el.style.opacity = String(0.45 + 0.55 * focus);
    if (el.classList.contains('focus') !== (p.index === cur)) {
      el.classList.toggle('focus', p.index === cur);
      labelWidths[p.index] = 0;
    }
  }
  labelEls.forEach((el, i) => el.classList.toggle('show', visible.has(i)));

  // chrome
  const pct = (progress / (N - 1)) * 100;
  thumb.style.left = `${pct}%`;
  fill.style.width = `${pct}%`;
  counter.textContent = `${cur + 1} / ${N}`;
  intro.classList.toggle('hide', progress > 0.35);
  hint.classList.toggle('hide', progress > 0.35);
  outro.hidden = progress < N - 1.3;
  outro.classList.toggle('show', progress > N - 1.15);

  const { k } = universe.view(progress);
  const sb = scaleBar(1 / k, Math.min(140, universe.width * 0.25), lang, S);
  bar.style.width = `${sb.px}px`;
  barLabel.textContent = sb.label;

  ambient.setDepth(progress / (N - 1));

  if (Math.abs(progress - cur) < 0.02 && hashIndex !== cur) {
    hashIndex = cur;
    history.replaceState(null, '', cur === 0 ? location.pathname + location.search : `#${OBJECTS[cur].id}`);
  }
  if (panelIndex >= 0 && Math.abs(progress - panelIndex) > 0.6) closePanel();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setTimeout(() => universe.preload(), 1200);
const initialCompare = compareFromHash();
if (initialCompare) enterCompare(initialCompare[0], initialCompare[1], true);
