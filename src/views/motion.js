/* ============================================================
   In Motion — builds the shader cards and runs the GL loop.
   Each card compiles its fragment shader, exposes two sliders
   as uniforms, and plays until you pause it (or scroll away).
   ============================================================ */
import { T, reducedMotion } from '../core/palette.js';
import { slug, downloadCanvasPNG } from '../core/dom.js';
import { SHADERS, GL_HEADER } from '../art/registry.js';

const glPieces = [];

const io2 = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  entries.forEach(e => {
    const o = e.target._obj; if (!o) return;
    o.visible = e.isIntersecting;
    if (o.visible && !o.rendered) { glRender(o); o.rendered = true; }
  });
}, { threshold: 0.15 }) : null;

function compileGL(gl, fragSrc) {
  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const v = sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
  const f = sh(gl.FRAGMENT_SHADER, GL_HEADER + fragSrc);
  if (!v || !f) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function glRender(o) {
  const c = o.canvas, gl = o.gl;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.max(1, Math.round(c.clientWidth * dpr)), H = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  gl.viewport(0, 0, W, H);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(o.prog);
  gl.uniform2f(o.u.res, W, H);
  gl.uniform1f(o.u.time, o.t % 600);
  gl.uniform1f(o.u.p0, o.values[0]);
  gl.uniform1f(o.u.p1, o.values[1]);
  gl.uniform3f(o.u.ink, T.ink[0] / 255, T.ink[1] / 255, T.ink[2] / 255);
  gl.uniform3f(o.u.crimson, T.crimson[0] / 255, T.crimson[1] / 255, T.crimson[2] / 255);
  gl.uniform3f(o.u.blue, T.blue[0] / 255, T.blue[1] / 255, T.blue[2] / 255);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

const motionGrid = document.getElementById('motionGrid');
SHADERS.forEach(def => {
  const card = document.createElement('div');
  card.className = 'piece';
  card.innerHTML = `
    <div class="art"><canvas class="gl" aria-label="${def.title} — animated shader, click to play or pause"></canvas></div>
    <div class="meta">
      <h3>${def.title}</h3>
      <div class="eq">${def.equation}</div>
      <div class="controls"></div>
      <div class="btn-row">
        <button class="accent play">${reducedMotion ? 'play' : 'pause'}</button>
        <button class="png">PNG</button>
      </div>
    </div>`;
  motionGrid.appendChild(card);
  const canvas = card.querySelector('canvas');
  const opts = { alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true };
  const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
  if (!gl) {
    card.querySelector('.art').innerHTML = '<div class="gl-fallback">This piece needs WebGL, which your browser is keeping to itself. The plotted gallery above still works fully.</div>';
    return;
  }
  const prog = compileGL(gl, def.frag);
  if (!prog) {
    card.querySelector('.art').innerHTML = '<div class="gl-fallback">This shader would not compile on your graphics driver. The plotted gallery above still works fully.</div>';
    return;
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  ['res', 'time', 'p0', 'p1', 'ink', 'crimson', 'blue'].forEach(n => u[n] = gl.getUniformLocation(prog, 'u_' + n));
  const obj = { def, canvas, gl, prog, u, values: def.params.map(p => p.value), playing: !reducedMotion, visible: false, t: 0, rendered: false };
  canvas._obj = obj;
  glPieces.push(obj);

  const ctrl = card.querySelector('.controls');
  def.params.forEach((prm, pi) => {
    const row = document.createElement('div');
    row.className = 'ctl';
    row.innerHTML = `<label>${prm.label}</label>
      <input type="range" min="${prm.min}" max="${prm.max}" step="${prm.step}" value="${prm.value}" aria-label="${prm.label}">
      <output>${prm.value}</output>`;
    const input = row.querySelector('input'), out = row.querySelector('output');
    input.addEventListener('input', () => {
      obj.values[pi] = parseFloat(input.value);
      out.textContent = input.value;
      if (!obj.playing) glRender(obj);
    });
    ctrl.appendChild(row);
  });

  const playBtn = card.querySelector('.play');
  function setPlay(v) { obj.playing = v; playBtn.textContent = v ? 'pause' : 'play'; }
  playBtn.addEventListener('click', () => setPlay(!obj.playing));
  canvas.addEventListener('click', () => setPlay(!obj.playing));
  card.querySelector('.png').addEventListener('click', () => {
    glRender(obj);
    downloadCanvasPNG(canvas, slug(def.title) + '.png');
  });
  if (io2) io2.observe(canvas);
  else { obj.visible = true; glRender(obj); obj.rendered = true; }
});

let glLast = null;
function glLoop(ts) {
  if (glLast === null) glLast = ts;
  const dt = Math.min((ts - glLast) / 1000, 0.1);
  glLast = ts;
  glPieces.forEach(o => { if (o.visible && o.playing) { o.t += dt; glRender(o); } });
  requestAnimationFrame(glLoop);
}
if (glPieces.length) requestAnimationFrame(glLoop);

/* re-render every shader once (used on theme switch and resize) */
export function rerenderShaders() {
  glPieces.forEach(o => { if (o.rendered) glRender(o); });
}
