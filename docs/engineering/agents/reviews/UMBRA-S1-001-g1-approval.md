# UMBRA-S1-001 — G1 Approval

Status: Approved (with observations)  
Date: 2026-08-28  
Verdict: PASS WITH OBSERVATIONS  
Decision owners: Platform Engineer (`osk-agent-harness-guide`), Engineering Reviewer (`osk-architecture-review`)

## Decision

S1-001 is approved. The TypeScript + Vite + Vitest baseline is reproducible, dependencies are justified, Sprint 1 boundaries (ADR-002) are preserved, and the TC-S1-001 evidence (clean install, typecheck, build, dev server, tests, audit) was observed. S1-001 stopped before S1-002 scope, as required.

## Authorization

G1 passes. S1-002 remains **not yet authorized** — completion of S1-001 plus G1 approval authorizes the gate review only, not the next slice. S1-002 requires an explicit authorization to begin, per [the slice plan](../tasks/umbra-sprint-1-slices.md) and [the G1 row of the review gates table](umbra-review-gates.md).

## Observations

The four observations below are recorded as durable follow-ups. None blocks S1-002, but each must be confirmed before S1-002 closes G2.

### Observation 1 — npm registry signatures

The baseline must rely on packages whose npm registry signatures are verified, to defend the supply chain of the runner, build, and test tooling.

**Evidence captured post-G1:**

```
$ npm audit signatures
audited 47 packages in 2s
47 packages have verified registry signatures
23 packages have verified attestations
```

All 47 installed packages report verified registry signatures; 23 of those additionally carry provenance attestations. Re-run `npm audit signatures` as part of the S1-002 baseline validation and capture the output in the S1-002 report. If a future install adds an unsigned or untrusted package, halt and escalate.

### Observation 2 — Vitest browser / jsdom decision

The Vitest environment for browser-side smoke tests (S1-002 AC-PROD-001 / AC-PROD-003 / AC-PROD-004 and TC-S1-002..004) is intentionally **deferred to S1-002**. S1-001 only ran `environment: 'node'` and added no DOM/Canvas test environment. The implementation report already lists this in Open Follow-Up; this observation makes the deferral an explicit gate precondition.

**Required S1-002 decision:** pick one of

- add a second Vitest project with `environment: 'jsdom'`, or
- switch to Vitest's browser mode (Playwright / WebdriverIO provider), or
- keep a Node-only runner for S1-002 and rely on the slice's required-region assertion / proportional screenshot at the runner level instead.

Document the choice and rationale in the S1-002 report; ratify or revise the boundary mapping (the directory table in the S1-001 report) at the same time.

### Observation 3 — Localhost IPv6 binding

On the validation host, `vite` defaults to binding `[::1]:5173` only. `curl http://127.0.0.1:5173/` returns `Connection refused`; `curl http://localhost:5173/` returns `HTTP 200` because the system resolves `localhost` to IPv6 `::1`. This is a host-platform observation, not a code defect.

**Platform note (track for future platform-engineer work):**

- Symptom: dev server reachable at `http://localhost:5173/`, not at `http://127.0.0.1:5173/`.
- Cause: Vite's default host is `localhost`, which resolves to IPv6 on this machine; no IPv4 socket is opened.
- Workarounds if IPv4 is required: `npm run dev -- --host 127.0.0.1` or `npm run dev -- --host 0.0.0.0`.
- Reference: `lsof -nP -iTCP:5173` shows `TCP [::1]:5173 (LISTEN)`.

Record this in the S1-002 evidence table if a future slice exercises `curl` against the dev server on a different host. No code change is required for S1-001 to be considered complete.

### Observation 4 — node_modules and dist not committed

**Evidence captured post-G1:**

```
$ git check-ignore -v node_modules
.gitignore:10:node_modules    node_modules

$ git check-ignore -v dist
.gitignore:11:dist    dist

$ git check-ignore -v dist/assets/index-ClGW03Ud.js
.gitignore:11:dist    dist/assets/index-ClGW03Ud.js

$ git ls-files | grep -E '^(node_modules|dist)/'
(empty — none tracked)

$ git status --short --ignored | grep -E '(node_modules|dist)'
!! dist/
!! node_modules/
```

`node_modules/` and `dist/` are correctly excluded by the existing `.gitignore` rules at lines 10 and 11. No build artifacts are tracked. `package-lock.json` is unignored and expected to be committed alongside the source changes.

## Conditions for S1-002

- Confirm `npm audit signatures` before starting S1-002; halt if any package is unverified.
- Decide and document the Vitest browser-environment approach in the S1-002 report.
- Record the IPv6 localhost observation in any future report that exercises the dev server with `curl`.
- Keep `.gitignore` unchanged unless a new build artifact appears; verify ignored status on every commit.

## References

- [S1-001 implementation report](../reports/UMBRA-S1-001-typescript-vite-baseline.md)
- [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md)
- [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md)
- [Sprint 1 review gates](umbra-review-gates.md) (G1 row)
- [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-001)
- [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md)
- [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [G0 approval (UMBRA-EXP-001)](UMBRA-EXP-001-g0-approval.md)
