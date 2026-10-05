/**
 * Runs the analyzer command of each skill that accepts --verbose, with and
 * without verbose. enhance-agent-prompts, enhance-prompts, enhance-plugins and
 * enhance-claude-memory accepted --verbose but their commands never passed it,
 * so the analyzers never ran their LOW certainty checks. enhance-docs had the
 * same bug (tests/enhance-docs-verbose.test.js).
 *
 * Run: `node --test tests/skill-verbose.test.js`
 */

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');

// Each fixture triggers one LOW certainty pattern of its analyzer.
const CASES = [
  {
    skill: 'enhance-agent-prompts',
    placeholder: '"<path>"',
    target: 'agents',
    files: {
      // A single "## Example" section: example_count_suboptimal wants 2 to 5.
      'agents/helper.md': '---\nname: helper\ndescription: Reviews diffs for typos in docs.\ntools: Read, Grep\nmodel: haiku\n---\n\n# Helper\n\nYou review diffs for typos.\n\n## Example\n\nInput: teh. Output: the.\n'
    },
    lowPattern: 'example_count_suboptimal'
  },
  {
    skill: 'enhance-prompts',
    placeholder: '"<path>"',
    target: 'prompts',
    files: {
      'prompts/summarize.md': '# Task\n\nSummarize the input.\n\n## Example\n\nInput: a. Output: b.\n'
    },
    lowPattern: 'suboptimal_example_count'
  },
  {
    skill: 'enhance-plugins',
    placeholder: '"<plugin dir>"',
    target: 'plugin',
    files: {
      // More than 10 commands: tool_overexposure.
      'plugin/.claude-plugin/plugin.json': JSON.stringify({
        name: 'demo',
        version: '1.0.0',
        description: 'Demo plugin',
        commands: Array.from({ length: 11 }, (_, i) => `cmd-${i}`)
      })
    },
    lowPattern: 'tool_overexposure'
  },
  {
    skill: 'enhance-claude-memory',
    placeholder: '"<path>"',
    target: 'project',
    files: {
      // Three H5 headings: deep_nesting.
      'project/AGENTS.md': '# Project\n\n##### One\n\n##### Two\n\n##### Three\n'
    },
    lowPattern: 'deep_nesting'
  }
];

let workDir;

function analyzerBlock(skill) {
  const text = fs.readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
  const section = text.split(/^## Run the analyzer$/m)[1];
  if (!section) return null;
  const block = section.match(/```bash\n([\s\S]*?)```/);
  return block ? { text, command: block[1] } : null;
}

function patternIds(value, out = []) {
  if (Array.isArray(value)) {
    for (const v of value) patternIds(v, out);
  } else if (value && typeof value === 'object') {
    if (typeof value.patternId === 'string') out.push(value.patternId);
    for (const v of Object.values(value)) patternIds(v, out);
  }
  return out;
}

function runSkill(c, verbose) {
  const found = analyzerBlock(c.skill);
  assert.ok(found, `${c.skill}: SKILL.md has a bash block under "## Run the analyzer"`);
  assert.ok(found.command.includes(c.placeholder), `${c.skill}: the command takes ${c.placeholder}`);
  const cmd = found.command
    .replace(c.placeholder, `'${c.target}'`)
    .replace('"<true|false>"', verbose ? '"true"' : '"false"');
  const out = execFileSync('bash', ['-c', cmd], {
    cwd: workDir,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: repoRoot },
    encoding: 'utf8'
  });
  return patternIds(JSON.parse(out));
}

before(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-skill-verbose-'));
  for (const c of CASES) {
    for (const [rel, content] of Object.entries(c.files)) {
      const file = path.join(workDir, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
});

after(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

for (const c of CASES) {
  test(`${c.skill} runs LOW certainty checks when verbose is set`, () => {
    const ids = runSkill(c, true);
    assert.ok(ids.includes(c.lowPattern), `${c.lowPattern} not reported with verbose: ${JSON.stringify(ids)}`);
  });

  test(`${c.skill} skips LOW certainty checks without verbose`, () => {
    const ids = runSkill(c, false);
    assert.ok(!ids.includes(c.lowPattern), `${c.lowPattern} reported without verbose: ${JSON.stringify(ids)}`);
  });
}

// Catches the next skill that documents --verbose and drops it: a skill that
// mentions --verbose, and whose analyzer has a verbose option, must pass it.
test('every skill that accepts --verbose passes it to an analyzer that reads it', () => {
  const missing = [];
  for (const skill of fs.readdirSync(skillsDir)) {
    if (!fs.existsSync(path.join(skillsDir, skill, 'SKILL.md'))) continue;
    const found = analyzerBlock(skill);
    if (!found || !found.text.includes('--verbose')) continue;
    const lib = found.command.match(/lib\/enhance\/([\w-]+\.js)/);
    if (!lib) continue;
    const source = fs.readFileSync(path.join(repoRoot, 'lib', 'enhance', lib[1]), 'utf8');
    if (!/\bverbose\b/.test(source)) continue;
    if (!found.command.includes('"<true|false>"') || !found.command.includes('verbose: process.argv')) {
      missing.push(skill);
    }
  }
  assert.deepEqual(missing, [], `skills that accept --verbose but do not pass it: ${missing.join(', ')}`);
});
