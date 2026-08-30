# UMBRA-S1-007 — Sphere Intersection — Report

## Status

Complete

## Objective

Add the ray–sphere quadratic and visible hit/miss selection. Scope: sphere data, intersection calculation, nearest non-negative hit, and pure unit tests for miss, hit, tangent, inside, behind-camera, and nearest-root cases. Non-goals: normals, lighting, shadows, other primitives, BVH, UI editors, anti-aliasing.

Acceptance criteria (from [S1-007 in the slice plan](../tasks/umbra-sprint-1-slices.md)): all documented intersection cases meet tolerance; background remains visible on misses.

Task contract: [S1-007 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy row: [TC-S1-006 (sphere intersection, pure unit + focused render hit/miss)](../umbra-verification-strategy.md).

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-29), after G4 (camera) and G5 (background-gradient / first visual) both passed `PASS WITH OBSERVATIONS`. S1-007 remains gated behind G6 (the adversarial-analysis review); G6 and G7 are **not yet passed**.

## Summary

Added a pure-core sphere primitive and ray–sphere intersection, plus a sphere renderer that composes the existing camera + background gradient with hit detection so a hit renders with a constant color and a miss falls back to the documented background gradient. The composition root (`src/main.ts`) now wires a fixed sphere (`center = (0, 0, −3)`, `radius = 1`) into the existing render path; the render controller is unchanged and remains generator-agnostic.

ADR-002 is preserved end-to-end. The new core modules import only sibling pure-core modules (`vec3`, `ray`, `pixel-buffer`, `camera`, `background-gradient`, `sphere`) and a type-only import from `smoke-generator`. No DOM, Canvas, Vite, or UI symbol appears anywhere in `src/core/`.

