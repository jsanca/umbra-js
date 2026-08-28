# Engineering Log

This file is the compact, current index of material engineering work. Detailed task, report, review, and checkpoint records live under `agents/`; this index links their relationship rather than repeating their evidence.

| Task | Description | Status | Depends On | Task File | Report | Review | Fix / Checkpoint | Knowledge |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UMBRA-EXP-001 | Initial Sprint 1 planning package | DONE | — | [task](agents/tasks/UMBRA-EXP-001-elito-planning.md) | [planning report](umbra-exp-001-planning-report.md) | [G0 approval](agents/reviews/UMBRA-EXP-001-g0-approval.md), [readiness review](agents/reviews/UMBRA-EXP-001-planning-readiness-review.md) | — | [project brief](../knowledge/umbra-project-brief.md) |
| UMBRA-S1-001 | TypeScript + Vite baseline bootstrap | DONE | UMBRA-EXP-001 | [slice plan](agents/tasks/umbra-sprint-1-slices.md) (S1-001) | [report](agents/reports/UMBRA-S1-001-typescript-vite-baseline.md) | [G1 approval (PASS WITH OBSERVATIONS)](agents/reviews/UMBRA-S1-001-g1-approval.md) | — | [architecture overview](../knowledge/umbra-architecture-overview.md) |
| UMBRA-S1-002..011 | Sprint 1 implementation slices awaiting G1+ authorization | PLANNED | UMBRA-S1-001 (G1) | [slice plan](agents/tasks/umbra-sprint-1-slices.md) | — | [review gates](agents/reviews/umbra-review-gates.md) | — | [roadmap](../roadmap/umbra-sprint-1-roadmap.md) |
| UMBRA-S1-LEGACY-001..003 | Superseded coarse-grained task drafts | SUPERSEDED | — | [legacy drafts](agents/tasks/UMBRA-S1-001-foundation-and-shell.md) | — | — | [replacement](agents/tasks/umbra-sprint-1-slices.md) | — |

Use `—` where a relationship does not exist. Keep cells brief; the linked durable record carries evidence, limitations, unresolved issues, and validation. Add a knowledge link when work establishes or changes reusable current understanding.
