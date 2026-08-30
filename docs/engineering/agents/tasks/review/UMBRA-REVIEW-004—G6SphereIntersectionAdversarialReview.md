# UMBRA-REVIEW-004 — G6 Sphere Intersection Adversarial Review

## Objective

Review S1-007 Sphere Intersection before authorizing S1-008.

This is an adversarial review of the ray–sphere intersection math, hit/miss rendering behavior, and ADR-002 boundary preservation.

## Responsible roles

- Engineering Reviewer
- QA Engineer

## Required skills

- osk-adversarial-analysis
- osk-verification-engineering
- osk-boundary-review

## Inputs

- `docs/engineering/agents/reports/UMBRA-S1-007-sphere-intersection.md`
- `docs/engineering/agents/reports/UMBRA-S1-006-background-gradient-render.md`
- `docs/engineering/agents/reviews/UMBRA-S1-005-g4-camera-review.md`
- `docs/engineering/agents/reviews/UMBRA-S1-006-g5-background-gradient-review.md`
- `docs/engineering/agents/reports/hooks/umbra-verify-20260829T183605Z.md`
- `docs/engineering/agents/reviews/evidence/UMBRA-S1-007-sphere-render.png`
- `docs/adr/ADR-002-sprint-1-rendering-boundaries.md`
- `docs/engineering/agents/reviews/umbra-review-gates.md`
- `src/core/sphere.ts`
- `src/core/sphere.test.ts`
- `src/core/sphere-renderer.ts`
- `src/core/sphere-renderer.test.ts`
- `src/core/background-gradient.ts`
- `src/core/camera.ts`
- `src/core/ray.ts`
- `src/core/vec3.ts`
- `src/controller/render-controller.test.ts`
- `src/main.ts`

## Scope

Review only S1-007.

Do not implement code.
Do not modify source.
Do not authorize S1-008.
Do not mark G6 or G7 as passed unless the review verdict explicitly supports it.
Do not review normals, lighting, materials, shadows, RenderRequest v0, or UI controls except to confirm they were not introduced.

## Context

S1-007 was authorized by Product Authority after:

- G4 Camera Architecture Review: PASS WITH OBSERVATIONS.
- G5 Background-Gradient / First Visual Review: PASS WITH OBSERVATIONS.
- S1-006 visual evidence was captured.

S1-007 added:

- `src/core/sphere.ts`
- `src/core/sphere-renderer.ts`
- fixed sphere wiring in `src/main.ts`
- pure unit tests and render integration tests
- manual screenshot evidence showing an amber sphere over the violet background gradient.

## Review questions

### A. Intersection math

1. Is the ray–sphere quadratic correct?

   ```text
   a = dot(direction, direction)
   b = 2 * dot(direction, origin - center)
   c = dot(origin - center, origin - center) - radius²
   D = b² - 4ac