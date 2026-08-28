# Agent Workspace Guide

Start with [docs/PROJECT.md](docs/PROJECT.md) for project context, then [docs/OSK.md](docs/OSK.md) for documentation placement. Both are canonical — this file only adds repo-specific guardrails an agent would otherwise miss.

## Current state (read first)

- S1-001 (TypeScript + Vite baseline), S1-002 (static shell), and S1-003 (Canvas viewport + pixel writer) are **done**. G1 approved (`PASS WITH OBSERVATIONS`); the G2 review of S1-002/S1-003 is pending. S1-004 through S1-011 are planned and **not authorized** until their gates pass. Finishing a slice does not auto-authorize the next.
- [ENGINEERING_LOG.md](docs/engineering/ENGINEERING_LOG.md) is the compact current index of task status. Consult it, the [slice plan](docs/engineering/agents/tasks/umbra-sprint-1-slices.md), and the [review gates](docs/engineering/agents/reviews/umbra-review-gates.md) before assuming anything is authorized.

## Commands

```bash
npm run dev            # Vite dev server, port 5173 (strictPort)
npm run build          # tsc -p tsconfig.app.json --noEmit && vite build
npm run preview        # serve dist
npm run test           # vitest watch mode
npm run test:run       # vitest run (single pass)
npm run typecheck      # tsc --noEmit on BOTH tsconfig.app.json and tsconfig.node.json
npm run verify         # full pipeline: npm audit signatures → audit → typecheck → test:run → build
npm run verify:smoke   # verify + bounded dev-server probe (curl localhost:5173)
```

- `npm run verify` is the canonical pre-iteration check. It **writes a Markdown report** to `docs/engineering/agents/reports/hooks/umbra-verify-<timestamp>.md` (git-tracked — don't hand-edit) and exits 0 only if every step passed. It calls `npm audit signatures`, which needs network.
- Run a single test file: `npx vitest run src/core/pixel-buffer.test.ts`.

## Test layout (non-obvious)

Vitest runs **three projects** (see `vitest.config.ts`), split by environment:

| Project | Environment | Includes |
| --- | --- | --- |
| `baseline` | node | `src/baseline.test.ts` |
| `core` | node | `src/core/**`, `src/diagnostics/**`, `src/canvas/**` |
| `shell` | happy-dom | `src/ui/**`, `src/controller/**` |

The pure-core and Canvas-adapter tests run in `node`; only UI/controller tests get a DOM (happy-dom, not jsdom). Pick the right environment when adding tests.

## Architecture boundary (ADR-002)

The pure rendering core **must not import** DOM, Canvas, Vite, or UI types. The Canvas output adapter (`src/canvas/`) is the only module that may touch Canvas 2D. The render controller (`src/controller/`) is the only module that may depend on both. The diagnostics adapter is a lightweight seam, not a plugin system. Full dependency matrix: [architecture overview](docs/knowledge/umbra-architecture-overview.md).

## Forbidden in Sprint 1

No Three.js, WebGL/WebGPU, UI framework, external math library, rendering engine, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editor, settings, or export. Every dependency needs a documented immediate purpose. Source: [ADR-001](docs/adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and the [product brief](docs/product/SPRINT-1-PRODUCT-BRIEF.md).

## TypeScript / module gotchas

- Relative imports use a **`.js` extension** even for `.ts` sources (e.g. `import { mountShell } from './ui/shell.js'`), per `allowImportingTsExtensions` + `moduleResolution: "bundler"`.
- `verbatimModuleSyntax: true` — use `import type { ... }` for type-only imports; `noUnusedLocals`/`noUnusedParameters` are on and will fail `build`/`typecheck`.

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
- The Vite dev server binds to IPv6 `::1` by default on this host; `curl http://localhost:5173/` works but `curl http://127.0.0.1:5173/` is refused. Use `npm run dev -- --host 127.0.0.1` if IPv4 is required.

<!-- OSK:BEGIN -->

## OSK Workspace

Read:

- `docs/PROJECT.md`
- `docs/OSK.md`

<!-- OSK:END -->

## Tool-Specific Instructions

Add only instructions required by this agent tool here. Keep shared project guidance in `docs/`.
