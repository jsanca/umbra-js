# UMBRA-EXP-001 — Elito Planning Task

Status: Complete — planning artifacts awaiting approval  
Owner: Product Authority / Technical Stakeholders  
Target role: Knowledge Curator / Planning Curator  
Execution model: Elito  
Implementation model: Minimax, later, by authorized slices only  
Date: 2026-08-28

## Task summary and boundary

Umbra is the first full OSK-guided workflow experiment: humans define product and technical intent, Elito creates durable planning only, humans approve the plan, Minimax executes one approved slice at a time, and OSK roles review, verify, and curate evidence. The repository is intentionally clean: no `package.json`, lockfile, `index.html`, `src/`, TypeScript configuration, Vite configuration, source, or tests existed when this task began.

This task authorizes documentation only under `docs/`. It does not authorize implementation, Vite bootstrapping, dependency installation, generated code, or test implementation.

## Authorities and design inputs

- Product and technical authority: the complete UMBRA-EXP-001 brief supplied by the task owner on 2026-08-28.
- Workspace authority: [Project context](../../../PROJECT.md) and [OSK guide](../../../OSK.md).
- Product north star: [Stitch README](../../../product/mockups/stitch/README.md), [design tokens](../../../product/mockups/stitch/DESIGN.md), `code.html`, and `screen.png`. It is not a pixel-perfect contract.

## Required planning outputs

- [Project brief](../../../knowledge/umbra-project-brief.md), [domain model](../../../knowledge/umbra-domain-model.md), [conceptual API](../../../knowledge/umbra-api-contract.md), and [architecture overview](../../../knowledge/umbra-architecture-overview.md).
- [Detailed roadmap](../../../roadmap/umbra-sprint-1-roadmap.md) and [eleven-slice execution plan](umbra-sprint-1-slices.md).
- [Review gates](../reviews/umbra-review-gates.md), [verification strategy](../../umbra-verification-strategy.md), and [risk register](../../umbra-risk-register.md).
- [Experiment log template](../../umbra-exp-001-log.md) and baseline [ADR-001](../../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md).

## Completion and handoff

Planning is complete only as documentation. Human authorities must approve the product brief, baseline ADR, and lightweight boundary decision before authorizing only `UMBRA-S1-001`. The executor must follow the canonical slice plan, stop at each declared gate, and create a report in `docs/engineering/agents/reports/` before the next slice can be authorized.
