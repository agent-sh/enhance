---
name: enhance-claude-memory
description: "Use when improving CLAUDE.md or AGENTS.md project memory files."
version: 1.0.0
---

# enhance-claude-memory

Analyze project memory files (CLAUDE.md, AGENTS.md) for optimization.

## Cross-Tool Detection

Searches for project memory files in order:
1. CLAUDE.md (Claude Code)
2. AGENTS.md (OpenCode, Codex)
3. .github/CLAUDE.md
4. .github/AGENTS.md

## Workflow

1. **Find** - Locate CLAUDE.md or AGENTS.md in project
2. **Read** - Load content and README.md for comparison
3. **Analyze** - Run all pattern checks
4. **Validate** - Check file/command references against filesystem
5. **Measure** - Calculate token metrics and duplication
6. **Report** - Generate structured markdown output

## Detection Patterns

### 1. Structure Validation (HIGH Certainty)

#### Critical Rules Section
- Should have `## Critical Rules` or similar
- Rules should be prioritized
- Include WHY explanations for each rule

#### Architecture Section
- Directory tree or structural overview
- Key file locations
- Module relationships

#### Key Commands Section
- Common development commands
- Test/build/deploy scripts
- Reference to package.json scripts

### 2. Reference Validation (HIGH Certainty)

#### File References
- Extract from `[text](path)` and `` `path/to/file.ext` ``
- Validate each exists on filesystem

#### Command References
- Extract `npm run <script>` and `npm <command>`
- Validate against package.json scripts

### 3. Efficiency Analysis (MEDIUM Certainty)

#### Token Count
- Recommended max: 1500 tokens (~6000 characters)
- Flag files exceeding threshold

#### README Duplication
- Detect overlap with README.md
- Flag >40% content duplication

#### Verbosity
- Average line length analysis
- Long paragraph detection

### 4. Quality Checks (MEDIUM Certainty)

#### WHY Explanations
- Rules should explain rationale
- Pattern: `*WHY: explanation`
- Flag rules without explanations

#### Structure Depth
- Avoid deep nesting (>3 levels)
- Keep hierarchy scannable

### 5. Cross-Platform Compatibility (MEDIUM/HIGH Certainty)

#### State Directory
- Don't hardcode `.claude/`
- Support `.opencode/`, `.codex/`
- Use `${STATE_DIR}/` or document variations

#### Terminology
- Avoid Claude-specific language
- Use "AI assistant" generically

## Output Format

```markdown
# Project Memory Analysis: {filename}

**File**: {path}
**Type**: {CLAUDE.md | AGENTS.md}

## Metrics
| Metric | Value |
|--------|-------|
| Estimated Tokens | {tokens} |
| README Overlap | {percent}% |

## Summary
| Certainty | Count |
|-----------|-------|
| HIGH | {n} |
| MEDIUM | {n} |

### Structure Issues ({n})
| Issue | Fix | Certainty |

### Reference Issues ({n})
| Issue | Fix | Certainty |

### Efficiency Issues ({n})
| Issue | Fix | Certainty |

### Cross-Platform Issues ({n})
| Issue | Fix | Certainty |
```

## Pattern Statistics

| Category | Patterns | Certainty |
|----------|----------|-----------|
| Structure | 3 | HIGH |
| Reference | 2 | HIGH |
| Efficiency | 4 | MEDIUM/LOW |
| Quality | 2 | MEDIUM/LOW |
| Cross-Platform | 3 | MEDIUM/HIGH |
| **Total** | **14** | - |

<examples>
### Example: Missing WHY Explanations

<bad_example>
```markdown
## Rules
1. Always run tests before committing
2. Use semantic commit messages
```
**Why it's bad**: Rules without rationale are harder to follow.
</bad_example>

<good_example>
```markdown
## Critical Rules
1. **Always run tests before committing**
   *WHY: Catches regressions before they reach main branch.*
```
**Why it's good**: Motivation makes compliance easier.
</good_example>

### Example: Cross-Platform Compatibility

<bad_example>
```markdown
State files are stored in `.claude/tasks.json`
```
**Why it's bad**: Hardcoded paths exclude other AI tools.
</bad_example>

<good_example>
```markdown
State files are stored in `${STATE_DIR}/tasks.json`
(`.claude/` for Claude Code, `.opencode/` for OpenCode)
```
**Why it's good**: Works across multiple AI assistants.
</good_example>
</examples>

## Constraints

- Always validate file references before reporting broken
- Consider context when flagging efficiency issues
- Cross-platform suggestions are advisory, not required
