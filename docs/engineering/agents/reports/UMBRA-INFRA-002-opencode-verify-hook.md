# UMBRA-INFRA-002 — OpenCode Verify Hook Integration — Report

## Status

**PROPOSED — NOT ACTIVE.**

Hook status: PROPOSED. Manual `npm run verify` is the only supported invocation. The corrected OpenCode plugin shape is recorded in `docs/engineering/agents/tasks/UMBRA-INFRA-002-opencode-verify-hook.md` Sketch C but **not** implemented as a project file. No `.opencode/`, no `opencode.json`, no global user config, no new dependencies, no renderer/core/controller/canvas code changes.

## Objective

Determine whether the existing Umbra verification pipeline (`npm run verify`, alias of `bash scripts/umbra-verify.sh`) can be wired into the local OpenCode lifecycle as a stop/session-idle/post-iteration hook, and either activate it with observed evidence, or document why active wiring is not possible at this time.

## Summary

UMBRA-INFRA-002 closed the open question from UMBRA-INFRA-001: OpenCode **does** expose a project-local hook mechanism (auto-discovered plugins in `.opencode/plugin/<file>.{ts,js}`), but UMBRA-INFRA-001's Sketch A was based on an invalid config shape (`hooks.session.idle` under `opencode.jsonc` is not a real OpenCode field). The corrected shape is recorded as Sketch C in the new notes file. Wiring is still PROPOSED because:

1. Creating `.opencode/` in this repo directly contradicts AGENTS.md ("tool-level config lives in user/global config, not in this repo").
2. Modifying global user config (`~/.config/opencode/opencode.jsonc`) is forbidden by the task brief.
3. Adding `@opencode-ai/plugin` as a dep is forbidden; pure-JS still requires `.opencode/` in the repo.
4. Automatic hook execution cannot be observed from a single agent session, and `customize-opencode` requires a manual OpenCode restart to load any new config-time file.

The manual `npm run verify` command remains the supported invocation and continues to produce durable reports under `docs/engineering/agents/reports/hooks/`.

## Files Changed

- `docs/engineering/agents/tasks/UMBRA-INFRA-001-opencode-hook-notes.md` — **updated in place**. Header now points at INFRA-002 as the current proposal. Sketch A marked as `INVALID — DO NOT USE` with a pointer to INFRA-002 Sketch C. Constraints honored, references, and manual workflow kept.
- `docs/engineering/agents/tasks/UMBRA-INFRA-002-opencode-verify-hook.md` — **new**. Current PROPOSED outcome, Sketch C (corrected plugin shape), path-to-ACTIVE checklist, manual workflow.
- `docs/engineering/agents/reports/UMBRA-INFRA-002-opencode-verify-hook.md` — **new** (this file).
- `docs/engineering/ENGINEERING_LOG.md` — **updated** with `UMBRA-INFRA-002` row.

No source files under `src/` were modified. `src/core/`, `src/controller/`, `src/canvas/`, `src/diagnostics/` remain empty. S1-003 was not started.

## Evidence

Observed evidence during this slice:

- `customize-opencode` skill content read in-session enumerates the OpenCode hook surface. The relevant subset is recorded under "Investigation" below.
- AGENTS.md "Repo-specific gotchas" line 37: "No `opencode.json` exists at the repo root; tool-level config lives in user/global config, not in this repo."
- UMBRA-INFRA-001 hook notes file exists and contained an invalid Sketch A; corrected in this slice.
- `bash scripts/umbra-verify.sh` runs cleanly (proven in UMBRA-INFRA-001 and re-usable here without re-execution; see "Validation" below).
- No new `package.json` field, no `package-lock.json` change, no `.opencode/`, no `opencode.json`, no global config write.

## Investigation

The `customize-opencode` skill enumerates the OpenCode config surface. Key facts:

| Field | Value |
| --- | --- |
| Project config locations | `./opencode.json`, `./opencode.jsonc`, `.opencode/opencode.json` |
| Global config | `~/.config/opencode/opencode.json` (NOT `~/.opencode/`) |
| Project commands dir | `.opencode/command/` or `.opencode/commands/` |
| Project skills dir | `.opencode/skill/<name>/SKILL.md` |
| Project agents dir | `.opencode/agent/` or `.opencode/agents/` |
| Project plugins (auto-discovered) | `.opencode/plugin/*.ts` and `.opencode/plugin/*.js` |
| Config reload | loaded once on startup; **restart OpenCode to apply changes** |
| Plugin shape | `export default (async ({ client, project, directory, $ }) => { return { ...Hooks } }) satisfies Plugin` |

Hook surface (verbatim from the skill):

