# Contributing to LINEWORK

Thanks for wanting to add to the gallery. The whole project is built so that a new
piece of art is a small, self-contained thing you can add in a few minutes — no build
tools, no framework, no ceremony.

## Run it locally

Native ES modules need to be served over HTTP (not opened as a `file://`):

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

Edit a file, reload the tab. That's the whole loop.

## The one rule every piece follows

Each artwork is a generator function:

```js
*draw(ctx, w, h, p, rng) { ... }
```

- `ctx` — a normal 2-D canvas context.
- `w`, `h` — the canvas size in CSS pixels.
- `p` — an object of the current slider values, keyed by your `params[].key`.
- `rng` — a **seeded** `[0,1)` random function. Use this instead of `Math.random()`
  so that a given seed always redraws the same image (that's what makes "shuffle" and
  permalinks reproducible).

Every `yield` is one animation step: the piece plots that much, then paints again on
the next frame. Yield every few strokes for a satisfying live draw. The *same*
generator is replayed against a fake context in [`src/core/svg.js`](src/core/svg.js)
to produce the SVG export, so plotter-ready vectors come for free — as long as you
stay inside what the recorder understands:

| You draw with | You get |
|---|---|
| `moveTo` / `lineTo` / `stroke` | a `<path>` |
| `arc` + `fill` or `stroke` | a `<circle>` — **full circles only**; walk a partial arc with `lineTo` |
| `fillRect` | a dot, batched into one `<path>` |
| `fillText`, images, gradients | nothing — no vector equivalent |

`save`/`restore`/`setTransform` are accepted but not recorded, so keep your geometry
in plain coordinates rather than leaning on the canvas transform stack.

Read colours from the active theme `T` (`T.ink`, `T.crimson`, `T.blue`) and wrap them
with `rgba()` / `lerpColor()` from [`src/core/palette.js`](src/core/palette.js) so your
piece looks right in both **paper** and **blueprint** modes.

## Add a plotted piece

Append one object to the relevant file:

- [`src/art/collection.js`](src/art/collection.js) — single-equation pieces (`01`)
- [`src/art/compositions.js`](src/art/compositions.js) — many-equation frames (`02`, tag `section:'comp'`)
- [`src/art/editions.js`](src/art/editions.js) — layered prints (`03`, tag `section:'ed'`)

```js
{
  title:    "Spiral of Theodorus",
  equation: "√1, √2, √3, … stacked right-angle triangles",
  params: [
    { key:"turns", label:"triangles", min:8, max:60, step:1, value:24 },
  ],
  *draw(ctx, w, h, p, rng) {
    // ...your drawing, yielding occasionally...
  }
}
```

Order in the array = order on the page.

## Add a GPU (shader) piece

Append to [`src/art/shaders.js`](src/art/shaders.js). Each piece is a fragment shader
string plus two sliders (exposed as `u_p0`, `u_p1`). These uniforms are always in
scope: `u_res`, `u_time`, `u_p0`, `u_p1`, `u_ink`, `u_crimson`, `u_blue`. Shaders
export as PNG snapshots rather than SVG.

## Add a whole new section

Create a file like `collection.js`, give its pieces a `section` tag, import and spread
it into [`src/art/registry.js`](src/art/registry.js), and add a matching grid + chapter
heading in `index.html`. The gallery routes each piece to its heading by that tag.

## Style

- Keep the existing voice in on-page copy — literate, a little playful, never salesy.
- Match the surrounding code: 2-space indent, terse helpers, comments that explain
  *why* rather than *what*.
- No new runtime dependencies. The zero-build, single-fork-and-go property is the point.

## Before you open a PR

- It runs with no console errors.
- Sliders, **shuffle**, **PNG**, **SVG** and the lightbox all work on your piece.
- It reads well in both themes (press **B**).
- The SVG export opens cleanly (drop it in any browser or Inkscape).
