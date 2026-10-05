/**
 * Runs the analyzer command from skills/enhance-docs/SKILL.md with and
 * without verbose. The skill accepts --verbose, but its command used to pass
 * only the mode, so the analyzer never ran its LOW certainty checks.
 *
 * Run: `node --test tests/enhance-docs-verbose.test.js`
 */

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const skillPath = path.join(repoRoot, 'skills', 'enhance-docs', 'SKILL.md');

// Mixed bullet styles: structure_recommendations, a LOW certainty check in
// the default (both) mode.
const FIXTURE = '# Guide\n\n- one\n* two\n';
const LOW_PATTERN = 'structure_recommendations';

let workDir;

function skillCommand() {
  const skill = fs.readFileSync(skillPath, 'utf8');
  const section = skill.split(/^## Run the analyzer$/m)[1];
  assert.ok(section, 'SKILL.md has a "## Run the analyzer" section');
  const block = section.match(/```bash\n([\s\S]*?)```/);
  assert.ok(block, 'the "Run the analyzer" section has a bash block');
  return block[1];
}

function runSkill(target, verbose) {
  const cmd = skillCommand()
    .replace('"<path>"', `'${target}'`)
    .replace('"<ai|both>"', '"both"')
    .replace('"<true|false>"', verbose ? '"true"' : '"false"');
  const out = execFileSync('bash', ['-c', cmd], {
    cwd: workDir,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: repoRoot },
    encoding: 'utf8'
  });
  const ids = [];
  for (const r of [].concat(JSON.parse(out))) {
    for (const key of ['linkIssues', 'structureIssues', 'codeIssues', 'efficiencyIssues', 'ragIssues', 'balanceIssues']) {
      for (const issue of r[key] || []) ids.push(issue.patternId);
    }
  }
  return ids;
}

before(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-docs-verbose-'));
  fs.mkdirSync(path.join(workDir, 'docs'));
  fs.writeFileSync(path.join(workDir, 'docs', 'guide.md'), FIXTURE);
});

after(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

for (const target of ['docs', 'docs/guide.md']) {
  test(`enhance-docs runs LOW certainty checks when verbose is set (${target})`, () => {
    const ids = runSkill(target, true);
    assert.ok(ids.includes(LOW_PATTERN), `${LOW_PATTERN} not reported with verbose: ${JSON.stringify(ids)}`);
  });

  test(`enhance-docs skips LOW certainty checks without verbose (${target})`, () => {
    const ids = runSkill(target, false);
    assert.ok(!ids.includes(LOW_PATTERN), `${LOW_PATTERN} reported without verbose: ${JSON.stringify(ids)}`);
  });
}
