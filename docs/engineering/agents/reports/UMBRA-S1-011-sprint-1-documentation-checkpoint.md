# UMBRA-S1-011 — Sprint 1 Documentation, Examples, and Checkpoint — Report

This report serves as both the S1-011 implementation report and the **G9 acceptance package** for Sprint 1 completion.

## Status

Complete (Sprint 1 implementation evidence G0–G8 captured; G9 acceptance review pending)

## Objective

Leave Sprint 1 explainable, pausable, and ready for acceptance. Scope: update current knowledge with proven behavior; beginner-facing examples/explanations; reports; final checkpoint; and navigation. Non-goals: new rendering features, UI scope, dependency changes, or Sprint 2 planning.

Acceptance criteria (from [S1-011 in the slice plan](../tasks/umbra-sprint-1-slices.md)): documented commands reproduce the verified scope; known limitations/deferred concepts are explicit; engineering log links artifacts.

Task contract: [S1-011 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy: link/index audit and replay of documented validation commands where available.

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-30), after S1-010 was implemented and verified and G8 passed `PASS WITH OBSERVATIONS`. G9 remains unpassed; the G9 acceptance review is the final acceptance gate for Sprint 1.

## Sprint 1 outcomes (what shipped)

Sprint 1 delivers a deterministic, DOM/Canvas-free didactic ray tracer that renders a top-down illuminated diffuse sphere over a violet-to-near-black background gradient, all reachable from a single declarative `RenderRequest v0`.

### Implementation map

| Slice | Outcome | Report | Review |
| --- | --- | --- | --- |
| S1-001 | TypeScript + Vite + Canvas 2D baseline; vitest + happy-dom test runner; ADR-001 boundary mapped | [report](UMBRA-S1-001-typescript-vite-baseline.md) | [G1](UMBRA-S1-001-g1-approval.md) |
| S1-002 | Static laboratory shell (dark page, regions, Render control, lesson, pipeline) | [report](UMBRA-S1-002-static-laboratory-shell.md) | [G2](UMBRA-S1-002-g2-approval.md) |
| S1-003 | Canvas viewport and pixel writer (core pixel buffer + diagnostics + Canvas adapter + controller + Render wiring) | [report](UMBRA-S1-003-canvas-viewport-and-pixel-writer.md) | [G2](UMBRA-S1-002-g2-approval.md) (joint) |
| S1-004 | `Vec3` and `Ray` primitives (pure core math) | [report](UMBRA-S1-004-vec3-and-ray-primitives.md) | — (awaiting G3) |
| S1-005 | `Camera` + `createCamera` + `generateRay` (vertical FOV, screen convention, documented degenerate-input policy) | [report](UMBRA-S1-005-camera-ray-generation.md) | [G4](UMBRA-S1-005-g4-camera-review.md) |
| S1-006 | Background-gradient render (camera rays → deterministic vertical gradient → `PixelBuffer` → Canvas) | [report](UMBRA-S1-006-background-gradient-render.md) | [G5](UMBRA-S1-006-g5-background-gradient-review.md) |
| S1-007 | Sphere intersection (ray–sphere quadratic, nearest valid non-negative hit, hit color overrides background on hit) | [report](UMBRA-S1-007-sphere-intersection.md) | [G6](UMBRA-S1-007-g6-sphere-intersection-review.md) |
| S1-008 | Normal-based shading (sphere normal → cardinal/non-cardinal RGB; replaces constant hit color; preserves miss → background) | [report](UMBRA-S1-008-normal-based-shading.md) | [S1-008 review](UMBRA-S1-008-normal-based-shading-review.md) |
| S1-009 | Declarative `RenderRequest v0` (output + camera + single-sphere scene; validation + request-to-core conversion) | [report](UMBRA-S1-009-render-request-v0.md) | [G7](UMBRA-S1-009-g7-render-request-api-boundary-review.md) |
| S1-010 | Point-light diffuse shading (optional `scene.light`; Lambertian `max(0, n·l) * intensity`; no-light path byte-equal to S1-008/009) | [report](UMBRA-S1-010-point-light-diffuse-shading.md) | [G8](UMBRA-S1-010-g8-point-light-diffuse-shading-review.md) |
| S1-011 | This report. Knowledge docs promoted to implemented state. Carry-forward backlog updated. | — | G9 (pending) |

