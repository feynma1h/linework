/* ============================================================
   The Studio — your turn at the press.

   Designed so you never face a blank equation box. Pick a
   starting point from the specimen strip, turn the knobs, or hit
   "surprise me" — every path here is curated to land on something
   worth keeping. The raw x(t)/y(t) is tucked under "show the
   math" for when you want to reach in and change the rules.
   ============================================================ */
import { T, rgba, lerpColor, reducedMotion, themeName } from '../core/palette.js';
import { fitCanvas, downloadBlob, downloadCanvasPNG, toast, copyText, slug } from '../core/dom.js';
import { svgDoc } from '../core/svg.js';

/* ---- a safe little expression compiler (no eval of arbitrary JS) ---- */
const FN = ['atan2', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'sqrt', 'floor',
            'round', 'ceil', 'sign', 'sin', 'cos', 'tan', 'abs', 'exp', 'log', 'min', 'max', 'pow'];

function compileExpr(src) {
  if (!src || !src.trim()) throw new Error('empty expression');
  let test = src.toLowerCase();
  FN.forEach(f => { test = test.split(f).join(' '); });
  test = test.split('pi').join(' ');
  test = test.replace(/[tab0-9+\-*/().,%\^\s]/g, '');
  if (test.length) throw new Error('unknown token “' + test[0] + '…” — see the hint below');
  let code = src;
  FN.forEach(f => { code = code.replace(new RegExp('\\b' + f + '\\b', 'gi'), 'Math.' + f); });
  code = code.replace(/\bpi\b/gi, 'Math.PI');
  code = code.replace(/\^/g, '**');
  const fn = new Function('t', 'a', 'b', '"use strict"; return (' + code + ');');
  fn(0, 1, 1);
  return fn;
}

/* ---- the specimen strip: curated, always-beautiful starting points ---- */
const PRESETS = [
  { name: 'Butterfly',   x: 'sin(t)*(exp(cos(t)) - 2*cos(4*t) - pow(sin(t/12),5))',
                         y: 'cos(t)*(exp(cos(t)) - 2*cos(4*t) - pow(sin(t/12),5))', tm: 24, a: 4, b: 3, lockAB: true },
  { name: 'Rose',        x: 'cos(a*t)*cos(t)', y: 'cos(a*t)*sin(t)', tm: 2, a: 7, b: 3 },
  { name: 'Lissajous',   x: 'sin(a*t + pi/2)', y: 'sin(b*t)', tm: 2, a: 3, b: 4 },
  { name: 'Epicycloid',  x: '(a+b)*cos(t) - b*cos(((a+b)/b)*t)',
                         y: '(a+b)*sin(t) - b*sin(((a+b)/b)*t)', tm: 12, a: 5, b: 3 },
  { name: 'Guilloché',   x: 'cos(t) + cos(a*t)/2 + sin(b*t)/3',
                         y: 'sin(t) + sin(a*t)/2 + cos(b*t)/3', tm: 2, a: 6, b: 14 },
  { name: 'Hypotrochoid', x: '(10-a)*cos(t) + b*cos(((10-a)/a)*t)',
                         y: '(10-a)*sin(t) - b*sin(((10-a)/a)*t)', tm: 6, a: 3, b: 5 },
  { name: 'Web',         x: 'cos((a/b)*t)*cos(t)', y: 'cos((a/b)*t)*sin(t)', tm: 12, a: 5, b: 3 },
  { name: 'Heart',       x: '16*pow(sin(t),3)',
                         y: '13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t)', tm: 2, a: 4, b: 3, lockAB: true },
];

/* ---- DOM handles ---- */
const canvas = document.getElementById('studioCanvas');
const exprX = document.getElementById('studioX'), exprY = document.getElementById('studioY');
const sA = document.getElementById('studioA'), sB = document.getElementById('studioB'), sTm = document.getElementById('studioTm');
const err = document.getElementById('studioError');
const presetStrip = document.getElementById('studioPresets');
let last = null;
let activePreset = -1;

