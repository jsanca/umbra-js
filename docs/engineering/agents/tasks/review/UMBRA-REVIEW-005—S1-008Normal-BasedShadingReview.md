Run UMBRA-REVIEW-005 — S1-008 Normal-Based Shading Review.

Use osk-verification-engineering, osk-boundary-review, and light adversarial analysis.

Review S1-008 only. Do not implement code. Do not authorize S1-009.

Focus:
- computeSphereNormal(hit) = normalize(hit.point - hit.sphere.center)
- normalToRgbaColor(normal) maps [-1,1] to [0,255] with alpha 0xff
- miss path still uses background gradient
- sphere-renderer did not introduce lighting/materials/shadows
- S1-009 RenderRequest v0 was not implemented
- ADR-002 boundary still holds
- carry-forward issues G6-1 and G6-3 remain explicitly open

Output:
docs/engineering/agents/reviews/UMBRA-S1-008-normal-based-shading-review.md

Verdict:
PASS / PASS WITH OBSERVATIONS / CHANGES REQUIRED / BLOCKED