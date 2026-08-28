# Umbra Sprint 1 Risk Register

Status: Planned

| ID | Risk | Likelihood | Impact | Mitigation | Gate |
| --- | --- | --- | --- | --- | --- |
| R-001 | Overengineering before first render | Medium | High | Enforce eleven narrow slice contracts and stop conditions. | G0–G8 |
| R-002 | UI dominates renderer learning value | Medium | High | Keep shell/UI slices separate; defer editor-like controls. | G2 |
| R-003 | Math defect is hidden by a plausible image | High | High | Unit/pixel cases and explicit tolerances precede visual acceptance. | G3–G6 |
| R-004 | Weak acceptance criteria allow a mockup/static image | Medium | High | Require Canvas image-data evidence and no external render image. | G2, G5 |
| R-005 | Uncontrolled dependency growth | Medium | Medium | Justify every package in S1-001; reject unapproved additions. | G1 |
| R-006 | Stitch is treated as full product contract | Medium | Medium | Product brief names it a north star and lists explicit exclusions. | G0, G2, G9 |
| R-007 | Planner writes implementation | Low | High | Documentation-only boundary check and planning report. | G0 |
| R-008 | Executor drifts beyond its slice | Medium | High | Explicit scope/non-goals/stop condition; next slice blocked by gate. | Every gate |
| R-009 | Verification is nondeterministic or subjective | Medium | High | Unit/pixel evidence, explicit completion signals, proportional screenshots. | G3–G8 |
| R-010 | RenderRequest boundary is unclear or Canvas leaks inward | Medium | High | Approve conceptual contract at G7; review imports/dependencies. | G7 |
| R-011 | Adapters become ceremonial framework | Medium | Medium | Only Canvas, diagnostics, and conversion seams justified by immediate needs. | G1, G7 |
| R-012 | Pause/resume loses evidence or scope | Medium | Medium | Reports, engineering log, checkpoints, and experiment log are mandatory. | G9 |

Likelihood and impact are planning estimates, not observed defects. New risks must cite execution evidence and receive an owner/gate before changing scope.
