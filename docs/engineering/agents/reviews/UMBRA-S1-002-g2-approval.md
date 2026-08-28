# UMBRA-S1-002 / UMBRA-S1-003 — G2 Boundary Review & Approval

Status: Approved (with observations)
Date: 2026-08-28
Verdict: PASS WITH OBSERVATIONS
Decision owner: Engineering Reviewer (`osk-boundary-review`, with `osk-verification-engineering` as supporting evidence)
Review task: `UMBRA-REVIEW-001` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-001-review.md`)
Scope: S1-002 (static shell) and S1-003 (Canvas viewport + pixel writer) only. S1-004+ is out of scope for this review.

## Decision

S1-002 and S1-003 satisfy their slice scope. The ADR-002 boundaries are intact end-to-end: the pure core contains no DOM/Canvas/Vite/UI imports, `putImageData`/`CanvasRenderingContext2D` is isolated to `src/canvas/`, and the render controller is the single module depending on both core and Canvas. The implementation did not drift into S1-004 math. Reproducible evidence is strong at the unit/integration level (60/60 tests, clean typecheck, PASS verify hook at commit `8f800d2`).

The one material gap is inherited from S1-002 and repeated in S1-003: there is no automated real-browser Canvas pixel assertion. This gap was resolved by an explicit product decision on 2026-08-28 (see "Product decision" below), not by a code change.

## Product decision (2026-08-28)

Product/technical authority resolved the S1-003 evidence approach:

- **Accepted** for Sprint 1: unit/integration tests + manual visual screenshot are sufficient evidence for S1-003's "Canvas writes actual pixels" criterion.
- **Deferred**: Playwright/Vitest browser mode is deferred until a later slice requires automated real-browser pixel assertions.

This closes review conditions 1 and 2 (manual visual confirmation + recorded browser-mode decision). S1-003's unit/integration proof stands as the accepted Sprint 1 evidence bar; no automated real-browser pixel assertion is required before S1-004.

## Focus answers

1. **S1-002 static shell scope** — Satisfied. Five regions (Header, Viewport canvas placeholder, Render control, Scene metadata, Current concept + Pipeline) present, Render control disabled, no Canvas writes, no external `<img>`/icon/stylesheet/script. Real `<button>` is keyboard-reachable. AC-PROD-001/003/004 met.
2. **S1-003 Canvas pixel-writer scope** — Satisfied. Canvas 2D mount, minimal pixel writer (`fillPixelBuffer`), honest status/dims/render-time diagnostics, trivial fixed-color smoke buffer. No external mockup image.
3. **Canvas output isolated to the adapter** — Yes, with one observation (see finding R2): `putImageData` lives only in `src/canvas/canvas-output.ts`, but the controller acquires the 2D context via `canvas.getContext('2d')`.
4. **Core free of DOM/Canvas/UI/Vite** — Confirmed by inspection: `src/core/pixel-buffer.ts` and `src/core/smoke-generator.ts` import only internal core modules and language types.
5. **Controller responsibility** — Acceptable for Sprint 1: DOM types (`HTMLCanvasElement`, `HTMLElement`) appear only in the `target` seam; no `putImageData`, no Canvas math.
6. **Drift into S1-004+** — None. `Ray`, `Intersection`, `Lighting`, `Camera` occur only as UI content strings in `src/ui/shell.ts` (pipeline labels, scene metadata, concept text) — S1-002 scope.
7. **Evidence sufficient to authorize S1-004** — Yes, conditionally (see Authorization below).

## Boundary compliance

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: no DOM/Canvas/Vite/UI imports (`pixel-buffer.ts`, `smoke-generator.ts`) |
| `src/diagnostics/*` | none (language types only) | — | Compliant: no imports; injectable clock |
| `src/canvas/*` | `../core/pixel-buffer.js` (public `PixelBuffer`) | allowed | Compliant: adapter consumes core result; only module touching Canvas 2D |
| `src/controller/*` | `../core/*`, `../canvas/*`, `../diagnostics/*` | allowed (sole dual-dependency module) | Compliant: orchestration only |
| `src/ui/shell.ts` | none (self-contained DOM) | — | Compliant: receives `onRender` callback, no core/controller import |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, CSS | composition root | Compliant: wires shell + controller |

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| R1 | — (pass) | Boundary | Pure core is clean of DOM/Canvas/Vite/UI; `Uint8ClampedArray` is the only platform type. | `src/core/pixel-buffer.ts`, `src/core/smoke-generator.ts` |
| R2 | MINOR | Layer Leakage (borderline) | The controller calls `canvas.getContext('2d')` to acquire the context before delegating the write. This is a Canvas 2D API call outside the adapter, stretching a strict reading of "the Canvas adapter is the only module that may touch Canvas 2D". Defensible — the adapter still owns presentation (`putImageData`) — but the strictest isolation would pass the canvas element or a `getContext` factory into the adapter. | `src/controller/render-controller.ts:78`; contrast `src/canvas/canvas-output.ts:37` |
| R3 | NOTE | Layer Leakage (borderline) | `performance.now()` is referenced as a guarded global (`typeof performance !== 'undefined'`) in both the diagnostics adapter and the controller, not imported. `performance` is a Web-platform/Node global, and the clock is injectable, so this is not a DOM-import violation. | `src/diagnostics/render-diagnostics.ts:123-124`, `src/controller/render-controller.ts:156-157` |
| R4 | — (pass) | Boundary | No S1-004+ drift. No `Vec3`/`Ray`/camera/sphere/lighting math exists; matching strings are UI copy. | `src/ui/shell.ts:29-35, 115-119, 211-219` |
| R5 | RESOLVED (was MAJOR) | Evidence gap | No automated real-browser Canvas pixel assertion. `putImageData` correctness was proven via stub-context unit/integration tests only (happy-dom's `getContext('2d')` returns `null`). Resolved by the 2026-08-28 product decision accepting unit/integration + manual visual screenshot as sufficient for Sprint 1 and deferring Playwright/Vitest browser mode. | `src/canvas/canvas-output.test.ts`, `src/controller/render-controller.test.ts:298-305`, S1-003 report "Limitations" |
| R6 | NOTE | Report accuracy | The S1-003 report's boundary table states the UI shell "imports the controller factory and constructs it from the live handles." In fact `src/ui/shell.ts` has no imports and receives an `onRender` callback; `src/main.ts` performs the wiring. The implementation is more decoupled than the report describes. | S1-003 report "ADR-002 boundary — verified" table vs `src/ui/shell.ts`, `src/main.ts` |
| R7 | NOTE | Dead surface | `assertContextMatchesBuffer` in `src/canvas/canvas-output.ts` is exported and tested but unused by the controller, which relies on `assertCanvasSize` plus the adapter's internal dimension check. Redundant, not a defect. | `src/canvas/canvas-output.ts:42-47`, `src/controller/render-controller.ts:147-153` |

## Required fixes before S1-004

None. Both G2 conditions are now closed by the 2026-08-28 product decision:

1. ~~QA (`osk-verification-engineering`) must complete the manual visual confirmation (proportional screenshot of the S1-002 layout and the S1-003 rendered viewport)~~ → accepted as part of S1-003 evidence; the screenshot is still to be captured, but the evidence bar is now unit/integration + manual visual screenshot.
2. ~~Record the Vitest browser-mode decision~~ → deferred to a later slice that requires automated real-browser pixel assertions.

## Observations / debt allowed to continue

- R2 (controller `getContext`) — acceptable; optionally fold context acquisition into the adapter in a later slice if a stricter boundary is desired.
- R3 (`performance` global) — acceptable; injectable clock already provides the seam.
- R5 (no automated browser pixel assertion) — **accepted by product decision** for Sprint 1; Playwright/Vitest browser mode is deferred until a later slice needs it.
- R6, R7 — report/wording and redundancy notes; correct opportunistically, no gate impact.

## Authorization recommendation

**Authorize S1-004 (Vec3 and Ray primitives).** The G2 boundary objectives are met: the core is proven pure and independently testable (the exact precondition S1-004 needs), Canvas presentation is isolated to the adapter, and the controller boundary is sound. The evidence approach is now settled by the product decision above; nothing blocks S1-004's pure-math scope.

## References

- [S1-002 report](../reports/UMBRA-S1-002-static-laboratory-shell.md)
- [S1-003 report](../reports/UMBRA-S1-003-canvas-viewport-and-pixel-writer.md)
- [Review gates](umbra-review-gates.md) (G2 row)
- [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Architecture overview](../../knowledge/umbra-architecture-overview.md)
- [Verification strategy](../umbra-verification-strategy.md) (TC-S1-002..004, TC-S1-003, TC-S1-011)
- [Latest verify hook run](../reports/hooks/umbra-verify-20260828T213108Z.md) (PASS, commit `8f800d2`)
- Reviewer-reproduced evidence (2026-08-28): `npm run test:run` → 7 files / 60 tests passed; `npm run typecheck` → silent, exit 0.