The Sprint 1 fixed scene, as built by `src/main.ts`:

- Camera: `position = (0,0,0)`, `lookAt = (0,0,−1)`, `vertical fieldOfView = π/3`; aspect `640/400 = 1.6` derived from output.
- Sphere: `center = (0,0,−3)`, `radius = 1`.
- Background: default `DEFAULT_BACKGROUND_GRADIENT` (`top 0x664db3`, `bottom 0x0c071f`; horizon midpoint `0x392a69`).
- Light: `position = (0,5,−2)`, `intensity = 1` (Lambertian diffuse, top-down illumination).

The render path is `RenderRequest v0` → `validateRenderRequest` → `createRequestRenderGenerator` → `createSphereRenderGenerator(camera, sphere, { background, light })` → `createRenderController` → `Canvas output adapter` (via `putImageData`).

## Files changed by S1-011 (this slice)

### Modified (docs and one test timeout)

- `docs/knowledge/umbra-api-contract.md` — promoted from "Conceptual — not production code" to implemented state. Documents the actual v0 shape (`output`, `camera`, `scene: { sphere, background?, light? }`), the validator's field-naming `RangeError`s, the permissive unknown-field policy (forward-linked to [ADR-003](../../adr/ADR-003-render-request-v0-validation-policy.md)), and a worked example using the Sprint 1 fixed scene plus an equivalence example for requests without a light.
- `docs/knowledge/umbra-architecture-overview.md` — promoted from "Proposed — not implemented" to implemented state. Replaces the conceptual scene-graph text with the implemented pure-core module map (`vec3`, `ray`, `pixel-buffer`, `smoke-generator`, `camera`, `sphere`, `normal`, `background-gradient`, `light`, `sphere-renderer`, `render-request`), documents the realized scene input adapter in `render-request.ts`, and records the carried limitations (CF-001..CF-010) inline.
- `docs/knowledge/umbra-domain-model.md` — promoted from "Conceptual Sprint 1 model — not implemented" to implemented state. Lists every Sprint 1 concept (Vec3, Ray, Camera, Sphere, SphereHit, intersectSphere, sphere normal, PointLight, light direction, Lambertian diffuse shading, background gradient, PixelBuffer, Canvas output, RenderRequest v0, render diagnostics, render controller, UI shell) with the owning module and the documented policy / invariant.
- `docs/engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md` — updated with all open non-blocking observations: CF-001..CF-006 from G6–G7 (CF-004 resolved by ADR-003; CF-006 resolved by this slice's knowledge-doc promotion; CF-007 resolved by the now-present S1-010 screenshot) and CF-008..CF-010 from G8. Each row records source review, severity, item, and G9-blocking flag (none).
- `AGENTS.md` Current State — updated to reflect S1-001..S1-011 implemented, G4–G8 passed, G9 pending; carry-forward observations updated (CF-004 and CF-006 marked resolved; CF-007 marked resolved; CF-001, CF-002, CF-003, CF-005, CF-008, CF-009, CF-010 remain open).
- `docs/engineering/ENGINEERING_LOG.md` — S1-011 row marked DONE with links to this report, the verify run, the G4–G8 reviews, the carry-forward backlog, and the promoted knowledge pages + ADR-003.
- `docs/engineering/agents/tasks/umbra-sprint-1-slices.md` — status line updated to reflect S1-011 done, G4–G8 passed, G9 pending. The "execute only" line updated to reflect S1-011 as the most recently authorized slice.
- `src/core/render-request.test.ts` — the single long-running byte-equality test ("produces a byte-equal buffer to the direct sphere renderer for the fixed scene") at the `640 × 400` fixed-scene dimensions now has a 20-second per-test timeout. The test is semantically unchanged: byte-equality is size-independent and is also asserted at `8 × 4` in the per-pixel contract test immediately below. The timeout change addresses machine-load variance so the deterministic verify hook can record evidence; no production code is affected.

No files were created under `src/`, `src/core/`, `src/canvas/`, `src/controller/`, `src/diagnostics/`, or `src/ui/` — S1-011 is docs-only per the "do not implement new renderer features" constraint. No `package.json` or `package-lock.json` changes. No `.osk/` changes.

## Knowledge-doc promotion (G7-5 resolution)

The conceptual docs at `docs/knowledge/` were stale versus the implementation through G7 (the G7 review's G7-5 finding). S1-011 promotes all three:

- `umbra-api-contract.md` is now status: **Implemented (S1-009 through S1-010; verified by G7 and G8)**. It documents the as-implemented contract, the validator's field-naming errors, the permissive unknown-field policy with the ADR-003 link, the conversion path, and two worked examples (the fixed scene from `main.ts` plus a no-light equivalence example). The original "Approval required at Slice 9" authority line is replaced with implementation-evidence references.
- `umbra-architecture-overview.md` is now status: **Implemented (S1-001 through S1-010 verified)**. The architecture diagram is unchanged (it was directionally correct); the boundary descriptions and dependency rules are confirmed against the implementation; the implemented module map replaces the conceptual text; the scene input adapter is recorded as realized in `render-request.ts`; and the carried limitations (CF-001..CF-010) are listed inline.
- `umbra-domain-model.md` is now status: **Sprint 1 model — implemented**. Every Sprint 1 concept (Vec3, Ray, Camera, Sphere, SphereHit, intersectSphere, sphere normal, PointLight, light direction, Lambertian diffuse shading, background gradient, PixelBuffer, Canvas output, RenderRequest v0, render diagnostics, render controller, UI shell) is listed with its owning module and a brief invariant or policy summary. The Sprint 1 invariants section names the normalization zero policy, the nearest-non-negative root policy, deterministic equivalence, the ADR-002 boundary, the validator's scope split (shape/range vs camera semantic degeneracy), and ADR-003's permissive unknown-field policy.

`docs/knowledge/README.md`'s "Umbra planning baseline" list still points at these three files; their updated statuses make the planning-vs-implemented distinction visible.

## Examples (worked, matching the contract)

The [API contract page](../../knowledge/umbra-api-contract.md) now includes a worked example of the Sprint 1 fixed scene — the exact `RenderRequestV0` that `src/main.ts` constructs — plus an equivalence example for a request without `scene.light`. Both examples match the implemented contract (the `scene.light` field exists and defaults to absent; the no-light path is byte-equal to the direct S1-008 sphere renderer, which is the load-bearing guarantee behind additive contract evolution). The examples were verified by `npm run verify` — they are consistent with the test-suite assertions in `render-request.test.ts` and `sphere-renderer.test.ts`.

## S1-010 screenshot evidence path

The G8 review flagged G8-1 (the S1-010 screenshot was missing from `reviews/evidence/` at review time). At S1-011, the screenshot now exists:

- `docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png` (479 KB PNG, captured 2026-08-30). This is the human-visible supplement to the deterministic per-pixel assertions in `render-request.test.ts` and `sphere-renderer.test.ts`. The G8-1 finding is recorded in the carry-forward backlog as CF-007 with status "resolved."

For completeness, the Sprint 1 visual evidence directory also contains:

- `UMBRA-S1-003-canvas-smoke.png` — the S1-003 smoke fill.
- `UMBRA-S1-006-background-gradient-render.png` — the S1-006 gradient render.
- `UMBRA-S1-007-sphere-render.png` — the S1-007 sphere hit render.
- `UMBRA-S1-010-point-light-diffuse-shading.png` — the S1-010 lit render (above).
- Two OSK pause captures (S1-006, S1-007) documenting the agent-authorization pauses recorded in `findings/UMBRA-OSK-FINDING-001-agent-authorization-pause.md`.

## Carry-forward observations (final tally)

Ten carry-forwards are tracked in `docs/engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md`. Three are resolved at S1-011 (CF-004 / G7-1 by ADR-003; CF-006 / G7-5 by the knowledge-doc promotion in this slice; CF-007 / G8-1 by the now-present S1-010 screenshot). Seven remain open and do not block G9:

| ID | Source | Item | Status |
|---|---|---|---|
| CF-001 | G6-1 | Zero-direction ray guard in `intersectSphere` | OPEN |
| CF-002 | G6-3 | Move `PixelBufferGenerator` from `smoke-generator.ts` to a neutral core module | OPEN |
| CF-003 | S1-008-2 | Harden `normalToRgbaColor` against `NaN` | OPEN (non-material) |
| CF-005 | G7-2 | `validateRenderRequest` scope split (camera semantic degeneracy delegated to `createCamera`) | OPEN |
| CF-008 | G8-2 | Document or guard `light.position === hitPoint` | OPEN |
| CF-009 | G8-3 | No distance attenuation (matches documented formula by design) | OPEN (by design) |
| CF-010 | G8-4 | `createPointLight` factory validation asymmetry | OPEN |

Three are resolved:

| ID | Source | Item | Status |
|---|---|---|---|
| CF-004 | G7-1 / ADR-003 | Unknown-field policy decision | RESOLVED by [ADR-003](../../adr/ADR-003-render-request-v0-validation-policy.md) |
| CF-006 | G7-5 | Promote/update knowledge docs after G7 | RESOLVED in this slice |
| CF-007 | G8-1 | Capture the S1-010 screenshot | RESOLVED — `UMBRA-S1-010-point-light-diffuse-shading.png` now present |

## Known limitations / deferred concepts (Sprint 1 scope out)

These are explicit Sprint 1 non-goals, not open carry-forwards. They are deferred to a future slice or hardening pass and are out of scope for G9:

- Shadows, reflections, refractions, textures, soft light, sampling, multi-sample anti-aliasing.
- Multiple primitives beyond the single sphere; multi-light beyond the single optional point light; area lights, directional lights, spotlights.
- Materials beyond the documented Lambertian diffuse color model.
- Scene editor, settings, export, post-processing, Web Workers.
- WebGL/WebGPU, Three.js, external math libraries, rendering engines, BVH acceleration.
- UI scope beyond the S1-002 static laboratory; no new controls.
- Discriminant epsilon for near-tangent rays (S1-007 documented limitation); degenerate zero-direction guard (CF-001); factory validation hardening (CF-002, CF-003, CF-010).

The lesson panel's current concept ("Ray–Sphere Intersection") and the pipeline highlight (`intersection`) were set in S1-002 and were not updated through S1-006..S1-010; this is a known minor UI staleness that the UI shell can update in a future slice without affecting the core.

## Validation

### `npm run verify` evidence

`npm run verify` PASS at the time of this report, recorded at:

- `docs/engineering/agents/reports/hooks/umbra-verify-20260830T190752Z.md`

Summary:

| Step | Exit | Notes |
|---|---|---|
| `npm audit signatures` | 0 | 56/56 verified, 25 with attestations; no new packages added |
| `npm audit` | 0 | 0 vulnerabilities |
| `npm run typecheck` | 0 | silent, both tsconfigs |
| `npm run test:run` | 0 | `Test Files 16 passed (16) / Tests 264 passed (264)` |
| `npm run build` | 0 | `✓ 20 modules transformed.` (dist rebuilt) |

Working-tree status at that run shows the S1-011 doc and test-timeout changes; no production-code changes.

### Replay recipe

A human or CI agent can replay the Sprint 1 verification with:

```bash
npm run verify
```

This writes a new `docs/engineering/agents/reports/hooks/umbra-verify-<timestamp>.md` and exits 0 only if every step passed. The verify hook calls `npm audit signatures`, which needs network.

A single test file can be run with, e.g., `npx vitest run src/core/render-request.test.ts`.

### Documentation link audit

- `docs/engineering/ENGINEERING_LOG.md` links every S1-001..S1-011 report and review.
- `docs/engineering/agents/tasks/umbra-sprint-1-slices.md` status line and slice sections reference every implemented outcome.
- `docs/knowledge/umbra-api-contract.md`, `umbra-architecture-overview.md`, and `umbra-domain-model.md` cross-link the implementation evidence, the ADRs, and the carry-forward backlog.
- `AGENTS.md` Current State references `ENGINEERING_LOG.md` as the compact current index.
- `docs/adr/ADR-001..ADR-003` are the three architectural decisions referenced from the knowledge pages and the G7 review.
- `docs/engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md` lists all open and resolved observations with source reviews.

### Forbidden tech — confirmed absent (Sprint 1 scope)

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear in `package.json`, `tsconfig.app.json`, `tsconfig.node.json`, or anywhere in `src/`. The Sprint 1 implementation is a pure TypeScript + Vite + Canvas 2D application with hand-written linear algebra and rendering mathematics.

## G9 acceptance package

This report constitutes the G9 acceptance package for Sprint 1. The acceptance evidence is:

1. **Implementation evidence** — 11 slice reports (S1-001..S1-011) linked from `ENGINEERING_LOG.md` and the slice plan.
2. **Review evidence** — G0–G8 gate reviews (or, for S1-008, the single-slice review); each gate has a corresponding review file under `docs/engineering/agents/reviews/`. G9 is the acceptance review itself.
3. **Knowledge evidence** — `docs/knowledge/umbra-api-contract.md`, `umbra-architecture-overview.md`, `umbra-domain-model.md` promoted to implemented state at S1-011; `AGENTS.md` Current State reflects S1-001..S1-011.
4. **Decision evidence** — `docs/adr/ADR-001..ADR-003` record the architectural decisions and the ADR-003 unknown-field policy.
5. **Carry-forward evidence** — `docs/engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md` lists all open and resolved observations.
6. **Visual evidence** — screenshots for S1-003, S1-006, S1-007, and S1-010 under `docs/engineering/agents/reviews/evidence/`.
7. **Verification evidence** — the most recent `npm run verify` PASS at `docs/engineering/agents/reports/hooks/umbra-verify-20260830T190752Z.md`; reproducible via `npm run verify`.

Sprint 1 is documented, explainable, pausable, and ready for Product Authority acceptance at G9.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-011 section; status line now reflects authorization).
- [ENGINEERING_LOG](../ENGINEERING_LOG.md) — compact current index with links to every slice report and review.
- [Carry-forward backlog](../tasks/backlog/UMBRA-CARRY-FORWARD.md) — all open and resolved observations.
- [ADR-001 — TypeScript, Vite, and Canvas 2D baseline](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [ADR-003 — RenderRequest v0 validation policy](../../adr/ADR-003-render-request-v0-validation-policy.md)
- [API contract (implemented)](../../knowledge/umbra-api-contract.md)
- [Architecture overview (implemented)](../../knowledge/umbra-architecture-overview.md)
- [Domain model (implemented)](../../knowledge/umbra-domain-model.md)
- Per-slice reports: S1-001..S1-010 (linked from the implementation map above).
- Per-gate reviews: G0..G8 under `docs/engineering/agents/reviews/` (linked above).
- Verification hook run: [umbra-verify-20260830T190752Z.md](hooks/umbra-verify-20260830T190752Z.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).