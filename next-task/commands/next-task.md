---
description: Intelligent task prioritization with code validation
argument-hint: [filter] [--include-blocked] [--implement]
---

# /next-task - Intelligent Task Prioritization

Discover what to work on next with AI-powered task analysis and code validation.

## Arguments

Parse from $ARGUMENTS:
- **Filter**: `bug`, `feature`, `test`, `security`, etc. (optional)
- **--include-blocked**: Show blocked tasks (default: hide)
- **--implement**: Start implementation after selection (default: recommend only)

## Pre-Context: Platform & Tool Detection

```bash
# Detect platform
PLATFORM=$(node ${CLAUDE_PLUGIN_ROOT}/lib/platform/detect-platform.js)
TOOLS=$(node ${CLAUDE_PLUGIN_ROOT}/lib/platform/verify-tools.js)

# Check required tools
GH_AVAILABLE=$(echo $TOOLS | jq -r '.gh.available')
if [ "$GH_AVAILABLE" != "true" ]; then
  echo "ERROR: GitHub CLI (gh) required. Install: https://cli.github.com"
  exit 1
fi

# Check optional integrations
HAS_PLAN=$(echo $PLATFORM | jq -r '.hasPlanFile')

# Try to detect Linear integration
LINEAR_DETECTED="false"
if gh issue list --json body --limit 1 | grep -q "linear.app"; then
  LINEAR_DETECTED="true"
fi
```

## Phase 1: Source Discovery

Determine available task sources:

### GitHub Issues (Required)

```bash
gh issue list --state open --json number,title,body,labels,assignees,createdAt --limit 100
```

Store as `GITHUB_ISSUES`.

### Linear Tasks (Optional)

If `LINEAR_DETECTED=true`:
- Parse Linear URLs from GitHub issue bodies
- Extract Linear task IDs
- Note: Full Linear API requires Linear MCP (future enhancement)

### PLAN.md (Optional)

If `HAS_PLAN=true`:
```bash
cat PLAN.md
```

Parse TODO sections, extract tasks, match with GitHub issues by title similarity.

### Output Source Summary

```markdown
## Available Sources
- GitHub Issues: X open issues
- Linear: Y tasks detected (via GitHub issue links)
- PLAN.md: Z tasks found

Proceeding with available sources...
```

## Phase 2: Task Collection

### Fetch from GitHub Issues

Extract from `GITHUB_ISSUES`:
- Number, title, body
- Labels (priority, status, type, area)
- Assignees
- Created date (for age calculation)

### Deduplicate

If same task appears in multiple sources:
- Use GitHub as source of truth for status
- Note Linear ID if present
- Mark PLAN.md tasks as "also in PLAN.md"

### Apply Filters

If filter provided:
- `bug`: Filter to issues with "bug" label
- `feature`: Filter to "enhancement" or "feature" labels
- `test`: Filter to "test" or "testing" labels
- `security`: Filter to "security" label
- `[custom]`: Filter to issues with matching label

If `--include-blocked` NOT provided:
- Exclude issues with "blocked" status
- Exclude issues with "waiting" label

## Phase 3: Code Validation (CRITICAL!)

For each task, verify it's not already implemented:

### Search Strategy

```bash
# Extract keywords from task title
TASK_TITLE="Add login page"
KEYWORDS="login page LoginPage"

# Search codebase
FOUND=$(rg -l "$KEYWORDS" --type ts --type tsx --type js --type jsx --max-count 1 2>/dev/null)

if [ -n "$FOUND" ]; then
  TASK_STATUS="appears-done"
  TASK_EVIDENCE="Found: $FOUND"
else
  TASK_STATUS="not-started"
  TASK_EVIDENCE="No implementation found"
fi
```

### Validation Checks

For each task:
1. Extract main keywords from title
2. Search for component/file names
3. Search for function names
4. Check test files
5. Categorize:
   - **Verified Pending**: No code found
   - **Appears Done**: Implementation found with evidence
   - **Partially Done**: Implementation exists but incomplete (e.g., no tests)

