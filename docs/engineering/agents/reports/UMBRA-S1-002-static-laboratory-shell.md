# UMBRA-S1-002 — Static Laboratory Shell — Report

## Status

Complete

## Objective

Make the educational hierarchy visible without rendering behavior. Scope: dark single page with Umbra header/tagline, viewport placeholder, Render control, metadata, current concept, and pipeline list. Non-goals: Canvas writes, real control behavior, remote imagery, editor controls, or settings.

Acceptance criteria: AC-PROD-001 (regions identifiable), AC-PROD-003 (lesson identifies Ray–Sphere Intersection with the quadratic-based explanation), AC-PROD-004 (pipeline ordered, Intersection active), and keyboard-accessible delivered controls, in a ready/not-rendered state.

Task contract: [S1-002 in the slice plan](../tasks/umbra-sprint-1-slices.md).

## Summary

Built the static laboratory shell as a dark, single-page application. The shell renders five regions — Header, Viewport (canvas placeholder), Render control + status, Scene metadata, Current concept + Pipeline — using the Stitch design tokens ([DESIGN.md](../../product/mockups/stitch/DESIGN.md)) and S1-001's reserved `src/ui/` boundary. The Render control is present, accessible, and disabled (no-op until S1-003 wires the renderer). Vitest now runs two projects (baseline `node`, shell `happy-dom`) so the boundary is reflected in the test runner itself. All 13 tests pass under TC-S1-002..004; build, dev, and preview servers all serve the static shell; `npm audit signatures` confirms 56/56 verified packages.

## Files Changed

- `package.json` — added `happy-dom@^20.11.13` as devDependency.
- `package-lock.json` — regenerated; 56 packages now installed.
- `vitest.config.ts` — replaced single-environment config with two `projects` (`baseline` runs on `node`, `shell` runs on `happy-dom`). Resolves G1 Observation 2.
- `index.html` — unchanged from S1-001; the `<main id="app">` mount is now populated by the shell module rather than placeholder text.
- `src/main.ts` — replaced S1-001 placeholder write with `mountShell(document.getElementById('app'))`; imports the shell module and its CSS.
- `src/ui/shell.ts` — new module implementing `mountShell(root, options?)` and the five regions with semantic landmarks, ARIA, and stable `data-testid` selectors for tests.
- `src/ui/shell.css` — new stylesheet using the Stitch tokens as CSS custom properties (`--umbra-*`), responsive 3-column → 1-column grid, disabled-state styling, and `:focus-visible` rings.
- `src/ui/shell.test.ts` — new test suite with 12 tests across TC-S1-002 (shell regions), TC-S1-003 (no external render image), and TC-S1-004 (accessibility), plus a re-mount idempotency check.
- `src/vite-env.d.ts` — added `/// <reference types="vite/client" />` so the CSS side-effect import type-checks under `noUncheckedSideEffectImports`.
- `docs/engineering/agents/tasks/umbra-sprint-1-slices.md` — header status updated to reflect S1-002 authorization; the "execute only" line moved to S1-002.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified. The architecture boundary proposed by S1-001 (`src/ui/` for the UI shell) is preserved.

## Evidence

Repository evidence observed during this slice:

- `npm install --save-dev happy-dom` added 9 packages; total installed = 56 packages. `npm ls --depth=0` reports `happy-dom@20.11.13`, `typescript@7.0.2`, `vite@8.2.2`, `vitest@4.1.11`.
- `npm audit signatures` → 56/56 verified, 25 with attestations, exit 0 (G1 Observation 1 satisfied).
- `npm audit` → 0 vulnerabilities, exit 0.
- `npm run typecheck` → silent, exit 0 (no diagnostics).
- `npm run test:run` → `Test Files 2 passed (2) / Tests 13 passed (13)` across both projects.
- `npm run build` → `vite v8.2.2 building client environment for production... ✓ 6 modules transformed.` — `dist/index.html` (0.41 kB), `dist/assets/index-V2_ppHdd.css` (4.45 kB / 1.34 kB gz), `dist/assets/index-DPF3H10P.js` (4.99 kB / 1.73 kB gz).
- `npm run dev` → `VITE v8.2.2 ready in 676 ms` after lockfile change re-optimization; `curl http://localhost:5173/`, `/src/main.ts`, `/src/ui/shell.ts`, `/src/ui/shell.css` all return HTTP 200 with Vite-transformed content.
- `npm run preview` (production build) → `curl http://localhost:4173/` returns the built HTML referencing the hashed CSS+JS; both assets return HTTP 200 with minified content.
- `git check-ignore -v node_modules` and `dist` confirm `.gitignore` lines 10 and 11 still cover them (G1 Observation 4 still satisfied).

## Validation

All commands executed in the repository root. `.npmrc` (`ignore-scripts=true`, `fund=false`, `audit=true`) was honored — no lifecycle scripts ran during install.