The suite now reports **178 tests across 13 files** (155 from S1-006 + 23 new), typecheck is silent, the production bundle grows from 15 to 17 modules, and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/sphere.ts` — `Sphere` and `SphereHit` value types; `createSphere(center, radius)` validating factory; `intersectSphere(sphere, ray)` returning the nearest valid non-negative hit or `null`. Uses the full quadratic `a = dot(direction, direction)`, `b = 2 dot(direction, oc)`, `c = dot(oc, oc) − r²`, discriminant `D = b² − 4 a c`. Tangent is `D = 0` (single root, hit); miss is `D < 0`; two distinct roots `t0 ≤ t1` select `t0` when `t0 ≥ 0`, else `t1` when `t1 ≥ 0` (origin inside), else miss. Normalizes `−0` to `+0` so the documented exact-zero tangent parameter is sign-stable.
- `src/core/sphere.test.ts` — 13 tests covering: `createSphere` validation (non-positive / non-finite radius, non-finite center, verbatim record); `intersectSphere` miss (`D < 0` beside, sphere behind origin); tangent (`D = 0` at exact root `t = 0`); single valid hit (entry root); nearest valid root (two valid roots → `t0`, not `t1`); inside sphere (exit root `t1`); general non-unit direction (full `a`); determinism; `pointAtRay` integration; sphere-identity in the hit.
- `src/core/sphere-renderer.ts` — `DEFAULT_SPHERE_HIT_COLOR` constant (`0xd96b1a` warm amber, fully opaque); `SphereRenderOptions` (`background?`, `hitColor?`); `createSphereRenderGenerator(camera, sphere, options?)` returning a `PixelBufferGenerator` that samples one ray per pixel and writes the hit color on hits and `backgroundColorForDirection(ray.direction)` on misses. Pixel-center convention and `(u, v)` screen convention are inherited from S1-005 / S1-006.
- `src/core/sphere-renderer.test.ts` — 7 tests: default hit-color constant; buffer dimensions and RGBA stride; the hit/miss contract (per-pixel equality against `intersectSphere` + `backgroundColorForDirection`, plus `hits > 0 && misses > 0` for a visible sphere); all-miss when the sphere is behind the camera (gradient preserved); all-hit when a huge sphere covers the view; cross-instance determinism; fresh buffer per call; custom hit color and background overrides.

### Modified

- `src/main.ts` — composition root now builds the documented fixed sphere (`center = (0, 0, −3)`, `radius = 1`) and passes `createSphereRenderGenerator(camera, FIXED_SPHERE)` as the controller's generator. The S1-005 sample camera and the controller's generator-agnostic seam are unchanged.
- `src/controller/render-controller.test.ts` — added a `sphere render integration` describe block (2 tests): the real sphere renderer plugs into the existing render path, writes a deterministic gradient+hit `ImageData` matching the per-pixel `intersectSphere` + `backgroundColorForDirection` contract, and falls back entirely to the background gradient when the sphere is behind the camera.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility; the nearest-root policy and the hit-color contract are recorded here for the S1-008 handoff).

## Semantics (recorded for S1-008 handoff)

- **Intersection quadratic.** `intersectSphere(sphere, ray)` solves `(origin + t·direction − center)² = r²` via the coefficients `a = dot(direction, direction)`, `b = 2 dot(direction, oc)`, `c = dot(oc, oc) − r²` where `oc = origin − center`. The discriminant `D = b² − 4 a c` decides miss (`D < 0`, `null`), tangent (`D = 0`, hit at `t = −b / (2 a)`), or two distinct roots.
- **Nearest valid root policy.** With roots `t0 ≤ t1`:
  - `t0 ≥ 0` → hit at `t0` (entry, the nearer root).
  - else `t1 ≥ 0` → hit at `t1` (origin inside the sphere; the entry root lies behind the origin and is discarded; the exit root is the nearest valid hit).
  - else `null` (sphere entirely behind the camera in the ray's direction).
- **Direction.** The function is correct for any non-zero direction (the full `a` coefficient is used). The Sprint 1 caller (`generateRay`) always supplies a unit direction, so for unit directions `a = 1` and `t = (−b ± sqrt(D)) / 2`.
- **Hit color.** S1-007 uses a constant hit color — `DEFAULT_SPHERE_HIT_COLOR = (0xd9, 0x6b, 0x1a, a = 0xff)` (warm amber) by default, override via `options.hitColor`. The warm amber is deliberately distinct from the violet default background so the sphere reads as "hit" against the sky.
- **Background gradient fallback.** Misses resolve to `backgroundColorForDirection(ray.direction, options.background ?? DEFAULT_BACKGROUND_GRADIENT)`, the same function S1-006 documents. `DEFAULT_BACKGROUND_GRADIENT` is unchanged.
- **Zero normalization.** The chosen `t` is normalized so an exact-zero tangent parameter is `+0`, not `−0`. Downstream code and tests can compare against the documented `0` without sign ambiguity.
- **Determinism.** `intersectSphere` and `createSphereRenderGenerator` are deterministic over their inputs. The generator returns a fresh buffer per call; cross-instance buffers are byte-equal for identical inputs.

## Numeric tolerance

Per the evidence policy, tolerances were defined before the tests were written:

- **Intersection math is exact integer arithmetic on the documented test cases.** Centers on integer coordinates (`(0,0,−3)`, `(0,0,−5)`, `(0,0,5)`, origin), unit axis-aligned directions, and integer radii. All hit parameters (`t`) and hit points (`point`) are exact integers, so `toBe` / `toEqual` exact equality is the documented assertion.
- **Discriminant boundary.** `D < 0` is a miss; `D ≥ 0` is a hit. No discriminant epsilon is introduced; the tangent case uses an exact-zero discriminant (`D = 0`) produced by an on-surface tangent ray.
- **Hit-point world-space tolerance.** `VEC3_EPSILON = 1e-6` (S1-004 default) is available for the general non-unit direction test and for the Ray integration assertion; the integer-coordinate tests use exact equality.
- **Color tolerance.** Hit color and gradient color are exact 8-bit integers; the integration tests assert exact channel equality, not approximate.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 13 passed (13) / Tests 178 passed (178)`. The new files run in the `core` (node) project (`sphere.test.ts`, `sphere-renderer.test.ts`) and the integration tests in the `shell` (happy-dom) project.
- `npx vitest run src/core/sphere.test.ts` → 13 passed.
- `npx vitest run src/core/sphere-renderer.test.ts` → 7 passed.
- `npm run build` → `✓ 17 modules transformed.` exit 0 (bundle now includes `sphere` and `sphere-renderer`; previously 15 modules).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T183605Z.md`.
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
| `sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./sphere.js`, `./smoke-generator.js` (type-only) |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: `sphere.ts` adds `vec3`+`ray`; `sphere-renderer.ts` adds the four pure-core siblings + a smoke-generator type-only import |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; still generator-agnostic) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller + core | composition root | Compliant (wires camera + sphere + sphere renderer) |

## Validation

### TC-S1-006 — sphere intersection + focused render hit/miss

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 13 passed (13) / Tests 178 passed (178)` |
| `npm run build` | 0 | `✓ 17 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/sphere.test.ts` | 0 | 13 passed |
| `npx vitest run src/core/sphere-renderer.test.ts` | 0 | 7 passed |