### Filter Out Completed

Remove tasks where `TASK_STATUS="appears-done"` with high confidence.

Keep tasks marked "partially-done" but note what's missing.

## Phase 4: Context-Aware Prioritization

Score each remaining task:

### Scoring Algorithm

```javascript
function scoreTask(task) {
  let score = 0;

  // 1. Explicit Priority (from labels)
  if (task.labels.includes('priority/critical') || task.labels.includes('P0')) score += 100;
  if (task.labels.includes('priority/high') || task.labels.includes('P1')) score += 50;
  if (task.labels.includes('priority/medium') || task.labels.includes('P2')) score += 25;

  // 2. Blockers (dependencies)
  if (task.body.match(/blocks #\d+/i)) score += 30;

  // 3. Effort Estimate (prefer quick wins)
  if (task.labels.includes('effort/small')) score += 20;
  if (task.labels.includes('effort/medium')) score += 10;
  if (task.labels.includes('effort/large')) score -= 10;

  // 4. Relation to Recent Work
  const recentFiles = execSync('git diff HEAD~10..HEAD --name-only').toString();
  const taskKeywords = extractKeywords(task.title);
  if (taskKeywords.some(k => recentFiles.includes(k))) score += 15;

  // 5. Age (older = higher priority for bugs)
  const ageInDays = (Date.now() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24);
  if (task.labels.includes('bug') && ageInDays > 30) score += 10;

  // 6. Impact (affects many users)
  if (task.labels.includes('impact/high')) score += 25;

  return score;
}
```

### Sort by Score

```bash
# Sort tasks by calculated score (descending)
# Keep top 10 for detailed analysis
```

## Phase 5: Recommendation with Rationale

Present top 5 tasks:

### Recommendation Format

```markdown
## Top Priority Tasks

### 1. [P1] Fix authentication timeout bug (#142)
**Source**: GitHub Issue #142
**Status**: Verified Pending (no fix found in codebase)
**Priority Score**: 85 (high priority + bug + old + blocking)
**Effort**: Small (labeled effort/small)
**Why Now**:
  - Blocking #145 and #147
  - Reported 45 days ago
  - Related to recent auth work in src/auth/
  - Affects production users (impact/high label)
**Related Files**:
  - src/auth/session.ts (likely location based on description)
  - tests/auth/session.test.ts (needs test)
**Dependencies**: None

---

### 2. [P2] Add dark mode toggle to settings (#89)
**Source**: GitHub Issue #89, also in PLAN.md
**Status**: Partially Done (found Settings component, no dark mode code)
**Priority Score**: 60 (medium priority + feature + recent work in settings/)
**Effort**: Medium (labeled effort/medium)
**Why Now**:
  - Recent work in src/components/Settings.tsx
  - User-requested feature (10 👍 reactions)
  - No blockers
**Related Files**:
  - src/components/Settings.tsx (add toggle)
  - src/hooks/useTheme.ts (create new hook)
  - src/styles/theme.ts (add dark theme)
**Dependencies**: None

---

[Continue for top 5...]
```

### Include Context

For each task:
- Evidence from code search
- Why it ranks highly
- What files will likely change
- Dependencies that must be done first
- Estimated complexity

## Phase 6: Optional Implementation Workflow

If `--implement` flag provided:

### Prompt User for Selection

```markdown
Select a task to implement (1-5), or 'cancel':
```

Wait for user input.

### Create Branch

```bash
TASK_NUMBER=142
TASK_SLUG="fix-auth-timeout"
BRANCH_NAME="feature/${TASK_SLUG}"

git checkout -b $BRANCH_NAME
```

### Generate Implementation Plan

Based on selected task:

