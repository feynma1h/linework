/* ============================================================
   The hero — a chord diagram that morphs through the whole
   family of "times tables on a circle" (n ↦ k·n mod N) as k
   drifts. It's the whole thesis in one figure: a single line
   of math, drawn live, endlessly restless.
   ============================================================ */
import { T, rgba, lerpColor, reducedMotion } from '../core/palette.js';
import { fitCanvas } from '../core/dom.js';

const heroCanvas = document.getElementById('heroCanvas');
const heroTag = document.getElementById('heroTag');
let heroCtx = null, heroW = 0, heroH = 0, heroRun = !reducedMotion, heroK = 2, heroT0 = null, heroVisible = true;

export function heroFit() {
  const f = fitCanvas(heroCanvas);
  heroCtx = f.ctx; heroW = f.w; heroH = f.h;
  heroDraw(heroK);
}

function heroDraw(k) {
  const ctx = heroCtx, w = heroW, h = heroH;
  ctx.clearRect(0, 0, w, h);
  const N = 200, cx = w / 2, cy = h / 2, R = Math.min(w * 0.42, h / 2 - 22);
  ctx.fillStyle = rgba(T.ink, 1);
  for (let n = 0; n < N; n++) {
    const a = 2 * Math.PI * n / N;
    ctx.fillRect(cx + (R + 7) * Math.cos(a) - 0.8, cy + (R + 7) * Math.sin(a) - 0.8, 1.6, 1.6);
  }
  ctx.lineWidth = 0.75;
  for (let n = 1; n < N; n++) {
    const a = 2 * Math.PI * n / N, b = 2 * Math.PI * ((k * n) % N) / N;
    ctx.strokeStyle = lerpColor(T.crimson, T.blue, n / N, 0.5);
    ctx.beginPath();
    ctx.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.lineTo(cx + R * Math.cos(b), cy + R * Math.sin(b));
    ctx.stroke();
  }
  heroTag.textContent = 'fig. 0 — n ↦ k·n (mod N) · k = ' + k.toFixed(2) +
    (reducedMotion ? '' : (heroRun ? ' · click to pause' : ' · click to play'));
}

function heroLoop(ts) {
  if (heroT0 === null) heroT0 = ts;
  if (heroRun && heroVisible) {
    const cycle = ((ts - heroT0) / 26000) % 1;
    heroK = 2 + cycle * 7;
    heroDraw(heroK);
  }
  requestAnimationFrame(heroLoop);
}

heroCanvas.addEventListener('click', () => { heroRun = !heroRun; heroDraw(heroK); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => { es.forEach(e => heroVisible = e.isIntersecting); }, { threshold: 0 }).observe(heroCanvas);
}

heroFit();
if (!reducedMotion) requestAnimationFrame(heroLoop);
