/* ============================================================
   The lightbox — one piece, full-bleed, with its own controls.
   Opened from any card; navigable with ← → and the keyboard.
   ============================================================ */
import { PIECES } from '../art/registry.js';
import { renderPiece, exportPNG, pieceLink, buildControls } from '../core/engine.js';
import { exportSVG } from '../core/svg.js';
import { copyText } from '../core/dom.js';

const lb = document.getElementById('lightbox');
const lbCanvas = document.getElementById('lbCanvas');
let lbIdx = -1, lastFocus = null;

export function isLightboxOpen() { return lbIdx >= 0; }

/* Point the lightbox at a piece. Assumes the panel is already up. */
function show(idx) {
  lbIdx = ((idx % PIECES.length) + PIECES.length) % PIECES.length;
  const piece = PIECES[lbIdx];
  document.getElementById('lbTitle').textContent = piece.title;
  document.getElementById('lbEq').textContent = piece.equation;
  document.getElementById('lbIdx').textContent =
    String(lbIdx + 1).padStart(2, '0') + ' / ' + String(PIECES.length).padStart(2, '0');
  buildControls(document.getElementById('lbControls'), piece, () => renderPiece(piece, lbCanvas, false));
  requestAnimationFrame(() => renderPiece(piece, lbCanvas, true));
}

/* Sliders moved in the lightbox — rebuild the card's row so it agrees. */
function syncCard(piece) {
  buildControls(piece.cardCanvas.closest('.piece').querySelector('.controls'), piece,
    () => renderPiece(piece, piece.cardCanvas, false));
  renderPiece(piece, piece.cardCanvas, false);
}

export function openLightbox(idx) {
  lastFocus = document.activeElement;
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  show(idx);
  document.getElementById('lbClose').focus();
}

export function closeLightbox() {
  if (lbIdx < 0) return;
  if (lbCanvas._raf) cancelAnimationFrame(lbCanvas._raf);   /* stop plotting a canvas nobody can see */
  lb.hidden = true;
  document.body.style.overflow = '';
  syncCard(PIECES[lbIdx]);
  lbIdx = -1;
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  lastFocus = null;
}

/* Step to a neighbouring piece without leaving the panel. */
function step(delta) {
  if (lbIdx < 0) return;
  if (lbCanvas._raf) cancelAnimationFrame(lbCanvas._raf);
  syncCard(PIECES[lbIdx]);
  show(lbIdx + delta);
}

/* re-render the open piece (used on theme switch) */
export function refreshLightbox() {
  if (lbIdx >= 0) renderPiece(PIECES[lbIdx], lbCanvas, false);
}

/* Keep Tab inside the dialog while it's open. */
lb.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const stops = lb.querySelectorAll('button, input, a[href]');
  if (!stops.length) return;
  const first = stops[0], last = stops[stops.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => step(-1));
document.getElementById('lbNext').addEventListener('click', () => step(1));
document.getElementById('lbShuffle').addEventListener('click', () => {
  const piece = PIECES[lbIdx];
  piece.seed = Math.floor(Math.random() * 1e9);
  renderPiece(piece, lbCanvas, true);
});
document.getElementById('lbReplay').addEventListener('click', () => renderPiece(PIECES[lbIdx], lbCanvas, true));
document.getElementById('lbLinkBtn').addEventListener('click', () => copyText(pieceLink(PIECES[lbIdx])));
document.getElementById('lbPng').addEventListener('click', () => exportPNG(PIECES[lbIdx], 2000));
document.getElementById('lbSvg').addEventListener('click', () => exportSVG(PIECES[lbIdx]));
