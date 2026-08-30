# UMBRA-OSK-RETRO-001 — Sprint 1 OSK Experiment Retrospective

## Executive summary

Sprint 1 is strong evidence that explicit scope, authorization, review, and
evidence artifacts improve agent behavior. The implementation records show
bounded slices, repeated `npm run verify` evidence, independent review findings,
and two authorization pauses observed across more than one model. This is not,
however, a completed product-acceptance claim: G9 has no approval artifact, G3
has no review artifact, and several records are stale or internally inconsistent
about current gate state. Sprint 2 is not authorized by this retrospective.

## What worked

### Agent behavior and authorization

- Slice plans named goals, non-goals, verification, review, handoff, and stop
  conditions. Reviews repeatedly found no premature renderer features or
  boundary leakage into later slices.
- `UMBRA-OSK-FINDING-001` records pauses before S1-006 and S1-007 when the
  slices were planned but not authorized. Its correction note attributes S1-006
  to DeepSeek Pro and says the same pause behavior also appeared with MiniMax;
  this is evidence of governance-artifact influence across models, not proof of
  a model-specific trait.
- Reports and reviews generally distinguished human Product Authority
  authorization from a review recommendation. S1-008, S1-009, S1-010, and
  S1-011 reports explicitly avoided claiming a future gate had passed.
- Review constraints prevented opportunistic carry-forward repair: the S1-008
  review confirms G6 observations were deliberately left open rather than being
  silently folded into unrelated scope.

### Evidence and review

- The verification hook produced timestamped, reproducible command evidence,
  including branch/commit and working-tree state. The S1-011 hook reports audit
  signatures, audit, typecheck, 264 tests, and build passing.
- Gate reviews independently re-derived camera, intersection, gradient, and
  diffuse-light math, checked ADR-002 imports, and created a durable
  carry-forward trail instead of treating every observation as a blocker.
- Deterministic unit/pixel assertions were correctly treated as primary proof;
  screenshots were supplementary human-visible evidence. G5 explicitly states
  that its reviewer could not decode image pixels and did not pretend otherwise.

## What failed or was missing

### Gate and roadmap design

Gates were specified, but not uniformly materialized as executable review
tasks/artifacts. The gate table includes G3 (S1-004) and G9, while the log says
S1-004 awaits G3 sign-off and S1-011/G9 is pending; neither has a corresponding
approval review in the inspected review directory. The G9 acceptance package is
useful input, not a G9 decision. Each gate should be an explicit roadmap task
with owner, reviewer, authority, evidence package, decision output, and next
authorization state.

The slice plan status line and AGENTS.md contain evidence-rich but mutable
current-state summaries. The latest hook also records them as uncommitted at
the time of verification. This makes them valuable navigation, not sole proof
of authorization. Gate decisions need a stable artifact and the summaries need
a synchronized-state policy.

### Evidence policy

The Product Authority accepted unit/integration evidence plus manual screenshots
for Sprint 1 Canvas behavior and deferred a real-browser pixel assertion. That
was a documented decision, not proof that browser automation is unnecessary.
The evidence corpus still lacks a browser pixel assertion and no capture hook
produces consistent visual evidence. Tests establish deterministic program
outputs; screenshots establish a human-visible rendering record; formal browser
tests establish browser integration/pixel behavior. They are complementary.

### Documentation accuracy

Reviews found report inaccuracies (S1-003 UI wiring; S1-006 screenshot
limitation) and G7 found planning knowledge stale relative to implementation.
S1-011 promoted the three knowledge pages and resolved the latter finding, but
the S1-011 report itself still lists S1-004 as awaiting G3 while presenting a
completion package. The review-gates document still says `Status: Planned`.
These are curation defects, not implementation failures.

## Model-role assessment

| Model / actor | Observed strengths | Do not trust alone for |
| --- | --- | --- |
| MiniMax / developer executor | Slice-scoped implementation and, per the authorization-pause finding, respecting documented stop boundaries. | Product decisions, self-approval, independent correctness or scope review. |
| DeepSeek Pro / reviewer-adversarial analyst | Independent derivations, boundary inspection, explicit non-blocking findings; also displayed the authorization pause behavior. | Product acceptance, final authority, or visual assessment when its environment cannot inspect pixels. |
| Elito / planner-curator | Decomposed slices, durable plans/reports, knowledge promotion, and carry-forward organization. | Treating plan text as current state without reconciling gate artifacts; deciding product policy. |
| Human Product Authority | Explicitly authorized later Sprint 1 slices and accepted an evidence trade-off. | Delegating acceptance/risk decisions implicitly to agents or review recommendations. |