The new sphere tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| `createSphere` validation | 4 | non-positive radius, non-finite radius, non-finite center (x/y/z), verbatim record |
| Miss (no real roots) | 2 | `D < 0` beside sphere; sphere entirely behind the ray origin |
| Tangent | 1 | `D = 0` on-surface tangent → hit at exact `t = 0`, point `(1,0,0)` |
| Hit (single valid root) | 1 | entry hit at `t = 2`, point `(0,0,−2)` for sphere `(0,0,−3) r=1` |
| Nearest valid root | 1 | two valid roots (`t0 = 4`, `t1 = 6`) → hit at `t0`, not `t1` |
| Inside sphere | 1 | exit root `t1 = 1` chosen when `t0 = −1` lies behind the origin |
| General (non-unit) direction | 1 | full `a = dot(direction, direction)`; `t = 1` for direction `(0,0,−2)` |
| Determinism + Ray integration | 2 | repeated-call equality; `hit.point === pointAtRay(ray, hit.t)`; sphere identity in the hit |

The new sphere-renderer tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Default hit color | 1 | warm amber `0xd96b1a`, fully opaque |
| Dimensions / stride | 1 | width, height, RGBA stride, `data.length` |
| Hit/miss contract | 3 | per-pixel equality against `intersectSphere` + `backgroundColorForDirection` with `hits > 0 && misses > 0`; all-miss when sphere is behind camera; all-hit for a huge sphere covering the view |
| Determinism + options | 3 | cross-instance equality; fresh buffer per call; custom hit color and background overrides honored |

The new controller integration tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Sphere render integration | 2 | the real sphere renderer plugs into the existing render path and writes a deterministic gradient+hit `ImageData` matching the per-pixel contract; all-miss case preserves the background gradient |

### Adversarial cases (the G6 review focus)

The slice plan and the G6 review gate call out edge-case coverage. Each adversarial case has a dedicated test:

| Adversarial case | Test | Setup | Outcome asserted |
| --- | --- | --- | --- |
| Miss (`D < 0`) | `sphere.test.ts` "returns null when the ray passes beside the sphere" | sphere `(5,0,0) r=1`, ray `(0,0,0) → (0,0,−1)` | `null` |
| Miss — behind camera | `sphere.test.ts` "returns null when the sphere is entirely behind the ray origin" | sphere `(0,0,5) r=1`, ray `(0,0,0) → (0,0,−1)` | `null` (both roots negative) |
| Tangent (`D = 0`) | `sphere.test.ts` "returns a hit at the grazing parameter for a tangent ray" | sphere origin `r=1`, ray `(1,0,0) → (0,1,0)` | hit at `t = 0`, point `(1,0,0)` |
| Inside sphere | `sphere.test.ts` "returns the exit root t1 when the ray origin is inside the sphere" | sphere origin `r=1`, ray origin at center | hit at `t = 1` (exit `t1`), not `t0 = −1` |
| Nearest valid root | `sphere.test.ts` "returns the nearer entry root t0, not the exit root t1" | sphere `(0,0,−5) r=1`, ray `(0,0,0) → (0,0,−1)` | hit at `t = 4` (entry), not `t = 6` (exit) |
| General (non-unit) direction | `sphere.test.ts` "uses the full a = dot(direction, direction)" | direction `(0,0,−2)` | hit at `t = 1` |
| Render path: hit overrides background, miss preserves gradient | `render-controller.test.ts` "writes a sphere-hit buffer … with hits and misses" | camera + visible sphere at `(0,0,−3) r=1` | per-pixel equality vs. `intersectSphere` + `backgroundColorForDirection` |
| Render path: all-miss preserves gradient | `render-controller.test.ts` "preserves the background gradient when the sphere is entirely behind the camera" | camera + sphere at `(0,0,5) r=1` | every pixel equals `backgroundColorForDirection(ray.direction)` |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear. The slice's explicit non-goals (normals, lighting, shadows, other primitives, BVH, UI editors, anti-aliasing) are confirmed absent: no normal / light / shadow module exists, no second primitive, no BVH, no anti-aliasing loop (one ray per pixel), and no UI change.

