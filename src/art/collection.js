/* ============================================================
   The Collection — one equation, one image.

   HOW TO ADD YOUR OWN PIECE
   -------------------------
   Append one object to the COLLECTION array below:

     {
       title:    "My Curve",
       equation: "the math, shown under the picture",
       params: [ { key:"n", label:"knob", min:1, max:9, step:1, value:4 } ],
       *draw(ctx, w, h, p, rng) {
         // ctx is a normal 2-D canvas context (w × h in CSS px).
         // p.n is the live slider value; rng() gives seeded [0,1).
         // `yield` once in a while → it plots itself live on screen
         // AND becomes a vector path in the SVG export. That's it.
       }
     }

   No registration step, no build. Reload the page — it appears.
   ============================================================ */
import { T, rgba, lerpColor } from '../core/palette.js';
import { makeNoise } from '../core/math.js';

export const COLLECTION = [
{
  title: "Times Table on a Circle",
  equation: "zₙ = e^(2πin/N) ;  n ↦ k·n (mod N)",
  params: [
    { key: "k", label: "multiplier k", min: 2, max: 9, step: 1, value: 2 },
    { key: "N", label: "points N", min: 60, max: 300, step: 10, value: 200 },
  ],
  *draw(ctx, w, h, p) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 26;
    ctx.fillStyle = rgba(T.ink, 1);
    for (let n = 0; n < p.N; n++) {
      const a = 2 * Math.PI * n / p.N;
      ctx.fillRect(cx + (R + 6) * Math.cos(a) - 0.8, cy + (R + 6) * Math.sin(a) - 0.8, 1.6, 1.6);
    }
    ctx.lineWidth = 0.7;
    for (let n = 1; n < p.N; n++) {
      const a = 2 * Math.PI * n / p.N, b = 2 * Math.PI * ((p.k * n) % p.N) / p.N;
      ctx.strokeStyle = lerpColor(T.crimson, T.blue, n / p.N, 0.55);
      ctx.beginPath();
      ctx.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.lineTo(cx + R * Math.cos(b), cy + R * Math.sin(b));
      ctx.stroke();
      if (n % 2 === 0) yield;
    }
  }
},
{
  title: "Harmonograph",
  equation: "x(t) = Σ Aᵢ sin(fᵢt+φᵢ)·e^(−dᵢt)",
  params: [
    { key: "f1", label: "freq x", min: 1, max: 8, step: 0.1, value: 3 },
    { key: "f2", label: "freq y", min: 1, max: 8, step: 0.1, value: 2 },
    { key: "d",  label: "decay", min: 0.001, max: 0.02, step: 0.001, value: 0.004 },
  ],
  *draw(ctx, w, h, p, rng) {
    const cx = w / 2, cy = h / 2, A = Math.min(w, h) / 2 - 30;
    const p1 = rng() * Math.PI * 2, p2 = rng() * Math.PI * 2, p3 = rng() * Math.PI * 2, p4 = rng() * Math.PI * 2;
    const det = 0.002 + rng() * 0.01;
    ctx.strokeStyle = rgba(T.ink, 0.55); ctx.lineWidth = 0.7;
    const dt = 0.01, tEnd = 240;
    const pt = t => {
      const e1 = Math.exp(-p.d * t * 8), e2 = Math.exp(-p.d * t * 9);
      return [
        cx + A * 0.5 * (Math.sin(p.f1 * t + p1) * e1 + Math.sin((p.f1 + det) * t + p2) * e2),
        cy + A * 0.5 * (Math.sin(p.f2 * t + p3) * e1 + Math.sin((p.f2 + det) * t + p4) * e2)
      ];
    };
    let t = 0, [px, py] = pt(0);
    while (t < tEnd) {
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let i = 0; i < 360 && t < tEnd; i++) {
        t += dt; const [x, y] = pt(t);
        ctx.lineTo(x, y); px = x; py = y;
      }
      ctx.stroke();
      yield;
    }
  }
},
{
  title: "Hypotrochoid Rings",
  equation: "x=(R−r)cosθ + d·cos(((R−r)/r)θ)",
  params: [
    { key: "r", label: "inner gear", min: 20, max: 95, step: 1, value: 55 },
    { key: "d", label: "pen offset", min: 10, max: 90, step: 1, value: 70 },
    { key: "L", label: "layers", min: 1, max: 4, step: 1, value: 3 },
  ],
  *draw(ctx, w, h, p) {
    const cx = w / 2, cy = h / 2, R = 120;
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const cols = [T.crimson, T.blue, T.ink, T.crimson];
    for (let layer = 0; layer < p.L; layer++) {
      const r = p.r - layer * 4, d = p.d - layer * 6;
      if (r < 8 || d < 4) continue;
      const revs = Math.min(r / gcd(R, r), 80);
      const maxR = (R - r) + d, scale = (Math.min(w, h) / 2 - 26) / maxR * (1 - layer * 0.04);
      const c = cols[layer % cols.length];
      ctx.strokeStyle = rgba(c, 0.5); ctx.lineWidth = 0.6;
      const thEnd = Math.PI * 2 * revs + 0.01;
      let th = 0;
      const pt = t => [
        cx + scale * ((R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t)),
        cy + scale * ((R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t))
      ];
      let [px, py] = pt(0);
      while (th < thEnd) {
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let i = 0; i < 260 && th < thEnd; i++) {
          th += 0.02; const [x, y] = pt(th);
          ctx.lineTo(x, y); px = x; py = y;
        }
        ctx.stroke();
        yield;
      }
    }
  }
},
{
  title: "Envelope of Lines (Astroid)",
  equation: "ℓₜ : (t, 0) → (0, 1−t),  t ∈ [0,1]",
  params: [
    { key: "n", label: "lines / side", min: 10, max: 60, step: 1, value: 28 },
  ],
  *draw(ctx, w, h, p) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 24;
    ctx.lineWidth = 0.8;
    const quads = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let qi = 0; qi < 4; qi++) {
      const [sx, sy] = quads[qi];
      for (let i = 0; i <= p.n; i++) {
        const t = i / p.n;
        const c = (qi % 2 === 0) ? T.ink : T.crimson;
        ctx.strokeStyle = rgba(c, 0.75);
        ctx.beginPath();
        ctx.moveTo(cx + sx * t * R, cy);
        ctx.lineTo(cx, cy + sy * (1 - t) * R);
        ctx.stroke();
        if (i % 3 === 0) yield;
      }
    }
  }
},
{
  title: "Interference Field",
  equation: "x′ = x + A·𝒩(x/λ, y/λ)",
  params: [
    { key: "amp", label: "amplitude", min: 5, max: 60, step: 1, value: 28 },
    { key: "sc",  label: "wavelength", min: 40, max: 200, step: 5, value: 110 },
  ],
  *draw(ctx, w, h, p, rng) {
    const noise = makeNoise(Math.floor(rng() * 1e9));
    const passes = [{ c: T.blue, off: 0, a: 0.5 }, { c: T.crimson, off: 0.8, a: 0.35 }];
    ctx.lineWidth = 0.55;
    for (const pass of passes) {
      ctx.strokeStyle = rgba(pass.c, pass.a);
      let col = 0;
      for (let x = 8; x < w - 8; x += 3) {
        ctx.beginPath();
        for (let y = 10; y < h - 10; y += 4) {
          const d = (noise.fbm(x / p.sc + pass.off, y / p.sc, 3) - 0.5) * 2 * p.amp;
          y === 10 ? ctx.moveTo(x + d, y) : ctx.lineTo(x + d, y);
        }
        ctx.stroke();
        if (++col % 5 === 0) yield;
      }
    }
  }
},
{
  title: "Contour Colonies",
  equation: "r(θ) = r₀(1 + ε·𝒩(cosθ, sinθ))",
  params: [
    { key: "rings", label: "rings", min: 4, max: 14, step: 1, value: 9 },
    { key: "rough", label: "roughness", min: 5, max: 60, step: 1, value: 30 },
  ],
  *draw(ctx, w, h, p, rng) {
    const noise = makeNoise(Math.floor(rng() * 1e9));
    const cols = 3, rows = 3, cw = w / cols, ch = h / rows;
    ctx.strokeStyle = rgba(T.ink, 0.8); ctx.lineWidth = 0.7;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const cx = cw * (i + 0.5) + (rng() - 0.5) * cw * 0.3;
      const cy = ch * (j + 0.5) + (rng() - 0.5) * ch * 0.3;
      const base = Math.min(cw, ch) * 0.62;
      const ox = rng() * 40, oy = rng() * 40;
      for (let k = p.rings; k >= 1; k--) {
        const rad = base * k / p.rings;
        ctx.beginPath();
        for (let th = 0; th <= Math.PI * 2 + 0.05; th += 0.06) {
          const wob = (noise.fbm(ox + Math.cos(th) * 1.4, oy + Math.sin(th) * 1.4, 3) - 0.5) * 2;
          const r = rad * (1 + wob * (p.rough / 100));
          const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
          th === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        yield;
      }
    }
  }
},
{
  title: "Maurer Rose",
  equation: "r = sin(n·θ),  θᵢ = i·d°,  connect θᵢ → θᵢ₊₁",
  params: [
    { key: "n", label: "petals n", min: 2, max: 9, step: 1, value: 6 },
    { key: "d", label: "step d°", min: 20, max: 179, step: 1, value: 71 },
  ],
  *draw(ctx, w, h, p) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 26;
    const pt = i => {
      const th = i * p.d * Math.PI / 180;
      const r = Math.sin(p.n * th) * R;
      return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
    };
    /* the straight-line walk */
    ctx.lineWidth = 0.6;
    let [px, py] = pt(0);
    for (let i = 1; i <= 360; i++) {
      const [x, y] = pt(i);
      ctx.strokeStyle = lerpColor(T.blue, T.ink, i / 360, 0.5);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      px = x; py = y;
      if (i % 4 === 0) yield;
    }
    /* the rose itself, on top */
    ctx.strokeStyle = rgba(T.crimson, 0.9); ctx.lineWidth = 1.4;
    let th = 0; const thEnd = Math.PI * 2;
    let qx = cx, qy = cy;
    while (th < thEnd) {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < 40 && th < thEnd; i++) {
        const r = Math.sin(p.n * th) * R;
        const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
        if (first) { ctx.moveTo(qx, qy); first = false; }
        ctx.lineTo(x, y); qx = x; qy = y;
        th += 0.012;
      }
      ctx.stroke();
      yield;
    }
  }
},
{
  title: "de Jong Attractor",
  equation: "xₙ₊₁=sin(a·yₙ)−cos(b·xₙ) ;  yₙ₊₁=sin(c·xₙ)−cos(d·yₙ)",
  params: [
    { key: "a", label: "a", min: -3, max: 3, step: 0.05, value: 1.4 },
    { key: "b", label: "b", min: -3, max: 3, step: 0.05, value: -2.3 },
  ],
  *draw(ctx, w, h, p, rng) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 18;
    const c = -2.5 + rng() * 5, d = -2.5 + rng() * 5;
    let x = 0.1, y = 0.1;
    const chunks = 80, per = 900;
    for (let kk = 0; kk < chunks; kk++) {
      ctx.fillStyle = lerpColor(T.crimson, T.blue, kk / chunks, 0.28);
      for (let i = 0; i < per; i++) {
        const nx = Math.sin(p.a * y) - Math.cos(p.b * x);
        const ny = Math.sin(c * x) - Math.cos(d * y);
        x = nx; y = ny;
        ctx.fillRect(cx + x / 2.05 * R - 0.35, cy + y / 2.05 * R - 0.35, 0.7, 0.7);
      }
      yield;
    }
  }
},
{
  title: "Phyllotaxis",
  equation: "r = c√n ,  θ = n · 137.5°  (the sunflower angle)",
  params: [
    { key: "ang",   label: "angle °", min: 137.0, max: 138.0, step: 0.01, value: 137.51 },
    { key: "count", label: "seeds", min: 200, max: 1200, step: 20, value: 700 },
  ],
  *draw(ctx, w, h, p) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 22;
    const c = R / Math.sqrt(p.count);
    for (let n = 0; n < p.count; n++) {
      const th = n * p.ang * Math.PI / 180;
      const r = c * Math.sqrt(n);
      ctx.fillStyle = lerpColor(T.crimson, T.blue, n / p.count, 0.85);
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(th), cy + r * Math.sin(th), 1.1 + 1.2 * (n / p.count), 0, Math.PI * 2);
      ctx.fill();
      if (n % 14 === 0) yield;
    }
  }
},
{
  title: "Lissajous Table",
  equation: "x = sin(a·t + δ) ,  y = sin(b·t)  for a,b = 1…m",
  params: [
    { key: "m", label: "grid m×m", min: 2, max: 5, step: 1, value: 4 },
    { key: "ph", label: "phase δ", min: 0, max: 3.14, step: 0.02, value: 1.57 },
  ],
  *draw(ctx, w, h, p) {
    const pad = 24, cell = (Math.min(w, h) - pad * 2) / p.m;
    const ox = (w - cell * p.m) / 2, oy = (h - cell * p.m) / 2;
    ctx.lineWidth = 0.9;
    for (let i = 0; i < p.m; i++) for (let j = 0; j < p.m; j++) {
      const a = i + 1, b = j + 1;
      const cx = ox + cell * (i + 0.5), cy = oy + cell * (j + 0.5), A = cell * 0.38;
      const col = (a === b) ? T.crimson : T.ink;
      ctx.strokeStyle = rgba(col, 0.8);
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2 + 0.02; t += 0.015) {
        const x = cx + A * Math.sin(a * t + p.ph), y = cy + A * Math.sin(b * t);
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      yield;
    }
  }
},
];
