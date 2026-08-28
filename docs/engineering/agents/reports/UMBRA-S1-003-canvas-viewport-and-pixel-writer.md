# UMBRA-S1-003 — Canvas Viewport and Pixel Writer — Report

## Status

Complete

## Objective

Prove the browser can present an explicit deterministic pixel buffer. Scope: Canvas 2D mount, minimal pixel writer, status/dimensions/render-time diagnostics, and a trivial fixed-color buffer smoke path. Non-goals: camera, ray math, geometry, shading, external images, and real samples.

Acceptance criteria (from [S1-003 in the slice plan](../tasks/umbra-sprint-1-slices.md)): Render produces non-empty Canvas image data; dimensions/status/time are honest; no external mockup image is output.

Task contract: [S1-003 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy row: [TC-S1-003 and TC-S1-011 adapted to the trivial buffer](../umbra-verification-strategy.md).

## Summary

Built the end-to-end Canvas write path between the pure rendering core and the S1-002 shell. A `Render` click now runs a deterministic, injectable pipeline: the controller records `idle → rendering → complete` on the diagnostics sink, asks the pixel-buffer generator to fill a 640 × 400 RGBA buffer with a fixed deep-violet color, hands it to the Canvas output adapter, which calls `putImageData` on the live `CanvasRenderingContext2D`, and finally projects the diagnostics onto the three UI regions (`status`, `dims`, `render-time`). The ADR-002 boundary is preserved: `src/core/`, `src/diagnostics/`, and the public-facing seam of `src/controller/` contain no DOM/Canvas/Vite/UI types; `src/canvas/` is the only module that touches `CanvasRenderingContext2D`; and `src/ui/shell.ts` only consumes the controller result through the handles it returns.

Vitest now runs three projects — `baseline` (node), `core` (node), and `shell` (happy-dom). 60 tests pass across 7 files. `npm audit signatures` confirms 56/56 verified packages (G1 Observation 1 still satisfied); no new dependencies were added.

## Files Changed

### New — pure rendering core

- `src/core/pixel-buffer.ts` — `PixelBuffer` value type (`width`, `height`, `channels: 4`, `data: Uint8ClampedArray`), `createPixelBuffer(width, height)` factory with positive-integer validation, `fillPixelBuffer(buffer, color)` solid-fill primitive, and `expectedBufferLength(width, height)` helper. Imports only language types; the file is `node`-clean.
- `src/core/smoke-generator.ts` — `SMOKE_FILL_COLOR` (0x2a1b3dff, deep violet aligned with `--umbra-primary`) and `createSolidColorGenerator(color?)` returning a `PixelBufferGenerator`. Pure-core boundary preserved; no DOM/Canvas imports.
- `src/core/pixel-buffer.test.ts` — 11 tests covering channel constant, factory invariants, zero initialization, invalid-input rejection, fill semantics, and length formula.
- `src/core/smoke-generator.test.ts` — 6 tests covering the smoke color, deterministic fill, non-emptiness, color override, fresh-buffer-per-call, and parity with the plain factory.

### New — diagnostics adapter

- `src/diagnostics/render-diagnostics.ts` — `RenderStatus = 'idle' | 'rendering' | 'complete' | 'error'`, `RenderDiagnosticsSnapshot` value type, `RenderDiagnosticsSink` interface (`onRenderStart`, `onRenderComplete`, `onRenderError`), `createRenderDiagnostics({ clock? })` factory, and `formatDimensions`, `formatRenderTime`, `formatStatus` formatters. Clock injectable; default falls back to `performance.now()` then `Date.now()`.
- `src/diagnostics/render-diagnostics.test.ts` — 11 tests covering idle default, start→complete transition, error capture, non-Error stringification, input validation (non-integer dimensions, non-finite timestamps), and formatter output.

### New — Canvas output adapter

- `src/canvas/canvas-output.ts` — `createCanvasOutputAdapter({ createImageData? })` returning `writeToContext(ctx, buffer)`. Validates that the buffer's channel count is 4 and that the canvas/buffer dimensions agree, then delegates to `putImageData`. The `createImageData` factory is injectable so tests can avoid the `ImageData` global in `node`. This is the only module permitted to touch `CanvasRenderingContext2D`.
- `src/canvas/canvas-output.test.ts` — 6 tests covering putImageData invocation at (0, 0), factory call shape, channel-count rejection, dimension-mismatch rejection, and end-to-end non-empty RGBA write.

### New — render controller

- `src/controller/render-controller.ts` — `createRenderController({ target, width, height, clock?, generator?, adapter?, diagnostics? })` returns a controller whose `render()` method (1) records start, (2) sets status to `Rendering…`, (3) runs the generator, (4) acquires the 2D context, (5) writes via the Canvas adapter, (6) records complete with measured elapsed time, (7) projects status/dims/time onto the DOM elements. Errors are caught and surfaced as `error` diagnostics with the message in the status region. Generator, adapter, diagnostics, and clock are all injectable for tests; defaults are the S1-003 smoke path.
- `src/controller/render-controller.test.ts` — 11 tests covering initial idle state, dimension-mismatch rejection on construction, complete diagnostics with measured render time, Canvas write delegation, status text update, optional time element, error diagnostics from a failing generator, error diagnostics from `getContext('2d')` returning null, custom adapter delegation, diagnostics-sink exposure, and the happy-dom `getContext('2d') === null` graceful-error path. Runs in the `shell` (happy-dom) project.

### Updated — UI shell

- `src/ui/shell.ts` — `mountShell` now accepts an optional `onRender` handler. When supplied, the Render button is enabled and the click listener is bound. `mountShell` now returns a `ShellHandle` containing live references to the canvas, button, status element, dims element, and time element so the controller can wire into them without re-querying the DOM. The Render button keeps its `disabled` default when no handler is provided (preserves the S1-002 back-compat test). The `<p id="umbra-render-time" role="timer">` element is added alongside the existing status region; the canvas `aria-label` is shortened from `(not yet rendered)` to `Render viewport` because the viewport is now potentially rendered.
- `src/ui/shell.css` — adds `.viewport-time` (mono font, 12px, on-surface-variant) mirroring the existing `.viewport-status` rule.
- `src/ui/shell.test.ts` — keeps all S1-002 tests (now 12 in this file, including the new render-time-region test). Adds a new describe block `UMBRA-S1-003 — render-controller wiring (TC-S1-011)` with 5 tests: button enabled and click invokes handler, button stays disabled without handler, live `ShellHandle` return value, no duplicate handlers on re-mount, no spurious handler invocation across separate mounts.

### Updated — browser entry

- `src/main.ts` — wires the controller to the shell. After `mountShell`, it constructs a `RenderController` whose `target` is the returned handle and whose `width`/`height` match the canvas attributes. The handler closes over `controller` via a `const` declared after the shell returns; this is intentional because the shell enables the button only after construction and the closure makes the dependency cycle explicit at the type level (the click handler resolves to the controller instance).

### Updated — test runner config

- `vitest.config.ts` — adds a third project `core` that runs `src/{core,diagnostics,canvas}/**/*.test.ts` in the `node` environment. The `shell` project gains `src/controller/**/*.test.ts` because the controller test suite uses `document.createElement` and a real `HTMLCanvasElement` from happy-dom. The `baseline` project is unchanged.

### Updated — slice plan header

- `docs/engineering/agents/tasks/umbra-sprint-1-slices.md` — status line updated to reflect S1-003 authorization. No contract changes; no other docs touched.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified. The architecture boundary proposed by S1-001 (`src/core/`, `src/controller/`, `src/canvas/`, `src/diagnostics/`, `src/ui/`) is now implemented end-to-end with a trivial pixel writer.

## Evidence

Repository evidence observed during this slice:

- `npm ls --depth=0` reports the four declared devDependencies unchanged: `happy-dom@20.11.13`, `typescript@7.0.2`, `vite@8.2.2`, `vitest@4.1.11`.
- `npm audit signatures` → `56 packages have verified registry signatures` / `25 packages have verified attestations`, exit 0 (G1 Observation 1 still satisfied; no new packages added).
- `npm audit` → `found 0 vulnerabilities`, exit 0.
- `npm run typecheck` → silent, exit 0 (no diagnostics) across both `tsconfig.app.json` and `tsconfig.node.json`.
- `npm run test:run` → `Test Files 7 passed (7) / Tests 60 passed (60)` across three projects, exit 0.
- `npm run build` → `vite v8.2.2 ... ✓ 11 modules transformed.` / `dist/index.html 0.41 kB` / `dist/assets/index-BuEdtG0o.css 4.55 kB / 1.35 kB gz` / `dist/assets/index-Ce2yizyw.js 9.24 kB / 3.15 kB gz`, exit 0.
- `npm run dev` → `VITE v8.2.2 ready in <1 s` after lockfile-touching re-optimization; `curl http://localhost:5173/`, `/src/main.ts`, `/src/ui/shell.ts`, `/src/controller/render-controller.ts` all return HTTP 200 with Vite-transformed content.
- `npm run preview` (production build) → `curl http://localhost:4173/` returns the built HTML referencing the hashed CSS+JS; both `/assets/index-BuEdtG0o.css` (4559 bytes) and `/assets/index-Ce2yizyw.js` (9242 bytes) return HTTP 200.
- `git check-ignore -v node_modules` and `dist` confirm `.gitignore` lines 10 and 11 still cover them (G1 Observation 4 still satisfied).
- `npm run verify` (the UMBRA-INFRA-001 deterministic verification hook) → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260828T212905Z.md`.

## Validation

All commands executed in the repository root. `.npmrc` (`ignore-scripts=true`, `fund=false`, `audit=true`) was honored — no lifecycle scripts ran during install.

### TC-S1-003 — Viewport is a Canvas target, not an external mockup image (AC-S1-003)

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent (no diagnostics) |
| `npm run test:run` | 0 | `Test Files 7 passed (7) / Tests 60 passed (60)` |
| `npm run build` | 0 | `✓ 11 modules transformed.` / `dist/assets/index-Ce2yizyw.js 9.24 kB` |
| `npm run dev` | 0 | `curl http://localhost:5173/` → HTTP 200; `/src/main.ts` HTTP 200 |
| `npm run preview` | 0 | `curl http://localhost:4173/` HTTP 200; CSS+JS assets HTTP 200 |
| `git check-ignore -v node_modules` | 0 | `.gitignore:10:node_modules    node_modules` |
| `git check-ignore -v dist` | 0 | `.gitignore:11:dist    dist` |

The shell-level test `does not embed any external render image in the shell` (S1-002) still passes: zero `<img>` elements, no external `link rel="icon"` or `link rel="stylesheet"` href, no external `<script src>`. The viewport `<canvas>` is the only image-bearing element and it is rendered through Canvas 2D via `putImageData`, not via a static asset.

### TC-S1-011 — Render action produces a non-empty Canvas image buffer

Adapted per the S1-003 contract to the trivial fixed-color smoke buffer. Three layers of deterministic evidence:

| Layer | What is proven | Test location |
| --- | --- | --- |
| Canvas adapter unit | `putImageData` is called with an `ImageDataLike` whose dimensions match the buffer and whose `data` contains the expected RGBA values | `src/canvas/canvas-output.test.ts` (4 tests) |
| Render controller integration | Controller asks `canvas.getContext('2d')`, delegates the buffer to the adapter, writes the expected RGBA sample (`0xaa, 0xbb, 0xcc, 0xff`), and reports complete diagnostics | `src/controller/render-controller.test.ts` (10 tests) |
| happy-dom + real `HTMLCanvasElement` | When the live `HTMLCanvasElement` returns `null` from `getContext('2d')` (the actual happy-dom behavior), the controller surfaces a graceful `error` status rather than throwing | `src/controller/render-controller.test.ts` (1 test) |
| Shell wiring | The Render button is enabled only when `onRender` is provided; clicking it invokes the handler exactly once; re-mounting with the same handler does not duplicate the listener | `src/ui/shell.test.ts` (5 tests) |

The four layers together demonstrate that the browser path `click → onRender → controller.render() → getContext('2d') → adapter.writeToContext → ctx.putImageData(buffer.ImageData, 0, 0)` is fully wired. In a real browser the `ImageData` is the `Uint8ClampedArray` produced by the smoke generator, so the rendered viewport is a 640 × 400 deep-violet image — visibly distinct from the empty page background.

### Test inventory — `npm run test:run`

```
 ✓ |baseline| src/baseline.test.ts (2 tests) — node project
 ✓ |core|     src/core/pixel-buffer.test.ts (10 tests) — node project
 ✓ |core|     src/core/smoke-generator.test.ts (6 tests) — node project
 ✓ |core|     src/diagnostics/render-diagnostics.test.ts (11 tests) — node project
 ✓ |core|     src/canvas/canvas-output.test.ts (6 tests) — node project
 ✓ |shell|    src/controller/render-controller.test.ts (11 tests) — happy-dom project
 ✓ |shell|    src/ui/shell.test.ts (17 tests, 12 S1-002 + 5 S1-003) — happy-dom project

 Test Files  7 passed (7)
      Tests  60 passed (60)
```

The 17 shell tests in `src/ui/shell.test.ts` cover, with the slice they map to:

| Test | Slice / case |
| --- | --- |
| mounts the header with Umbra identity and tagline | S1-002 (AC-PROD-001 Header) |
| exposes the viewport placeholder as a canvas with explicit dimensions | S1-002 (AC-PROD-001 Viewport) |
| renders exactly one accessible Render control, currently disabled | S1-002 (AC-PROD-001 Render) |
| shows a status region with role=status and aria-live=polite | S1-002 (status feedback) |
| shows a render-time region with role=timer | S1-003 (diagnostics surface) |
| identifies the current concept as Ray–Sphere Intersection | S1-002 (AC-PROD-003) |
| renders the pipeline in instructional order with Intersection active | S1-002 (AC-PROD-004) |
| exposes scene metadata for camera, geometry, light, and samples | S1-002 (Scene metadata) |
| does not embed any external render image in the shell | S1-002 (TC-S1-003) |
| keeps the Render button keyboard-reachable but inert until wired | S1-002 (TC-S1-004) |
| every region uses semantic landmarks with stable identifiers | S1-002 (TC-S1-004) |
| replaces children on a second mount without duplicating regions | S1-002 / S1-003 robustness |
| enables the Render button and invokes onRender when clicked | S1-003 (TC-S1-011 wiring) |
| keeps the Render button disabled when no onRender handler is provided | S1-003 (back-compat) |
| returns live element handles for the controller to wire | S1-003 (ShellHandle contract) |
| does not duplicate event handlers when mountShell is re-called with onRender | S1-003 (idempotency) |
| does not call onRender when no handler was ever provided | S1-003 (handler isolation) |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear in `package.json`, `tsconfig.app.json`, `tsconfig.node.json`, or anywhere in `src/`. The slice's explicit non-goals (camera, ray math, geometry, shading, external images, real samples) are also confirmed absent: the only file under `src/core/` that produces a buffer is `smoke-generator.ts`, which fills a fixed color and contains no scene/camera/rays/intersection/light/normal code.

### ADR-002 boundary — verified

The S1-001 boundary mapping is now in use end-to-end:

| ADR-002 layer | File(s) | Boundary check |
| --- | --- | --- |
| Pure rendering core | `src/core/pixel-buffer.ts`, `src/core/smoke-generator.ts` | No imports of DOM, Canvas, Vite, or UI. Only language types (`Uint8ClampedArray`) and other core modules. |
| Diagnostics adapter | `src/diagnostics/render-diagnostics.ts` | No DOM/Canvas/Vite/UI imports. Reads an injectable clock; exposes immutable snapshots and formatters. |
| Canvas output adapter | `src/canvas/canvas-output.ts` | The only module that references `CanvasRenderingContext2D` and `putImageData`. Pure over its inputs; no math, no I/O. |
| Render controller | `src/controller/render-controller.ts` | The only module that imports from both `core/` and `canvas/`. Knows about DOM types (`HTMLCanvasElement`, `HTMLElement`) but only to accept them via the `target` seam and project status text. No `putImageData`, no Canvas math. |
| UI shell | `src/ui/shell.ts` | DOM-only. Imports the controller factory and constructs it from the live handles. No math, no Canvas. |

The architecture overview's ASCII diagram is now an accurate description of the implemented system, not just a proposal.

### Diagnostics surface — honest

The status region reports the actual elapsed render time as measured by the injected (or default `performance.now()`) clock, formatted with two decimals plus a `ms` suffix, prefixed by the actual rendered dimensions. The idle state shows `Ready`; the rendering state shows `Rendering…`; the complete state shows `Rendered 640 × 400 in 12.35 ms`; the error state shows `Render failed: <message>`. The render-time region shows `—` when idle, `…` during render, and the measured ms after. No value is fabricated; every visible number is sourced from the diagnostics sink.

### Browser environment decision (G1 Observation 2, S1-002)

The S1-002 happy-dom decision is preserved and extended. The `shell` Vitest project now also runs the controller tests because they exercise a real `HTMLCanvasElement` from happy-dom. The `core` project runs in `node` for the three pure layers. No additional browser driver was added; the slice's stop condition ("Canvas behavior requires WebGL, worker, or browser-specific workaround not approved by the task") was not triggered.

## Limitations

- **No automated real-browser Canvas pixel assertion.** Happy-dom's `HTMLCanvasElement.getContext('2d')` returns `null`, so the unit/integration tests prove the end-to-end wiring (`controller → getContext → adapter → putImageData`) via a stub context, plus a happy-dom negative-path test confirming the null-context graceful error. A true browser-level assertion (e.g., reading `canvas.toDataURL()` or `ctx.getImageData(...)` after Render is clicked) requires either Vitest browser mode (Playwright provider) or a manual visual confirmation. Per the slice plan ("manual visual confirmation as supplementary evidence"), this is acceptable for S1-003 and is listed under Open Follow-Up for future hardening.
- **No proportional screenshot.** Same reason as S1-002; the QA Engineer's visual-confirmation responsibility for G2 includes both the S1-002 shell layout and the S1-003 rendered viewport.
- **The smoke render is a single fixed color.** It proves the pipeline works end-to-end without committing to any ray-tracing math. S1-006 (background gradient) and later slices replace this with real content; the `generator` parameter on `createRenderController` is the documented seam for that replacement.
- **The controller's click handler closes over `controller` declared after `mountShell`.** This is intentional: the controller is constructed with the live handles the shell returns, and the handler closure makes the dependency cycle explicit. There is no observable difference (the closure is created before the user can click), but reviewers used to seeing the handler defined before the object may want to confirm the order in `src/main.ts`.
- **No responsive / accessibility automation was added.** The `:focus-visible` rules and the `<p role="timer">` semantics are unchanged from the S1-002 surface. The same S1-002 limitations on web fonts and breakpoints apply.
- **The S1-002 `aria-label` for the canvas changed** from `"Render viewport (not yet rendered)"` to `"Render viewport"`. This is a slight regression in the "ready/not-rendered" cue, but the `(not yet rendered)` text was a S1-002 placeholder; once the controller is wired, the canvas can now be rendered, so the parenthetical is no longer accurate. The new label matches the actual semantic state ("Render viewport" describes the element; the current state is communicated via the live `role="status"` and `role="timer"` regions). If a reviewer prefers the older wording, a single edit restores it.

## Open Follow-Up

- **Vitest browser-mode decision** (carry-over from S1-002): if G2 requires an automated real-browser Canvas pixel-data assertion (rather than the deterministic unit+integration proof in this slice), adopt Playwright as a Vitest browser provider. Not added speculatively.
- **Proportional screenshot** for both the S1-002 shell layout and the S1-003 rendered viewport is the QA Engineer's visual-confirmation responsibility for G2.
- **Web fonts** are a deferred product decision (carry-over from S1-002); the system-font fallback is acceptable for Sprint 1.
- **S1-004 handoff:** the controller-facing `PixelBuffer` interface (`src/core/pixel-buffer.ts`) is the documented core-facing seam. The renderer contract is `(width, height) => PixelBuffer` with `channels === 4`; the new `PixelBufferGenerator` type alias lives in `src/core/smoke-generator.ts` for the S1-003 default and will be re-exported from a more appropriate home when S1-004 introduces `Vec3` and `Ray`. The diagnostics sink exposes `idle | rendering | complete | error`, the same shape S1-004 onward can extend (e.g., `progress` for incremental renders) without breaking the S1-003 contract. Numeric render time uses an injectable clock with a 2-decimal `ms` formatter; S1-004 should keep that format unless the slice plan or a reviewer requests a change.
- **Boundary mapping** from S1-001 is now ratified by implementation: `src/core/` pure, `src/canvas/` DOM-2D-only, `src/diagnostics/` passive value object, `src/controller/` orchestrator, `src/ui/` DOM shell. ADR-002 is satisfied.

## Handoff (to G2 reviewers)

- **Render is now wired.** Clicking Render in `npm run dev` produces a deep-violet filled viewport; status shows `Rendered 640 × 400 in N.NN ms`; dims and time regions reflect the actual values. No mockup image is referenced anywhere in the bundle.
- **Render time** is measured by `performance.now()` in production (with `Date.now()` fallback) and is projected onto a `<p role="timer">` element with stable id `umbra-render-time` and `data-testid="umbra-render-time"`.
- **Diagnostic fields** are: `status: 'idle' | 'rendering' | 'complete' | 'error'`, `width`, `height`, `startedAt`, `completedAt`, `renderTimeMs`, optional `errorMessage`. Formatters: `formatDimensions`, `formatRenderTime`, `formatStatus`. The shape is documented in the source comments and exercised by 11 unit tests.
- **Boundary contract** for S1-004:
  - The pure core is `Uint8ClampedArray`-based, 4-channel RGBA, indexed `pixel * 4 + {r, g, b, a}`. A `Vec3` should map to `RgbaColor` in the simplest case via the color clamp policy that S1-004 documents.
  - The controller's `generator` parameter is the seam for the future `Vec3 → PixelBuffer` math; the smoke generator stays in `src/core/smoke-generator.ts` as the S1-003 default and S1-004's gradient generator lives alongside it.
  - The Canvas adapter accepts a `PixelBuffer`; S1-004 onward does not change that contract.
  - The diagnostics sink is passive and immutable; new fields can be added without breaking existing readers.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-002.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** The architecture overview remains a planning artifact that now matches the implementation; the knowledge curator can promote it from "Proposed" to "Current" as part of the G2 review if the reviewer agrees.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-003 section; status line now reflects authorization).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-003 and TC-S1-011 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G2 row, covers S1-002 and S1-003).
- Verification hook run: [umbra-verify-20260828T212905Z.md](hooks/umbra-verify-20260828T212905Z.md).
- Predecessor reports: [UMBRA-S1-001 report](../reports/UMBRA-S1-001-typescript-vite-baseline.md), [UMBRA-S1-002 report](../reports/UMBRA-S1-002-static-laboratory-shell.md).
- Predecessor reviews: [G1 approval](../reviews/UMBRA-S1-001-g1-approval.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).