> `event(input)`, `config(cfg)`, `chat.message`, `chat.params`, `chat.headers`, `tool.execute.before`, `tool.execute.after`, `tool.definition`, `command.execute.before`, `shell.env`, `permission.ask`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.session.compacting`, `experimental.compaction.autocontinue`, `experimental.text.complete`.

Important negatives:

- There is **no** `hooks.session.idle` field on `opencode.json` or `opencode.jsonc`. UMBRA-INFRA-001 Sketch A was wrong.
- There is **no** documented `session.idle` event in the bus event surface (the skill does not enumerate `event` subtypes; in practice `session.idle` is not exposed).
- Running `npm run verify` (audit + typecheck + tests + build) on every `tool.execute.after` or every `event` is too costly and risks a recursive loop if the verify pipeline ever touched OpenCode tooling.

The closest fit is `experimental.text.complete` (per agent-turn text completion). It is marked experimental; the Sketch C in the new notes file targets it but explicitly says "conditional on that surface remaining stable."

## Hook integration status

**PROPOSED.** Rationale:

- AGENTS.md explicitly forbids project-local tool-level config. Creating `.opencode/plugin/` violates it.
- Global user config modification is forbidden by the task brief.
- A new dep is forbidden by the task brief.
- ACTIVE requires observed automatic hook execution, which requires a manual OpenCode restart that this slice cannot perform.

## Files NOT created (by design)

These paths were considered and explicitly NOT created in this slice:

- `.opencode/plugin/umbra-verify.js` — would violate AGENTS.md.
- `.opencode/opencode.json` — would violate AGENTS.md.
- `opencode.json` / `opencode.jsonc` at repo root — would violate AGENTS.md.
- Any file under `~/.config/opencode/` — global config, modification forbidden.
- `package.json` dependency entries — adding deps is forbidden.
- Any file under `src/core/`, `src/controller/`, `src/canvas/`, `src/diagnostics/` — out of scope; would start S1-003.

## Validation

Per the task brief, validation ran as:

| Step | Result |
| --- | --- |
| `bash scripts/umbra-verify.sh` (optional re-run) | Not re-executed. INFRA-001 produced `docs/engineering/agents/reports/hooks/umbra-verify-20260828T200019Z.md` with `PASS`. The pipeline is unchanged. Re-running would only produce a new timestamped PASS report and is not novel evidence for INFRA-002. |
| `git status --short` (read-only) | See "Final repo state" below. Only the four docs paths listed in Files Changed appear. |
| `ls -la opencode.json* .opencode 2>&1` (read-only) | `No such file or directory` for both. No project config created. |
| `npm ls --depth=0` (read-only) | Same four devDependencies as INFRA-001: `happy-dom`, `typescript`, `vite`, `vitest`. No new package. |
| `cat ~/.config/opencode/opencode.jsonc` (read-only) | `{ "$schema": "https://opencode.ai/config.json" }`. Unchanged. |
| AGENTS.md, UMBRA-INFRA-001 notes, scripts/umbra-verify.sh, package.json re-read | All consistent with the PROPOSED outcome above. |

## Limitations

- **ACTIVE is unreachable from a single agent session.** OpenCode loads plugins on startup and a restart is required to apply any new config-time file. The slice's boundary ("Do not claim ACTIVE without observing automatic hook execution") is therefore structural, not just procedural.
- **The Sketch C hook surface (`experimental.text.complete`) is marked experimental in OpenCode.** If OpenCode renames or removes it, Sketch C needs an update. No plan for that exists in this slice.
- **No automated test for "hook fires at end of iteration."** Without ACTIVE status, no such test is meaningful. The verification pipeline itself is tested by its own run reports.
- **The corrected sketch depends on the bus event catalog.** The skill summary does not enumerate `event` subtypes. Empirically discovering them would require writing a plugin and observing which events fire, which is again an ACTIVE-time activity.

## Open Follow-Up

1. **Amend AGENTS.md** if the project later wants ACTIVE status. Decide explicitly where OpenCode hook config lives (project-local `.opencode/` vs. user-level `~/.config/opencode/`).
2. **Pick a hook target.** Either accept the experimental `experimental.text.complete` cost or wait for OpenCode to expose a stable per-session event.
3. **Add a dep (optional)** for typed plugins (`@opencode-ai/plugin`), or stay pure-JS at the cost of type safety.
4. **Restart OpenCode** with the new plugin and observe a fresh `docs/engineering/agents/reports/hooks/umbra-verify-*.md` appearing after an agent turn. Promote status to ACTIVE in this notes file.
5. **Re-run `bash scripts/umbra-verify.sh`** whenever any of the S1-* slices or dependency manifest changes.

## Rollback

This slice added only docs. To roll back to the state before INFRA-002:

```bash
git checkout HEAD -- docs/engineering/agents/tasks/UMBRA-INFRA-001-opencode-hook-notes.md docs/engineering/ENGINEERING_LOG.md
rm docs/engineering/agents/tasks/UMBRA-INFRA-002-opencode-verify-hook.md
rm docs/engineering/agents/reports/UMBRA-INFRA-002-opencode-verify-hook.md
```

No config files were added or modified. The rollback is docs-only and reversible by `git checkout` + `rm`.

## Handoff

- **Hook integration status:** PROPOSED. Do not create `.opencode/` or `opencode.json` in this repo without amending AGENTS.md and getting explicit approval.
- **Verification pipeline:** unchanged from INFRA-001. Run `npm run verify` (or `bash scripts/umbra-verify.sh`) before and after slice work.
- **Next steps toward ACTIVE** are listed under "Path to ACTIVE" in the INFRA-002 task notes. None are in scope for this slice.

## Related Records

- Task notes: [UMBRA-INFRA-002 hook notes](../tasks/UMBRA-INFRA-002-opencode-verify-hook.md)
- Predecessor notes (corrected): [UMBRA-INFRA-001 hook notes](../tasks/UMBRA-INFRA-001-opencode-hook-notes.md)
- Predecessor report: [UMBRA-INFRA-001 engineering report](../reports/UMBRA-INFRA-001-opencode-verification-hook.md)
- Pipeline run artifact (from INFRA-001): [umbra-verify-20260828T200019Z.md](../reports/hooks/umbra-verify-20260828T200019Z.md)
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md)
- Workspace guide: [AGENTS.md](../../../../AGENTS.md)
