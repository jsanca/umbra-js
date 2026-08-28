You are acting as OSK Engineering Reviewer for Umbra G2.

Use:
- osk-boundary-review
- osk-verification-engineering as supporting evidence

Review only S1-002 and S1-003.

Inputs:
- docs/engineering/agents/reports/UMBRA-S1-002-static-laboratory-shell.md
- docs/engineering/agents/reports/UMBRA-S1-003-canvas-viewport-and-pixel-writer.md
- docs/engineering/agents/reviews/umbra-review-gates.md
- docs/adr/ADR-002-sprint-1-rendering-boundaries.md
- latest docs/engineering/agents/reports/hooks/umbra-verify-*.md
- manual screenshot evidence if available

Focus:
1. Does S1-002 satisfy static shell scope?
2. Does S1-003 satisfy Canvas pixel writer scope?
3. Is Canvas output isolated to the Canvas adapter?
4. Is core free from DOM/Canvas/UI/Vite?
5. Is controller responsibility acceptable for Sprint 1?
6. Did implementation drift into S1-004 or later?
7. Is evidence sufficient to authorize S1-004?

Output:
- Verdict: PASS / PASS WITH OBSERVATIONS / CHANGES REQUIRED / BLOCKED
- Findings table with severity
- Evidence cited by file/path
- Required fixes before S1-004, if any
- Observations/debt allowed to continue
- Authorization recommendation for S1-004