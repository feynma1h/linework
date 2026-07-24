/* ============================================================
   Compositions — many equations sharing one frame.

   Where the Collection is a single voice, a composition is a
   chorus: tiles, atlases and subdivisions that let a whole
   family of equations occupy one sheet. Same draw() contract as
   the Collection — these just carry `section:'comp'` so the
   gallery files them under the right heading.
   ============================================================ */
import { T, rgba } from '../core/palette.js';

export const COMPOSITIONS = [
{
  section: 'comp',
  title: "Truchet Quilt",
  equation: "tile ∈ {◜◞, ◝◟} chosen by χ(i,j) — arcs meet at edge midpoints",
  params: [
    { key: "cells", label: "cells", min: 4, max: 14, step: 1, value: 8 },
    { key: "detail", label: "subdivide %", min: 0, max: 60, step: 5, value: 25 },
  ],
  *draw(ctx, w, h, p, rng) {
    const S = Math.min(w, h) - 36, ox = (w - S) / 2, oy = (h - S) / 2;
    const cell = S / p.cells;
    const arc = (cx, cy, r, a0, a1, col, lw) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath();
      const steps = 14;
      for (let s = 0; s <= steps; s++) {
        const a = a0 + (a1 - a0) * s / steps;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    function* tile(x, y, s, depth) {
      if (depth > 0 && rng() * 100 < p.detail && s > cell / 3) {
        const hs = s / 2;
        yield* tile(x, y, hs, depth - 1);       yield* tile(x + hs, y, hs, depth - 1);
        yield* tile(x, y + hs, hs, depth - 1);  yield* tile(x + hs, y + hs, hs, depth - 1);
        return;
      }
      const col = rng() < 0.12 ? rgba(T.crimson, 0.85) : rgba(T.ink, 0.8);
      const lw = s > cell * 0.75 ? 0.9 : 0.7;
      if (rng() < 0.5) {
        arc(x,   y,   s / 2, 0,           Math.PI / 2,   col, lw);
        arc(x + s, y + s, s / 2, Math.PI, Math.PI * 1.5, col, lw);
      } else {
        arc(x + s, y,   s / 2, Math.PI / 2, Math.PI,     col, lw);
        arc(x,   y + s, s / 2, Math.PI * 1.5, Math.PI * 2, col, lw);
      }
      yield;
    }
    for (let i = 0; i < p.cells; i++)
      for (let j = 0; j < p.cells; j++)
        yield* tile(ox + i * cell, oy + j * cell, cell, 2);
  }
},
{
  section: 'comp',
  title: "Rose Atlas",
  equation: "r = cos((n/d)·θ) — every petal ratio, one specimen sheet",
  params: [
    { key: "m", label: "grid m×m", min: 3, max: 6, step: 1, value: 4 },
    { key: "rev", label: "windings", min: 1, max: 3, step: 1, value: 1 },
  ],
  *draw(ctx, w, h, p) {
    const pad = 22, S = Math.min(w, h) - pad * 2, cell = S / p.m;
    const ox = (w - S) / 2, oy = (h - S) / 2;
    for (let i = 0; i < p.m; i++) for (let j = 0; j < p.m; j++) {
      const n = i + 1, d = j + 1;
      const cx = ox + cell * (i + 0.5), cy = oy + cell * (j + 0.5), R = cell * 0.40;
      const col = (n === d) ? T.crimson : T.ink;
      ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 0.8;
      const thEnd = Math.PI * 2 * d * p.rev;
      const steps = Math.min(2600, Math.ceil(thEnd / 0.012));
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const th = thEnd * s / steps;
        const r = Math.cos((n / d) * th) * R;
        const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      yield;
    }
  }
},
{
  section: 'comp',
  title: "Facet Hatch",
  equation: "split(box) until leaf → hatch at θ ~ U(0,π)",
  params: [
    { key: "depth", label: "max splits", min: 3, max: 7, step: 1, value: 5 },
    { key: "gap", label: "line gap", min: 3, max: 9, step: 0.5, value: 4.5 },
  ],
  *draw(ctx, w, h, p, rng) {
    const M = 18;
    function hatch(x0, y0, x1, y1) {
      const ang = rng() * Math.PI;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const nx = -dy, ny = dx;
      const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
      let oMin = Infinity, oMax = -Infinity;
      corners.forEach(([X, Y]) => { const o = X * nx + Y * ny; if (o < oMin) oMin = o; if (o > oMax) oMax = o; });
      ctx.strokeStyle = rng() < 0.10 ? rgba(T.crimson, 0.8) : rgba(T.ink, 0.78);
      ctx.lineWidth = 0.7;
      const inset = 2.5;
      for (let o = oMin + p.gap / 2; o < oMax; o += p.gap) {
        let t0 = -1e9, t1 = 1e9;
        const Px = o * nx, Py = o * ny;
        if (Math.abs(dx) > 1e-9) {
          const ta = (x0 + inset - Px) / dx, tb = (x1 - inset - Px) / dx;
          t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
        } else if (Px < x0 + inset || Px > x1 - inset) continue;
        if (Math.abs(dy) > 1e-9) {
          const ta = (y0 + inset - Py) / dy, tb = (y1 - inset - Py) / dy;
          t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
        } else if (Py < y0 + inset || Py > y1 - inset) continue;
        if (t1 <= t0) continue;
        ctx.beginPath();
        ctx.moveTo(Px + t0 * dx, Py + t0 * dy);
        ctx.lineTo(Px + t1 * dx, Py + t1 * dy);
        ctx.stroke();
      }
    }
    function* split(x0, y0, x1, y1, depth) {
      const wd = x1 - x0, ht = y1 - y0;
      const mayLeaf = depth <= p.depth - 2;   /* top two levels always split — never a blank frame */
      if (depth <= 0 || (wd < 70 && ht < 70) || (mayLeaf && rng() < 0.18)) {
        if (rng() < 0.94) hatch(x0, y0, x1, y1);
        yield;
        return;
      }
      const horiz = wd < ht ? true : (ht < wd ? false : rng() < 0.5);
      const r = 0.35 + rng() * 0.3;
      if (horiz) {
        const ys = y0 + ht * r;
        yield* split(x0, y0, x1, ys, depth - 1);
        yield* split(x0, ys, x1, y1, depth - 1);
      } else {
        const xs = x0 + wd * r;
        yield* split(x0, y0, xs, y1, depth - 1);
        yield* split(xs, y0, x1, y1, depth - 1);
      }
    }
    yield* split(M, M, w - M, h - M, p.depth);
  }
},
{
  section: 'comp',
  title: "Curtain Tiles",
  equation: "x = u·cosᵉ(s·π/2), y = v·sinᵉ(s·π/2) — a comb per cell, mirrored by parity",
  params: [
    { key: "cells", label: "cells", min: 2, max: 6, step: 1, value: 4 },
    { key: "comb", label: "curves / tile", min: 6, max: 20, step: 1, value: 12 },
  ],
  *draw(ctx, w, h, p, rng) {
    const S = Math.min(w, h) - 40, ox = (w - S) / 2, oy = (h - S) / 2;
    const cell = S / p.cells, pad = cell * 0.08;
    for (let i = 0; i < p.cells; i++) for (let j = 0; j < p.cells; j++) {
      const x0 = ox + i * cell, y0 = oy + j * cell;
      const mirX = (i + j) % 2 === 1;                    /* checkerboard mirror */
      const map = (u, v) => [x0 + (mirX ? cell - u : u), y0 + v];
      const inner = cell - pad * 2;
      const e = 0.72 + rng() * 0.2;
      /* the comb: superellipse quarters from top edge to left edge */
      ctx.lineWidth = 0.65;
      for (let k = 0; k < p.comb; k++) {
        const f = (k + 1) / p.comb;
        const U = pad + inner * (0.18 + 0.82 * f);
        const V = pad + inner * (0.30 + 0.70 * f);
        ctx.strokeStyle = rgba(T.ink, 0.75);
        ctx.beginPath();
        const steps = 26;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps * Math.PI / 2;
          const u = pad + (U - pad) * Math.pow(Math.cos(t), e);
          const v = pad + (V - pad) * Math.pow(Math.sin(t), e);
          const [X, Y] = map(u, v);
          s === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        ctx.stroke();
        if (k % 3 === 0) yield;
      }
      /* crimson teardrop in the corner — nested outlines, plotter-style fill */
      const dropR = inner * 0.16, dcx = pad + dropR * 1.05, dcy = pad + dropR * 1.6;
      ctx.strokeStyle = rgba(T.crimson, 0.85); ctx.lineWidth = 1;
      for (let q = 5; q >= 1; q--) {
        const sc = q / 5;
        ctx.beginPath();
        const ds = 30;
        for (let s = 0; s <= ds; s++) {
          const t = s / ds * Math.PI * 2;
          const px = Math.cos(t);
          const py = Math.sin(t) * Math.pow(Math.sin(t / 2), 2);
          const [X, Y] = map(dcx + px * dropR * sc * 0.62, dcy + py * dropR * sc * 1.15);
          s === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
      /* cell border */
      ctx.strokeStyle = rgba(T.ink, 0.5); ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x0 + cell, y0); ctx.lineTo(x0 + cell, y0 + cell);
      ctx.lineTo(x0, y0 + cell); ctx.lineTo(x0, y0);
      ctx.stroke();
      yield;
    }
  }
},
];
