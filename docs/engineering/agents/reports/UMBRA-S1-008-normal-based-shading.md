# UMBRA-S1-008 — Normal-Based Shading — Report

## Status

Complete

## Objective

Turn a sphere hit into a normal-derived visible color. Scope: sphere normal calculation, normal-based color mapping, renderer integration, and unit/pixel tests for cardinal and non-cardinal normals. Non-goals: point light, shadows, reflectance model beyond the agreed normal visualization, `RenderRequest v0`, UI controls, anti-aliasing.

Acceptance criteria (from [S1-008 in the slice plan](../tasks/umbra-sprint-1-slices.md)): cardinal and non-cardinal normals and selected pixels match documented values.

Task contract: [S1-008 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy rows: [TC-S1-007 (normals, pure unit/pixel), TC-S1-008 (pixel samples), TC-S1-009 (determinism)](../umbra-verification-strategy.md).

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-29), after S1-007 was implemented and verified. S1-007's G6 review passed `PASS WITH OBSERVATIONS`. S1-008 remains gated behind G7; G7 and G8 are **not yet passed**.

## Carry-forward observations (explicitly NOT addressed in this slice)

- **G6-1 — zero-direction ray guard.** Remains a follow-up. The S1-008 slice did not modify `intersectSphere` (root policy unchanged per the explicit constraint). The degenerate-direction behavior is therefore the same as S1-007: a zero-direction ray silently falls through to `null`.
- **G6-3 — `PixelBufferGenerator` type placement.** Remains a follow-up. The type is still defined in `smoke-generator.ts` and imported (type-only) by `background-gradient.ts`, `sphere-renderer.ts`, and `render-controller.ts`. A future slice will move it to a neutral core module.

## Summary

Replaced the constant S1-007 hit color with normal-derived shading. The pure-core `src/core/normal.ts` module computes the sphere normal at a hit point and maps it to an opaque RGBA color by the canonical visualization `t = clamp01(0.5 * (n + 1))` per channel. `src/core/sphere-renderer.ts` now writes `normalToRgbaColor(computeSphereNormal(hit))` for hits and continues to write `backgroundColorForDirection(ray.direction)` for misses, so the gradient fallback is preserved. The S1-007 `DEFAULT_SPHERE_HIT_COLOR` constant and the `hitColor` option have been removed — the hit color is no longer a constant, so there is no longer a knob to override it.

ADR-002 is preserved. `normal.ts` imports only `vec3`, `sphere`, and `pixel-buffer` (for the `RgbaColor` type). `sphere-renderer.ts` now also imports `normal.ts`. No DOM, Canvas, Vite, or UI symbol appears anywhere in `src/core/`.

