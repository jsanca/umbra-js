# Sprint 1 Verification Strategy — Superseded

Status: Superseded by [Umbra Sprint 1 Verification Strategy](umbra-verification-strategy.md)  
Authority: Historical draft only

This coarse-grained strategy is retained for planning history. The canonical strategy supports the complete eleven-slice plan and nine review gates. It must not be used for execution.

## Historical draft

## Verification rules

Expected behavior flows from the [product brief](../product/SPRINT-1-PRODUCT-BRIEF.md) and each task’s acceptance criteria to the test cases below, then to future automation and observed evidence. Automation is not proof until executed. Each execution report must state one of: `VERIFIED`, `VERIFIED WITH OBSERVATIONS`, `PARTIALLY VERIFIED`, `AUTOMATION READY — NOT EXECUTED`, `BLOCKED`, or `FAILED`.

## Planned cases

| ID | Requirement | Level | Expected evidence |
| --- | --- | --- | --- |
| TC-S1-001 | AC-S1-001 | Build/tooling | Clean install, build, and test command output with exit status. |
| TC-S1-002 | AC-S1-002, AC-PROD-001 | UI smoke | Rendered shell screenshot or DOM assertion for required regions. |
| TC-S1-003 | AC-S1-003 | UI inspection | Assertion that viewport output is a Canvas target, not an external mockup image. |
| TC-S1-004 | AC-S1-004 | UI/accessibility | Text and accessible-name assertions for concept, pipeline, and Render. |
| TC-S1-005 | AC-S1-006 | Unit | Vector arithmetic cases, including zero/normalization policy. |
| TC-S1-006 | AC-S1-006 | Unit | Ray–sphere two-hit, tangent, miss, and ray-origin-inside cases. |
| TC-S1-007 | AC-S1-006 | Unit | Normal values at cardinal and non-cardinal sphere points. |
| TC-S1-008 | AC-S1-007 | Unit | Fixed-scene pixels at documented sample coordinates. |
| TC-S1-009 | AC-S1-007 | Unit | Determinism: same scene and dimensions yield the same pixel buffer. |
| TC-S1-010 | AC-S1-008 | Static/boundary | Core dependency inspection or automated import rule. |
| TC-S1-011 | AC-S1-010 | Browser | Render action creates a non-empty Canvas image buffer. |
| TC-S1-012 | AC-S1-011 | Browser | Keyboard-activated Render reaches a completed/visible result. |
| TC-S1-013 | AC-S1-012 | Browser | No fixed delay: wait for an explicit completion condition and preserve failure trace/screenshot. |

## Numeric and image evidence policy

- Slice 2 must define tolerance before asserting floating-point results; exact equality is allowed only for deliberately exact integer/channel values.
- Pixel assertions use a small documented coordinate set and expected RGBA/tolerance values, not an opaque full-image snapshot as the sole oracle.
- A browser test must check an observable Canvas result (for example, non-background pixels or image data), rather than only asserting that a canvas element exists.
- Screenshots and traces are diagnostic evidence for browser failures or acceptance review; retain only those needed to explain a result.

## Execution prerequisites

Slice 1 must establish the repository-native commands, test runner, browser-test setup if needed, and any local browser prerequisites. If a required prerequisite is absent, QA reports `BLOCKED` rather than creating infrastructure outside the authorized slice.

## Review gates

| Gate | Required evidence | Decision owner | Blocks |
| --- | --- | --- | --- |
| G0 Planning approval | Product brief and both ADRs approved | Product Authority + Technical Stakeholders | All implementation |
| G1 Foundation review | S1-001 report, TC-S1-001–004 result, boundary review | QA + Engineering Reviewer | S1-002 |
| G2 Core review | S1-002 report, TC-S1-005–010 result, architecture/boundary review | QA + Engineering Reviewer | S1-003 |
| G3 Sprint acceptance | S1-003 report, TC-S1-011–013 result, product acceptance | QA + Engineering Reviewer + Product Authority | Sprint close |

No gate is passed by planned automation alone. The responsible implementation report links exact commands, observed results, and retained evidence locations.
