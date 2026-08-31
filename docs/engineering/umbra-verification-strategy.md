# Umbra Sprint 1 Verification Strategy

Status: Implemented evidence policy and execution record. It describes what Sprint 1 verification establishes; it does not grant G9 product acceptance.

Authority: [Product brief](../product/SPRINT-1-PRODUCT-BRIEF.md), [slice plan](agents/tasks/umbra-sprint-1-slices.md), [review gates](agents/reviews/umbra-review-gates.md), and the implemented [RenderRequest contract](../knowledge/umbra-api-contract.md).

## What was implemented and executed

Sprint 1 has three Vitest projects: `baseline` and `core` run in Node; `shell` runs in happy-dom for the UI and controller. The standard local command is `npm run verify`, which records signature audit, dependency audit, typecheck, test run, and build output under `agents/reports/hooks/`.

The latest hook referenced by the S1-011 checkpoint is [2026-08-30 19:07:52 UTC](agents/reports/hooks/umbra-verify-20260830T190752Z.md): all required commands exited zero and its test run reported 264 passing tests. That is a reproducible engineering snapshot of its recorded commit and working tree, not a timeless claim about every later checkout.

| Area | Implemented verification | Evidence and limit |
| --- | --- | --- |
| Tooling and build | `npm audit signatures`, `npm audit`, typecheck, Vitest, Vite build | Generated verification-hook reports; a passing hook proves only its recorded commands. |
| Pure rendering core | Unit tests for vectors, rays, camera, pixel buffers, gradients, sphere intersections, normals, lights, renderer, and RenderRequest conversion | Deterministic data and selected pixel/buffer assertions. |
| Contract boundary | Invalid input, deterministic equivalent requests, and Canvas-free export surface | `render-request.test.ts`, S1-009 report, and G7 review. |
| UI, controller, and Canvas adapter | Shell/controller behavior in happy-dom; adapter buffer/context checks | DOM-like tests, not a real browser Canvas implementation. |
| Visual presentation | Manual screenshots for Canvas smoke, gradient, sphere, and diffuse light | Review evidence supplements tests; it is not a pixel-level browser assertion. |

## Evidence policy in use

Tests, screenshots, and formal browser tests answer different questions and are retained separately.

| Evidence class | What it supports | What it cannot support alone |
| --- | --- | --- |
| Deterministic unit and integration tests | Mathematical behavior, buffer contents, API errors, and repeatability under the test runtime | Browser layout, actual Canvas rasterization, or human visual usability. |
| Generated verification hook | The precise audit/typecheck/test/build commands and their output at a timestamped source state | Gate approval or a claim that unrecorded environments behave identically. |
| Manual visual screenshot | A human-checkable rendering appearance at capture time | Formal pixel correctness, accessibility behavior, or cross-browser coverage. |
| Real-browser automation with pixel assertions | Browser DOM/Canvas behavior, observable completion, and selected rendered-pixel outcomes | It is not implemented for Sprint 1, so no such claim is made. |

The retained visual evidence is [S1-003 Canvas smoke](agents/reviews/evidence/UMBRA-S1-003-canvas-smoke.png), [S1-006 gradient](agents/reviews/evidence/UMBRA-S1-006-background-gradient-render.png), [S1-007 sphere](agents/reviews/evidence/UMBRA-S1-007-sphere-render.png), and [S1-010 diffuse light](agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png). Product Authority accepted the combination of deterministic tests and manual visual confirmation for Sprint 1; a browser pixel-assertion layer and a repeatable visual-capture hook remain explicit future/process decisions.

## Gate and acceptance interpretation

G1, G2, G4, G5, G6, G7, and G8 have independent review artifacts. Their observations remain part of the carry-forward record; a review pass does not erase those limitations. No G3 review artifact is present. S1-011 is an evidence and documentation checkpoint, but G9 product acceptance is pending. Do not infer G3 or G9 approval from a green hook, a test count, or a screenshot.

## Reproduction and review practice

1. Run `npm run verify` from the repository root; it produces a new timestamped hook report.
2. Read the generated report's commit, working-tree status, command exits, and test output before citing it.
3. For a user-visible rendering claim, pair deterministic test evidence with the relevant screenshot or a future real-browser test; report which form was used.
4. Keep failures and observations in their reports/backlog rather than rewriting a historical result.

## Sprint 1 limits and future work

- No Playwright or equivalent real-browser test suite exists.
- No automated browser pixel assertion or visual evidence-capture hook exists.
- The optional `npm run verify:smoke` starts the dev server and probes reachability; it is a bounded server smoke check, not browser acceptance.
- Sprint 2 work is not authorized by this strategy. Any future verification expansion requires an authorized task and must retain the distinction between test, screenshot, and browser evidence.

## References

- [S1-011 documentation checkpoint](agents/reports/UMBRA-S1-011-sprint-1-documentation-checkpoint.md)
- [Review gates](agents/reviews/umbra-review-gates.md)
- [Carry-forward backlog](agents/tasks/backlog/UMBRA-CARRY-FORWARD.md)
- [Sprint 1 architecture overview](../knowledge/umbra-architecture-overview.md)
- [Sprint 1 render pipeline](../knowledge/umbra-render-pipeline-sprint-1.md)