## Limitations

- **Hit color is a constant.** S1-007 uses a flat warm-amber color for any sphere hit. Normal-based shading is the S1-008 concern and is explicitly out of scope here.
- **Single sphere only.** The renderer takes a single `Sphere`. Multi-sphere scenes with nearest-across selection belong to S1-009 (declarative `RenderRequest v0`), which introduces the scene-shape contract.
- **No ray-primitive set.** Only `intersectSphere` exists; planes, boxes, triangles, etc. are out of scope for Sprint 1 (the slice plan and ADR-001 forbid other primitives).
- **No screenshot in this automated environment.** Producing one requires browser automation, and the repo intentionally carries no browser-automation dependency. A human may capture the running app via `npm run dev` for the G6 visual record; the per-pixel deterministic evidence above is the primary proof per the evidence policy.
- **Discriminant epsilon.** The `D < 0` boundary is exact. Near-misses (true `D ≈ 0`) may flip to tangent/hit due to floating-point noise. This is the textbook trade-off and acceptable for Sprint 1; a later slice can introduce a discriminant epsilon if a real case requires it.
- **Camera/sphere placement is fixed in `main.ts`.** The composition root uses the documented sample camera and a single fixed sphere. Declarative scene configuration is the S1-009 concern.

## Handoff (to G6 reviewers and S1-008)

- **Sphere API.** `createSphere(center, radius) → Sphere` and `intersectSphere(sphere, ray) → SphereHit | null`, both in `src/core/sphere.ts`. `SphereHit = { sphere, t, point }`.
- **Nearest valid root policy.** Documented in the module header and asserted by 13 unit tests. The rule is `t0 ≥ 0 → t0`; else `t1 ≥ 0 → t1` (origin inside); else `null` (behind camera).
- **Discriminant boundary.** `D < 0` miss; `D = 0` tangent; `D > 0` two roots. Tangent test asserts the exact-zero case at `t = 0` with `+0` normalization. No discriminant epsilon is introduced.
- **Hit color.** `DEFAULT_SPHERE_HIT_COLOR = (0xd9, 0x6b, 0x1a, a = 0xff)` (warm amber). Override via `options.hitColor` in `createSphereRenderGenerator`.
- **Render integration.** `createSphereRenderGenerator(camera, sphere, options?)` returns a `PixelBufferGenerator`; the existing `createRenderController` accepts it via the unchanged `generator` option. The controller is still generator-agnostic.
- **Fixed-scene anchor.** `main.ts` uses camera `position = (0,0,0)`, `lookAt = (0,0,−1)`, `fov = π/3`, `aspect = 640/400`, and sphere `center = (0,0,−3)`, `radius = 1`. The sphere is centered in the view, occupying roughly the central `~120 × 120` pixels of the `640 × 400` viewport (visible against the gradient).
- **S1-008 integration point.** Sphere normals are computed from the hit point as `(point − sphere.center) / radius`. Normal-based color replaces `DEFAULT_SPHERE_HIT_COLOR` in the renderer. The background-gradient fallback on miss is unchanged.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-006.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** G6 and G7 remain unpassed; this report records the human authorization but does not assert gate passage.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-007 section; status line now reflects authorization).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-006 row).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G6 row).
- Gate reviews for predecessor slices: [G4 (camera)](../reviews/UMBRA-S1-005-g4-camera-review.md), [G5 (background gradient / first visual)](../reviews/UMBRA-S1-006-g5-background-gradient-review.md).
- Verification hook run: [umbra-verify-20260829T183605Z.md](hooks/umbra-verify-20260829T183605Z.md).
- Predecessor reports: [UMBRA-S1-005 report](UMBRA-S1-005-camera-ray-generation.md), [UMBRA-S1-006 report](UMBRA-S1-006-background-gradient-render.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).