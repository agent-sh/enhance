# Phase 2: Multi-Agent Review - Reference

This file contains detailed agent coordination for `/audit-project`.

**Parent document**: `audit-project.md`

## Agent Specialization

### File Filtering by Agent

Each agent reviews only relevant files:

| Agent | File Patterns |
|-------|--------------|
| security-expert | Auth, validation, API endpoints, config |
| performance-engineer | Hot paths, algorithms, loops, queries |
| test-quality-guardian | Test files only |
| architecture-reviewer | All source files |
| database-specialist | Models, queries, migrations |
| api-designer | API routes, controllers, handlers |
| frontend-specialist | Components, state management |
| devops-reviewer | CI/CD configs, Dockerfiles |

## Agent Coordination

Use Task tool to launch agents in parallel:

```javascript
const agents = [];

// Always active agents
agents.push(Task({
  subagent_type: "Explore",
  prompt: `You are security-expert. Review ${SCOPE} for security issues.

Framework: ${FRAMEWORK}
Patterns: ${frameworkPatterns?.security}

Focus on:
- SQL injection, XSS, CSRF vulnerabilities
- Authentication and authorization flaws
- Secrets exposure, insecure configurations
- Input validation, output encoding

Provide findings in evidence-based format with file:line.`
}));

agents.push(Task({
  subagent_type: "Explore",
  prompt: `You are performance-engineer. Review ${SCOPE} for performance issues.

Framework: ${FRAMEWORK}
Patterns: ${frameworkPatterns?.performance}

Focus on:
- N+1 queries, inefficient algorithms
- Memory leaks, unnecessary allocations
- Blocking operations, missing async
- Bundle size, lazy loading

Provide findings in evidence-based format.`
}));

// Conditional agents
if (HAS_TESTS) {
  agents.push(Task({
    subagent_type: "Explore",
    prompt: `You are test-quality-guardian. Review test files.

Framework: ${FRAMEWORK}

Focus on:
- Test coverage for new code
- Edge case coverage
- Test design and maintainability
- Mocking appropriateness

Provide findings in evidence-based format.`
  }));
}

if (FILE_COUNT > 50) {
  agents.push(Task({
    subagent_type: "Explore",
    prompt: `You are architecture-reviewer. Review ${SCOPE} for design issues.

Framework: ${FRAMEWORK}

Focus on:
- Code organization and modularity
- Design pattern violations
- Dependency management
- SOLID principles

Provide findings in evidence-based format.`
  }));
}

if (HAS_DB) {
  agents.push(Task({
    subagent_type: "Explore",
    prompt: `You are database-specialist. Review ${SCOPE} for database issues.

Framework: ${FRAMEWORK}

Focus on:
- Query optimization, N+1 queries
- Missing indexes
- Transaction handling
- Connection pooling

Provide findings in evidence-based format.`
  }));
}

if (HAS_API) {
  agents.push(Task({
    subagent_type: "Explore",
    prompt: `You are api-designer. Review ${SCOPE} for API issues.

Framework: ${FRAMEWORK}

Focus on:
- REST best practices
- Error handling and status codes
- Rate limiting, pagination
- API versioning

Provide findings in evidence-based format.`
  }));
}
```

## Finding Consolidation

After all agents complete:

```javascript
function consolidateFindings(agentResults) {
  const allFindings = [];

  for (const result of agentResults) {
    if (result.findings) {
      allFindings.push(...result.findings);
    }
  }

  // Deduplicate by file:line
  const seen = new Set();
  const deduped = allFindings.filter(f => {
    const key = `${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Group by file
  const byFile = {};
  for (const f of deduped) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  return {
    all: deduped,
    byFile,
    counts: {
      critical: deduped.filter(f => f.severity === 'critical').length,
      high: deduped.filter(f => f.severity === 'high').length,
      medium: deduped.filter(f => f.severity === 'medium').length,
      low: deduped.filter(f => f.severity === 'low').length
    }
  };
}
```

## Framework-Specific Patterns

### React Patterns

```javascript
const reactPatterns = {
  hooks_rules: {
    description: "React hooks must be called at top level",
    pattern: /use[A-Z]\w+\(/,
    context: "inside conditionals or loops"
  },
  state_management: {
    description: "Avoid prop drilling, use context or state management",
    pattern: /props\.\w+\.\w+\.\w+/
  },
  performance: {
    description: "Use memo/useMemo for expensive computations",
    pattern: /\.map\(.*=>.*\.map\(/
  }
};
```

### Express Patterns

```javascript
const expressPatterns = {
  error_handling: {
    description: "Express routes must have error handling",
    pattern: /app\.(get|post|put|delete)\(/,
    check: "next(err) in catch block"
  },
  async_handlers: {
    description: "Async handlers need try-catch or wrapper",
    pattern: /async\s*\(req,\s*res/
  }
};
```

### Django Patterns

```javascript
const djangoPatterns = {
  n_plus_one: {
    description: "Use select_related/prefetch_related",
    pattern: /\.objects\.(all|filter)\(\)/
  },
  raw_queries: {
    description: "Avoid raw SQL, use ORM",
    pattern: /\.raw\(|connection\.cursor\(\)/
  }
};
```

## Pattern Application

```javascript
function applyPatterns(findings, frameworkPatterns) {
  if (!frameworkPatterns) return findings;

  for (const pattern of Object.values(frameworkPatterns)) {
    // Check each finding against framework patterns
    for (const finding of findings) {
      if (pattern.pattern.test(finding.codeQuote)) {
        finding.frameworkContext = pattern.description;
      }
    }
  }

  return findings;
}
```

## Review Output Format

```markdown
## Agent Reports

### security-expert
**Files Reviewed**: X
**Issues Found**: Y (Z critical, A high)

Findings:
1. [Finding details with file:line]
2. [Finding details with file:line]

### performance-engineer
**Files Reviewed**: X
**Issues Found**: Y

Findings:
1. [Finding details with file:line]

[... per agent]

## Consolidated Summary

**Total Issues**: X
- Critical: Y (must fix)
- High: Z (should fix)
- Medium: A (consider)
- Low: B (nice to have)

**Top Files by Issue Count**:
1. src/api/users.ts: 5 issues
2. src/auth/session.ts: 3 issues
```
