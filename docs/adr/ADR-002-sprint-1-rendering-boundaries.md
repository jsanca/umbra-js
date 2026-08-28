# ADR-002: Keep Sprint 1 Rendering Mathematics Independent of the Canvas UI

Status: Approved at Gate G0 on 2026-08-28  
Date: 2026-08-28

## Context

Umbra’s value is didactic clarity. Learners and future contributors need to distinguish ray-tracing mathematics from browser presentation. A browser-only implementation that mixes vector arithmetic, intersections, shading, and DOM/Canvas calls would be difficult to test and teach.

## Decision

Sprint 1 will use these planned boundaries:

```text
Browser UI / Canvas adapter
        │ invokes and displays
        ▼
Render orchestration
        │ uses
        ▼
Pure rendering core
vectors → rays → sphere intersection → normal → direct lighting → pixel colors
```

The pure rendering core must not depend on DOM, Canvas, Vite, or UI types. The Canvas adapter owns image-buffer presentation. The fixed-scene definition is explicit data consumed by orchestration, not hidden UI state.

## Consequences

- Mathematical behavior can be verified with deterministic, low-cost tests.
- The UI may change without redefining rendering mathematics.
- Sprint 1 needs only one sphere, one camera, and one point light; generic scene editing is deferred.
- No package or folder naming is prescribed here; Slice 1 must document its implementation mapping and the reviewer must evaluate it against this decision.

## Alternatives considered

- **Canvas calls inside intersection/shading functions:** rejected because it couples lesson logic to presentation and obstructs deterministic tests.
- **A generic entity/component scene model:** deferred because it broadens Sprint 1 beyond the fixed educational scene.

## References

- [Sprint 1 product brief](../product/SPRINT-1-PRODUCT-BRIEF.md)
- [Verification strategy](../engineering/umbra-verification-strategy.md)
