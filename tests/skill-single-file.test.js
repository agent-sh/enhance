/**
 * Runs the analyzer command of enhance-agent-prompts, enhance-prompts,
 * enhance-skills and enhance-hooks exactly as each SKILL.md documents it, on
 * a single file and on a directory. Each command called a directory walker:
 * analyzeAllAgents() threw ENOTDIR on a file path, and analyzeAllPrompts(),
 * analyzeAllSkills() and analyzeAllHooks() returned []. enhance-docs had the
 * same bug (tests/enhance-docs-skill.test.js).
 *
 * Run: `node --test tests/skill-single-file.test.js`
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

// Each target file triggers one HIGH certainty pattern. The directory also
// holds a second file without it, so a directory run has more than one result.
const CASES = [
  {
    skill: 'enhance-agent-prompts',
    dir: 'agents',
    file: 'agents/runner.md',
    files: {
      // Bare Bash in tools: unrestricted_bash.
      'agents/runner.md': '---\nname: runner\ndescription: Runs the test suite and reports failures.\ntools: Bash\nmodel: haiku\n---\n\nYou run the tests.\n',
      'agents/reader.md': '---\nname: reader\ndescription: Reads files and reports typos.\ntools: Read, Grep\nmodel: haiku\n---\n\nYou read files.\n'
    },
    pathKey: 'agentPath',
    pattern: 'unrestricted_bash'
  },
  {
    skill: 'enhance-prompts',
    dir: 'prompts',
    file: 'prompts/summarize.md',
    files: {
      // H1 straight to H3: heading_hierarchy_gaps.
      'prompts/summarize.md': '# Task\n\n### Steps\n\nSummarize the input in three sentences.\n',
      'prompts/translate.md': '# Task\n\nTranslate the input to French.\n'
    },
    pathKey: 'promptPath',
    pattern: 'heading_hierarchy_gaps'
  },
  {
    skill: 'enhance-skills',
    dir: 'skills',
    file: 'skills/deploy/SKILL.md',
    files: {
      // No name in the frontmatter: missing_name.
      'skills/deploy/SKILL.md': '---\ndescription: Builds the docs site.\n---\n\nBuild the site.\n',
      'skills/reader/SKILL.md': '---\nname: reader\ndescription: Use when user asks to read files.\n---\n\nRead files.\n'
    },
    pathKey: 'skillPath',
    pattern: 'missing_name'
  },
  {
    skill: 'enhance-hooks',
    dir: 'hooks',
    file: 'hooks/guard.md',
    files: {
      // No description in the frontmatter: missing_description.
      'hooks/guard.md': '---\nname: guard\n---\n\nBlock rm -rf.\n',
      'hooks/audit.md': '---\nname: audit\ndescription: Logs every Bash call.\n---\n\nLog it.\n'
    },
    pathKey: 'hookPath',
    pattern: 'missing_description'
  }
];

let workDir;

function skillCommand(skill) {
  const text = fs.readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
  const section = text.split(/^## Run the analyzer$/m)[1];
  assert.ok(section, `${skill}: SKILL.md has a "## Run the analyzer" section`);
  const block = section.match(/```bash\n([\s\S]*?)```/);
  assert.ok(block, `${skill}: the "Run the analyzer" section has a bash block`);
  assert.ok(block[1].includes('"<path>"'), `${skill}: the command takes "<path>"`);
  assert.ok(block[1].includes('"<true|false>"'), `${skill}: the command takes "<true|false>"`);
  return block[1];
}

// Runs the command the way the model would, and returns the per-file results:
// one result for a file, one per file for a directory.
function runSkill(c, target) {
  const cmd = skillCommand(c.skill)
    .replace('"<path>"', `'${target}'`)
    .replace('"<true|false>"', '"false"');
  let out;
  try {
    out = execFileSync('bash', ['-c', cmd], {
      cwd: workDir,
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: repoRoot },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (err) {
    assert.fail(`${c.skill} '${target}' exited ${err.status}: ${String(err.stderr).split('\n').find(l => l.startsWith('Error')) || err.message}`);
  }
  return [].concat(JSON.parse(out));
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

// Pattern ids reported for one file, from a run on that file or its directory.
function idsFor(c, results, file) {
  const own = results.filter(r => path.resolve(workDir, r[c.pathKey]) === path.resolve(workDir, file));
  return patternIds(own).sort();
}

before(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-skill-single-file-'));
  for (const c of CASES) {
    for (const [rel, content] of Object.entries(c.files)) {
      const file = path.join(workDir, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
  // A skill reference file with no frontmatter. It is not a skill.
  fs.mkdirSync(path.join(workDir, 'skills/deploy/references'), { recursive: true });
  fs.writeFileSync(path.join(workDir, 'skills/deploy/references/guide.md'), '# Deploy guide\n\nRun the build first.\n');
});

after(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

for (const c of CASES) {
  test(`${c.skill} reports findings for a single file`, () => {
    const results = runSkill(c, c.file);
    assert.equal(results.length, 1, `expected one result for a file: ${JSON.stringify(results).slice(0, 200)}`);
    const ids = idsFor(c, results, c.file);
    assert.ok(ids.includes(c.pattern), `${c.pattern} not reported for ${c.file}: ${JSON.stringify(ids)}`);
  });

  test(`${c.skill} reports findings for a directory`, () => {
    const results = runSkill(c, c.dir);
    assert.equal(results.length, Object.keys(c.files).length, 'one result per file in the directory');
    const ids = idsFor(c, results, c.file);
    assert.ok(ids.includes(c.pattern), `${c.pattern} not reported for ${c.file}: ${JSON.stringify(ids)}`);
  });

  test(`${c.skill} gives a file the same findings alone as inside its directory`, () => {
    assert.deepEqual(
      idsFor(c, runSkill(c, c.file), c.file),
      idsFor(c, runSkill(c, c.dir), c.file)
    );
  });
}

test('enhance-skills gives [] for a file that is not SKILL.md, as a directory run skips it', () => {
  const c = CASES.find(x => x.skill === 'enhance-skills');
  assert.deepEqual(runSkill(c, 'skills/deploy/references/guide.md'), []);
  const inDir = runSkill(c, c.dir).map(r => path.relative(workDir, path.resolve(workDir, r.skillPath))).sort();
  assert.deepEqual(inDir, [path.join('skills', 'deploy', 'SKILL.md'), path.join('skills', 'reader', 'SKILL.md')]);
});
