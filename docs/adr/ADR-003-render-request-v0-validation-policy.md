# ADR-003: RenderRequest v0 Accepts and Ignores Unknown Fields

Status: Proposed on 2026-08-30; pending G8 review
Date: 2026-08-30

## Context

Sprint 1 introduces `RenderRequest v0` as the declarative, DOM/Canvas-free input
contract for the renderer (`src/core/render-request.ts`). The contract has
three top-level fields — `output`, `camera`, and `scene` — each with a
documented set of required and optional sub-fields, plus a documented
validation policy that throws `RangeError` messages naming the failing
field.

The validator is the single source of truth for *shape and range* errors: it
checks that required fields are present, that numeric ranges are met
(dimensions, field of view, radius, intensity, color channels), and that
finiteness holds for vectors and scalars. It deliberately does **not** reject
fields it does not recognize. This policy was flagged by the G7 review as
finding G7-1 (MINOR, non-blocking): the permissive behavior is acceptable for
Sprint 1 v0 but must be recorded as an explicit forward-compatibility
decision rather than left implicit.

The risk of an alternative strict policy is that a v0 caller who passes an
optional, unrecognized field — for example, a typo like `camera.up` →
`camera.upward`, or `scene.background` → `scene.bakcground`, or a future
additive field that the v0 caller does not yet know about — would see a hard
validation error and a refused render. That outcome is hostile to additive
contract evolution (S1-009's `scene.light` was itself an additive field) and
to learner experimentation. The G7 review's recommendation was either to
record the permissive policy as an explicit decision with a hardening
follow-up, or to introduce a `version`/strictness signal.

## Decision

For Sprint 1, `RenderRequest v0` is **permissive about unknown fields** at
both the top level and at any nested level:

- `validateRenderRequest(request: unknown)` validates the documented fields
  (presence, types, ranges, finiteness) and throws `RangeError` naming the
  failing field for any violation. It does not inspect, report, or reject
  fields it does not recognize.
- `createRequestRenderGenerator(request)` calls the validator and then
  converts only the documented fields. Unknown fields are passed through to
  the validator and ignored; they do not influence the rendered output.
- This policy applies uniformly to top-level fields (e.g. an unknown
  `metadata` field), nested objects (e.g. an unknown key inside `camera` or
  `scene`), and nested arrays (none exist in v0, but the policy is uniform
  if any are added).

The mitigation against silent typos rests on three orthogonal guards:

1. **TypeScript's `RenderRequestV0` type** catches typos at compile time for
   typed callers — every caller in this repository is a typed caller.
2. **Required-field validation** still throws: a missing required field is
   never silently ignored, regardless of the unknown-field policy.
3. **The single composition root** (`src/main.ts`) is the only place that
   constructs requests today; the policy therefore does not currently face
   a multi-tenant / untyped-caller risk in this codebase.

The policy is explicitly framed as a **forward-compatibility choice**: the
additive contract evolution path used by `scene.light` in S1-010 (and by
future additive fields if any are approved) depends on permissive
top-level handling so that old callers do not break when new fields are
introduced.

## Consequences

- v0 callers cannot rely on a typo being caught at runtime; the static
  type, the required-field validator, and the composition-root review are
  the only guards in v0.
- Additive contract decisions (e.g. introducing `scene.light` in S1-010) do
  not break existing v0 callers, because unknown fields are ignored.
- A future hardening pass — either a strict mode (reject unknown fields
  with a precise error) or an explicit `version`/strictness signal — can be
  added without breaking v0 callers, since the permissive behavior is the
  default and strictness is opt-in.
- The conceptual documentation (`docs/knowledge/umbra-api-contract.md`) and
  the implemented contract must agree on this policy. The implementation
  is the authoritative source; the knowledge page is promoted by the
  knowledge curator after G7 (G7-5 follow-up).

## Alternatives considered

- **Strict rejection of unknown fields.** Rejected for v0 because it would
  require every additive contract decision to be backported to existing
  callers (or guarded by a version field) and would frustrate learner
  experimentation. The hardening risk is mitigated by the type system, the
  required-field validator, and the composition-root code review.
- **Explicit `version`/strictness signal on the request.** Deferred to a
  future hardening pass. A `version: "v0"` field plus a strict mode would
  let callers opt in to rejection; v0 remains permissive by default to
  preserve forward compatibility.
- **Silent acceptance of unknown fields with no documentation.** Rejected
  because it leaves the policy implicit and surprising; the G7 review
  flagged it as a non-blocking risk precisely because it was implicit. An
  explicit ADR (this document) and an updated knowledge page (the G7-5
  follow-up) are the durable remedy.

## References

- [Sprint 1 slice plan — S1-009 / S1-010 handoff and S1-009 carry-forward
  observations](../engineering/agents/tasks/umbra-sprint-1-slices.md)
- [S1-009 implementation report](../engineering/agents/reports/UMBRA-S1-009-render-request-v0.md)
- [S1-010 implementation report](../engineering/agents/reports/UMBRA-S1-010-point-light-diffuse-shading.md)
- [G7 RenderRequest v0 API architecture + boundary review](../engineering/agents/reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md) (G7-1 finding)
- [RenderRequest v0 API contract (conceptual)](../knowledge/umbra-api-contract.md)
- [Rendering boundaries (ADR-002)](ADR-002-sprint-1-rendering-boundaries.md)