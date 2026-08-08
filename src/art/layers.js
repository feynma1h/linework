/* ============================================================
   Layer library — reusable painters.

   An "edition" is a stack of these composed with yield*. Add a
   layer here once and any print can use it. Each layer is a
   generator, so it plots live and records to SVG for free.
   ============================================================ */
import { T, rgba, lerpColor } from '../core/palette.js';
import { makeNoise } from '../core/math.js';

export const LAYERS = {
  /* drifting parallel lines, displaced by noise — atmosphere */
  *flow(ctx, w, h, o, rng) {
    const noise = makeNoise(Math.floor(rng() * 1e9));
    ctx.strokeStyle = rgba(o.color, o.alpha); ctx.lineWidth = 0.55;
    const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let li = 0;
    if (o.vertical) {
      for (let x = 16; x < w - 16; x += o.gap) {
        ctx.beginPath();
        for (let y = 18; y < h - 18; y += 4) {
          const d = (noise.fbm(x / o.scale, y / o.scale, 3) - 0.5) * 2 * o.amp;
          const xx = cl(x + d, 14, w - 14);
          y === 18 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y);
        }
        ctx.stroke();
        if (++li % 6 === 0) yield;
      }
    } else {
      for (let y = 16; y < h - 16; y += o.gap) {
        ctx.beginPath();
        for (let x = 18; x < w - 18; x += 4) {
          const d = (noise.fbm(x / o.scale, y / o.scale, 3) - 0.5) * 2 * o.amp;
          const yy = cl(y + d, 14, h - 14);
          x === 18 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
        if (++li % 6 === 0) yield;
      }
    }
  },

  /* damped twin-pendulum trace */
  *harmonograph(ctx, w, h, o, rng) {
    const p1 = rng() * 6.283, p2 = rng() * 6.283, p3 = rng() * 6.283, p4 = rng() * 6.283;
    const det = 0.002 + rng() * 0.01;
    ctx.strokeStyle = rgba(o.color, o.alpha); ctx.lineWidth = o.lw || 0.7;
    const dt = 0.01, tEnd = 210;
    const pt = t => {
      const e1 = Math.exp(-o.decay * t * 8), e2 = Math.exp(-o.decay * t * 9);
      return [o.cx + o.A * 0.5 * (Math.sin(o.f1 * t + p1) * e1 + Math.sin((o.f1 + det) * t + p2) * e2),
              o.cy + o.A * 0.5 * (Math.sin(o.f2 * t + p3) * e1 + Math.sin((o.f2 + det) * t + p4) * e2)];
    };
    let t = 0, [px, py] = pt(0);
    while (t < tEnd) {
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let i = 0; i < 380 && t < tEnd; i++) { t += dt; const [x, y] = pt(t); ctx.lineTo(x, y); px = x; py = y; }
      ctx.stroke(); yield;
    }
  },

  /* sunflower-seed disc */
  *phyllo(ctx, w, h, o) {
    const c = o.R / Math.sqrt(o.count);
    for (let n = 0; n < o.count; n++) {
      const th = n * o.ang * Math.PI / 180, r = c * Math.sqrt(n);
      ctx.fillStyle = lerpColor(o.c1, o.c2, n / o.count, o.alpha);
      ctx.beginPath();
      ctx.arc(o.cx + r * Math.cos(th), o.cy + r * Math.sin(th), o.dot || (0.9 + 1.1 * n / o.count), 0, Math.PI * 2);
      ctx.fill();
      if (n % 16 === 0) yield;
    }
  },

  /* sparse random dot field */
  *scatter(ctx, w, h, o, rng) {
    ctx.fillStyle = rgba(o.color, o.alpha);
    for (let i = 0; i < o.count; i++) {
      const x = 22 + rng() * (w - 44), y = 22 + rng() * (h - 44);
      const r = 0.5 + rng() * o.rmax;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (i % 24 === 0) yield;
    }
  },

  /* spirograph rings */
  *hypotrochoid(ctx, w, h, o) {
    const R = 120, gcd = (a, b) => b ? gcd(b, a % b) : a;
    for (let L = 0; L < o.layers; L++) {
      const r = o.r - L * 4, d = o.d - L * 6;
      if (r < 8 || d < 4) continue;
      const revs = Math.min(r / gcd(R, r), 80);
      const maxR = (R - r) + d, scale = o.size / maxR * (1 - L * 0.04);
      ctx.strokeStyle = rgba(o.colors[L % o.colors.length], o.alpha); ctx.lineWidth = 0.6;
      const thEnd = Math.PI * 2 * revs + 0.01;
      let th = 0;
      const pt = t => [o.cx + scale * ((R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t)),
                       o.cy + scale * ((R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t))];
      let [px, py] = pt(0);
      while (th < thEnd) {
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let i = 0; i < 300 && th < thEnd; i++) { th += 0.02; const [x, y] = pt(th); ctx.lineTo(x, y); px = x; py = y; }
        ctx.stroke(); yield;
      }
    }
  },

  /* one bold frequency-ratio curve */
  *lissajous(ctx, w, h, o) {
    ctx.strokeStyle = rgba(o.color, o.alpha); ctx.lineWidth = o.lw;
    const steps = 1400;
    const pt = s => { const t = Math.PI * 2 * s / steps;
      return [o.cx + o.A * Math.sin(o.a * t + o.phase), o.cy + o.A * Math.sin(o.b * t)]; };
    let s = 0, [px, py] = pt(0);
    while (s < steps) {
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let i = 0; i < 140 && s < steps; i++) { s++; const [x, y] = pt(s); ctx.lineTo(x, y); px = x; py = y; }
      ctx.stroke(); yield;
    }
  },

  /* strange-attractor fog */
  *mist(ctx, w, h, o, rng) {
    const c = -2.5 + rng() * 5, d = -2.5 + rng() * 5;
    let x = 0.1, y = 0.1;
    const chunk = 800, chunks = Math.ceil(o.n / chunk);
    ctx.fillStyle = rgba(o.color, o.alpha);
    for (let k = 0; k < chunks; k++) {
      for (let i = 0; i < chunk; i++) {
        const nx = Math.sin(o.a * y) - Math.cos(o.b * x), ny = Math.sin(c * x) - Math.cos(d * y);
        x = nx; y = ny;
        ctx.fillRect(o.cx + x / 2.05 * o.R - 0.3, o.cy + y / 2.05 * o.R - 0.3, 0.6, 0.6);
      }
      yield;
    }
  },

  /* small chord-diagram star */
  *chords(ctx, w, h, o) {
    ctx.lineWidth = o.lw || 0.6;
    for (let n = 1; n < o.N; n++) {
      const a = Math.PI * 2 * n / o.N, b = Math.PI * 2 * ((o.k * n) % o.N) / o.N;
      ctx.strokeStyle = lerpColor(o.c1, o.c2, n / o.N, o.alpha);
      ctx.beginPath();
      ctx.moveTo(o.cx + o.R * Math.cos(a), o.cy + o.R * Math.sin(a));
      ctx.lineTo(o.cx + o.R * Math.cos(b), o.cy + o.R * Math.sin(b));
      ctx.stroke();
      if (n % 3 === 0) yield;
    }
  },

  /* intaglio plate frame: double rule */
  *plate(ctx, w, h) {
    ctx.strokeStyle = rgba(T.ink, 0.9);
    const rect = (m, lw) => { ctx.lineWidth = lw; ctx.beginPath();
      ctx.moveTo(m, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, h - m);
      ctx.lineTo(m, h - m); ctx.lineTo(m, m); ctx.stroke(); };
    rect(12, 1); rect(17, 0.5);
    yield;
  },

  /* printmaker's seal: crimson square holding a mini astroid */
  *chop(ctx, x, y, s) {
    ctx.strokeStyle = rgba(T.crimson, 0.9); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + s, y); ctx.lineTo(x + s, y + s);
    ctx.lineTo(x, y + s); ctx.lineTo(x, y);
    ctx.stroke();
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.34, n = 4;
    ctx.lineWidth = 0.6;
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        ctx.beginPath();
        ctx.moveTo(cx + sx * t * r, cy);
        ctx.lineTo(cx, cy + sy * (1 - t) * r);
        ctx.stroke();
      }
    yield;
  },
};
