# Umbra Sprint 1 Roadmap — First Light

Status: Gate G0 approved; only UMBRA-S1-001 authorized  
Authority: [Product brief](../product/SPRINT-1-PRODUCT-BRIEF.md) and [slice plan](../engineering/agents/tasks/umbra-sprint-1-slices.md)

## Outcome

A learner can use a small technical-laboratory page to render a deterministic, directly lit sphere scene with Canvas 2D and understand that Ray–Sphere Intersection is the active concept.

## Sequence

| Order | Slice | Outcome | Required gate |
| --- | --- | --- | --- |
| 0 | UMBRA-EXP-001 | Planning package | G0 |
| 1 | UMBRA-S1-001 | TypeScript/Vite baseline | G1 |
| 2 | UMBRA-S1-002 | Static Stitch-inspired shell | G2 |
| 3 | UMBRA-S1-003 | Canvas viewport and pixel writer | G2 |
| 4 | UMBRA-S1-004 | Vec3 and Ray primitives | G3 |
| 5 | UMBRA-S1-005 | Camera-ray generation | G4 |
| 6 | UMBRA-S1-006 | Background-gradient visual render | G5 |
| 7 | UMBRA-S1-007 | Sphere intersection | G6 |
| 8 | UMBRA-S1-008 | Normal-based shading | G6 |
| 9 | UMBRA-S1-009 | Declarative RenderRequest v0 | G7 |
| 10 | UMBRA-S1-010 | Point-light diffuse shading | G8 |
| 11 | UMBRA-S1-011 | Documentation, examples, checkpoint | G9 |

Each successor requires explicit authorization after the preceding gate. Completion does not authorize adjacent or future roadmap work.

## Current authorization

`UMBRA-S1-001` is the sole authorized implementation slice. Its work is limited to the TypeScript/Vite baseline and must justify every dependency, establish reproducible install/build/test commands, preserve OSK boundaries, and avoid source work beyond baseline bootstrap. `UMBRA-S1-002` through `UMBRA-S1-011` are not authorized.
