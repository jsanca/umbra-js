# UMBRA-S1-010 — Point-Light Diffuse Shading — Report

## Status

Complete

## Objective

Complete the first-light outcome with one point light and direct Lambertian diffuse shading. Scope: point-light data, deterministic diffuse calculation, fixed-scene configuration, Canvas presentation, and diagnostics. Non-goals: shadows, reflections, refractions, textures, soft light, sampling, multiple material models.

Acceptance criteria (from [S1-010 in the slice plan](../tasks/umbra-sprint-1-slices.md)): documented lit and unlit/background pixels meet tolerance; the fixed scene renders from `RenderRequest v0`; product metadata remains honest.

Task contract: [S1-010 in the slice plan](../tasks/umbra-sprint-1-slices.md), the [RenderRequest v0 API contract (conceptual)](../../knowledge/umbra-api-contract.md), and the G7 review's [S1-010 contract evolution recommendation](../reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md).
Verification strategy rows: [TC-S1-011 (Canvas image data), TC-S1-012 (keyboard render), TC-S1-013 (no arbitrary waits)](../umbra-verification-strategy.md).

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-30), after S1-009 was implemented and verified and G7 passed `PASS WITH OBSERVATIONS`. S1-010 remains gated behind G8 (first-light review); G8 is **not yet passed**.

## Carry-forward observations (tracked, NOT addressed in this slice)

The user instruction explicitly tracked but did not require addressing: **G6-1** (zero-direction ray guard), **G6-3** (`PixelBufferGenerator` type placement), **S1-008-2** (`normalToRgbaColor` NaN hardening), **G7-1** (permissive unknown-field policy), **G7-2** (semantic-degeneracy delegation to `createCamera`). All five remain open and are documented as carry-forwards in the report; none are addressed here.

## Summary

Added the first-light outcome: a point-light data type, a Lambertian diffuse shading function, an optional `scene.light` field in `RenderRequest v0`, and a `light` option on the sphere renderer. The hit-color path is now `(hit, light?) → diffuseShadingColor(baseColor, normal, light, hit.point)` when a light is supplied, and `→ normalToRgbaColor(computeSphereNormal(hit))` (the S1-008 path) when no light is supplied. **The byte-equality guarantee with S1-008/009 for requests without `scene.light` is preserved** — the G7 carry-forward is upheld. The composition root (`src/main.ts`) now builds a `RenderRequest v0` with a single point light at `(0, 5, −2)`, producing a top-down illuminated diffuse sphere over the violet background gradient.

ADR-002 is preserved. `light.ts` imports only pure-core siblings (`vec3`, `pixel-buffer` for the `RgbaColor` type). `render-request.ts` and `sphere-renderer.ts` accept the additive `light` option. No DOM, Canvas, Vite, or UI symbol appears in the new module or in the modified files.

