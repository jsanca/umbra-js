# UMBRA-REVIEW-002 — G4 Camera Architecture Review

## Objective

Review S1-005 Camera-Ray Generation before authorizing downstream geometry/render work.

## Responsible role

- Engineering Reviewer

## Required skills

- osk-boundary-review
- osk-verification-engineering
- architecture review

## Inputs

- `docs/engineering/agents/reports/UMBRA-S1-005-camera-ray-generation.md`
- `docs/engineering/agents/reports/UMBRA-S1-004-vec3-and-ray-primitives.md`
- `docs/adr/ADR-002-sprint-1-rendering-boundaries.md`
- `docs/engineering/agents/reviews/umbra-review-gates.md`
- latest `docs/engineering/agents/reports/hooks/umbra-verify-*.md`
- `src/core/camera.ts`
- `src/core/camera.test.ts`
- `src/core/vec3.ts`
- `src/core/ray.ts`

## Scope

Review only S1-005.

Do not implement code.
Do not mark S1-006 or S1-007 authorized.
Do not modify source unless explicitly requested later.

## Review questions

1. Does `createCamera(config)` define a coherent pinhole camera model?
2. Is vertical FOV clearly defined and consistently used?
3. Is the `(u, v)` screen convention correct and documented?
4. Is the camera basis correct?
   - `forward = normalize(lookAt - position)`
   - `right = normalize(cross(forward, up))`
   - `trueUp = normalize(cross(right, forward))`
5. Does `generateRay(camera, u, v)` produce unit-direction rays?
6. Are center and corner ray contracts correct?
7. Are degenerate inputs handled explicitly?
8. Does this preserve S1-004 Vec3/Ray semantics?
9. Does `src/core/` remain free of DOM/Canvas/Vite/UI?
10. Is the `createVec3` re-export from `camera.ts` acceptable, or should it be flagged as avoidable API surface?

## Required evidence

- Re-run or verify:
  - `npm run typecheck`
  - `npm run test:run`
  - optionally `npx vitest run src/core/camera.test.ts`
- Inspect imports in `src/core/`.
- Inspect camera math directly, not only the report.

## Output

Write:

`docs/engineering/agents/reviews/UMBRA-S1-005-g4-camera-review.md`

The review must include:

- Verdict:
  - PASS
  - PASS WITH OBSERVATIONS
  - CHANGES REQUIRED
  - BLOCKED
- Findings table with severity.
- Boundary matrix.
- Evidence summary.
- Required fixes before S1-007, if any.
- Authorization recommendation for S1-006/S1-007.