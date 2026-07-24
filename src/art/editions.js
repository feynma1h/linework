/* ============================================================
   Editions — layered prints, signed in the plate.

   The finished artifact. Each edition stacks painters from the
   layer library (background → hero → accent) and closes with a
   plate border and the printmaker's chop, the way an etching is
   pulled, layered and signed. Built with yield* so the whole
   stack still plots live and records to SVG.
   ============================================================ */
import { T, rgba } from '../core/palette.js';
import { LAYERS } from './layers.js';

export const EDITIONS = [
{
  section: 'ed',
  title: "Edition №1 — Low Tide",
  equation: "flow(𝒩) ∘ harmonograph ∘ phyllotaxis — three systems, one plate",
  params: [
    { key: "swell", label: "swell", min: 4, max: 36, step: 1, value: 14 },
    { key: "f2", label: "voice f₂", min: 1, max: 8, step: 0.1, value: 2 },
  ],
  *draw(ctx, w, h, p, rng) {
    yield* LAYERS.flow(ctx, w, h, { color: T.blue, alpha: 0.18, amp: p.swell, scale: 130, gap: 7, vertical: false }, rng);
    yield* LAYERS.harmonograph(ctx, w, h, { cx: w * 0.46, cy: h * 0.52, A: Math.min(w, h) * 0.40, f1: 3, f2: p.f2, decay: 0.005, color: T.ink, alpha: 0.6, lw: 0.7 }, rng);
    yield* LAYERS.phyllo(ctx, w, h, { cx: w * 0.74, cy: h * 0.26, R: Math.min(w, h) * 0.11, count: 260, ang: 137.51, c1: T.crimson, c2: T.crimson, alpha: 0.85 });
    yield* LAYERS.plate(ctx, w, h);
    yield* LAYERS.chop(ctx, w - 46, h - 46, 24);
  }
},
{
  section: 'ed',
  title: "Edition №2 — Night Orchard",
  equation: "scatter(χ) ∘ hypotrochoid ∘ rose — three systems, one plate",
  params: [
    { key: "r", label: "inner gear", min: 20, max: 95, step: 1, value: 62 },
    { key: "stars", label: "seeds", min: 60, max: 400, step: 10, value: 180 },
  ],
  *draw(ctx, w, h, p, rng) {
    yield* LAYERS.scatter(ctx, w, h, { count: p.stars, color: T.ink, alpha: 0.35, rmax: 1.1 }, rng);
    yield* LAYERS.hypotrochoid(ctx, w, h, { cx: w * 0.5, cy: h * 0.47, size: Math.min(w, h) * 0.36, r: p.r, d: 70, colors: [T.blue, T.ink], alpha: 0.5, layers: 2 });
    /* crimson rose accent, lower-left third */
    const cx = w * 0.24, cy = h * 0.78, R = Math.min(w, h) * 0.10;
    ctx.strokeStyle = rgba(T.crimson, 0.85); ctx.lineWidth = 0.9;
    const steps = 900;
    const pt = q => { const th = 6.2832 * 3 * q / steps; const r = Math.cos((5 / 3) * th) * R;
      return [cx + r * Math.cos(th), cy + r * Math.sin(th)]; };
    let s = 0, [px, py] = pt(0);
    while (s < steps) {
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let i = 0; i < 150 && s < steps; i++) { s++; const [x, y] = pt(s); ctx.lineTo(x, y); px = x; py = y; }
      ctx.stroke(); yield;
    }
    yield* LAYERS.plate(ctx, w, h);
    yield* LAYERS.chop(ctx, w - 46, h - 46, 24);
  }
},
{
  section: 'ed',
  title: "Edition №3 — Signal & Noise",
  equation: "mist(de Jong) ∘ Lissajous ∘ chords — three systems, one plate",
  params: [
    { key: "a", label: "signal a", min: 1, max: 7, step: 1, value: 3 },
    { key: "mist", label: "mist", min: 10, max: 60, step: 2, value: 32 },
  ],
  *draw(ctx, w, h, p, rng) {
    yield* LAYERS.mist(ctx, w, h, { cx: w * 0.5, cy: h * 0.5, R: Math.min(w, h) * 0.46, a: 1.7, b: -2.1, n: p.mist * 1000, color: T.ink, alpha: 0.10 }, rng);
    yield* LAYERS.lissajous(ctx, w, h, { cx: w * 0.5, cy: h * 0.5, A: Math.min(w, h) * 0.34, a: p.a, b: p.a + 1, phase: Math.PI / 2, color: T.blue, alpha: 0.85, lw: 1.2 });
    yield* LAYERS.chords(ctx, w, h, { cx: w * 0.79, cy: h * 0.21, R: Math.min(w, h) * 0.10, k: 2, N: 90, c1: T.crimson, c2: T.crimson, alpha: 0.6, lw: 0.5 });
    yield* LAYERS.plate(ctx, w, h);
    yield* LAYERS.chop(ctx, w - 46, h - 46, 24);
  }
},
];
