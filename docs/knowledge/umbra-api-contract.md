# Umbra RenderRequest API Contract v0

Status: Conceptual contract — not production code  
Authority: UMBRA-EXP-001 task brief; approval required at Slice 9

## Purpose

Define a declarative render input that can evolve without exposing Canvas or UI concerns to the rendering core.

## Shape

`RenderRequest v0` contains three top-level conceptual fields:

| Field | Conceptual contents | Sprint 1 rule |
| --- | --- | --- |
| `output` | `width`, `height` | Positive integer pixel dimensions. |
| `camera` | `position`, `lookAt`, `fieldOfView` | Values must yield a determinable viewing direction; invalid camera policy is documented in Slice 9. |
| `scene` | `background`, `objects`, `lights` | Supports only the declared Sprint 1 data shapes: sphere object and point light. |

`Vec3Like` is an `{x, y, z}`-shaped value; `ColorLike` is an `{r, g, b}`-shaped value. Slice 9 must choose and document color range and invalid-input behavior. A render result may expose a pixel buffer and diagnostics, but Canvas presentation is not part of this contract.

## Evolution boundary

The v0 contract is deliberately declarative and minimal. Later features such as materials, multiple primitives, shadows, export, or additional output targets require an approved additive contract decision; they must not be implied by unused fields in Sprint 1.

## Verification targets

- Equivalent valid requests render deterministically.
- Invalid dimensions, degenerate camera inputs, unsupported object types, and unsupported light types have documented outcomes.
- The contract is independent of DOM and Canvas types.
