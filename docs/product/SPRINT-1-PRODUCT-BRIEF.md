# Umbra Sprint 1 Product Brief

Status: Approved at Gate G0 on 2026-08-28  
Authority: Product Authority  
Design input: [Stitch mockup](mockups/stitch/README.md), [design tokens](mockups/stitch/DESIGN.md), and `screen.png`

## Product outcome

Deliver a small laboratory where a learner can render one deterministic, lit sphere scene to a Canvas 2D viewport and see that the active lesson is **Ray–Sphere Intersection**.

The experience should communicate: “A small laboratory for learning how light becomes pixels.” It is an educational renderer, not a scene editor.

## Sprint 1 user flow

1. A learner opens Umbra and sees a dark, technical application shell.
2. The center viewport contains the initial rendered scene or an explicit ready-to-render state.
3. The learner selects **Render** and sees a completed Canvas 2D image of the fixed scene.
4. The interface identifies the current concept as Ray–Sphere Intersection and presents the pipeline in its instructional order.
5. The learner can read scene metadata and render status without needing to edit a scene.

## Required visible surface

| Area | Sprint 1 contract | Explicitly not required |
| --- | --- | --- |
| Header | Umbra identity and didactic subtitle | Settings, help, and terminal actions |
| Viewport | Canvas 2D is the dominant visual element; render status, dimensions, and render time are visible | Mockup image, photorealism, progressive sampling |
| Controls | One accessible Render action; fixed preset resolution is allowed | User-controlled sample count or arbitrary resolution |
| Scene metadata | Fixed-scene summary: camera, one sphere, one point light, and a clearly non-functional sample placeholder/metadata when shown | Editable scene graph, object controls, coordinate inputs |
| Lesson | Current-concept title plus concise ray–sphere explanation | Lesson navigation, quizzes, or curriculum persistence |
| Pipeline | Ordered labels: Ray generation → Intersection → Lighting → Canvas output; Intersection is visually active | BVH, post-processing, or operational pipeline controls |

## Visual direction

Use the Stitch design as a direction, not a pixel match:

- Dark neutral surfaces and low-contrast structural borders.
- Violet for the primary Render action; cyan/amber only as restrained technical accents.
- Readable sans-serif prose and monospace technical labels/data.
- A fluid canvas center; desktop side panels may stack below the viewport at constrained widths.
- Functional controls and labels must not merely imitate the mockup’s decorative controls.

## Acceptance criteria

- AC-PROD-001: On initial load, the learner can identify Umbra, the viewport, the Render action, the current concept, and the ordered pipeline.
- AC-PROD-002: Activating Render produces a non-empty image through Canvas 2D for the documented fixed scene; the viewport is not a static external image.
- AC-PROD-003: The visible lesson identifies Ray–Sphere Intersection and accurately states that intersection distances arise from solving the ray/sphere quadratic.
- AC-PROD-004: The visible pipeline makes Ray generation, Intersection, Lighting, and Canvas output distinguishable, with Intersection active.
- AC-PROD-005: All interactive controls delivered in Sprint 1 have accessible names and a keyboard-operable path.
- AC-PROD-006: Sprint 1 contains no UI that implies unsupported scene editing, export, BVH acceleration, or configurable sampling.

## Deferred product decisions

- Whether first render occurs automatically or only after Render is selected. The implementation may choose either behavior, but must label the state honestly.
- Exact responsive breakpoint and typography loading strategy.
- The lesson sequence and interaction model beyond the first concept.

## Sources and boundaries

This brief is the product contract for the planned slices. The visual source is the Stitch mockup; its own README explicitly excludes the full scene editor, export, settings, complex precision controls, BVH, post-processing, and advanced materials from Sprint 1.
