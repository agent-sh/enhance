# Changelog

## [Unreleased]

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
