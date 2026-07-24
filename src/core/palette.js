/* ============================================================
   Palette & theme.

   Two themes — warm "paper" and cool "blueprint". `T` is the
   currently active one; every piece reads its colours from it.
   These are live module bindings: reassigning them in
   setActiveTheme() updates every importer automatically.
   ============================================================ */

export const reducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const THEMES = {
  paper:     { paper: '#FBFAF5', ink: [21, 22, 27],   crimson: [165, 58, 43], blue: [44, 78, 128]  },
  blueprint: { paper: '#0E1422', ink: [233, 230, 218], crimson: [224, 122, 95], blue: [127, 164, 216] },
};

export let themeName = 'paper';
export let T = THEMES.paper;

/* Swap the active theme. Views re-render themselves after calling this. */
export function setActiveTheme(name) {
  themeName = name;
  T = THEMES[name];
}

/* colour helpers ------------------------------------------------ */
export function rgba(c, a) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

export function lerpColor(c1, c2, t, a = 1) {
  return `rgba(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},` +
         `${Math.round(c1[1] + (c2[1] - c1[1]) * t)},` +
         `${Math.round(c1[2] + (c2[2] - c1[2]) * t)},${a})`;
}
