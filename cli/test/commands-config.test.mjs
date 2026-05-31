import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Isolate config
const TEST_DIR = path.join(os.tmpdir(), `kb-cli-test-commands-config-${Date.now()}`);
process.env.KB_CLI_CONFIG_DIR = TEST_DIR;

const { saveConfig, loadConfig, clearConfigAuth } = await import('../../cli/dist/config.js');
const { runConfigGet, runConfigSet, runConfigList } = await import('../../cli/dist/commands/config.js');

test('CLI config commands', async (t) => {
  t.before(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  t.after(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  await t.test('runConfigGet prints config value for valid key', () => {
    clearConfigAuth();
    saveConfig({ workspaceSlug: 'test-ws', defaultProjectSlug: 'test-proj' });

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runConfigGet('workspaceSlug', true);
    } finally {
      console.log = originalLog;
    }

    assert.ok(logs.some(l => l.includes('test-ws')), `expected 'test-ws' in output, got: ${JSON.stringify(logs)}`);
  });

  await t.test('runConfigGet prints error for invalid key in REPL mode without exiting', () => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    try {
      // isRepl=true prevents process.exit
      runConfigGet('invalidKey', true);
    } finally {
      console.error = originalError;
    }

    assert.ok(errors.some(l => l.includes('Invalid')), 'should print error for invalid key');
  });

  await t.test('runConfigSet updates config value for valid key', () => {
    clearConfigAuth();
    saveConfig({ workspaceSlug: 'old-ws' });

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runConfigSet('workspaceSlug', 'new-ws', true);
    } finally {
      console.log = originalLog;
    }

    const config = loadConfig();
    assert.equal(config.workspaceSlug, 'new-ws');
    assert.ok(logs.some(l => l.includes('Updated') && l.includes('new-ws')));
  });

  await t.test('runConfigSet trims whitespace from value', () => {
    clearConfigAuth();
    saveConfig({ workspaceSlug: 'old' });

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runConfigSet('workspaceSlug', '  trimmed-ws  ', true);
    } finally {
      console.log = originalLog;
    }

    const config = loadConfig();
    assert.equal(config.workspaceSlug, 'trimmed-ws');
  });

  await t.test('runConfigSet rejects invalid key in REPL mode without exiting', () => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    try {
      runConfigSet('invalidKey', 'value', true);
    } finally {
      console.error = originalError;
    }

    assert.ok(errors.some(l => l.includes('Invalid')));
  });

  await t.test('runConfigList displays all config values', () => {
    clearConfigAuth();
    saveConfig({
      apiUrl: 'https://test.api/v1',
      workspaceSlug: 'list-ws',
      defaultProjectSlug: 'list-proj',
      cookies: { kb_access_token: 'abc' },
    });

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runConfigList();
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    assert.ok(output.includes('list-ws'), 'should show workspace');
    assert.ok(output.includes('list-proj'), 'should show project');
    // Auth status should show logged in
    assert.ok(output.includes('Logged In') || output.includes('logged'), 'should show logged in status');
  });

  await t.test('runConfigList shows Not Logged In when no access token', () => {
    clearConfigAuth();
    saveConfig({ workspaceSlug: 'no-auth-ws', cookies: {} });

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      runConfigList();
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    assert.ok(output.includes('Not Logged In') || output.includes('not'), 'should show not logged in');
  });
});