The suite now reports **264 tests across 16 files** (232 from S1-009 + 32 new: 16 light + 12 render-request-light + 4 sphere-renderer-light), typecheck is silent, the production bundle grows from 19 to 20 modules, and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/light.ts` — `PointLight` interface, `createPointLight(position, intensity?)` (validates `intensity` is a positive finite number; default `1`), `lightDirectionFromHit(light, hitPoint)` returning the unit direction toward the light, `diffuseShadingColor(baseColor, normal, light, hitPoint)` computing the Lambertian factor `t = max(0, dot(normal, lightDir)) * intensity` and returning the base color scaled by `t` with `Math`round + clamp to `[0, 255]`. Alpha is preserved from `baseColor`. Pure core; no DOM/Canvas/Vite/UI.
- `src/core/light.test.ts` — 16 tests: `createPointLight` validation (4), `lightDirectionFromHit` contract + degenerate light-at-hit (5), `diffuseShadingColor` cardinal exact (dot ∈ {0, 1, -1}) + intensity overflow + alpha preservation + degenerate (7), non-cardinal consistency (1).

### Modified

- `src/core/render-request.ts` — added `PointLightConfig` (`position: Vec3Like`, `intensity?: number`) and `SceneConfig.light?: PointLightConfig`. The validator gained `validatePointLight` (finite `position`, optional positive finite `intensity`); `assertPositiveRadius` was renamed to `assertPositiveFiniteNumber` (now used by both radius and intensity). The conversion calls `createPointLight` when `scene.light` is present and passes it to `createSphereRenderGenerator` via the `light` option. **The no-light path is unchanged**: requests without `scene.light` produce the S1-009 byte-equal output.
- `src/core/render-request.test.ts` — 12 new tests: `validateRenderRequest` accepts requests with `scene.light` (2) and rejects invalid light position / intensity / missing position (5); `createRequestRenderGenerator` lit rendering: per-pixel equality against `diffuseShadingColor`, strict-darkening assertion vs the no-light buffer, miss-preserved-background, and light-on-behind-camera-sphere (4); plus the boundary-surface test (still asserts the documented runtime export surface).
- `src/core/sphere-renderer.ts` — `SphereRenderOptions` gained `light?: PointLight`. On a hit, the renderer now computes the normal once, derives the S1-008 base color, and either returns the base color (no light → byte-equal to S1-008) or `diffuseShadingColor(baseColor, normal, light, hit.point)`. Misses and the `background` option are unchanged.
- `src/core/sphere-renderer.test.ts` — 4 new tests: no-light byte-equality with S1-008 normal color (per-pixel), light per-pixel equality against `diffuseShadingColor`, back-facing `dot < 0` → black (asserted via the formula directly to avoid fragile pixel-center assumptions), miss-preserved-background with a light.
- `src/main.ts` — the composition root now constructs a `RenderRequest v0` with `scene.light = { position: { x: 0, y: 5, z: -2 }, intensity: 1 }`. The fixed-scene render is now the first-light outcome: a top-down illuminated diffuse sphere over the violet background gradient. The existing UI copy (`1 sphere`, `1 point`) becomes truthful (the `1 point` claim now matches the implemented point light).

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility; the carry-forward observations and the G7-5 doc-staleness note remain tracked for a later promotion pass).

## Semantics (recorded for S1-011 handoff)

- **PointLight.** `createPointLight(position: Vec3, intensity: number = 1) → PointLight`. `intensity` is a positive finite multiplier; `position` is expected to be finite (the request validator enforces finiteness).
- **Light direction.** `lightDirectionFromHit(light, hitPoint)` returns `normalizeVec3(subtractVec3(light.position, hitPoint))`. The S1-004 zero policy applies when `light.position === hitPoint` (direction collapses to `VEC3_ZERO`); this is a degenerate caller bug, not a shading concern.
- **Diffuse shading.** `diffuseShadingColor(baseColor, normal, light, hitPoint)`:
  ```
  lightDir = normalize(light.position − hitPoint)
  t = max(0, dot(normal, lightDir)) * light.intensity
  color = clampByte(round(baseColor.channel * t))   for r, g, b
  alpha = baseColor.a
  ```
  The base material color for Sprint 1 is the S1-008 normal visualization (`normalToRgbaColor(computeSphereNormal(hit))`), so the lit hit color is the normal color modulated by the Lambertian factor.
- **Renderer composition.** On a hit:
  - **No light** → `normalToRgbaColor(computeSphereNormal(hit))` (byte-equal to S1-008).
  - **With light** → `diffuseShadingColor(baseColor, normal, light, hit.point)`.
  On a miss → `backgroundColorForDirection(ray.direction, background)` (unchanged).
- **RenderRequest v0 additive change.** `scene.light?: { position: Vec3Like; intensity?: number }`. The field is optional; omitting it preserves S1-008/009 behavior. `intensity` defaults to `1` in the conversion (`createPointLight(position, intensity ?? 1)`).
- **Determinism.** Two requests that with the the same scene shape (sphere + optional light) produce byte-equal buffers; structurally equivalent scenes are deterministic. The byte-equality test in `render-request.test.ts` and the per-pixel consistency test in `sphere-renderer.test.ts` together pin the contract.
- **Boundary.** `light.ts` imports only `vec3` (values) + `pixel-buffer` (type). `render-request.ts` adds `light.js`; `sphere-renderer.ts` adds `light.js`. No DOM/Canvas/Vite/UI symbol appears in any modified or new core module.

## Numeric tolerance

Per the evidence policy, tolerances were defined before tests were written:

- **Cardinal cases are exact.** `dot ∈ {0, 1, −1}` produce exact integer outputs (asserted by `light.test.ts`): `(0,0,0, baseColor.a)` for `dot ≤ 0`, `baseColor * intensity` for `dot = 1` (clamped to `[0, 255]`).
- **Intensity overflow** is clamped per channel (asserted: `intensity = 2`, `dot = 1`, `baseColor = (200,100,50)` → `(255,200,100)`).
- **Non-cardinal** is covered by consistency: the expected color is re-derived from the documented formula and compared exactly (`light.test.ts` diagonal case).
- **Per-pixel determinism** in the renderer: every hit pixel of a lit render equals `diffuseShadingColor(baseColor, normal, light, hit.point)` (asserted pixel-by-pixel in `render-request.test.ts` and `sphere-renderer.test.ts`).
- **Inherited tolerances:** `VEC3_EPSILON = 1e-6` (S1-004 default) is used for vector comparisons in `lightDirectionFromHit` tests; the sphere root policy and the pixel-center convention are unchanged.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 16 passed (16) / Tests 264 passed (264)`. The new file runs in the `core` (node) project; the modified integration tests run in `core` as well (the new lit tests in `render-request.test.ts` are core tests, not controller).
- `npx vitest run src/core/light.test.ts` → 16 passed.
- `npx vitest run src/core/render-request.test.ts` → 45 passed (33 from S1-009 + 12 new).
- `npx vitest run src/core/sphere-renderer.test.ts` → 12 passed (8 from S1-008 + 4 new).
- `npm run build` → `✓ 20 modules transformed.` exit 0 (bundle now includes `light`; previously 19 modules).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260830T174558Z.md`.
- `npm audit signatures` → 56/56 verified, 25 with attestations (no new packages added).
- `npm audit` → 0 vulnerabilities.

### Core boundary inspection (TC-S1-005 continuity)

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
| `sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./light.js`, `./normal.js`, `./sphere.js`, `./smoke-generator.js` (type-only) |
| `render-request.ts` | `./camera.js`, `./background-gradient.js`, `./pixel-buffer.js`, `./sphere-renderer.js`, `./light.js`, `./sphere.js`, `./smoke-generator.js` (type-only), `./vec3.js` |
| `light.ts` | `./vec3.js`, `./pixel-buffer.js` (type-only) |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: `light.ts` adds `vec3` + `pixel-buffer` (type-only); `sphere-renderer.ts` and `render-request.ts` add `light.js` |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; generator-agnostic) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller + core | composition root | Compliant (request now includes `scene.light`) |

## Validation

### TC-S1-011 / TC-S1-012 / TC-S1-013

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 16 passed (16) / Tests 264 passed (264)` |
| `npm run build` | 0 | `✓ 20 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/light.test.ts` | 0 | 16 passed |

