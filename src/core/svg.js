/* ============================================================
   SVG recorder — the trick that makes everything plotter-ready.

   makeRecorder() returns a *fake* 2-D canvas context. The exact
   same draw() generator that paints the screen runs against it,
   but every stroke becomes a vector <path> instead of pixels.
   No duplicate drawing code — one source of truth, two outputs.
   ============================================================ */
import { T } from './palette.js';
import { mulberry32 } from './math.js';
import { downloadBlob, slug, toast } from './dom.js';

export function makeRecorder() {
  const parts = [];
  let cur = null, dots = null;
  const st = { stroke: 'rgba(0,0,0,1)', fill: 'rgba(0,0,0,1)', lw: 1, ga: 1 };
  const r2 = v => Math.round(v * 100) / 100;

  function parse(c) {
    const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/.exec(c);
    if (!m) return { hex: c, op: 1 };
    const hex = '#' + [+m[1], +m[2], +m[3]].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    return { hex, op: m[4] === undefined ? 1 : +m[4] };
  }

  function flushDots() {
    if (!dots || !dots.d.length) { dots = null; return; }
    const { hex, op } = parse(dots.style);
    parts.push(`<path d="${dots.d.join('')}" fill="none" stroke="${hex}" stroke-opacity="${r2(op * dots.ga)}" stroke-width="${r2(dots.sw)}" stroke-linecap="round"/>`);
    dots = null;
  }

  const ctx = {
    set strokeStyle(v) { st.stroke = v; }, get strokeStyle() { return st.stroke; },
    set fillStyle(v)   { st.fill = v; },   get fillStyle()   { return st.fill; },
    set lineWidth(v)   { st.lw = v; },     get lineWidth()   { return st.lw; },
    set globalAlpha(v) { st.ga = v; },     get globalAlpha() { return st.ga; },
    beginPath() { cur = { d: [], arcs: [] }; },
    moveTo(x, y) { if (cur) cur.d.push(`M${r2(x)} ${r2(y)}`); },
    lineTo(x, y) { if (cur) cur.d.push(`L${r2(x)} ${r2(y)}`); },
    arc(x, y, r) { if (cur) cur.arcs.push([x, y, r]); },
    stroke() {
      if (!cur || !cur.d.length) return;
      const { hex, op } = parse(st.stroke);
      parts.push(`<path d="${cur.d.join('')}" fill="none" stroke="${hex}" stroke-opacity="${r2(op * st.ga)}" stroke-width="${r2(st.lw)}"/>`);
    },
    fill() {
      if (!cur) return;
      const { hex, op } = parse(st.fill);
      cur.arcs.forEach(([x, y, r]) => {
        parts.push(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}" fill="${hex}" fill-opacity="${r2(op * st.ga)}"/>`);
      });
    },
    fillRect(x, y, w, h) {
      const cx = x + w / 2, cy = y + h / 2, sw = Math.max(w, h);
      if (!dots || dots.style !== st.fill || Math.abs(dots.sw - sw) > 0.01) {
        flushDots();
        dots = { style: st.fill, sw, ga: st.ga, d: [] };
      }
      dots.d.push(`M${r2(cx)} ${r2(cy)}h.01`);
    },
    rect() {}, clearRect() {}, setTransform() {}, save() {}, restore() {},
  };
  return { ctx, parts, finish: flushDots };
}

export function svgDoc(parts) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 600 600">
<!-- plotter tip: delete the "paper" rect below to plot on your own stock -->
<rect id="paper" width="600" height="600" fill="${T.paper}"/>
${parts.join('\n')}
</svg>`;
}

export function exportSVG(piece) {
  const rec = makeRecorder();
  const gen = piece.draw(rec.ctx, 600, 600, piece.values, mulberry32(piece.seed));
  let guard = 0;
  while (!gen.next().done && ++guard < 200000) {}
  rec.finish();
  downloadBlob(svgDoc(rec.parts), 'image/svg+xml', slug(piece.title) + '.svg');
  toast('SVG saved — plotter-ready');
}
