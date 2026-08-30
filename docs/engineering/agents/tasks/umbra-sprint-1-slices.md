# Umbra Sprint 1 — Authorized Slice Plan

Status: S1-001..S1-011 done (S1-002/S1-003 G2 approved with observations; S1-004 awaits G3 sign-off; S1-005 awaits G4 review). G4, G5, G6, G7, and G8 passed `PASS WITH OBSERVATIONS` between 2026-08-29 and 2026-08-30. S1-005, S1-006, S1-007, S1-008, S1-009, S1-010, and S1-011 were authorized by human Product Authority instruction on 2026-08-28, 2026-08-29, and 2026-08-30, not solely by passed gates. G9 remains unpassed (the G9 acceptance review is the final acceptance gate for Sprint 1)  
Executor: Minimax / Software Engineer, only after named gate approval

## Responsibility model

Unless a slice states otherwise:

- Responsible execution role: `software-engineer`
- Execution model / alter ego: Minimax
- Product authority: Human Product Authority
- Technical authority: Technical Stakeholders
- Review roles: as declared in each slice under `Required review`
- Knowledge update owner: `knowledge-curator`, only for proven facts after evidence exists

Exceptions:

- `S1-001` requires Platform Engineer review because it establishes reproducible project tooling.
- `S1-011` is primarily a Knowledge Curator documentation/checkpoint slice, with Software Engineer support only when replaying commands or linking implementation evidence.

## Common execution rules

Every slice creates an evidence-backed report in `docs/engineering/agents/reports/`, updates current knowledge only for proven facts, and stops if it encounters unapproved scope, missing prerequisites, or an unresolved gate. Expected paths are planned targets, not existing files. The actual baseline structure is chosen in Slice 1 and reviewed for ADR-002 compliance. At present, S1-011 is the most recently authorized slice (human Product Authority instruction; with G4/G5/G6/G7/G8 `PASS WITH OBSERVATIONS`); G9 acceptance review is pending.

## S1-001 — TypeScript + Vite baseline

- **Goal:** establish a reproducible minimal browser baseline.
- **Scope:** manifest, TypeScript/Vite configuration, entry page, development/build/test commands, and a justified minimal test setup.
- **Non-goals:** UI shell, Canvas output, renderer, and optional dependencies.
- **Expected files:** `package.json`, lockfile, TypeScript/Vite config, browser entry files, and test configuration selected by the executor.
- **Acceptance criteria:** clean install, development, build, and test commands are documented and observed; every dependency is justified; OSK boundaries are preserved; no source work beyond baseline bootstrap is performed.
- **Verification method:** TC-S1-001; retain command output and exit statuses.
- **Required review:** Platform Engineer / `osk-agent-harness-guide`; Engineering Reviewer / `osk-architecture-review`.
- **Handoff:** report exact commands, package rationale, and proposed boundary mapping for authorization of S1-002.
- **Stop condition:** baseline command fails twice without new diagnostic evidence, or an unapproved dependency is needed.

## S1-002 — Static laboratory shell

- **Goal:** make the educational hierarchy visible without rendering behavior.
- **Scope:** dark single page with Umbra header/tagline, viewport placeholder, Render control, metadata, current concept, and pipeline list.
- **Non-goals:** Canvas writes, real control behavior, remote imagery, editor controls, or settings.
- **Expected files:** application entry/UI/style files established by S1-001; focused shell test files.
- **Acceptance criteria:** AC-PROD-001, AC-PROD-003, AC-PROD-004, and keyboard-accessible delivered controls are met in a ready/not-rendered state.
- **Verification method:** TC-S1-002–004 with a required-region assertion and proportional screenshot.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review`.
- **Handoff:** identify the reserved Canvas mount point and no-op/disabled controls for S1-003.
- **Stop condition:** a requested visual element implies unsupported editor/export/settings behavior.

## S1-003 — Canvas viewport and pixel writer

- **Goal:** prove the browser can present an explicit deterministic pixel buffer.
- **Scope:** Canvas 2D mount, minimal pixel writer, status/dimensions/render-time diagnostics, and a trivial fixed-color/buffer smoke path.
- **Non-goals:** camera, ray math, geometry, shading, external images, and real samples.
- **Expected files:** Canvas adapter/controller files and focused browser/unit tests.
- **Acceptance criteria:** Render produces non-empty Canvas image data; dimensions/status/time are honest; no external mockup image is output.
- **Verification method:** TC-S1-003 and TC-S1-011 (adapted to the trivial buffer); manual visual confirmation as supplementary evidence.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review`.
- **Handoff:** document the core-facing pixel-buffer interface and diagnostics fields for S1-004.
- **Stop condition:** Canvas behavior requires WebGL, worker, or browser-specific workaround not approved by the task.

## S1-004 — Vec3 and Ray primitives

- **Goal:** create the independently testable mathematical vocabulary.
- **Scope:** Vec3 operations, Ray value, normalization/zero policy, and pure unit tests.
- **Non-goals:** camera, Canvas, sphere, lighting, and UI changes.
- **Expected files:** pure-core modules and unit tests only.
- **Acceptance criteria:** documented arithmetic and ray-point cases pass; zero/normalization behavior is explicit; no browser import enters the core.
- **Verification method:** TC-S1-005 and core dependency inspection.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review`.
- **Handoff:** record exact vector/ray semantics and numeric tolerance for S1-005.
- **Stop condition:** a mathematical rule is ambiguous or requires an undocumented API decision.

## S1-005 — Camera-ray generation

- **Goal:** generate deterministic rays for documented viewport coordinates.
- **Scope:** camera configuration, field of view, look-at semantics, and core tests for center/corner rays.
- **Non-goals:** rendering loop, geometry, Canvas, and UI camera controls.
- **Expected files:** pure camera/core modules and unit tests.
- **Acceptance criteria:** center and selected corner rays match documented expected directions within tolerance; degenerate camera behavior is defined.
- **Verification method:** TC-S1-005 plus camera-specific deterministic cases recorded in the report.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-architecture-review`.
- **Handoff:** publish camera semantics and sample coordinates for S1-006.
- **Stop condition:** field-of-view or look-at behavior cannot be specified unambiguously.

