/* ============================================================
   The rendering engine.

   Every piece exposes a generator draw(ctx, w, h, params, rng):
   each `yield` is one animation step, so the same function can
   either paint itself stroke-by-stroke on screen or run to
   completion for a crisp export. This module drives both.
   ============================================================ */
import { T, themeName, reducedMotion } from './palette.js';
import { fitCanvas, slug, toast } from './dom.js';
import { mulberry32 } from './math.js';

/* Draw a piece onto a canvas — animated (live plotting) or instant. */
export function renderPiece(piece, canvas, animate) {
  if (canvas._raf) cancelAnimationFrame(canvas._raf);
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const gen = piece.draw(ctx, w, h, piece.values, mulberry32(piece.seed));

  if (!animate || reducedMotion) {
    let guard = 0;
    while (!gen.next().done && ++guard < 200000) {}
    return;
  }
  function tick() {
    let done = false;
    for (let i = 0; i < 2; i++) { if (gen.next().done) { done = true; break; } }
    if (!done) canvas._raf = requestAnimationFrame(tick);
  }
  canvas._raf = requestAnimationFrame(tick);
}

/* Render a piece at any resolution and save it as a PNG. */
export function exportPNG(piece, size, name) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const scale = size / 600;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = T.paper; ctx.fillRect(0, 0, 600, 600);
  const gen = piece.draw(ctx, 600, 600, piece.values, mulberry32(piece.seed));
  let guard = 0;
  while (!gen.next().done && ++guard < 200000) {}
  const a = document.createElement('a');
  a.download = (name || slug(piece.title)) + '.png';
  a.href = c.toDataURL('image/png');
  a.click();
  toast('saved — go frame it');
}

/* Build a shareable permalink that encodes the piece + its knobs. */
export function pieceLink(piece) {
  const ps = new URLSearchParams();
  ps.set('p', piece.index);
  ps.set('seed', piece.seed);
  for (const k in piece.values) ps.set(k, piece.values[k]);
  if (themeName === 'blueprint') ps.set('theme', 'blueprint');
  return location.origin + location.pathname + '#' + ps.toString();
}

/* Render the slider row for a piece's parameters. */
export function buildControls(container, piece, onChange) {
  container.innerHTML = '';
  piece.params.forEach(prm => {
    const row = document.createElement('div');
    row.className = 'ctl';
    row.innerHTML = `<label>${prm.label}</label>
      <input type="range" min="${prm.min}" max="${prm.max}" step="${prm.step}" value="${piece.values[prm.key]}" aria-label="${prm.label}">
      <output>${piece.values[prm.key]}</output>`;
    const input = row.querySelector('input'), out = row.querySelector('output');
    input.addEventListener('input', () => {
      piece.values[prm.key] = parseFloat(input.value);
      out.textContent = input.value;
      onChange();
    });
    container.appendChild(row);
  });
}
