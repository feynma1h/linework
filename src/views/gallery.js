/* ============================================================
   The gallery — turns the registry into cards.

   Builds a card per piece, wires its sliders and buttons, and
   lazily renders each canvas as it scrolls into view. Every card
   gets the same toolkit for free: live plot, shuffle, PNG, SVG,
   permalink and a lightbox — that's the whole publishing surface.
   ============================================================ */
import { PIECES } from '../art/registry.js';
import { renderPiece, exportPNG, pieceLink, buildControls } from '../core/engine.js';
import { exportSVG } from '../core/svg.js';
import { copyText } from '../core/dom.js';
import { openLightbox } from './lightbox.js';

const grid     = document.getElementById('galleryGrid');
const compGrid = document.getElementById('compGrid');
const edGrid   = document.getElementById('edGrid');

const io = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      renderPiece(e.target._piece, e.target, true);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.2 }) : null;

PIECES.forEach((piece, idx) => {
  piece.index = idx;
  piece.seed = 1000 + idx * 7;
  piece.values = {};
  piece.params.forEach(p => piece.values[p.key] = p.value);

  const card = document.createElement('div');
  card.className = 'piece';
  card.innerHTML = `
    <div class="art"><canvas aria-label="${piece.title} — click to enlarge"></canvas></div>
    <div class="meta">
      <h3>${piece.title}</h3>
      <div class="eq">${piece.equation}</div>
      <div class="controls"></div>
      <div class="btn-row">
        <button class="accent shuffle">shuffle</button>
        <button class="png">PNG</button>
        <button class="svg">SVG</button>
        <button class="link">link</button>
        <button class="expand">expand ⤢</button>
      </div>
    </div>`;
  (piece.section === 'comp' ? compGrid : piece.section === 'ed' ? edGrid : grid).appendChild(card);

  const canvas = card.querySelector('canvas');
  canvas._piece = piece;
  piece.cardCanvas = canvas;

  buildControls(card.querySelector('.controls'), piece, () => renderPiece(piece, canvas, false));

  card.querySelector('.shuffle').addEventListener('click', () => {
    piece.seed = Math.floor(Math.random() * 1e9);
    renderPiece(piece, canvas, true);
  });
  card.querySelector('.png').addEventListener('click', () => exportPNG(piece, 1600));
  card.querySelector('.svg').addEventListener('click', () => exportSVG(piece));
  card.querySelector('.link').addEventListener('click', () => copyText(pieceLink(piece)));
  card.querySelector('.expand').addEventListener('click', () => openLightbox(idx));
  canvas.addEventListener('click', () => openLightbox(idx));

  if (io) io.observe(canvas);
  else renderPiece(piece, canvas, false);
});

/* Re-render every card (used on theme switch and resize). */
export function renderAllPieces() {
  PIECES.forEach(p => renderPiece(p, p.cardCanvas, false));
}