The new light tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| `createPointLight` validation | 4 | Verbatim record; default intensity `1`; non-positive and non-finite intensity rejected |
| `lightDirectionFromHit` | 5 | Documented formula; unit length; axis-aligned `(0,0,1)`; degenerate `VEC3_ZERO` at coincident light/hit; determinism |
| `diffuseShadingColor` cardinal | 7 | `dot = 1` returns base color; `dot = 0` returns black; negative `dot` clamped to black; alpha preserved; intensity scales and clamps overflow; degenerate lightDir → black |
| Non-cardinal consistency | 1 | Diagonal normal + axis-aligned light re-derived from the formula matches |

The new render-request tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| `validateRenderRequest` light | 7 | Position-only accepted; explicit positive intensity accepted; non-finite position / non-positive / NaN / negative intensity / missing position rejected |
| `createRequestRenderGenerator` lit | 4 | No-light hits match S1-008 normal color (byte-equality per pixel); lit hits match `diffuseShadingColor` per pixel; lit buffer strictly darker on at least one hit (vs no-light); misses preserve background; light with sphere behind camera → all misses |
| Boundary | 1 | (Carried from S1-009; runtime export surface unchanged) |

The new sphere-renderer tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| S1-010 diffuse shading | 4 | No-light byte-equality with S1-008; lit per-pixel equality with `diffuseShadingColor`; back-facing `dot < 0` → black; miss-preserved-background with a light |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear. The slice's explicit non-goals (shadows, reflections, refractions, textures, soft light, sampling, multiple material models, additional primitives, UI controls) are confirmed absent: no shadow / reflection / material / texture module exists, no second primitive, no UI change. The renderer remains single-sample-per-pixel (no AA), one sphere, one optional light.

