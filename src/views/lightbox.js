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
let lbIdx = -1;

export function isLightboxOpen() { return lbIdx >= 0; }

export function openLightbox(idx) {
  lbIdx = ((idx % PIECES.length) + PIECES.length) % PIECES.length;
  const piece = PIECES[lbIdx];
  document.getElementById('lbTitle').textContent = piece.title;
  document.getElementById('lbEq').textContent = piece.equation;
  document.getElementById('lbIdx').textContent =
    String(lbIdx + 1).padStart(2, '0') + ' / ' + String(PIECES.length).padStart(2, '0');
  buildControls(document.getElementById('lbControls'), piece, () => renderPiece(piece, lbCanvas, false));
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => renderPiece(piece, lbCanvas, true));
}

export function closeLightbox() {
  if (lbIdx < 0) return;
  const piece = PIECES[lbIdx];
  lb.hidden = true;
  document.body.style.overflow = '';
  buildControls(piece.cardCanvas.closest('.piece').querySelector('.controls'), piece,
    () => renderPiece(piece, piece.cardCanvas, false));
  renderPiece(piece, piece.cardCanvas, false);
  lbIdx = -1;
}

/* re-render the open piece (used on theme switch) */
export function refreshLightbox() {
  if (lbIdx >= 0) renderPiece(PIECES[lbIdx], lbCanvas, false);
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => { const i = lbIdx; closeLightbox(); openLightbox(i - 1); });
document.getElementById('lbNext').addEventListener('click', () => { const i = lbIdx; closeLightbox(); openLightbox(i + 1); });
document.getElementById('lbShuffle').addEventListener('click', () => {
  const piece = PIECES[lbIdx];
  piece.seed = Math.floor(Math.random() * 1e9);
  renderPiece(piece, lbCanvas, true);
});
document.getElementById('lbReplay').addEventListener('click', () => renderPiece(PIECES[lbIdx], lbCanvas, true));
document.getElementById('lbLinkBtn').addEventListener('click', () => copyText(pieceLink(PIECES[lbIdx])));
document.getElementById('lbPng').addEventListener('click', () => exportPNG(PIECES[lbIdx], 2000));
document.getElementById('lbSvg').addEventListener('click', () => exportSVG(PIECES[lbIdx]));
