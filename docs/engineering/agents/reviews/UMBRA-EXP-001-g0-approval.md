# UMBRA-EXP-001 — G0 Approval

Status: Approved  
Date: 2026-08-28  
Decision owners: Product Authority, Technical Stakeholders

## Decision

The Sprint 1 product scope, Stitch interpretation, ADR-001, ADR-002, roadmap, review gates, verification strategy, and risk register are approved as the planning baseline for Umbra Sprint 1.

## Authorization

Only `UMBRA-S1-001` is authorized. No later implementation slice is authorized by this approval.

## Conditions

- S1-001 must establish the TypeScript/Vite baseline from the clean repository.
- S1-001 must justify every dependency.
- S1-001 must produce reproducible install/build/test commands.
- S1-001 must not implement ray-tracing features beyond the authorized baseline.
- G1 must pass before S1-002 can begin.

## Notes

The Stitch mockup remains a product north star, not a pixel-perfect contract. ADR-001 and ADR-002 are accepted for Sprint 1.

## References

- [Sprint 1 product brief](../../../product/SPRINT-1-PRODUCT-BRIEF.md)
- [ADR-001](../../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md)
- [ADR-002](../../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Sprint 1 roadmap](../../../roadmap/umbra-sprint-1-roadmap.md)
- [Slice plan](../tasks/umbra-sprint-1-slices.md)
- [Review gates](umbra-review-gates.md)
