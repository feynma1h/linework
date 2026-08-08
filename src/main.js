/* ============================================================
   LINEWORK — entry point.

   Everything is already wired by the modules imported below;
   this file just conducts: the theme switch, "shuffle all",
   keyboard shortcuts, permalinks and the boot sequence.
   ============================================================ */
import { SITE } from './config.js';
import { setActiveTheme } from './core/palette.js';
import { renderPiece } from './core/engine.js';
import { toast } from './core/dom.js';
import { PIECES, SHADERS } from './art/registry.js';

import { renderAllPieces } from './views/gallery.js';
import { openLightbox, closeLightbox, isLightboxOpen, refreshLightbox } from './views/lightbox.js';
import { heroFit } from './views/hero.js';
import { rerenderShaders } from './views/motion.js';

/* =================== theme =================== */
let themeName = 'paper';
function setTheme(name) {
  themeName = name;
  setActiveTheme(name);
  document.body.classList.toggle('blueprint', name === 'blueprint');
  document.getElementById('themeBtn').textContent = name === 'blueprint' ? '◑ paper' : '◐ blueprint';
  renderAllPieces();
  refreshLightbox();
  rerenderShaders();
  heroFit();
}
document.getElementById('themeBtn').addEventListener('click', () => {
  setTheme(themeName === 'paper' ? 'blueprint' : 'paper');
});

/* =================== shuffle all (staggered) =================== */
function shuffleAll() {
  PIECES.forEach((p, i) => {
    setTimeout(() => {
      p.seed = Math.floor(Math.random() * 1e9);
      renderPiece(p, p.cardCanvas, true);
    }, i * 130);
  });
  toast('reshuffling the universe…');
}
document.getElementById('shuffleAllBtn').addEventListener('click', shuffleAll);

/* =================== keyboard shortcuts =================== */
document.addEventListener('keydown', e => {
  /* Escape always closes; every other shortcut yields to a focused control. */
  if (e.key === 'Escape' && isLightboxOpen()) { closeLightbox(); return; }
  const tag = (e.target.tagName || '').toUpperCase();
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if (isLightboxOpen()) {
    if (e.key === 'ArrowLeft') document.getElementById('lbPrev').click();
    else if (e.key === 'ArrowRight') document.getElementById('lbNext').click();
    else if (e.key === 's' || e.key === 'S') document.getElementById('lbShuffle').click();
    else if (e.key === ' ') { e.preventDefault(); document.getElementById('lbReplay').click(); }
    else if (e.key === 'd' || e.key === 'D') document.getElementById('lbPng').click();
    return;
  }
  if (e.key === 'g' || e.key === 'G') document.getElementById('gallery').scrollIntoView();
  else if (e.key === 'c' || e.key === 'C') document.getElementById('compositions').scrollIntoView();
  else if (e.key === 'e' || e.key === 'E') document.getElementById('editions').scrollIntoView();
  else if (e.key === 'm' || e.key === 'M') document.getElementById('motion').scrollIntoView();
  else if (e.key === 'y' || e.key === 'Y') document.getElementById('make').scrollIntoView();
  else if (e.key === 'b' || e.key === 'B') setTheme(themeName === 'paper' ? 'blueprint' : 'paper');
  else if (e.key === 'S' && e.shiftKey) shuffleAll();
});

/* =================== permalinks =================== */
function applyHash() {
  if (!location.hash || location.hash.length < 2) return false;
  const ps = new URLSearchParams(location.hash.slice(1));
  if (ps.get('theme') === 'blueprint') setTheme('blueprint');

  if (ps.has('p')) {
    const idx = parseInt(ps.get('p'), 10);
    if (isNaN(idx) || idx < 0 || idx >= PIECES.length) return false;
    const piece = PIECES[idx];
    if (ps.has('seed')) piece.seed = parseInt(ps.get('seed'), 10) || piece.seed;
    piece.params.forEach(prm => {
      if (ps.has(prm.key)) {
        const v = parseFloat(ps.get(prm.key));
        if (!isNaN(v)) piece.values[prm.key] = Math.min(prm.max, Math.max(prm.min, v));
      }
    });
    setTimeout(() => openLightbox(idx), 250);
    return true;
  }
  return false;
}

/* =================== boot =================== */
document.getElementById('artistName').textContent = SITE.artist;
document.getElementById('year').textContent = SITE.year;

/* Chapter tallies and repo links come from the data, so adding a
   piece or forking under a new name never leaves stale copy behind. */
const tally = {
  collection: PIECES.filter(p => !p.section).length,
  comp:       PIECES.filter(p => p.section === 'comp').length,
  ed:         PIECES.filter(p => p.section === 'ed').length,
  shader:     SHADERS.length,
};
document.querySelectorAll('[data-count]').forEach(el => {
  el.textContent = tally[el.dataset.count];
});
document.querySelectorAll('[data-repo]').forEach(el => {
  el.href = SITE.repo.replace(/\/$/, '') + (el.dataset.repo ? '/' + el.dataset.repo : '');
});

applyHash();

/* re-render on resize (debounced) */
let rT;
window.addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    renderAllPieces();
    refreshLightbox();
    rerenderShaders();
    heroFit();
  }, 200);
});
