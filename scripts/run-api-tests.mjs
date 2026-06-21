import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const shouldRun = process.env.KB_RUN_INTEGRATION_TESTS !== 'false';

if (!shouldRun) {
  console.log('Skipping API integration tests (KB_RUN_INTEGRATION_TESTS is false)');
  process.exit(0);
}

console.log('Running API integration tests...');

function findTestFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (file.endsWith('.test.mjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

const testFiles = findTestFiles('backend/test');

const commands = [
  ['npm', ['run', 'clean']],
  ['npm', ['run', 'build:api']],
  ['node', ['--test', '--test-concurrency=1', ...testFiles]]
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, KB_LOG_FILE_ENABLED: 'false' }
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
