/**
 * Runs the analyzer command exactly as skills/enhance-docs/SKILL.md documents
 * it, against a single file and against a directory. The skill used to call
 * analyzeAllDocs(), which walks a directory and returns [] for a file path,
 * so `enhance-docs <file>` reported nothing.
 *
 * Run: `node --test tests/enhance-docs-skill.test.js`
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

// A heading jump (H1 to H3) and a code block without a language: both are
// HIGH certainty findings in every mode.
const FIXTURE = '# Guide\n\n### Setup\n\n```\nnpm install\n```\n';

let workDir;

function skillCommand() {
  const skill = fs.readFileSync(skillPath, 'utf8');
  const section = skill.split(/^## Run the analyzer$/m)[1];
  assert.ok(section, 'SKILL.md has a "## Run the analyzer" section');
  const block = section.match(/```bash\n([\s\S]*?)```/);
  assert.ok(block, 'the "Run the analyzer" section has a bash block');
  assert.ok(block[1].includes('"<path>"'), 'the command takes "<path>"');
  assert.ok(block[1].includes('"<ai|both>"'), 'the command takes "<ai|both>"');
  return block[1];
}

function runSkill(target) {
  const cmd = skillCommand()
    .replace('"<path>"', `'${target}'`)
    .replace('"<ai|both>"', '"both"');
  const out = execFileSync('bash', ['-c', cmd], {
    cwd: workDir,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: repoRoot },
    encoding: 'utf8'
  });
  // A directory yields an array of per-file results, a file yields one result.
  return [].concat(JSON.parse(out));
}

function patternIds(results, file) {
  const ids = [];
  for (const r of results) {
    if (path.resolve(workDir, r.docPath) !== path.resolve(workDir, file)) continue;
    for (const key of ['linkIssues', 'structureIssues', 'codeIssues', 'efficiencyIssues', 'ragIssues', 'balanceIssues']) {
      for (const issue of r[key] || []) ids.push(issue.patternId);
    }
  }
  return ids.sort();
}

before(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-docs-skill-'));
  fs.mkdirSync(path.join(workDir, 'docs'));
  fs.writeFileSync(path.join(workDir, 'docs', 'guide.md'), FIXTURE);
});

after(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

test('enhance-docs reports findings for a single file', () => {
  const ids = patternIds(runSkill('docs/guide.md'), 'docs/guide.md');
  assert.ok(ids.includes('inconsistent_heading_levels'), `heading jump not reported: ${JSON.stringify(ids)}`);
  assert.ok(ids.includes('missing_code_language'), `untagged code block not reported: ${JSON.stringify(ids)}`);
});

test('enhance-docs reports findings for a directory', () => {
  const ids = patternIds(runSkill('docs'), 'docs/guide.md');
  assert.ok(ids.includes('inconsistent_heading_levels'), `heading jump not reported: ${JSON.stringify(ids)}`);
  assert.ok(ids.includes('missing_code_language'), `untagged code block not reported: ${JSON.stringify(ids)}`);
});

test('a single file gets the same findings as the same file inside a directory', () => {
  assert.deepEqual(
    patternIds(runSkill('docs/guide.md'), 'docs/guide.md'),
    patternIds(runSkill('docs'), 'docs/guide.md')
  );
});
