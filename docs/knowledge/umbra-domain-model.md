# Umbra Domain Model

Status: Conceptual Sprint 1 model — not implemented  
Authority: UMBRA-EXP-001 task brief

| Concept | Meaning in Sprint 1 | Ownership / boundary |
| --- | --- | --- |
| Vec3 | Three-component value used for positions, directions, and vector arithmetic. | Pure rendering core |
| Ray | Origin plus direction; parameter `t` identifies a point along it. | Pure rendering core |
| Camera | Declarative position, look-at direction, and field of view that generate viewport rays. | Render request / orchestration |
| Sphere | Center, radius, and material/color; the only geometric primitive in Sprint 1. | Pure rendering core |
| Hit | The nearest non-negative sphere intersection and its normal, or a miss. | Pure rendering core |
| Point light | Position and intensity/color used for direct diffuse lighting. | Scene configuration / core |
| Scene | Background, one-or-more declarative objects, and lights; Sprint 1 uses one fixed sphere and one point light. | Request input / orchestration |
| Pixel buffer | Deterministic color result produced by the core before Canvas presentation. | Render orchestration |
| Canvas output | Browser presentation of a completed pixel buffer. | Canvas output adapter |
| Render diagnostics | Status, dimensions, elapsed render time, and result metadata. | Diagnostics adapter |

## Invariants to verify

- A direction used for normal or lighting calculations follows the documented normalization policy.
- A ray/sphere miss yields no hit; a hit selected for visible rendering is the nearest non-negative distance.
- The same `RenderRequest v0` and output dimensions yield the same pixel buffer.
- Core concepts do not depend on DOM, Canvas, Vite, or UI types.

This page defines intended conceptual vocabulary; actual behavior becomes current implementation knowledge only after execution evidence is recorded.
