# Uno's First Fast Run — `/race`

An interactive QR experience: a miniature race-car diorama that transforms into a
real, scannable QR code. Built for phones, shown on a screen at the party.

---

## Where it lives

| File | Role |
|---|---|
| `pages/race.vue` | Route, SEO meta, full-bleed page shell |
| `components/race/RaceStage.vue` | Canvas host, overlay copy, state machine, fallbacks |
| `utils/raceQr.ts` | QR destination config + matrix generation |
| `utils/raceWorld.ts` | Turns the QR matrix into race-world geometry (pure, no DOM) |
| `utils/raceRenderer.ts` | Camera, timeline and canvas 2D renderer |
| `composables/useRaceAudio.ts` | Optional synthesised start-lights + engine (off by default) |

Nothing else in the site was touched. `/cam` — the QR's destination — is untouched,
as are `/`, `/fund`, `/gallery` and `/admin`.

---

## Configuring the QR destination

Default lives in `utils/raceQr.ts`:

```ts
export const RACE_QR_DEFAULT_TARGET = 'https://unosfirst.com/cam'
```

To change it without editing source, set the env var (wired to
`runtimeConfig.public.raceQrUrl` in `nuxt.config.ts`):

```bash
NUXT_PUBLIC_RACE_QR_URL=https://unosfirst.com/gallery
```

The scene is rebuilt from whatever URL is configured — module count, track layout,
where the car launches from and the flatten order are all derived from the matrix,
so any target works. Error-correction level and quiet zone are also in `raceQr.ts`.

---

## How the transformation works

The QR matrix is the scene graph, not a picture laid on top of one.

1. **`createQrMatrix(url)`** produces the real matrix (`qrcode`'s `create()`).
   The default URL is version 2 — a 25×25 grid, which keeps modules chunky enough
   to scan comfortably on a phone.
2. **`buildRaceWorld(matrix)`** gives every module a role based on its structural
   position in the symbol, and extrudes it:
   - ordinary dark module → a section of asphalt
   - finder patterns (the three corners) → grandstand / podium complexes, taller
   - timing pattern (row 6 / col 6) → the dashed sector-timing strips
   - alignment pattern → the hairpin marker island
   - light modules → paddock ground
   Kerbs are striped only where a run of ≥3 modules borders open ground, so they
   land on real straights. Dashed centre lines go on modules with asphalt on both
   opposite sides. The launch column is the one carrying the most asphalt.
3. **The camera starts low** (26–30° above the ground, close to the car) so the
   opening frame reads as a racetrack, not a code. The board recedes into haze.
4. **On tap**: start lights run, then the car accelerates away up the launch column.
5. **The camera rises to exactly 90°** while a flatten wave follows the car north
   and outward — blocks drop to zero height in the car's wake, kerbs and markings
   fade, barriers retract, the spur slides away, and the palette resolves from
   paddock concrete / dark asphalt to pure white / pure black.
6. **At pitch 90 with zero extrusion the perspective projection degenerates to a
   uniform scale**, so the flattened modules land exactly on the QR grid. Over the
   last ~450 ms the geometry is blended into an integer pixel grid so the final
   frame has no anti-aliased module edges.

There is no crossfade to a QR image. The last frame is the same geometry the
racetrack was built from — which is why it reconstructs bit-for-bit.

### Going back

Tapping the settled code (or "Back to the grid") runs the whole timeline
**backwards** at 0.62× speed rather than resetting: the code lifts back into
extruded track, kerbs and barriers return, the camera drops to the starting grid
and the car reverses onto pole. Because every visual is a pure function of one
clock value, the rewind is the forward animation with time running the other way —
no separate reverse animation to keep in sync. Start lights, tyre smoke and camera
shake are suppressed while rewinding, since those only make sense going forwards.

### Decoration on the settled code

The finished plate carries a checkered flag border, kerb-red corner brackets and a
UNO 01 pit board. **All of it sits outside the quiet zone** — the symbol keeps its
full 5 clear modules on every side — so none of it can affect a scan. The border
thickness is rounded to whole pixels so the white plate, and therefore every
module, still lands on the pixel grid. The plate also keeps a soft drop shadow so
it reads as the diorama base seen from above rather than a flat image.

---

## Dependencies

**None added.** `qrcode` was already a dependency (used by `/cam/print`) and is
imported dynamically, so it stays out of the main bundle. The 3D is a hand-rolled
perspective projector on canvas 2D — a WebGL library would have been a large
dependency for a scene that is a few hundred flat quads.

Built output: the race feature is one ~28 kB chunk plus the shared ~25 kB `qrcode`
chunk, both loaded only on `/race`.

---

## Mobile and performance

- Measured draw cost is **~1.2 ms/frame**, and **~5.5 ms under a 4× CPU throttle**.
- Same-colour quads are batched into one fill per colour per row, and the batch
  buffers are reused between frames, so a frame costs ~150 fills and allocates
  nothing. Rows draw far-to-near for correct occlusion.
- `devicePixelRatio` is capped at 2. No `shadowBlur` in the animation loop (it is
  the single most expensive canvas 2D operation) — contact shadows are offset quads
  merged into one path so overlaps do not double-darken. The one `shadowBlur` is on
  the settled plate, which is drawn once after the loop has stopped.
- A rolling average of real draw cost downgrades quality once (dropping shadows,
  centre lines, barriers, decor and particles) if a device is genuinely slow.
- The render loop stops when the code has settled and when the tab is hidden.
- Portrait is the primary layout. On a phone held sideways (`aspect > 1.35` and
  `height < 560`) the copy moves into a left column so the code can use the full
  height instead of being squeezed — verified to scan at 740×360.

## Accessibility and fallbacks

- `prefers-reduced-motion` gets a ~1 s transition from a near-overhead start, with
  no camera flight, shake, particles or block bounce. Same final code.
- If canvas is unavailable, the page falls back to the same matrix rendered as
  **SVG** — deliberately not the `qrcode` library's image renderer, which is itself
  canvas-backed and would fail for the same reason.
- The destination is always present as a real link, so the page is usable even if
  nothing renders.
- The tap target is a real focusable `<button>`; tab + enter runs the whole thing.
- A "Skip" control jumps straight to the code mid-race.
- Audio is off by default, synthesised (no assets), and only ever starts inside a
  user gesture.

---

## Verification

The final code was checked by reconstructing the matrix from rendered pixels and
comparing it against the source matrix module by module — an exact match on all
625 modules across Pixel 5, iPhone 12, iPhone SE, desktop and reduced-motion. Real
screenshots of the production build were also decoded with `jsQR` at full size and
downscaled to 20%, on six viewports from 320×568 to 1920×1080, plus after three
rewind-and-rerun cycles, after resize (settled and mid-animation), after
backgrounding, and via Skip.

Light modules render at luminance 255, dark at 0. The quiet zone is probed at
every module of the full 4-module band on all four sides, corners included, and
comes back pure white — which is what proves the decorative frame clears it.

## Known limitations

- Very long destination URLs push the matrix past version ~6; `raceQr.ts` refuses
  above 41 modules, because past that the modules get too small to scan reliably at
  phone size. Use a short URL.
- The car briefly overlaps the code area mid-flight. It is gone well before the
  code settles, so it never affects scanning, but a screenshot taken mid-animation
  will not decode — that is expected.
- On a 320px-wide phone (iPhone SE 1st gen) the decorative border costs one module
  of size, leaving 7px modules. Still verified to decode, including downscaled, but
  it is the tightest case.
- Audio uses `AudioContext` directly; on iOS it only produces sound with the ringer
  switch on.
