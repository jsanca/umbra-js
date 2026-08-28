# Umbra Sprint 1 Architecture Overview

Status: Proposed architecture — not implemented  
Authority: [ADR-001](../adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and [ADR-002](../adr/ADR-002-sprint-1-rendering-boundaries.md)

```text
UI shell ──► render controller ──► pure rendering core ──► pixel buffer
   │                │                                           │
   │                └────────► diagnostics adapter ◄───────────┘
   └──────────────────────────► Canvas output adapter ◄─────────┘
```

## Lightweight boundaries

- **Pure rendering core:** vector/ray/camera/sphere/normal/background/light calculations. No browser or framework imports.
- **Render controller:** accepts `RenderRequest v0`, validates/orchestrates the fixed scene, and returns pixel data plus diagnostics.
- **Canvas output adapter:** translates a completed pixel buffer to Canvas 2D. It owns browser API interaction only.
- **Diagnostics adapter:** records elapsed time, status, output dimensions, and completion/miss metadata needed by the UI. It is a lightweight boundary, not a plugin system.
- **Scene input adapter:** a small conversion/validation seam from declarative request data to core values. It may remain a controller function in Sprint 1 if its boundary is explicit and testable.

## Dependency rules

| Source | May depend on | Must not depend on |
| --- | --- | --- |
| Pure core | Language-standard value types | DOM, Canvas, Vite, UI, diagnostics implementation |
| Controller | Pure core and request data | UI details or direct visual styling |
| Canvas adapter | Controller result and Canvas 2D | Core internals beyond its public result |
| UI shell | Controller and displayed diagnostics | Core math internals |

No formal ports/adapters framework or plugin architecture is needed in Sprint 1. These conceptual seams exist solely to preserve testability and evolutionary change.
