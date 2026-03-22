# Changelog

## [Unreleased]

### Added

- Wire Phase 2-4 repo-intel data into enhancers: stale-docs and conventions data enriches enhancement recommendations; conventions are passed to agent-prompts, skills, and prompts enhancers for coding style validation
- Pre-fetch doc-drift data before launching enhancers in the orchestrator; passes stale doc paths only to the docs-enhancer prompt to reduce noise
- Prioritize doc analysis by drift risk from repo-intel: `getDocPrioritySignals()` uses the doc-drift query so docs with low code coupling sort first
- `agent-knowledge` added as git submodule for centralized knowledge base shared across all plugin repos
- agnix validation added to CI pipeline with `.agnix.toml` configuration

### Fixed

- Remove AUTO-GENERATED comment and redundant 'Be concise' instruction from agent configs
- Inline state dir detection replaced with `getStateDirPath()` in enhance-orchestrator

### Docs

- Fix agent model table in README: `hooks-enhancer` and `skills-enhancer` both use opus, not sonnet

## [1.0.0] - 2026-02-21

Initial release. Extracted from [agentsys](https://github.com/agent-sh/agentsys) monorepo.