These are limited observations from the artifact corpus, not general model
benchmarks. Independent reviewer and human authority remain necessary.

## Carry-forward debt assessment

| ID | Classification | Rationale |
| --- | --- | --- |
| CF-001 zero-direction ray | Must fix before Sprint 2 | A public/core degenerate input silently maps to `null`; resolve or make the contract explicit before broader reuse. |
| CF-002 generator type placement | Should fix during Sprint 2 | Cohesion debt; not a Sprint 1 correctness blocker. |
| CF-003 normal NaN hardening | Should fix during Sprint 2 | Current pipeline protects it, but the helper’s boundary is fragile. |
| CF-004 unknown fields / ADR-003 | Can remain documented | Explicit v0 policy exists; strict/version option needs a separately authorized evolution decision. |
| CF-005 request semantic degeneracy | Must fix before Sprint 2 | Clarify or test the validator/conversion split before request surface grows. |
| CF-006 stale knowledge | Resolved; maintain as process control | Promotion occurred at S1-011; require reconciliation whenever an implementation gate changes durable truth. |
| CF-007 S1-010 screenshot | Resolved; improve process | Screenshot exists after review; capture must occur before the evidence-consuming gate. |
| CF-008 light at hit point | Should fix during Sprint 2 | Same degenerate-vector family; define guard or explicit policy. |
| CF-009 no attenuation | Can remain documented | It is an approved Sprint 1 simplification, not a hidden defect. |
| CF-010 light factory asymmetry | Should fix during Sprint 2 | Align factory validation depth before reuse outside request conversion. |
| G4 documentation drift, G5 report accuracy, G2 wiring wording | Process-only improvement | Correct records through an evidence-preserving erratum/reconciliation policy, not history rewrite. |

## OSK template recommendations

1. **Slice template:** required fields for executor Role, model/alter ego,
   reviewer Role, Product/technical authority, evidence package, stop condition,
   explicit authorization state, and knowledge-update trigger.
2. **Gate review template:** gate id, reviewed commit/worktree basis, decision
   owner, verdict, blockers/observations, evidence inventory, authorization
   recommendation, and an explicit statement that recommendation is not
   authorization.
3. **Report template:** actual scope/non-goals, command evidence links,
   assertions versus manual evidence, carry-forward IDs, and current-document
   reconciliation impact.
4. **Evidence package template:** deterministic test outputs, generated hook
   report, screenshot/trace provenance, reviewer capability limits, and a
   distinction among automated, manual, and unverified evidence.
5. **Carry-forward template:** source, state, severity, owner, target horizon,
   decision needed, and whether the item blocks the next authorization—not just
   whether it blocked the prior gate.
6. **AGENTS.md policy:** label it a derived current-state index, name its source
   gate artifacts, require update in the same change as a decision, and prohibit
   it from asserting approval without a linked decision record.
7. **Automation policy:** the verify hook remains valuable as a reproducible
   baseline; decide separately whether a visual-capture hook and formal browser
   assertion are needed before the next visual/product gate.

## Sprint 2 readiness notes

Before any Sprint 2 authorization: complete G9 Product Authority acceptance;
reconcile G3’s absent decision; perform the must-fix request/math policy work;
run a knowledge-curator current-state audit; decide browser visual evidence
policy; decide controller/context boundary strictness; and agree a
RenderRequest evolution/strictness policy. A math learning checkpoint is also
appropriate before expanding rendering behavior. These are prerequisites, not a
Sprint 2 design or authorization.

## Recommended next actions

1. Create/complete explicit G3 and G9 review/decision tasks; do not backfill
   them as passed without evidence.
2. Triage the carry-forward backlog using the classifications in this review.
3. Reconcile AGENTS.md, review-gates status, slice-plan status, and log against
   the decision artifacts.
4. Decide and document the browser pixel/visual-capture evidence policy.
5. Only after the above and explicit Product Authority action, consider a new
   authorized work package.

## Evidence basis

This retrospective is based on the Sprint 1 log, slice plan, S1-001..S1-011
reports, G1/G2/G4/G5/G6/G7/G8 reviews, G9 acceptance package, generated verify
hook reports, carry-forward backlog, AGENTS.md, ADR-001..003, and the three
implemented knowledge pages. It does not claim G3 or G9 passed.