## S1-006 — Background-gradient render

- **Goal:** create the first visually meaningful render without geometry.
- **Scope:** controller/core loop that maps camera rays to a deterministic background gradient and returns a pixel buffer to Canvas.
- **Non-goals:** sphere hit testing, normals, point lighting, materials, and anti-aliasing.
- **Expected files:** renderer/controller additions, Canvas wiring, focused pixel and browser smoke tests.
- **Acceptance criteria:** selected output pixels prove the gradient; Render visibly updates Canvas deterministically.
- **Verification method:** TC-S1-008, TC-S1-009, and TC-S1-011 with documented RGBA tolerance.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review`.
- **Handoff:** supply a stable first-render screenshot and pixel coordinates for S1-007.
- **Stop condition:** visual acceptance is the only available proof when a deterministic pixel assertion can be written.

## S1-007 — Sphere intersection

- **Goal:** add the ray–sphere quadratic and visible hit/miss selection.
- **Scope:** sphere data, intersection calculation, nearest non-negative hit, and unit tests for two-hit/tangent/miss/inside cases.
- **Non-goals:** normals, lighting, shadows, other primitives, BVH, or UI editors.
- **Expected files:** pure sphere/intersection modules and tests.
- **Acceptance criteria:** all documented intersection cases meet tolerance; background remains visible on misses.
- **Verification method:** TC-S1-006 and a focused render hit/miss assertion.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-adversarial-analysis`.
- **Handoff:** record root-selection rule and edge-case evidence for S1-008.
- **Stop condition:** the nearest-hit or tangent policy is undefined.

## S1-008 — Normal-based shading

- **Goal:** turn a sphere hit into a normal-derived visible color.
- **Scope:** sphere normal calculation, normal visualization or simple normal-based color, and tests.
- **Non-goals:** point light, shadows, reflectance model beyond the agreed normal visualization.
- **Expected files:** pure normal/shading modules, renderer integration, and unit/pixel tests.
- **Acceptance criteria:** cardinal/non-cardinal normals and selected pixels match documented values.
- **Verification method:** TC-S1-007–009.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review`.
- **Handoff:** document color range and result shape decisions for S1-009.
- **Stop condition:** shading design requires a material system outside Sprint 1.

## S1-009 — Declarative RenderRequest API v0

- **Goal:** expose the implemented fixed scene through the approved conceptual request boundary.
- **Scope:** `output`, `camera`, and `scene` request data; minimal supported sphere/light shapes; validation policy; request-to-core conversion.
- **Non-goals:** generic plugin scenes, arbitrary primitives, Canvas types in the contract, or compatibility promises beyond v0.
- **Expected files:** request contract/validation/controller modules, tests, and update to the API knowledge page.
- **Acceptance criteria:** valid equivalent requests are deterministic; invalid dimensions/camera/unsupported types follow documented outcomes; core remains DOM/Canvas-free.
- **Verification method:** API contract tests plus TC-S1-009–010.
- **Required review:** Engineering Reviewer / `osk-architecture-review` and `osk-boundary-review`; QA Engineer / `osk-verification-engineering`.
- **Handoff:** update the API contract with actual evidence and request approval for S1-010.
- **Stop condition:** contract expansion would add unimplemented material, mesh, export, or adapter-plugin behavior.

## S1-010 — Point light and diffuse shading

- **Goal:** complete the first-light outcome with one point light and direct diffuse shading.
- **Scope:** point-light data, deterministic diffuse calculation, fixed-scene configuration, Canvas presentation, and diagnostics.
- **Non-goals:** shadows, reflections, refractions, textures, soft light, sampling, or multiple material models.
- **Expected files:** pure lighting/core modules, fixed-scene data, renderer/controller changes, and tests.
- **Acceptance criteria:** documented lit and unlit/background pixels meet tolerance; the fixed scene renders from `RenderRequest v0`; product metadata remains honest.
- **Verification method:** focused unit/pixel tests, TC-S1-011–013, and manual visual check.
- **Required review:** QA Engineer / `osk-verification-engineering`; Engineering Reviewer / `osk-adversarial-analysis` and `osk-architecture-review`.
- **Handoff:** retain reproducible render evidence for Sprint 1 documentation and acceptance.
- **Stop condition:** a request for shadows, materials, multi-sampling, or performance optimization appears.

## S1-011 — Sprint documentation, examples, and checkpoint

- **Goal:** leave Sprint 1 explainable, pausable, and ready for acceptance.
- **Scope:** update current knowledge with proven behavior, beginner-facing examples/explanations, reports, final checkpoint, and navigation.
- **Non-goals:** new rendering features, UI scope, dependency changes, or Sprint 2 planning.
- **Expected files:** documentation, engineering reports/reviews/checkpoint, and evidence references only.
- **Acceptance criteria:** documented commands reproduce the verified scope; known limitations/deferred concepts are explicit; engineering log links artifacts.
- **Verification method:** link/index audit and replay of documented validation commands where available.
- **Required review:** Knowledge Curator / `osk-knowledge-curator`; Engineering Reviewer / `osk-code-docs`; QA Engineer / `osk-verification-engineering`.
- **Handoff:** submit G9 acceptance package to Product Authority with all evidence links.
- **Stop condition:** any claimed current behavior lacks implementation evidence or an open checkpoint remains.