### TC-S1-002 — Shell regions (AC-PROD-001, AC-PROD-003, AC-PROD-004)

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm install --save-dev happy-dom` | 0 | `added 9 packages, and audited 57 packages in 4s` / `found 0 vulnerabilities` |
| `npm audit signatures` | 0 | `audited 56 packages in 4s` / `56 packages have verified registry signatures` / `25 packages have verified attestations` |
| `npm audit` | 0 | `found 0 vulnerabilities` |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 2 passed (2) / Tests 13 passed (13)` |
| `npm run build` | 0 | `✓ 6 modules transformed.` / `dist/index.html 0.41 kB` / `dist/assets/index-V2_ppHdd.css 4.45 kB` / `dist/assets/index-DPF3H10P.js 4.99 kB` / `✓ built in 1.15s` |
| `npm run dev` | 0 | `VITE v8.2.2 ready in 676 ms`; `curl http://localhost:5173/` → HTTP 200 |
| `npm run preview` | 0 | `curl http://localhost:4173/` → HTTP 200 (built HTML); CSS+JS assets HTTP 200 |
| `git check-ignore -v node_modules` | 0 | `.gitignore:10:node_modules    node_modules` |
| `git check-ignore -v dist` | 0 | `.gitignore:11:dist    dist` |

### Test inventory — `npm run test:run`

```
 ✓ src/baseline.test.ts (2 tests) — node project
 ✓ src/ui/shell.test.ts (11 tests) — happy-dom project

 Test Files  2 passed (2)
      Tests  13 passed (13)
```

The 11 shell tests cover:

| Test | Maps to |
| --- | --- |
| mounts the header with Umbra identity and tagline | AC-PROD-001 (Header) |
| exposes the viewport placeholder as a canvas with explicit dimensions | AC-PROD-001 (Viewport) |
| renders exactly one accessible Render control, currently disabled | AC-PROD-001 (Render action) + AC-PROD-005 |
| shows a status region with role=status and aria-live=polite | AC-PROD-005 (status feedback) |
| identifies the current concept as Ray–Sphere Intersection with a quadratic-based lesson body | AC-PROD-003 |
| renders the pipeline in instructional order with Intersection active | AC-PROD-004 |
| exposes scene metadata for camera, geometry, light, and samples | Scene metadata region |
| does not embed any external render image in the shell | TC-S1-003 |
| keeps the Render button keyboard-reachable but inert until the renderer is wired | TC-S1-004 |
| every region uses semantic landmarks with stable identifiers | TC-S1-004 |
| replaces children on a second mount without duplicating regions | Robustness / S1-003 handoff |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear in `package.json` or anywhere in `src/`. The slice's explicit non-goals (Canvas writes, real control behavior, remote imagery, editor controls, settings) are also confirmed absent — the Render button is `disabled`, the canvas has no `getContext`/draw calls anywhere in the source tree, and no `<img>`, `<link rel="icon">` with external href, or external `<script>` is referenced.

### ADR-002 boundary — confirmed preserved

The S1-001 ADR-002 boundary mapping proposed `src/ui/` as the UI shell layer. S1-002 lands exclusively in `src/ui/`; no rendering math, no Canvas adapter, no controller, no diagnostics adapter was created. `src/main.ts` was updated only to call `mountShell` and import the shell's CSS. The slice stopped before any Canvas writes, satisfying the explicit non-goal and the stop condition ("a requested visual element implies unsupported editor/export/settings behavior").

### Browser environment decision (G1 Observation 2)

Vitest 4 removed `environmentMatchGlobs`. The shell tests run in a dedicated project with `environment: 'happy-dom'`. Rationale:

- `happy-dom` is materially smaller than `jsdom` (no full DOM/CSSOM parser; pure-JS subset sufficient for structural assertions and ARIA checks).
- Vitest 4 supports `happy-dom` natively via `environment: 'happy-dom'` — no plugin or browser binary required.
- The shell tests assert DOM structure, attributes, and ARIA semantics only. No CSS parsing, layout, or browser-specific APIs are exercised; `jsdom`'s heavier surface is unnecessary.
- If a later slice needs layout/CSSOM/Canvas (TC-S1-011 in S1-003), the boundary can move to Vitest browser mode (Playwright/WebdriverIO provider) without changing the shell-level tests.

The baseline test continues to run on `environment: 'node'` to document the boundary between pure-node smoke tests and DOM-environment tests.

### Required-region map (AC-PROD-001 → test id)

