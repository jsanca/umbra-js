# UMBRA-S1-006 — G5 Background-Gradient / First Visual Review

Status: Approved (with observations)
Date: 2026-08-29
Verdict: PASS WITH OBSERVATIONS
Decision owners: QA Engineer (`osk-verification-engineering`), Engineering Reviewer (`osk-boundary-review`)
Review task: `UMBRA-REVIEW-003` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-003-g5-background-gradient-review.md`)
Scope: S1-006 (background-gradient render) only. Sphere intersection, normals, and lighting are out of scope for this review.

## Decision

S1-006 satisfies its slice scope and the G5 pass criteria. The gradient maps the vertical component of a camera ray's unit direction to an opaque RGBA color by linear interpolation between a documented `bottom` and `top` color; top, bottom, and horizon colors are documented and asserted exactly; the pixel-center convention is consistent with S1-005 camera semantics; the generator produces deterministic, integer-exact `PixelBuffer` output; the controller remains generator-agnostic; and `main.ts` wires the sample camera and gradient generator cleanly. ADR-002 is preserved: `background-gradient.ts` imports only pure-core siblings, and no DOM/Canvas/Vite/UI symbol appears anywhere in `src/core/`.

The slice did not drift into sphere/intersection/lighting/materials/anti-aliasing, and the evidence is deterministic (exact 8-bit channel equality), not subjective-only. Two non-blocking observations are recorded (G5-1, G5-2).

## Authorization note (verified)

The report records that S1-006 was authorized by **human Product Authority instruction (2026-08-29)**, not by a passed gate, and that G4/G5 remained unpassed at the time of writing. The report does not claim G4 or G5 passed. This review now passes G5; it does not, by itself, authorize S1-007.

## Focus answers (review questions 1–10)

1. **Gradient maps ray direction to color** — Yes. `backgroundColorForDirection` computes `t = clamp01(0.5 * (direction.y + 1))` and lerps `bottom → top` per channel. Verified: up (`y=+1`) → top, down (`y=−1`) → bottom, horizon (`y=0`) → midpoint, and only `direction.y` is read.
2. **Top/bottom/horizon documented and tested** — Yes. `DEFAULT_BACKGROUND_GRADIENT` documents `top = (0x66,0x4d,0xb3)`, `bottom = (0x0c,0x07,0x1f)`; horizon midpoint `(0x39,0x2a,0x69)` is asserted exactly.
3. **Pixel-center convention** — Matches S1-005. Pixel `(x, y)` → `u = (x+0.5)/width`, `v = (y+0.5)/height`, the same `(u, v)` screen convention the camera documents.
4. **Deterministic output** — Yes. Exact integer rounding + clamping; fresh buffer per call; cross-instance equality asserted.
5. **Controller generator-agnostic** — Yes. `createRenderController` takes `generator` via options; the controller was not modified for S1-006 beyond its unchanged seam.
6. **`main.ts` wiring** — Clean. Composition root builds the documented sample camera and injects `createBackgroundGradientGenerator(camera)` as the controller's generator.
7. **Screenshot** — See "Visual evidence assessment" below.
8. **Scope containment** — Confirmed. No sphere/intersection/lighting/material module exists or is imported.
9. **Core boundary** — Clean. `background-gradient.ts` imports `pixel-buffer.js`, `camera.js`, `vec3.js`, and a type-only import from `smoke-generator.js`.
10. **`PixelBufferGenerator` type placement** — Acceptable for now, but a cohesion concern (finding G5-1); should move to a neutral module later.

## Visual evidence assessment

`docs/engineering/agents/reviews/evidence/UMBRA-S1-006-background-gradient-render.png` exists — a valid PNG, `3340 × 1712` (full-page capture, not just the `640 × 400` viewport).

Honest limitation: this reviewer's environment cannot decode image pixels, so a literal pixel-by-pixel visual confirmation of the PNG was not performed. The visual correctness is instead established by deterministic, exact evidence, which the G5 gate accepts as primary (the gate requires "deterministic visual output; no subjective-only proof"):

- `src/core/background-gradient.test.ts` (16 tests) asserts the exact canonical colors, the `y`-only dependence, and a per-pixel sweep that re-derives every pixel from `generateRay` + `backgroundColorForDirection`.
- `src/controller/render-controller.test.ts` ("background-gradient integration", 2 tests) re-derives every written `ImageData` channel against the same contract and asserts the top row is lighter than the bottom row — a vertical violet gradient, not a flat fill.
- The gradient colors are exact 8-bit integers (top `(102,77,179)` violet; bottom `(12,7,31)` near-black violet), so no floating-point color tolerance is involved.

The screenshot therefore serves as the human-visible supplementary record; the pixel assertions carry the proof. A human reviewer with image access should still glance at it to confirm it visually reads as "bright violet at top → near-black violet at bottom."

## Boundary compliance

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/background-gradient.ts` | `./pixel-buffer.js`, `./camera.js`, `./vec3.js`, `./smoke-generator.js` (type-only) | internal core | Compliant |
| `src/core/background-gradient.test.ts` | `./background-gradient.js`, `./camera.js`, `./vec3.js`, `./pixel-buffer.js`, `vitest` | test-only | Compliant |
| `src/controller/render-controller.ts` | `../core/*`, `../canvas/*`, `../diagnostics/*` | allowed (sole dual-dependency module) | Compliant: unchanged |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, `./core/*`, CSS | composition root | Compliant |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports |

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| G5-1 | NOTE | Cohesion / type placement | The shared `PixelBufferGenerator` contract type lives in `smoke-generator.ts`, a module named for one specific solid-color generator, yet it is the generator interface consumed by `background-gradient.ts` and `render-controller.ts`. Not a boundary violation (all core), but the generic contract is misplaced relative to the specific smoke generator. Move it to a neutral core module (e.g. `pixel-buffer.ts` or a dedicated `generator.ts`) in a later slice. | `src/core/smoke-generator.ts:16`, `src/core/background-gradient.ts:38`, `src/controller/render-controller.ts:18` |
| G5-2 | NOTE | Report accuracy | The S1-006 report's "Limitations" states "No screenshot in this environment"; the G5 screenshot now exists. The report anticipated this ("A human may capture … for the G5 visual record"), but the limitation sentence is now stale and should be reconciled when the knowledge curator runs. | S1-006 report "Limitations" vs `reviews/evidence/UMBRA-S1-006-background-gradient-render.png` |
| G5-3 | — (pass) | Math correctness | Direction→color mapping, canonical colors, and exact integer blending independently re-derived and confirmed: `t = clamp01(0.5*(y+1))`, midpoint `(0x39,0x2a,0x69)` is exact integer arithmetic. | `src/core/background-gradient.ts:55-96`, `src/core/background-gradient.test.ts:51-97` |
| G5-4 | — (pass) | Determinism | Pixel-center convention matches S1-005; fresh buffer per call; cross-instance equality; controller integration re-derives every `ImageData` channel exactly. | `src/core/background-gradient.ts:68-84`, `src/core/background-gradient.test.ts:100-156`, `src/controller/render-controller.test.ts:298-347` |
| G5-5 | — (pass) | Boundary / scope | Core stays DOM/Canvas/Vite/UI-free; controller unchanged; `main.ts` composition root wires camera + gradient; no sphere/intersection/lighting/material/anti-aliasing drift. | `src/core/background-gradient.ts` imports; `src/main.ts`; `src/controller/render-controller.ts` |

