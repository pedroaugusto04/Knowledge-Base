import { spawnSync } from 'node:child_process';

console.log('Running CLI tests...');

const commands = [
  ['npm', ['run', 'build:cli']],
  ['node', ['--test', '--test-concurrency=1', '"cli/test/**/*.test.mjs"']],
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
