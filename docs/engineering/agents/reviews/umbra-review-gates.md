# Umbra Sprint 1 Review Gates

Status: Planned  
Report destination: `docs/engineering/agents/reviews/<task-id>-<slug>.md`

| Gate | Trigger | Owner role / skill | Required evidence | Pass criteria | Fail outcome |
| --- | --- | --- | --- | --- | --- |
| G0 | Planning artifacts | Product Authority, Technical Stakeholders, Knowledge Curator / `osk-knowledge-curator` | Product brief, ADRs, slice plan, risks, verification, experiment template | Scope and decisions approved; only S1-001 authorized | Amend plan; no implementation |
| G1 | S1-001 baseline | Platform Engineer / `osk-agent-harness-guide`; Engineering Reviewer / `osk-architecture-review` | Commands, dependency rationale, build/test output, boundary map | Reproducible baseline; justified packages; ADR alignment | Block S1-002 |
| G2 | S1-002 and S1-003 | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review` | UI/Canvas tests, screenshot, Canvas evidence, accessible-control results | Shell is bounded; Canvas writes actual pixels; no mockup image | Fix or block core work |
| G3 | S1-004 Vec3/Ray | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review` | Unit results, tolerance/zero policy, import evidence | Math correct at defined cases; pure core boundary preserved | Fix or clarify math policy |
| G4 | S1-005 camera | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-architecture-review` | Center/corner-ray evidence, camera semantics | Deterministic rays and explicit degenerate-input policy | Block first visual render |
| G5 | S1-006 first visual | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-boundary-review` | Pixel checks, Canvas evidence, screenshot | Deterministic visual output; no subjective-only proof | Fix renderer evidence |
| G6 | S1-007 and S1-008 | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-adversarial-analysis` | Intersection/normal tests, root policy, counterexample analysis | Edge cases covered; no unresolved material math risk | Fix or escalate ambiguity |
| G7 | S1-009 API v0 | Engineering Reviewer / `osk-architecture-review` + `osk-boundary-review`; QA / `osk-verification-engineering` | Contract tests, invalid-input policy, dependency evidence | Declarative request is minimal and Canvas-free | Amend contract before lighting |
| G8 | S1-010 first light | QA / `osk-verification-engineering`; Engineering Reviewer / `osk-adversarial-analysis` | Lit/unlit pixel evidence, fixed-scene result, limitations | Direct-light outcome meets scope and deterministic evidence | Fix or defer feature |
| G9 | S1-011 completion | Product Authority; Knowledge Curator / `osk-knowledge-curator`; Engineering Reviewer / `osk-code-docs` | All reports/reviews, current knowledge, log, checkpoint, acceptance evidence | Documentation is traceable; no open checkpoint; product accepts Sprint 1 | Remediate documentation/evidence |


Post-review visual evidence:
- `docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png`

Any failed gate blocks the next slice. A gate report must distinguish verified findings from plausible risks and identify the next authorized action.