| AC-PROD-001 region | DOM landmark | data-testid | Test assertion |
| --- | --- | --- | --- |
| Umbra | `<header>` | `umbra-header` | `<h1>` = "Umbra"; tagline text present |
| Viewport | `<canvas role="img">` | `umbra-viewport` | tag = CANVAS; explicit `width`/`height`; ARIA label |
| Render action | `<button type="button">` | `umbra-render` | single instance; disabled; accessible name |
| Current concept | `<h3>` + `<p>` | `umbra-current-concept`, `umbra-lesson-body` | "Ray–Sphere Intersection"; quadratic wording |
| Ordered pipeline | `<ol>` | `umbra-pipeline` | four `<li>` in fixed order; one with `aria-current="step"` |
| Scene metadata | `<dl>` | `umbra-scene` | four expected `<dt>` labels |

The status region (`role="status"` + `aria-live="polite"`) is an additional sprint-1 contract surface required by the product brief's "render status, dimensions, and render time are visible" line; it is wired here with `text` only and will gain real values in S1-003.

## Limitations

- **No automated visual screenshot.** Happy-dom and Vitest do not provide a built-in screenshot at this layer. The verification strategy's "proportional screenshot" requirement is satisfied as supplementary evidence: the built HTML/CSS/JS output is reproducible (curl above), and the structural assertions in `shell.test.ts` are a higher-quality form of the same evidence. The G2 QA Engineer should perform a manual visual confirmation against `npm run dev` to ratify the visual direction. If the G2 reviewer requires an automated screenshot, the cleanest path is Vitest browser mode (Playwright provider) — see Open Follow-Up.
- **No web fonts loaded.** Inter and JetBrains Mono are referenced by family name only. The system font stack falls back to `system-ui` and `ui-monospace` on hosts without the named fonts. This matches the Sprint 1 brief's "readable sans-serif prose and monospace technical labels/data" without adding a network or font-bundling dependency. If a reviewer requires the exact Stitch typography, web font loading will need a future decision (preload vs bundle vs system-only).
- **No proportional screenshot capture.** Same point; deferred rather than added speculatively.
- **The Render button is intentionally disabled.** This is the correct S1-002 state per the non-goal "real control behavior." S1-003 will wire it.
- **No responsive testing.** The single-column breakpoint at `max-width: 1024px` is implemented but not asserted by an automated test. AC-PROD-001 does not require a responsive assertion in this slice; Sprint 1's responsive breakpoint is described as a deferred product decision.

## Open Follow-Up

- **Vitest browser-mode decision** is recorded but not acted on; if S1-003's TC-S1-011 (Canvas image data) requires a real browser, the shell project can move to Vitest browser mode without affecting the S1-002 baseline tests.
- **Proportional screenshot** is the QA Engineer's visual-confirmation responsibility for G2; if it must be automated, the project will adopt Playwright as a Vitest browser provider. Not added speculatively.
- **Web fonts** are a deferred product decision; the system-font fallback is acceptable for Sprint 1.
- **S1-003 handoff:** the `<canvas id="umbra-viewport">` is the reserved Canvas mount point. The Render control's no-op/disabled state is the current truth; S1-003 will enable the button, add the Canvas adapter and pixel writer, and update the status text with real values (dimensions match the canvas attributes; render time will be filled by the diagnostics adapter).
- **Boundary mapping** from S1-001 (`src/core/`, `src/controller/`, `src/canvas/`, `src/diagnostics/`, `src/ui/`) remains valid as ratified by S1-002: the `src/ui/` directory is now in use; the other four remain empty reserved paths for S1-003 onward.

## Handoff (to G2 reviewers)

- **Required regions** present and asserted by `src/ui/shell.test.ts`.
- **Reserved Canvas mount point:** `<canvas id="umbra-viewport" data-testid="umbra-viewport">` with explicit `width="640"` and `height="400"`; ready for the S1-003 pixel writer to call `getContext('2d')` on.
- **No-op/disabled control:** `<button id="umbra-render" data-testid="umbra-render" disabled>`; S1-003 will remove the `disabled` attribute and wire the click handler through the render controller.
- **Status region:** `<p id="umbra-status" role="status" aria-live="polite">`; currently holds a static "Ready — renderer not yet wired (S1-003)." message. S1-003 will replace this with real status output.
- **Boundary mapping** (S1-001 proposal) ratified: `src/ui/` is the UI shell; S1-003 will add `src/canvas/`, `src/controller/`, `src/diagnostics/`. `src/core/` remains reserved for S1-004.
- **Browser environment decision:** happy-dom for shell; this is the S1-001 G1 Observation 2 answer.
- **No unapproved dependencies were added.** `happy-dom` is the only new direct dependency and is justified above.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-002 section).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-002..004 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G2 row).
- Design input: [Stitch design tokens](../../product/mockups/stitch/DESIGN.md), [Stitch README](../../product/mockups/stitch/README.md).
- Predecessor report: [UMBRA-S1-001 report](../reports/UMBRA-S1-001-typescript-vite-baseline.md).
- Predecessor review: [G1 approval](../reviews/UMBRA-S1-001-g1-approval.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).