The suite now reports **199 tests across 14 files** (178 from S1-007 + 21 new normal tests; sphere-renderer test count is unchanged at 8), typecheck is silent, the production bundle grows from 17 to 18 modules, and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/normal.ts` — `computeSphereNormal(hit)` returning the unit outward normal (`normalize(hit.point − hit.sphere.center)`); `normalToRgbaColor(normal)` mapping the three components to RGB via `t = clamp01(0.5 * (n + 1))`, scaled to `[0, 255]` and rounded, with `a = 0xff`. Cardinals produce the documented exact colors; the non-cardinal test normal `(1/√3, 1/√3, 1/√3)` produces the exact integer `(201, 201, 201, 255)`.
- `src/core/normal.test.ts` — 21 tests covering: `computeSphereNormal` cardinal directions (front `+z`, back `−z`, `+x`, `+y`); non-cardinal diagonal; unit-length result (within `VEC3_EPSILON`); the documented `normalize(point − center)` formula; determinism; `normalToRgbaColor` for all six cardinal normals (exact); the diagonal non-cardinal (exact `(201,201,201,255)`); out-of-range clamping; alpha always `0xff`; channel range across a sweep; determinism; Sphere + normal integration (the documented front hit maps to `(128,128,255,255)`; the axis-aligned → byte-saturation property is preserved).

### Modified

- `src/core/sphere-renderer.ts` — removed `DEFAULT_SPHERE_HIT_COLOR` and the `hitColor` option from `SphereRenderOptions`. The renderer now imports `computeSphereNormal` and `normalToRgbaColor` from `./normal.js` and writes `normalToRgbaColor(computeSphereNormal(hit))` for hits and `backgroundColorForDirection(ray.direction, background)` for misses. The `background` option is preserved.
- `src/core/sphere-renderer.test.ts` — updated the hit/miss contract test to assert `normalToRgbaColor(computeSphereNormal(hit))` for hits; replaced the "all pixels hit" assertion (which used to compare against the now-removed constant hit color) with a per-pixel consistency sweep against `normalToRgbaColor(computeSphereNormal(hit))` plus `hitCount === width * height`; renamed and simplified the override test to exercise only `options.background`; added a test asserting that no `hitColor` override is exposed and that the renderer always produces normal-derived colors.
- `src/controller/render-controller.test.ts` — replaced the `DEFAULT_SPHERE_HIT_COLOR` import with `normalToRgbaColor` and `computeSphereNormal`; the per-pixel controller integration test now asserts `normalToRgbaColor(computeSphereNormal(hit))` for hits.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility; the normal mapping and the cardinal-color contract are recorded here for the S1-009 handoff).

## Semantics (recorded for S1-009 handoff)

- **Normal.** `computeSphereNormal(hit) = normalizeVec3(subtractVec3(hit.point, hit.sphere.center))`. Because `intersectSphere` only returns hits whose point lies on the sphere surface (`|point − center| = r`), the raw difference has length `r`; normalizing yields the unit outward normal. The result is a unit vector (within `VEC3_EPSILON`) that points away from the sphere center at the hit point.
- **Color mapping.** `normalToRgbaColor(normal)` maps each component `n_axis` to the channel byte via `t = clamp01(0.5 * (n_axis + 1))`, `byte = Math.round(t * 255)`. Alpha is always `0xff`. The mapping is the canonical "normal visualization" used in many teaching ray tracers: cardinal normals produce pure colors, and the sphere's geometry reads as a colored ball against the gradient background.
- **Documented cardinal colors (exact):**
  - `(+x) → (255, 128, 128, 255)`
  - `(−x) → (  0, 128, 128, 255)`
  - `(+y) → (128, 255, 128, 255)`
  - `(−y) → (128,   0, 128, 255)`
  - `(+z) → (128, 128, 255, 255)`
  - `(−z) → (128, 128,   0, 255)`
- **Documented non-cardinal color (exact):** the unit diagonal normal `(1/√3, 1/√3, 1/√3)` maps to `(201, 201, 201, 255)`. The scaled value `201.112...` rounds to `201`, which is not on a `.5` rounding boundary and is therefore stable under IEEE-754 double precision.
- **Render integration.** `createSphereRenderGenerator(camera, sphere, options?)` continues to return a `PixelBufferGenerator`. On a hit it writes `normalToRgbaColor(computeSphereNormal(hit))`; on a miss it writes `backgroundColorForDirection(ray.direction, options.background ?? DEFAULT_BACKGROUND_GRADIENT)`. The hit color is no longer configurable because it is no longer a constant — it is fully determined by the normal at the hit point.
- **Determinism.** `computeSphereNormal` and `normalToRgbaColor` are deterministic over their inputs. The sphere renderer is deterministic; cross-instance buffers are byte-equal for identical inputs.
- **No drift into lighting, materials, or shadows.** The hit color depends only on the normal's three components; there is no light direction, no dot-product, no shadow term, and no material parameter. S1-010 (point light, diffuse shading) is the first slice that introduces lighting.

## Numeric tolerance

Per the evidence policy, tolerances were defined before the tests were written:

- **Color channels are exact 8-bit integers.** Cardinal colors are exact by construction (`0.5 · 255 = 127.5 → 128`, `0 · 255 = 0`, `1 · 255 = 255`). The non-cardinal test normal maps to `201`, which is not a `.5` rounding boundary and is therefore stable.
- **Normal components** are compared with `toBeCloseTo(..., 10)` for irrational unit normals (e.g., `1/√3`) and exact `toEqual` for axis-aligned normals produced by integer-coordinate setups.
- **Unit-length invariant** uses `toBeCloseTo(1, 6)` (six decimal places).
- **Inherited tolerances:** `VEC3_EPSILON = 1e-6` (S1-004 default) for vector comparisons; the S1-007 sphere root policy and discriminant boundary (`D < 0` miss, `D = 0` tangent, `D > 0` two roots) are unchanged.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 14 passed (14) / Tests 199 passed (199)`. The new file runs in the `core` (node) project; the updated integration tests run in the `shell` (happy-dom) project.
- `npx vitest run src/core/normal.test.ts` → 21 passed.
- `npx vitest run src/core/sphere-renderer.test.ts` → 8 passed (the per-pixel consistency sweep, the behind-camera fallback, the all-hit consistency sweep, determinism, fresh buffer, custom background override, and the "no constant hit-color option" test).
- `npm run build` → `✓ 18 modules transformed.` exit 0 (bundle now includes `normal`; previously 17 modules).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T191325Z.md`.
- `npm audit signatures` → 56/56 verified, 25 with attestations (no new packages added).
- `npm audit` → 0 vulnerabilities.

### Core boundary inspection (TC-S1-005 continuity + adversarial-analysis prep)

Imports in `src/core/` after this slice:

| File | Imports |
| --- | --- |
| `vec3.ts` | none (language types only) |
| `ray.ts` | `./vec3.js` only |
| `pixel-buffer.ts` | none |
| `smoke-generator.ts` | `./pixel-buffer.js` only |
| `camera.ts` | `./vec3.js`, `./ray.js` only |
| `background-gradient.ts` | `./pixel-buffer.js`, `./camera.js`, `./vec3.js`, `./smoke-generator.js` (type-only) |
| `sphere.ts` | `./vec3.js`, `./ray.js` only |
| `normal.ts` | `./vec3.js`, `./sphere.js`, `./pixel-buffer.js` (type-only) |
| `sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./normal.js`, `./sphere.js`, `./smoke-generator.js` (type-only) |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: `normal.ts` adds `vec3` + `sphere` + `pixel-buffer` (type-only); `sphere-renderer.ts` adds `normal` to its existing core imports |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; generator-agnostic) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller + core | composition root | Compliant (wires camera + sphere + sphere renderer) |

## Validation

### TC-S1-007 / TC-S1-008 / TC-S1-009

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 14 passed (14) / Tests 199 passed (199)` |
| `npm run build` | 0 | `✓ 18 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/normal.test.ts` | 0 | 21 passed |
| `npx vitest run src/core/sphere-renderer.test.ts` | 0 | 8 passed |

