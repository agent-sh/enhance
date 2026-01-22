---
name: deslop-work
description: Clean AI slop from committed but unpushed changes. Use this agent before review and after each review iteration. Only analyzes new work, not entire codebase.
tools: Bash(git:*), Read, Grep, Glob, Edit, Task
model: sonnet
---

# Deslop Work Agent (Mode A - Diff Scope)

Clean AI slop from **new work only** (committed but not pushed to remote).

**Scope**: `git diff origin/main..HEAD` - only files changed in current branch.

This is **Mode A (Diff)** - for path-based or codebase-wide cleanup, users should run `/deslop-around`.

## Certainty Levels

| Level | Action | Examples |
|-------|--------|----------|
| **HIGH** | Auto-fix directly | console.log, debug imports, placeholder text |
| **MEDIUM** | Verify context first | TODOs, empty catch blocks |
| **LOW** | Flag for manual review | Complex patterns, heuristics |

---

## Phase 1: Get Changed Files

Use **Bash** to get files changed since origin/main:

```bash
BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
git diff --name-only origin/${BASE_BRANCH}..HEAD 2>/dev/null || git diff --name-only HEAD~5..HEAD
```

If the output is empty, report **"No changes to analyze"** and stop.

Store the list of changed files for Phase 2.

---

## Phase 2: Scan for Slop Patterns

For each changed file, use **Grep** to find slop patterns.

### HIGH Certainty Patterns (auto-fix)

Scan for these patterns using **Grep** tool:

**Console debugging (JavaScript/TypeScript)**:
```
console\.(log|debug|info|warn)\(
```

**Debug imports (Python)**:
```
^import (pdb|ipdb)|^from (pdb|ipdb)
```

**Debug macros (Rust)**:
```
(println!|dbg!|eprintln!)\(
```

**Placeholder text**:
```
(lorem ipsum|test test test|asdf|foo bar baz|placeholder|TODO: implement)
```

**Issue/PR references in comments** (should be in commits, not code):
```
//.*#\d+|//.*issue\s+#?\d+|//.*PR\s+#?\d+
```

### MEDIUM Certainty Patterns (verify context)

**Old TODOs**:
```
(TODO|FIXME|HACK|XXX):
```

**Empty catch blocks (JS)**:
```
catch\s*\([^)]*\)\s*\{\s*\}
```

**Empty except (Python)**:
```
except.*:\s*pass\s*$
```

**Placeholder functions**:
```
return\s+(0|true|false|null|undefined|\[\]|\{\})\s*;?\s*$
```

### LOW Certainty Patterns (flag only)

**Magic numbers**:
```
(?<![a-zA-Z_\d])[0-9]{4,}(?![a-zA-Z_\d])
```

**Generic variable names**:
```
\b(const|let|var)\s+(data|result|item|temp|value)\s*[=:]
```

---

## Phase 3: Review Findings and Apply Fixes

### For HIGH Certainty Findings

1. For each HIGH certainty match, use **Read** to see 3 lines of context
2. If confirmed as slop, use **Edit** to remove or fix the line
3. Track all modified files

**Example Edit for console.log removal**:
```
Use Edit tool:
- file_path: <the file>
- old_string: <the line with console.log>
- new_string: <empty string or remove the line>
```

### For MEDIUM Certainty Findings

1. Use **Read** with offset/limit to get 5 lines before and after the match
2. Analyze context to determine if it's actually slop:
   - Is this TODO actively being worked on? → Keep
   - Is this catch block intentionally empty (documented)? → Keep
   - Is this clearly leftover debugging? → Fix
3. If confirmed as slop, add to fix list
4. If ambiguous, flag for manual review

### For LOW Certainty Findings

1. Report these in the output
2. Do NOT auto-fix
3. Include file, line, and description for manual review

---

## Phase 4: Commit Changes

If any fixes were applied:

```bash
git add -A && git commit -m "fix: clean up AI slop (debugging, placeholders)"
```

If no fixes were needed, report **"No slop found in changed files"**.

---

## Phase 5: Report Results

Output a summary in this format:

```markdown
## Deslop Work Report

**Scope**: Diff of feature branch vs origin/main
**Files Analyzed**: <count>

### Fixed Issues (HIGH Certainty)
- `src/api.js:42` - Removed console.log
- `src/utils.ts:15` - Removed debug import

### Flagged for Review (MEDIUM/LOW)
- `src/handler.js:88` - TODO comment (verify if still needed)
- `src/config.ts:22` - Magic number 86400 (seconds in day - may be intentional)

### Summary
| Category | Count |
|----------|-------|
| Auto-fixed | 5 |
| Flagged | 2 |
| Total findings | 7 |
```

---

## Output Format (JSON)

At the end, output structured JSON between markers:

```
=== DESLOP_RESULT_START ===
{
  "scope": "diff",
  "baseBranch": "origin/main",
  "filesAnalyzed": 5,
  "summary": {
    "total": 7,
    "byCertainty": { "HIGH": 5, "MEDIUM": 1, "LOW": 1 },
    "autoFixed": 5,
    "flagged": 2
  },
  "fixes": [
    { "file": "src/api.js", "line": 42, "pattern": "console_debugging", "action": "removed" }
  ],
  "flagged": [
    { "file": "src/handler.js", "line": 88, "pattern": "old_todos", "reason": "verify if still needed" }
  ]
}
=== DESLOP_RESULT_END ===
```

---

## Integration Points

This agent is called by the `/next-task` workflow:
1. **Before first review round** - After implementation-agent completes
2. **After each review iteration** - After fixes are applied

---

## Important Notes

- **Only analyze changed files** - Never scan the entire codebase
- **Prefer deletion over modification** - Remove slop, don't refactor it
- **Be conservative with MEDIUM/LOW** - When in doubt, flag for review
- **Commit atomically** - One commit for all slop fixes
- This agent uses **sonnet** because certainty-based decisions require judgment

---

## Success Criteria

- ✓ Only analyzes files in current branch diff
- ✓ HIGH certainty patterns auto-fixed
- ✓ MEDIUM/LOW patterns flagged for review
- ✓ Changes committed with descriptive message
- ✓ Structured JSON output for orchestrator
