# Umbra Sprint 1 Verification Strategy

Status: Planned — no verification has been executed  
Authority: [Product brief](../product/SPRINT-1-PRODUCT-BRIEF.md), [slice plan](agents/tasks/umbra-sprint-1-slices.md), and [API contract](../knowledge/umbra-api-contract.md)

## Test design

| Area | Cases | Lowest sufficient level | Expected evidence |
| --- | --- | --- | --- |
| Baseline | TC-S1-001 | Build/tooling | Clean install/build/test output and exit status. |
| Shell and accessibility | TC-S1-002–004 | DOM/UI smoke | Required regions, accessible names, keyboard path, proportionate screenshot. |
| Canvas/pixel writer | TC-S1-011 | Unit + browser | Explicit non-empty Canvas image data, dimensions, status, and no external render image. |
| Vec3/Ray | TC-S1-005 | Pure unit | Arithmetic, ray point, zero/normalization policy. |
| Camera | TC-S1-014 | Pure unit | Center/corner ray directions and degenerate inputs. |
| Background | TC-S1-008–009 | Pixel/unit | Selected coordinates, tolerance, determinism. |
| Sphere | TC-S1-006 | Pure unit | Two roots, tangent, miss, origin inside, nearest non-negative policy. |
| Normals | TC-S1-007 | Pure unit/pixel | Cardinal and non-cardinal normals, selected output pixels. |
| Request API | TC-S1-010, TC-S1-015 | Unit/static | Valid request, invalid dimensions/camera/type policy, Canvas-free contract. |
| First light | TC-S1-012–013 | Unit + browser | Lit/unlit/background pixel values, keyboard render flow, trace/screenshot on failure. |

## Evidence policy

- Define floating-point and color tolerances before test implementation.
- Prefer deterministic unit/pixel assertions; manual visual confirmation supplements, never replaces, them.
- Browser automation waits on an observable completion condition, not arbitrary timeouts.
- Preserve runner output, commands, environment prerequisites, and only diagnostic screenshots/traces needed to classify the result.
- Reports classify execution honestly as `VERIFIED`, `VERIFIED WITH OBSERVATIONS`, `PARTIALLY VERIFIED`, `AUTOMATION READY — NOT EXECUTED`, `BLOCKED`, or `FAILED`.

## Planned case identifiers

`TC-S1-001` baseline; `002` shell; `003` no-static-render image; `004` accessibility; `005` vectors/rays; `006` sphere; `007` normals; `008` pixel samples; `009` determinism; `010` boundary; `011` Canvas image data; `012` keyboard render; `013` no arbitrary waits; `014` camera rays; `015` RenderRequest v0 validation.

Execution prerequisites and gate ownership are defined in [review gates](agents/reviews/umbra-review-gates.md). The earlier strategy file is superseded by this document.
