/* ============================================================
   Deterministic randomness & value noise.

   Every piece is seeded, so a given seed always draws the same
   image — that's what makes permalinks and "shuffle" reproducible.
   ============================================================ */

/* Small, fast, seedable PRNG. Returns a function → [0,1). */
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Seeded 2-D value noise with fractal (fbm) sampling — the
   "atmosphere" behind flow fields and interference patterns. */
export function makeNoise(seed) {
  const rand = mulberry32(seed), S = 64, g = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) g[i] = rand();
  const sm = t => t * t * (3 - 2 * t);

  function n(x, y) {
    x = ((x % S) + S) % S; y = ((y % S) + S) % S;
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const x1 = (xi + 1) % S, y1 = (yi + 1) % S;
    const A = g[yi * S + xi], B = g[yi * S + x1], C = g[y1 * S + xi], D = g[y1 * S + x1];
    const u = sm(xf), v = sm(yf);
    return A * (1 - u) * (1 - v) + B * u * (1 - v) + C * (1 - u) * v + D * u * v;
  }

  n.fbm = function (x, y, oct) {
    let s = 0, amp = 0.5, f = 1;
    for (let o = 0; o < oct; o++) { s += amp * n(x * f, y * f); amp *= 0.5; f *= 2; }
    return s;
  };
  return n;
}