/* ---- the core plotter: samples a parametric pair and fits it to a box ---- */
function computePoints(fx, fy, a, b, tMax, SAMPLES) {
  const pts = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const t = tMax * i / SAMPLES;
    const x = fx(t, a, b), y = fy(t, a, b);
    if (!isFinite(x) || !isFinite(y)) { pts.push(null); continue; }
    pts.push([x, y]);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  if (!isFinite(minX) || maxX - minX < 1e-12) { minX -= 1; maxX += 1; }
  if (!isFinite(minY) || maxY - minY < 1e-12) { minY -= 1; maxY += 1; }
  return { pts, minX, maxX, minY, maxY };
}

function drawPoints(ctx, w, h, data, animate, onCanvas) {
  const { pts, minX, maxX, minY, maxY } = data;
  const SAMPLES = pts.length - 1;
  const span = Math.max(maxX - minX, maxY - minY);
  const scale = (Math.min(w, h) - 56) / span;
  const offX = w / 2 - ((minX + maxX) / 2) * scale;
  const offY = h / 2 + ((minY + maxY) / 2) * scale;
  const px = p => [offX + p[0] * scale, offY - p[1] * scale];
  ctx.lineWidth = 0.8;
  function seg(i) {
    const p0 = pts[i - 1], p1 = pts[i];
    if (p0 && p1) {
      ctx.strokeStyle = lerpColor(T.crimson, T.blue, i / SAMPLES, 0.6);
      const A = px(p0), B = px(p1);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
  }
  if (animate && !reducedMotion && onCanvas) {
    const CHUNK = Math.ceil(SAMPLES / 110);
    let i = 1;
    function drawChunk() {
      let n = 0;
      while (n < CHUNK && i <= SAMPLES) { seg(i); i++; n++; }
      if (i <= SAMPLES) onCanvas._raf = requestAnimationFrame(drawChunk);
    }
    drawChunk();
  } else {
    for (let i = 1; i <= SAMPLES; i++) seg(i);
  }
}

/* ---- plot the main canvas from the current inputs ---- */
export function plotStudio(animate) {
  err.textContent = '';
  let fx, fy;
  try {
    fx = compileExpr(exprX.value);
    fy = compileExpr(exprY.value);
  } catch (e) { err.textContent = '⚠ ' + e.message; return; }

  const a = parseFloat(sA.value), b = parseFloat(sB.value);
  const tMax = parseInt(sTm.value) * Math.PI;
  let data;
  try { data = computePoints(fx, fy, a, b, tMax, 5000); }
  catch (e) { err.textContent = '⚠ runtime: ' + e.message; return; }
  last = data;

  if (canvas._raf) cancelAnimationFrame(canvas._raf);
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  drawPoints(ctx, w, h, data, animate, canvas);
}

function syncOutputs() {
  document.getElementById('studioTmOut').textContent = sTm.value;
  document.getElementById('studioAOut').textContent = sA.value;
  document.getElementById('studioBOut').textContent = sB.value;
}

function setFromPreset(p) {
  exprX.value = p.x; exprY.value = p.y;
  sTm.value = p.tm; sA.value = p.a; sB.value = p.b;
  syncOutputs();
}

function loadPreset(i, animate) {
  activePreset = i;
  setFromPreset(PRESETS[i]);
  [...presetStrip.children].forEach((el, k) => el.classList.toggle('active', k === i));
  plotStudio(animate);
}

/* ---- build the specimen strip (small live thumbnails) ---- */
PRESETS.forEach((p, i) => {
  const btn = document.createElement('button');
  btn.className = 'preset';
  btn.type = 'button';
  btn.innerHTML = `<canvas aria-hidden="true"></canvas><span>${p.name}</span>`;
  btn.setAttribute('aria-label', 'start from ' + p.name);
  presetStrip.appendChild(btn);
  btn.addEventListener('click', () => loadPreset(i, true));

  /* render the thumbnail once layout settles */
  requestAnimationFrame(() => {
    const c = btn.querySelector('canvas');
    const { ctx, w, h } = fitCanvas(c);
    ctx.clearRect(0, 0, w, h);
    try {
      const data = computePoints(compileExpr(p.x), compileExpr(p.y), p.a, p.b, p.tm * Math.PI, 1400);
      drawPoints(ctx, w, h, data, false, null);
    } catch (e) { /* a bad preset shouldn't break the strip */ }
  });
});

/* ---- surprise me: a curated preset + gently randomised knobs ---- */
document.getElementById('studioSurprise').addEventListener('click', () => {
  const i = Math.floor(Math.random() * PRESETS.length);
  const p = PRESETS[i];
  activePreset = i;
  setFromPreset(p);
  if (!p.lockAB) {
    const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
    sA.value = rnd(Math.max(2, +sA.min | 0), Math.min(9, +sA.max | 0));
    sB.value = rnd(Math.max(2, +sB.min | 0), Math.min(9, +sB.max | 0));
    syncOutputs();
  }
  [...presetStrip.children].forEach((el, k) => el.classList.toggle('active', k === i));
  plotStudio(true);
  toast('surprise — turn the knobs from here');
});

/* ---- wiring ---- */
[sTm, sA, sB].forEach(el => el.addEventListener('input', () => { syncOutputs(); plotStudio(false); }));
[exprX, exprY].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') plotStudio(true); }));
document.getElementById('studioReplay').addEventListener('click', () => plotStudio(true));
document.getElementById('studioPng').addEventListener('click', () => downloadCanvasPNG(canvas, 'studio-plot.png'));
document.getElementById('studioSvg').addEventListener('click', studioSVG);
document.getElementById('studioLink').addEventListener('click', () => {
  const ps = new URLSearchParams();
  ps.set('lab', '1');
  ps.set('x', exprX.value); ps.set('y', exprY.value);
  ps.set('tm', sTm.value); ps.set('a', sA.value); ps.set('b', sB.value);
  if (themeName === 'blueprint') ps.set('theme', 'blueprint');
  copyText(location.origin + location.pathname + '#' + ps.toString());
});

function studioSVG() {
  if (!last) { toast('plot something first'); return; }
  const { pts, minX, maxX, minY, maxY } = last;
  const span = Math.max(maxX - minX, maxY - minY);
  const scale = (600 - 56) / span;
  const offX = 300 - ((minX + maxX) / 2) * scale;
  const offY = 300 + ((minY + maxY) / 2) * scale;
  const r2 = v => Math.round(v * 100) / 100;
  const px = p => [r2(offX + p[0] * scale), r2(offY - p[1] * scale)];
  const parts = [];
  const CH = 50;
  for (let s = 1; s < pts.length; s += CH) {
    let d = '', started = false;
    for (let i = s; i < Math.min(s + CH, pts.length); i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      if (!p0 || !p1) { started = false; continue; }
      const A = px(p0), B = px(p1);
      if (!started) { d += 'M' + A[0] + ' ' + A[1]; started = true; }
      d += 'L' + B[0] + ' ' + B[1];
    }
    if (d) {
      const col = lerpColor(T.crimson, T.blue, s / pts.length, 0.85);
      const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(col);
      const hex = '#' + [+m[1], +m[2], +m[3]].map(v => v.toString(16).padStart(2, '0')).join('');
      parts.push(`<path d="${d}" fill="none" stroke="${hex}" stroke-opacity="${m[4]}" stroke-width="0.8"/>`);
    }
  }
  downloadBlob(svgDoc(parts), 'image/svg+xml', 'studio-plot.svg');
  toast('SVG saved — plotter-ready');
}

/* ---- public API for permalinks, theme switches and resize ---- */
export function loadStudioFromParams(ps) {
  if (ps.has('x')) exprX.value = ps.get('x');
  if (ps.has('y')) exprY.value = ps.get('y');
  if (ps.has('tm')) sTm.value = ps.get('tm');
  if (ps.has('a')) sA.value = ps.get('a');
  if (ps.has('b')) sB.value = ps.get('b');
  activePreset = -1;
  [...presetStrip.children].forEach(el => el.classList.remove('active'));
  syncOutputs();
  plotStudio(true);
}

export function refreshStudio() { plotStudio(false); }

/* boot the studio on a friendly default */
export function bootStudio() { loadPreset(1, false); }
