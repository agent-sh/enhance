# enhance

Master enhancement orchestrator for plugins, agents, prompts, docs, hooks, and skills.

## Overview

`/enhance` runs specialized analyzers over a repo's agent-facing files, verifies their findings, and reports them in one list ranked by certainty. The guidance targets current models: it flags dated prompt scaffolding (all-caps rule lists, "think step by step", step choreography, repeated rules) and never suggests adding emphasis.

## Usage

```
/enhance                          # every enhancer whose content exists
/enhance --focus=agent            # one enhancer
/enhance plugins/my-plugin --verbose
/enhance --apply                  # report, then apply HIGH certainty auto-fixes
/enhance --show-suppressed        # findings hidden by learned suppressions
/enhance --no-learn               # analyze without saving suppressions
/enhance --reset-learned          # clear learned suppressions for this project
/enhance --export-learned         # print learned suppressions as JSON
```

`--focus` values: `plugin`, `agent`, `claudemd` (alias `claude-memory`), `docs`, `prompt`, `hooks`, `skills`, `cross-file`.

Enhancers run in parallel, at most 4 at a time. In a harness without a subagent tool they run one after another inline.

## Enhancers

| Enhancer | Checks | Model |
|-------|---------|-------|
| `agent-enhancer` | Description as routing text, tool scope, model tier, prompt body | inherits session model |
| `prompt-enhancer` | Missing context, dated patterns, output contracts | inherits session model |
| `claudemd-enhancer` | CLAUDE.md / AGENTS.md accuracy, bloat, README duplication, cross-platform | inherits session model |
| `skills-enhancer` | Trigger quality, invocation control, tool scope, size | inherits session model |
| `docs-enhancer` | Broken links, structure, stale docs, retrieval readiness | sonnet |
| `hooks-enhancer` | Hook safety, exit codes, timeouts, matcher scope | sonnet |
| `plugin-enhancer` | Manifest, MCP tool schemas and descriptions, security | sonnet |
| `cross-file-enhancer` | Undeclared tools, missing agent references, duplicate or contradictory rules | sonnet |

Each enhancer runs its JavaScript analyzer from `lib/enhance/`, checks every finding against the file to drop false positives, and adds what a pattern analyzer cannot see.

## Certainty Levels

| Level | Meaning | Auto-Fixable |
|-------|---------|--------------|
| HIGH | Definite issues | Some |
| MEDIUM | Likely improvements | No |
| LOW | Advisory suggestions (shown with `--verbose`) | No |

Fixes apply only with `--apply`, only for HIGH certainty findings that have an auto-fix. Security and cross-file findings are never auto-fixed.

## Requirements

- An agentsys-supported harness (Claude Code, OpenCode, Codex, Cursor, Kiro)
- Node.js (for the analyzers)

## License

MIT
