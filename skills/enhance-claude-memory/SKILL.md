---
name: enhance-claude-memory
description: "Use when reviewing CLAUDE.md or AGENTS.md project memory files for broken references, bloat, duplication with the README, and instructions that no longer help."
version: 5.3.0
argument-hint: "[path] [--fix] [--verbose]"
---

# enhance-claude-memory

Project memory is read at the start of every session, so every line costs tokens on every run and every stale line misleads every run. Review it for accuracy first, then fit. Input (`$ARGUMENTS`): a path (default `.`), `--fix`, `--verbose`.

Files, in lookup order: `CLAUDE.md`, `AGENTS.md`, `.github/CLAUDE.md`, `.github/AGENTS.md`, plus nested ones in subdirectories and `.claude/CLAUDE.md`. Claude Code reads `CLAUDE.md`; OpenCode, Codex and most other harnesses read `AGENTS.md`. A repo serving several harnesses may keep both, or one that points at the other.

## Run the analyzer

```bash
node -e 'const a=require(process.argv[1]); console.log(JSON.stringify(a.analyze(process.argv[2], { verbose: process.argv[3] === "true" }), null, 2))' \
  "${CLAUDE_PLUGIN_ROOT}/lib/enhance/projectmemory-analyzer.js" "<path>" "<true|false>"
```

Pass `true` as the last argument when `--verbose` is set (or your caller sets `verbose`): without it the analyzer skips its LOW certainty checks.

It validates file and command references, measures tokens, and estimates README overlap. Verify each finding before reporting it: the analyzer has false positives.

## What to check

**Accuracy (HIGH).** Every referenced path exists. Every `npm run <script>` (or make target, just recipe) exists. Commands and architecture notes match the code. A wrong fact here is worse than a missing one.

**Content only the author knows.** Good project memory holds what a capable newcomer could not infer from the code in a few minutes: build and test commands, conventions that are not visible in the code, the real constraints (release process, protected branches, secrets handling, generated files not to edit) with their reasons, and where things live when it is not obvious. Flag what the model already knows (generic best practices, "write clean code", language basics) and what duplicates the README.

**Dated instruction style.** Apply the `enhance-prompts` guidance. In memory files the common cases are all-caps rule lists, rules without reasons, the same rule stated in several places, and history ("we switched to X after incident Y") where only the current rule matters. The analyzer's `missing_emphasis_markers` and prose-versus-bullets `verbose_instructions` findings encode older advice: down-rank them to LOW at most, and do not suggest MUST, ALWAYS or emphasis markers.

**Size.** Flag files well past roughly 1,500 tokens, and suggest moving reference material into files the memory links to, loaded when needed.

**Cross-platform (advisory).** Hardcoded `.claude/` state paths in a file other harnesses read, or Claude-only terms in an `AGENTS.md`.

**Model IDs.** Flag full model IDs with dates (they retire). Tier names or "inherit" age better.

## Fix

With `--fix`, apply HIGH certainty auto-fixes only (`applyFixes` in the analyzer). A fix does not delete rules: removing guidance is the author's call.

## Output

```markdown
# Project Memory Analysis: <file>
File: <path> | ~<tokens> tokens | README overlap: <pct>%

| Issue | Fix | Certainty |
|---|---|---|
```

When called by an enhancer agent, return the findings JSON that agent specifies instead.
