const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function mustExist(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) fail(`Missing required PCMaster file: ${rel}`);
  return full;
}

function mustInclude(rel, snippets) {
  const full = mustExist(rel);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      fail(`${rel} missing required text: ${snippet}`);
    }
  }
}

const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'CODEX.md',
  'PCMASTER.md',
  'runtime/pcmaster/source-of-truth.md',
  'runtime/pcmaster/active-task.md',
  'runtime/pcmaster/test-plan.md',
  'runtime/pcmaster/proof.md',
  'runtime/pcmaster/latest-status.md',
  'runtime/pcmaster/blockers.md',
];

for (const rel of requiredFiles) mustExist(rel);

mustInclude('PCMASTER.md', [
  'C:\\Users\\ARKAI\\Desktop\\newvision-demo',
  'No source of truth = no coding.',
  'npm test',
  'npm run check:pcmaster',
  'Do not deploy',
]);

mustInclude('AGENTS.md', [
  'PCMASTER.md',
  'runtime/pcmaster/active-task.md',
  'No proof = not done.',
]);

mustInclude('runtime/pcmaster/active-task.md', [
  'Allowed files:',
  'Test commands:',
  'Rollback path:',
]);

mustInclude('runtime/pcmaster/test-plan.md', [
  'npm test',
  'npm run check:pcmaster',
]);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  project: 'newvision-demo',
  root: ROOT,
  requiredFiles: requiredFiles.length,
  checkedAt: new Date().toISOString(),
}, null, 2));
