# UMBRA-EXP-001 — Planning Readiness Review

Status: G0 approved on 2026-08-28  
Review scope: Planning artifacts created for Sprint 1; no implementation reviewed.

## Verdict

Product Authority approved the Sprint 1 product scope and Stitch interpretation. Technical Stakeholders approved ADR-001 and ADR-002. `UMBRA-S1-001` is authorized; all later slices remain unauthorized.

## Positive findings

- The product scope is bounded to a fixed educational scene and a Canvas-first laboratory interface.
- The canonical plan has eleven independently authorizable slices with explicit exclusions and stop conditions.
- ADR-002 establishes a testable UI/Canvas-to-core separation before code exists.
- Planned verification maps requirements to test-case identifiers and does not claim execution.

## Findings

| ID | Severity | Evidence | Impact | Recommendation | Disposition |
| --- | --- | --- | --- | --- | --- |
| PRR-001 | MAJOR | ADR-001 and ADR-002 are approved at G0. | Technical baseline is now authorized. | Preserve the decisions and review implementation against them. | Resolved at G0. |
| PRR-002 | MAJOR | The product brief is approved at G0. | Product scope and acceptance are now authorized. | Preserve the product exclusions through Sprint 1. | Resolved at G0. |
| PRR-003 | MINOR | The exact test/browser tooling is intentionally deferred to S1-001. | Verification execution cannot yet be reproduced. | Require S1-001 to document tooling and commands before G1. | Planned task requirement. |

## Risk analysis

| Risk | Counterexample / mechanism | Status | Mitigation owner |
| --- | --- | --- | --- |
| Scope inflation | Mockup controls are mistaken for an editor/export contract. | Plausible | Product Authority enforces exclusions at G0 and G9. |
| False rendered output | A static image or merely present canvas is accepted as rendering. | Plausible | QA applies TC-S1-003 and TC-S1-011. |
| Coupled mathematics/UI | Canvas calls leak into intersection/shading logic. | Plausible | Engineering Reviewer applies ADR-002 at G2/G7. |
| Numerically brittle tests | Floating-point edge cases or an unspecified tolerance cause false confidence. | Plausible | Software Engineer documents tolerance; QA applies TC-S1-005–009. |
| Misleading UI state | Controls imply editable settings/sampling that do not work. | Plausible | Product Authority applies AC-PROD-006 at G2/G9. |

No issue above is a verified implementation defect: no application exists and no implementation verification was run.

## G0 decision and required next action

G0 approved the product brief, Stitch interpretation, ADR-001, and ADR-002. The authorized executor may begin only `UMBRA-S1-001`, subject to its dependency justification, reproducible install/build/test commands, OSK boundary preservation, and baseline-bootstrap-only limit. A completion report and G1 review are required before any later slice can be considered for authorization.