The new normal tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| `computeSphereNormal` cardinal | 4 | front `+z`, back `−z`, `+x`, `+y` — all exact |
| `computeSphereNormal` non-cardinal / invariants | 4 | diagonal `(1/√3, 1/√3, 1/√3)`; unit length within `VEC3_EPSILON`; equals the documented `normalize(point − center)` formula; determinism |
| `normalToRgbaColor` cardinal | 6 | `+x`, `+y`, `+z`, `−x`, `−y`, `−z` → documented exact bytes |
| `normalToRgbaColor` non-cardinal / clamping | 5 | diagonal `(201, 201, 201, 255)`; out-of-range clamping; alpha always `0xff`; channel range sweep; determinism |
| Sphere + normal integration | 2 | front hit maps to `(128, 128, 255, 255)`; axis-aligned normal → byte saturation (255/0) + unit length preserved |

The updated sphere-renderer tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Dimensions / stride | 1 | width, height, RGBA stride, `data.length` |
| Hit/miss contract | 1 | per-pixel equality vs. `normalToRgbaColor(computeSphereNormal(hit))` for hits and `backgroundColorForDirection(ray.direction)` for misses; `hits > 0 && misses > 0` |
| Behind camera all-miss | 1 | every pixel equals the background gradient |
| Huge sphere all-hit | 1 | per-pixel equality vs. `normalToRgbaColor(computeSphereNormal(hit))`; `hitCount === width * height` |
| Determinism / fresh buffer | 2 | cross-instance equality; fresh buffer per call |
| Custom background override | 1 | the `background` option is honored; the rendered pixels differ from the default-gradient render |
| No constant hit-color option | 1 | `SphereRenderOptions` has no `hitColor`; hits produce the normal-derived color |

