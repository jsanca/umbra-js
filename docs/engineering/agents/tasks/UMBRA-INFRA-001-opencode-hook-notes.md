# UMBRA-INFRA-001 — OpenCode Verification Hook — Integration Notes

Status: superseded by [UMBRA-INFRA-002](./UMBRA-INFRA-002-opencode-verify-hook.md). Kept for historical traceability only. The Sketch A below is **not** a valid OpenCode config shape; it has been corrected in INFRA-002's Sketch C.

## Manual command (active)

```bash
bash scripts/umbra-verify.sh
# or via npm:
npm run verify
```

The script records the standard Umbra pre-iteration validation commands (`npm audit signatures`, `npm audit`, `npm run typecheck`, `npm run test:run`, `npm run build`), captures their stdout + stderr, writes a Markdown report under `docs/engineering/agents/reports/hooks/umbra-verify-<timestamp>.md`, and exits 0 only if every required command passed.

The optional dev-server smoke is **off by default** (the dev server is long-running). It can be opted in:

```bash
bash scripts/umbra-verify.sh --with-dev-smoke
# or via npm:
npm run verify:smoke
```

## Hook integration status — proposed, not active

The task brief asked for the script to be wired into a "stop / session-idle / post-iteration" hook if the local OpenCode setup supports it. Investigation of this repository and the local OpenCode environment shows:

| Check | Result | Source |
| --- | --- | --- |
| Project-level `opencode.json` | not present | `ls opencode.json*` returned no matches |
| Project-level `opencode.jsonc` | not present | `ls opencode.json*` returned no matches |
| Project-level `.opencode/` directory | not present | `ls .opencode/` returned "No such file or directory" |
| User-level `~/.config/opencode/opencode.jsonc` | empty (only `$schema`) | `cat ~/.config/opencode/opencode.jsonc` → `{ "$schema": "https://opencode.ai/config.json" }` |
| User-level `~/.claude/settings.json` | unrelated (theme + plugin marketplace); no hooks | `cat ~/.claude/settings.json` |
| AGENTS.md guidance | "tool-level config lives in user/global config, not in this repo" | `AGENTS.md` |

The Umbra project intentionally keeps tool-level config in the user's global config rather than the repo (see AGENTS.md "Repo-specific gotchas"). Wiring a hook would therefore require one of:

1. Modifying `~/.config/opencode/opencode.jsonc` — **forbidden by the task brief** ("wiring the hook requires modifying unknown/global user config" is an explicit stop condition).
2. Creating a new OpenCode plugin to implement the hook — **forbidden by the task brief** ("adding dependencies would be required" is an explicit stop condition; a plugin would be a new package).
3. Creating a project-level `opencode.json` — **forbidden by the task brief** ("do not create speculative OpenCode configuration if the local OpenCode hook mechanism cannot be verified") and contradicts the existing project policy in AGENTS.md.

Per the task's "If hook integration is not confidently supported or requires external/global configuration, do not fake it" instruction, this document records the manual command as the only supported invocation and explicitly marks a proposed hook configuration as **not active**.

## Historical sketch (now superseded — see INFRA-002 Sketch C)

> **Correction (UMBRA-INFRA-002).** The Sketch A below is **not a valid OpenCode config shape**. OpenCode plugins are not declared in `opencode.json` via a `hooks` field; they are auto-discovered as `.opencode/plugin/<file>.{ts,js}` exports. See [INFRA-002 Sketch C](./UMBRA-INFRA-002-opencode-verify-hook.md) for the corrected shape.

### Sketch A — `opencode.jsonc` with `hooks.session.idle` (INVALID — DO NOT USE)

```jsonc
// SUPERSEDED — this shape is not supported by OpenCode.
{
  "$schema": "https://opencode.ai/config.json",
  "hooks": {
    "session.idle": ["bash", "scripts/umbra-verify.sh"]
  }
}
```

This sketch assumed OpenCode would at some point define a `hooks.session.idle` event under `opencode.jsonc`. It does not. The corrected path is INFRA-002 Sketch C.

### Sketch B — user-level plugin (would require a new package)

A small OpenCode plugin under a separate package could subscribe to the agent lifecycle and invoke `scripts/umbra-verify.sh`. This is **not** created here because:

- the task explicitly forbids adding dependencies,
- the local OpenCode environment does not currently publish a hook event API,
- the manual command above already covers the validation need without that complexity.

### Manual workflow until hook integration is approved

Run `bash scripts/umbra-verify.sh` (or `npm run verify`) **before** declaring a slice complete, and again **after** any modification that could affect typecheck, tests, build, or audit. Treat the generated report under `docs/engineering/agents/reports/hooks/` as the slice-level verification artifact and link it from the slice's engineering report.

## Constraints honored

- No Canvas / renderer / controller / core code touched.
- S1-003 not started.
- No package dependencies added (script uses `bash`, `git`, `curl`, `date`, `mktemp`, `sed` — all standard POSIX tools on macOS).
- `npm run verify` and `npm run verify:smoke` are script aliases only; they do not add dependencies.
- The generated report directory `docs/engineering/agents/reports/hooks/` is intentionally **not** added to `.gitignore` so the reports remain durable evidence alongside other engineering reports.

## References

- [UMBRA-INFRA-002 — current proposal](./UMBRA-INFRA-002-opencode-verify-hook.md)
- [UMBRA-INFRA-001 engineering report](../reports/UMBRA-INFRA-001-opencode-verification-hook.md)
- [UMBRA-INFRA-002 engineering report](../reports/UMBRA-INFRA-002-opencode-verify-hook.md)
- [Sprint 1 verification strategy](../umbra-verification-strategy.md)
- [Sprint 1 review gates table](../reviews/umbra-review-gates.md)
- [AGENTS.md](../../../../AGENTS.md)