```markdown
## Implementation Plan: Fix Authentication Timeout Bug (#142)

### Step 1: Investigate Current Implementation
- Read src/auth/session.ts
- Understand timeout logic
- Identify bug location

### Step 2: Implement Fix
- Update timeout handling
- Add proper error handling
- Update types if needed

### Step 3: Write Tests
- Add unit test for timeout scenario
- Add integration test
- Verify edge cases

### Step 4: Verify & Ship
- Run tests: npm test
- Run type check: npm run check-types
- Use /ship to create PR
```

### Multi-Agent Implementation

Use Task tool to launch specialized agents:

1. **Code Exploration Agent**:
   ```bash
   Task(subagent_type="Explore", prompt="Analyze authentication timeout bug in src/auth/session.ts...")
   ```

2. **Implementation Agent**:
   - Read current code
   - Implement fix
   - Write tests

3. **Review Agent** (approval gate):
   ```bash
   Task(subagent_type="pr-review-toolkit:code-reviewer", prompt="Review authentication timeout fix...")
   ```

4. **If approved**: Call `/ship`
   ```bash
   Skill(skill="ship")
   ```

5. **If blocked**: Report issues, iterate

## Stale/Invalid Task Handling

If code validation finds many "appears-done" tasks:

```markdown
## ⚠️ Stale Tasks Detected

The following tasks appear to be completed but are still open:

1. **#89 - Add login page**: Found LoginPage.tsx, LoginPage.test.tsx
2. **#102 - Setup CI**: Found .github/workflows/ci.yml
3. **#115 - Add README**: Found README.md with comprehensive docs

**Recommendation**: Close these issues or update their status.

Would you like me to generate close commands?
```

If yes:
```bash
gh issue close 89 --comment "Completed: LoginPage.tsx exists with tests"
gh issue close 102 --comment "Completed: CI configured in .github/workflows/"
gh issue close 115 --comment "Completed: README.md is comprehensive"
```

## Blocked Tasks Report

If tasks are blocked (and `--include-blocked` used):

```markdown
## Blocked Tasks

### #67 - Deploy to production
**Blocked By**: #65 (setup staging environment)
**Status**: Cannot proceed until #65 is complete

### #98 - Add payment processing
**Blocked By**: External (waiting for vendor API access)
**Status**: On hold pending vendor

**Recommendation**: Focus on unblocked tasks first.
```

## Error Handling

### GitHub CLI Not Available
```markdown
ERROR: GitHub CLI required for task analysis.

Install: https://cli.github.com

Or use brew:
  brew install gh

Then authenticate:
  gh auth login
```

### No Issues Found
```markdown
No open issues found in this repository.

Consider:
1. Creating issues for planned work
2. Running /project-review to find code quality improvements
3. Running /deslop-around to clean up technical debt
```

### All Tasks Appear Complete
```markdown
Great news! All open issues appear to be implemented.

Suggestions:
1. Review and close completed issues
2. Run /project-review for quality improvements
3. Check PLAN.md for upcoming work not yet in issues
```

## Output Format

Be concise and actionable:
- Use evidence (file paths, line numbers)
- Show priority reasoning
- Link related work
- Provide next steps

## Example Usage

```bash
/next-task
# Analyze all open issues, recommend top 5

/next-task bug
# Focus on bug-labeled issues only

/next-task --include-blocked
# Show all tasks including blocked ones

/next-task feature --implement
# Analyze features, then start implementation workflow

/next-task test
# Focus on test-related issues
```

## Context Efficiency

Use context optimizer for git commands:

```bash
# Recent commits (for context)
git log --oneline --no-decorate -10 --format="%h %s"

# Changed files (for relation detection)
git diff HEAD~10..HEAD --name-only | head -20

# Current branch
git branch --show-current
```

## Success Criteria

- ✅ Multi-source task collection
- ✅ Code validation prevents recommending completed work
- ✅ Evidence-based prioritization
- ✅ Graceful degradation without Linear/PLAN.md
- ✅ Optional implementation workflow
- ✅ Context-efficient commands

Begin Phase 1 now.