## Evidence summary (reviewer-reproduced, 2026-08-29)

- `npm run typecheck` → silent, exit 0 (both tsconfigs).
- `npm run test:run` → `Test Files 11 passed (11) / Tests 155 passed (155)`.
- `npx vitest run src/core/background-gradient.test.ts` → `Test Files 1 passed (1) / Tests 16 passed (16)`.
- `npm run verify` → PASS (audit-signatures 56/56, audit 0 vulns, typecheck, 155 tests, build `✓ 15 modules transformed`), recorded at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T171211Z.md` (commit `98af674`).
- Import inspection confirms the boundary matrix above; no DOM/Canvas/Vite/UI symbols in `src/core/`.
- Screenshot present: `UMBRA-S1-006-background-gradient-render.png` (`3340 × 1712`).

## Required fixes before S1-007

None. No BLOCKER or MAJOR findings.

Recommended follow-ups (non-blocking): (1) move the `PixelBufferGenerator` type to a neutral core module (G5-1); (2) reconcile the report's "no screenshot" limitation sentence with the now-existing screenshot (G5-2).

## Authorization recommendation

**G5 passes.** S1-006 background-gradient render is approved as the first deterministic visual render. This does **not** authorize S1-007: per the review task, S1-007 requires an explicit Product Authority decision after this review (and remains subject to the G6 review gate). The recommendation is that S1-007 proceed only upon that explicit decision.

## References

- [S1-006 implementation report](../reports/UMBRA-S1-006-background-gradient-render.md)
- [S1-005 implementation report](../reports/UMBRA-S1-005-camera-ray-generation.md)
- [Verification hook run (PASS)](../reports/hooks/umbra-verify-20260829T171211Z.md)
- [Review gates](umbra-review-gates.md) (G5 row)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Verification strategy](../umbra-verification-strategy.md) (TC-S1-008, TC-S1-009, TC-S1-011)
- [Review task](../tasks/review/UMBRA-REVIEW-003-g5-background-gradient-review.md)
- Screenshot: `evidence/UMBRA-S1-006-background-gradient-render.png`
- Reviewed sources: `src/core/background-gradient.ts`, `src/core/background-gradient.test.ts`, `src/controller/render-controller.ts`, `src/controller/render-controller.test.ts`, `src/main.ts`
