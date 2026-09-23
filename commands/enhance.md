---
name: enhance
description: Analyze plugins, agents, prompts, docs, hooks, and skills for best-practice gaps
codex-description: 'Use when user asks to "enhance prompts", "improve agents", "analyze plugins", "optimize documentation", "review CLAUDE.md". Runs parallel analyzers on prompts, agents, plugins, docs, hooks, skills, and project memory files.'
argument-hint: "[target-path] [--apply] [--focus=TYPE] [--verbose] [--show-suppressed] [--no-learn] [--reset-learned] [--export-learned]"
---

# /enhance

Find the gaps in a repo's agent-facing files (plugins, agents, prompts, docs, project memory, hooks, skills, and the consistency between them) and report them in one ranked list. Change files only with `--apply`.

Run the `enhance-orchestrator` skill with `$ARGUMENTS`. If the Skill tool is unavailable, read `${CLAUDE_PLUGIN_ROOT}/skills/enhance-orchestrator/SKILL.md` and follow it.

## Arguments

- `target-path`: directory or file to analyze. Default: current directory.
- `--apply`: after the report, apply the HIGH certainty findings that have an auto-fix.
- `--focus=TYPE`: run one enhancer: `plugin`, `agent`, `claudemd` (alias `claude-memory`), `docs`, `prompt`, `hooks`, `skills`, `cross-file`.
- `--verbose`: include LOW certainty findings.
- `--show-suppressed`: list findings hidden by learned suppressions.
- `--no-learn`: analyze without saving new suppressions.
- `--reset-learned`: clear this project's learned suppressions.
- `--export-learned`: print this project's learned suppressions as JSON, for sharing.

## Examples

```
/enhance                         # everything that exists in the current directory
/enhance --focus=agent           # agents only
/enhance plugins/my-plugin --verbose
/enhance --apply                 # report, then apply HIGH certainty auto-fixes
```

## Output

```markdown
# Enhancement Analysis Report

**Target**: <path>
**Enhancers Run**: plugin, agent, docs

## Executive Summary
| Enhancer | HIGH | MEDIUM | LOW | Auto-Fixable |
|---|---|---|---|---|

## HIGH Certainty Issues
<grouped by enhancer, then file>

## MEDIUM Certainty Issues

## Auto-Fix Summary
<n> issues can be fixed with `--apply`.
```
