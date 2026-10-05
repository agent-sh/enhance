# Changelog

## [Unreleased]

### Changed

- Second pass over the prompts for current models. The enhancer agents no longer repeat constraints their skills already state, "Never" rules read as plain instructions with their reasons, and a dated hooks example is gone. The command, agent, skill and AGENTS.md files went from 6,877 to 6,389 words.
- The agent-prompts skill down-ranks the analyzer's `missing_role`, and `missing_constraints` when an agent states its limits inline or in the skill it loads, so agents written in this style are not flagged HIGH.
- AGENTS.md drops the generic model table and the GPU validation text this CPU-only repo does not need, replaces the nonexistent `npm run validate` with the agnix command CI runs, and gains an Overview that says which of `lib/` is synced from agent-core.

### Fixed

- `enhance-docs` on a single file returned no findings. The skill called `analyzeAllDocs()`, which walks a directory and returns `[]` for a file path. It now calls `analyze({ doc, mode })`, which handles both a file and a directory. `tests/enhance-docs-skill.test.js` runs the skill's command on both.
- `enhance-docs --verbose` now runs the analyzer's LOW certainty checks. The skill accepted `--verbose` but its analyzer command passed only the mode, so `verbose` was always false. The command takes a `<true|false>` argument and passes it through. `tests/enhance-docs-verbose.test.js` runs the skill's command both ways.
- `--verbose` now reaches the analyzer in `enhance-agent-prompts`, `enhance-prompts`, `enhance-plugins` and `enhance-claude-memory`. Each skill accepted the flag but its analyzer command passed only the path, so their LOW certainty checks never ran. Each command takes a `<true|false>` argument and passes it as `verbose`, as `enhance-docs` does. `tests/skill-verbose.test.js` runs each command both ways, and fails for any skill that documents `--verbose` but does not pass it to an analyzer that reads it.
- `enhance-agent-prompts <file>` crashed and `enhance-prompts <file>` returned `[]`. Both skills called a directory walker on the user's path. `analyzeAllAgents()` called `readdirSync` on it and threw `ENOTDIR`; it now analyzes a file path as one agent (`lib/enhance/agent-analyzer.js`, the same change as agent-sh/agent-core#36). `enhance-prompts` calls `analyze({ prompt })`, which handles a file and a directory, instead of `analyzeAllPrompts()`, which returns `[]` for a file. `tests/skill-single-file.test.js` runs both commands on a file and on a directory.
- `npm test` works on Node 18 and 20. The script used `tests/**/*.test.js`. `sh` reads `**` as `*`, matches nothing under `tests/*/`, and passes the pattern on unexpanded; Node expands test globs itself only from 21 on, so Node 18 and 20 failed with "Could not find". The script is now `node --test tests/*.test.js`, which the shell expands, and CI runs it on Node 18, 22, 24 and 26.

## [1.1.0] - 2026-09-24

### Changed

- Rewrote the command, agent and skill prompts for current models: goal, constraints with reasons, done criteria, and output contract instead of JavaScript pseudocode, "MUST" rule lists, and forced tool order. Prompt size went from 13,767 to 6,552 words.
- The prompt guidance the enhancers apply is current: it flags all-caps emphasis, "think step by step", step choreography, repeated rules, history narratives and pinned model IDs, and it no longer recommends "should" to "MUST", adding emphasis markers, chain-of-thought instructions, XML tags as a requirement, or an example quota. Analyzer patterns that still encode that older advice (`missing_xml_structure`, `missing_cot`, `example_count_suboptimal`, `suboptimal_example_count`, `examples_without_contrast`, `missing_examples`, `critical_info_buried`, `missing_emphasis_markers`, `verbose_instructions`) are down-ranked to LOW at most.
- Enhancer agents verify every analyzer finding against the file before reporting it, and return one JSON contract the orchestrator merges.
- The orchestrator runs at most 4 enhancers at a time, and runs them inline one by one when the harness has no subagent tool.
- Agent, prompt, project-memory and skills enhancers inherit the session model instead of pinning opus. Docs and hooks enhancers move to sonnet with plugin and cross-file.
- The hooks guidance no longer hardcodes the event and hook-type lists, which change between releases. It tells the enhancer to check the harness's current hooks reference, and drops the claim that prompt hooks only work on `Stop` and `SubagentStop`.
- Analyzer commands use `${CLAUDE_PLUGIN_ROOT}/lib/enhance/...` instead of a path relative to the user's working directory, which did not resolve outside this repo.
- README documents the real interface (`/enhance --focus=TYPE`, `--apply`) instead of `/enhance:<type>` commands and a `--fix` flag the command does not have.
- Removed the vestigial `<!-- TEMPLATE -->` markers from agent files. The agentsys template expander only reads the monorepo's `plugins/` directory, which no longer holds these agents.

### Added

- Wire Phase 2-4 repo-intel data into enhancers: stale-docs and conventions data enriches enhancement recommendations; conventions are passed to agent-prompts, skills, and prompts enhancers for coding style validation
- Pre-fetch doc-drift data before launching enhancers in the orchestrator; passes stale doc paths only to the docs-enhancer prompt to reduce noise
- Prioritize doc analysis by drift risk from repo-intel: `getDocPrioritySignals()` uses the doc-drift query so docs with low code coupling sort first
- `agent-knowledge` added as git submodule for centralized knowledge base shared across all plugin repos
- agnix validation added to CI pipeline with `.agnix.toml` configuration

### Fixed

- Remove AUTO-GENERATED comment and redundant 'Be concise' instruction from agent configs
- Inline state dir detection replaced with `getStateDirPath()` in enhance-orchestrator

## [1.0.0] - 2026-02-21

Initial release. Extracted from [agentsys](https://github.com/agent-sh/agentsys) monorepo.
