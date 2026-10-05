# enhance

> Plugin structure and tool use analyzer - validates plugin.json, MCP tools, and security patterns

## Overview

An agentsys plugin: Markdown prompts in `commands/`, `agents/` and `skills/` that drive the Node.js analyzers in `lib/enhance/`. Plain CommonJS, no build step, tests use `node:test`. Everything in `lib/` except `lib/agentsys.js` is synced from [agent-core](https://github.com/agent-sh/agent-core), so change shared code there: a local edit is overwritten by the next sync PR.

## Agents

- agent-enhancer
- claudemd-enhancer
- cross-file-enhancer
- docs-enhancer
- hooks-enhancer
- plugin-enhancer
- prompt-enhancer
- skills-enhancer

## Skills

- enhance-agent-prompts
- enhance-claude-memory
- enhance-cross-file
- enhance-docs
- enhance-hooks
- enhance-orchestrator
- enhance-plugins
- enhance-prompts
- enhance-skills

## Commands

- enhance

## Conventions

- Output is plain text with the status markers `[OK]`, `[ERROR]`, `[WARN]`, `[CRITICAL]`, and no emojis or ASCII art. People read it in terminals and other plugins parse it; spend tokens on content, not decoration.
- In prose, write a spaced single dash (` - `), not ` -- ` or an em dash.
- Put summaries, plans and audit notes in the PR or issue, not in committed files: committed notes go stale.
- Changes reach main through a PR. A feature or fix is done when tests that cover it pass.
- Keep git hooks on. `scripts/setup-hooks.sh` installs a pre-push hook that runs `npm test`.
- When a script or tool fails, report the failure before working around it, so the tool gets fixed.
- When goals conflict, rank them: plugin users' experience, automation that needs no babysitting, token cost, output quality, simplicity.

## Dev commands

```bash
npm test                        # node:test suite
agnix --config .agnix.toml .    # agent config lint, also run in CI
```

## References

- Part of the [agentsys](https://github.com/agent-sh/agentsys) ecosystem
- https://agentskills.io
