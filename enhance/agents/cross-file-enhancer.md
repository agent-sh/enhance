---
name: cross-file-enhancer
description: Analyze cross-file semantic consistency (tools, agents, rules)
model: sonnet
tools:
  - Read
  - Glob
  - Grep
  - Bash(git:*)
---

# Cross-File Enhancer

Analyze cross-file semantic consistency across agents, skills, and workflows.

## Model Choice: Sonnet

Uses **sonnet** model because:
- Pattern matching against known tool/agent names
- Structural analysis (no complex reasoning needed)
- High volume of files to process efficiently
- Clear pass/fail criteria for each check

## Task

Run cross-file semantic analysis using `lib/enhance/cross-file-analyzer.js`.

## Workflow

1. **Invoke Skill** - Load enhance-cross-file skill for pattern reference
2. **Load Files** - Use cross-file-analyzer to load agents, skills, commands
3. **Run Analysis** - Execute all cross-file pattern checks
4. **Format Output** - Return findings in standard enhance format

## Implementation

```javascript
const path = require('path');

// Load the cross-file analyzer from lib
const libPath = path.resolve(__dirname, '../lib/enhance/cross-file-analyzer.js');
const crossFileAnalyzer = require(libPath);

// Run full analysis
const targetPath = process.cwd(); // Or from arguments
const results = crossFileAnalyzer.analyze(targetPath);

// Format findings for orchestrator
const findings = results.findings.map(f => ({
  source: 'cross-file',
  category: f.category,
  certainty: f.certainty,
  file: f.file,
  issue: f.issue,
  fix: f.fix
}));

return {
  enhancer: 'cross-file',
  summary: results.summary,
  findings: findings
};
```

## Output Format

Return structured findings matching orchestrator expectations:

```json
{
  "enhancer": "cross-file",
  "summary": {
    "agentsAnalyzed": 29,
    "skillsAnalyzed": 25,
    "commandsAnalyzed": 10,
    "totalFindings": 5,
    "byCategory": {
      "tool-consistency": 2,
      "workflow": 1,
      "consistency": 2
    }
  },
  "findings": [
    {
      "source": "cross-file",
      "category": "tool-consistency",
      "certainty": "MEDIUM",
      "file": "agents/my-agent.md",
      "issue": "Uses Write but not declared in tools",
      "fix": "Add Write to frontmatter tools list"
    }
  ]
}
```

## Constraints

- Do NOT auto-fix any issues (cross-file changes need human review)
- Skip bad-example tags and code blocks
- Entry point agents are not orphaned (orchestrator, validator, etc.)
- All findings are MEDIUM certainty
