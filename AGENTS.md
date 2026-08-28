# Agent Workspace Guide

Start with [docs/PROJECT.md](docs/PROJECT.md) for project context, then [docs/OSK.md](docs/OSK.md) for documentation placement. Both are canonical — this file only adds repo-specific guardrails an agent would otherwise miss.

## Current state (read first)

- The repo is at **Gate G0** planning baseline. There is **no** `package.json`, no source, no test runner, no build, no `node_modules`, no `opencode.json`. Treat every "how to run" assumption as wrong until evidence shows otherwise.
- **Only `UMBRA-S1-001` (TypeScript + Vite baseline bootstrap) is authorized.** S1-002 through S1-011 are not authorized until their preceding gate (G2 through G9) passes. Finishing an authorized slice does not auto-authorize the next one. See the [slice plan](docs/engineering/agents/tasks/umbra-sprint-1-slices.md) and [review gates](docs/engineering/agents/reviews/umbra-review-gates.md).

## Architecture boundary (ADR-002)

The pure rendering core **must not import** DOM, Canvas, Vite, or UI types. The Canvas output adapter is the only module that may touch Canvas 2D. The render controller is the only module that may depend on both. The diagnostics adapter is a lightweight seam, not a plugin system. Full dependency matrix: [architecture overview](docs/knowledge/umbra-architecture-overview.md).

## Forbidden in Sprint 1

No Three.js, WebGL/WebGPU, UI framework, external math library, rendering engine, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editor, settings, or export. Every dependency needs a documented immediate purpose. Source: [ADR-001](docs/adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and the [product brief](docs/product/SPRINT-1-PRODUCT-BRIEF.md).

## Documentation placement

Classify by purpose, not by the task that produced it. Rules and checklist: [docs/OSK.md](docs/OSK.md) and the per-folder READMEs (`docs/engineering/README.md`, `docs/knowledge/README.md`, `docs/adr/README.md`).

## Evidence expectations

- Every slice writes a report at `docs/engineering/agents/reports/<slice-id>-<slug>.md` and links it from [ENGINEERING_LOG.md](docs/engineering/ENGINEERING_LOG.md).
- Gate reviews go in `docs/engineering/agents/reviews/` per the [review gates](docs/engineering/agents/reviews/umbra-review-gates.md) table.
- Define numeric and color tolerances **before** writing tests; prefer deterministic pixel/unit assertions over visual-only proof.
- Classify execution honestly: `VERIFIED`, `VERIFIED WITH OBSERVATIONS`, `PARTIALLY VERIFIED`, `AUTOMATION READY — NOT EXECUTED`, `BLOCKED`, `FAILED`. Do not claim results the evidence does not support.

## OSK-managed state

`.osk/workspace.yaml`, `.osk/skills/`, and `.osk/roles/` are OSK workspace state, not project source. Roles (`software-engineer`, `knowledge-curator`, `platform-engineer`, `qa-engineer`, `engineering-reviewer`) define who is allowed to do what. Skills in `.osk/skills/` are the canonical reusable skills. Do not duplicate their contracts in `docs/`.

## Repo-specific gotchas

- `.npmrc` sets `ignore-scripts=true`, `fund=false`, `audit=true`. Honor it on every install.
- `.gitignore` already covers `node_modules`, `dist`, `dist-ssr`, and editor metadata. Do not re-add them.
- No `opencode.json` exists at the repo root; tool-level config lives in user/global config, not in this repo.
- Default branch: `main`, remote: `git@github.com:jsanca/umbra-js.git`. Do not push or open a PR without an explicit request.

<!-- OSK:BEGIN -->

## OSK Workspace

Read:

- `docs/PROJECT.md`
- `docs/OSK.md`

<!-- OSK:END -->

## Tool-Specific Instructions

Add only instructions required by this agent tool here. Keep shared project guidance in `docs/`.