The updated controller integration test asserts per-pixel equality against the same `intersectSphere` + `computeSphereNormal` + `normalToRgbaColor` + `backgroundColorForDirection` contract.

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear. The slice's explicit non-goals (point light, shadows, reflectance model beyond the normal visualization, `RenderRequest v0`, UI controls, anti-aliasing) are confirmed absent: no light / shadow / material / reflectance module exists, no `RenderRequest` data structure, no UI change, and no anti-aliasing loop (one ray per pixel, no neighborhood sampling).

## Limitations

- **No reflectance model.** The hit color is the raw normal-to-RGB visualization, not a Lambertian or Phong term. S1-010 (point light + diffuse shading) is the first slice that introduces a reflectance model.
- **No `DEFAULT_SPHERE_HIT_COLOR` or `hitColor` override.** The hit color is now fully derived from the normal. The previous S1-007 escape hatch for overriding the hit color has been removed because the hit color is no longer a constant. If a future slice needs a material override, the override shape will be defined by that slice (a `Material` value object), not by reintroducing `hitColor`.
- **Sphere root policy unchanged.** Per the explicit constraint, `intersectSphere` is unchanged. The carry-forward G6-1 zero-direction guard is not addressed in this slice.
- **`PixelBufferGenerator` type placement unchanged.** Per the carry-forward observation, the type still lives in `smoke-generator.ts`.
- **No screenshot in this automated environment.** Producing one requires browser automation, and the repo intentionally carries no browser-automation dependency. A human may capture the running app via `npm run dev` for the G7 visual record; the per-pixel deterministic evidence above is the primary proof per the evidence policy.

## Handoff (to G7 reviewers and S1-009)

- **Normal API.** `computeSphereNormal(hit)` and `normalToRgbaColor(normal)` in `src/core/normal.ts`. `computeSphereNormal` returns the unit outward normal; `normalToRgbaColor` maps it to a fully opaque RGBA color.
- **Canonical colors** are exact 8-bit integers, documented above. The diagonal `(1/√3, 1/√3, 1/√3)` maps to the exact `(201, 201, 201, 255)`. These are the deterministic anchor values G7 and S1-009 can rely on.
- **Render integration.** `createSphereRenderGenerator(camera, sphere, options?)` writes the normal-derived color for hits and `backgroundColorForDirection(ray.direction, options.background ?? DEFAULT_BACKGROUND_GRADIENT)` for misses. The `background` option is preserved; the `hitColor` option is gone.
- **S1-009 integration point.** The `RenderRequest v0` contract should describe the scene as `{ camera, background?, spheres: [{ center, radius }] }` (one sphere for Sprint 1; the slice plan allows a small fixed scene). Validation must remain Canvas-free (the G7 acceptance criterion). The normal-based shading here becomes the fixed-scene shading until S1-010 replaces it with a reflectance model.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-007.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** G7 and G8 remain unpassed; this report records the human authorization but does not assert gate passage.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-008 section; status line now reflects authorization).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-007, TC-S1-008, TC-S1-009 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G7 row).
- Gate review for predecessor slice: [G6 (sphere intersection)](../reviews/UMBRA-S1-007-g6-sphere-intersection-review.md).
- Verification hook run: [umbra-verify-20260829T191325Z.md](hooks/umbra-verify-20260829T191325Z.md).
- Predecessor reports: [UMBRA-S1-005 report](UMBRA-S1-005-camera-ray-generation.md), [UMBRA-S1-006 report](UMBRA-S1-006-background-gradient-render.md), [UMBRA-S1-007 report](UMBRA-S1-007-sphere-intersection.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).