## Limitations

- **No shadows.** The slice plan and the user scope both forbid shadows; the lit pixel does not test for occlusion by the sphere. The back-facing pixel is black because `dot < 0`, not because it is shadowed by the sphere's near side.
- **Single light only.** `scene.light` is a singular `PointLightConfig`, not an array. Multiple lights, area lights, directional lights, and spotlights are out of scope; the G7 review's recommendation is honored (single sphere, optional single light).
- **No material parameter.** The base color is the S1-008 normal visualization; there is no albedo/material object. The diffuse factor multiplies the base color directly. A future additive decision can introduce a material model (the slice plan stop condition).
- **Degenerate light at hit point.** `light.position === hitPoint` produces `VEC3_ZERO` direction → `dot = 0` → black. The validator does not catch this (it would require a proximity check); it is a caller bug.
- **Carry-forward observations remain open.** G6-1, G6-3, S1-008-2, G7-1, G7-2 — none addressed in this slice, per the user's explicit instruction to track but not mix. The conceptual docs (`umbra-api-contract.md`, `umbra-architecture-overview.md`) remain stale (G7-5); the knowledge curator can promote them now that G7 passed.
- **No screenshot in this automated environment.** Producing one requires browser automation, and the repo intentionally carries no browser-automation dependency. The "fixed scene renders from `RenderRequest v0`" acceptance is established by the per-pixel deterministic evidence (lit hits match `diffuseShadingColor`, misses match the gradient, the no-light path is byte-equal to S1-008). A human may capture the running app via `npm run dev` for the G8 visual record.

## Handoff (to G8 reviewers and S1-011)

- **Lighting API.** `PointLight`, `createPointLight`, `lightDirectionFromHit`, `diffuseShadingColor` in `src/core/light.ts`. The renderer composes them.
- **RenderRequest v0 additive change.** `scene.light?: { position: Vec3Like; intensity?: number }`. `intensity` defaults to `1`. The no-light path is byte-equal to S1-008/009.
- **Fixed-scene anchor.** `main.ts` uses camera `position = (0,0,0)`, `lookAt = (0,0,−1)`, `fov = π/3`, `aspect = 640/400`; sphere `center = (0,0,−3)`, `radius = 1`; light `position = (0,5,−2)`, `intensity = 1`. The visible scene is a top-down illuminated diffuse sphere over the violet background gradient.
- **S1-011 integration point.** The final Sprint 1 documentation/checkpoint slice must reconcile the conceptual docs (`umbra-api-contract.md`, `umbra-architecture-overview.md`) with the now-implemented contract (G7-5), and surface the carry-forward observations as known limitations in the checkpoint evidence.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-009.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** G8 remains unpassed; this report records the human authorization but does not assert gate passage.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-010 section; status line now reflects authorization).
- Conceptual API contract: [RenderRequest v0 API contract](../../knowledge/umbra-api-contract.md).
- Architecture overview: [Sprint 1 architecture overview](../../knowledge/umbra-architecture-overview.md).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-011, TC-S1-012, TC-S1-013 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G8 row).
- Predecessor reviews: [G4 camera review](../reviews/UMBRA-S1-005-g4-camera-review.md), [G5 background-gradient review](../reviews/UMBRA-S1-006-g5-background-gradient-review.md), [G6 sphere-intersection review](../reviews/UMBRA-S1-007-g6-sphere-intersection-review.md), [S1-008 normal-shading review](../reviews/UMBRA-S1-008-normal-based-shading-review.md), [G7 RenderRequest review](../reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md).
- Verification hook run: [umbra-verify-20260830T174558Z.md](hooks/umbra-verify-20260830T174558Z.md).
- Predecessor reports: [UMBRA-S1-005 report](UMBRA-S1-005-camera-ray-generation.md), [UMBRA-S1-006 report](UMBRA-S1-006-background-gradient-render.md), [UMBRA-S1-007 report](UMBRA-S1-007-sphere-intersection.md), [UMBRA-S1-008 report](UMBRA-S1-008-normal-based-shading.md), [UMBRA-S1-009 report](UMBRA-S1-009-render-request-v0.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).