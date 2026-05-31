import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createServer } from 'node:http';

// Isolate config for note command tests
const TEST_DIR = path.join(os.tmpdir(), `kb-cli-test-note-${Date.now()}`);
process.env.KB_CLI_CONFIG_DIR = TEST_DIR;

const { saveConfig, loadConfig, clearConfigAuth } = await import('../../cli/dist/config.js');

// --------------------------------------------------------------------------
// Test the note command's interaction with the agent API
// --------------------------------------------------------------------------

test('Note command integration', async (t) => {
  t.before(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  t.after(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
  });

  await t.test('runNote sends text to agent and handles submit action', async () => {
    let receivedPayload = null;
    let receivedUrl = '';
    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        if (req.url.includes('/conversation/agent')) {
          receivedUrl = req.url;
          receivedPayload = JSON.parse(Buffer.concat(chunks).toString());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ action: 'submit', replyText: 'Done!' }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({
        apiUrl: server.url,
        workspaceSlug: 'test-ws',
        defaultProjectSlug: 'inbox',
        cookies: { kb_access_token: 'tok' },
      });

      // Capture console output to suppress spinner/logs
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runNote } = await import('../../cli/dist/commands/note.js');
        await runNote('Test note text', { project: 'my-project' });
      } finally {
        console.log = originalLog;
      }

      assert.equal(receivedPayload.messageText, 'Test note text');
      assert.ok(receivedUrl.includes('projectSlug=my-project'));
    } finally {
      await server.close();
    }
  });

  await t.test('runNote sends file attachment when --file option is provided', async () => {
    let receivedPayload = null;
    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        if (req.url.includes('/conversation/agent')) {
          receivedPayload = JSON.parse(Buffer.concat(chunks).toString());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ action: 'submit', replyText: 'File saved!' }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    // Create a temp file to attach
    const tempFile = path.join(TEST_DIR, 'test-attachment.txt');
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(tempFile, 'file content here', 'utf8');

    try {
      clearConfigAuth();
      saveConfig({
        apiUrl: server.url,
        workspaceSlug: 'test-ws',
        defaultProjectSlug: 'inbox',
        cookies: { kb_access_token: 'tok' },
      });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runNote } = await import('../../cli/dist/commands/note.js');
        await runNote('Note with file', { file: tempFile });
      } finally {
        console.log = originalLog;
      }

      assert.equal(receivedPayload.messageText, 'Note with file');
      assert.equal(receivedPayload.hasMedia, true);
      assert.equal(receivedPayload.media.fileName, 'test-attachment.txt');
      assert.ok(receivedPayload.media.mimeType.includes('text'));
      assert.ok(receivedPayload.media.sizeBytes > 0);
      assert.ok(receivedPayload.media.dataBase64.length > 0);
    } finally {
      await server.close();
    }
  });

  await t.test('runNote handles cancel action from agent', async () => {
    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        if (req.url.includes('/conversation/agent')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ action: 'cancel', replyText: 'Operation cancelled.' }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({
        apiUrl: server.url,
        workspaceSlug: 'test-ws',
        defaultProjectSlug: 'inbox',
        cookies: { kb_access_token: 'tok' },
      });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runNote } = await import('../../cli/dist/commands/note.js');
        await runNote('Cancel test', {});
      } finally {
        console.log = originalLog;
      }

      // Should not throw; just display cancel message
      assert.ok(logs.some((l) => l.includes('cancelled') || l.includes('Cancel')),
        `expected cancel message in output, got: ${JSON.stringify(logs)}`);
    } finally {
      await server.close();
    }
  });
});

// --------------------------------------------------------------------------
// Test the ask command's interaction with the API
// --------------------------------------------------------------------------
test('Ask command integration', async (t) => {
  await t.test('runAsk queries the API and displays answer with sources', async () => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });

    let receivedBody = null;
    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);

        if (req.url.includes('/ask')) {
          receivedBody = JSON.parse(Buffer.concat(chunks).toString());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            answer: 'Use docker compose up.',
            confidence: 0.85,
            sources: [
              { title: 'Docker Guide', fileName: 'docker.md', path: 'docs/docker.md' },
            ],
          }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({
        apiUrl: server.url,
        workspaceSlug: 'default',
        cookies: { kb_access_token: 'tok' },
      });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runAsk } = await import('../../cli/dist/commands/ask.js');
        await runAsk('How to start with docker?', { project: 'infra' });
      } finally {
        console.log = originalLog;
      }

      assert.equal(receivedBody.question, 'How to start with docker?');
      assert.equal(receivedBody.projectSlug, 'infra');

      const output = logs.join('\n');
      assert.ok(output.includes('docker compose up'), 'should display answer');
      assert.ok(output.includes('85%'), 'should display confidence percentage');
      assert.ok(output.includes('Docker Guide'), 'should display source title');
    } finally {
      await server.close();
    }
  });
});

// --------------------------------------------------------------------------
// Test list commands
// --------------------------------------------------------------------------
test('List commands integration', async (t) => {
  await t.test('runListProjects displays projects', async () => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });

    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        if (req.url.includes('/projects')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            projects: [
              { projectSlug: 'inbox', displayName: 'Inbox' },
              { projectSlug: 'platform', displayName: 'Platform App' },
            ],
          }));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({ apiUrl: server.url, cookies: { kb_access_token: 'tok' } });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runListProjects } = await import('../../cli/dist/commands/list.js');
        await runListProjects();
      } finally {
        console.log = originalLog;
      }

      const output = logs.join('\n');
      assert.ok(output.includes('inbox'), 'should list inbox project');
      assert.ok(output.includes('platform'), 'should list platform project');
    } finally {
      await server.close();
    }
  });

  await t.test('runListWorkspaces displays workspaces', async () => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });

    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        if (req.url.includes('/workspaces')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            workspaces: [
              { workspaceSlug: 'default', displayName: 'Default' },
              { workspaceSlug: 'team', displayName: 'My Team' },
            ],
          }));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({ apiUrl: server.url, cookies: { kb_access_token: 'tok' } });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runListWorkspaces } = await import('../../cli/dist/commands/list.js');
        await runListWorkspaces();
      } finally {
        console.log = originalLog;
      }

      const output = logs.join('\n');
      assert.ok(output.includes('default'), 'should list default workspace');
      assert.ok(output.includes('team'), 'should list team workspace');
    } finally {
      await server.close();
    }
  });

  await t.test('runListProjects shows message when no projects exist', async () => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });

    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        if (req.url.includes('/projects')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ projects: [] }));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not found' }));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({ apiUrl: server.url, cookies: { kb_access_token: 'tok' } });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runListProjects } = await import('../../cli/dist/commands/list.js');
        await runListProjects();
      } finally {
        console.log = originalLog;
      }

      const output = logs.join('\n');
      assert.ok(output.includes('No') || output.includes('no'), 'should show empty message');
    } finally {
      await server.close();
    }
  });
});

// --------------------------------------------------------------------------
// Test logout command
// --------------------------------------------------------------------------
test('Logout command integration', async (t) => {
  await t.test('runLogout clears session and prints confirmation', async () => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });

    const server = await new Promise((resolve) => {
      const srv = createServer(async (req, res) => {
        if (req.url.includes('/auth/logout')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      });
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => srv.close(r)),
        });
      });
    });

    try {
      clearConfigAuth();
      saveConfig({
        apiUrl: server.url,
        workspaceSlug: 'logout-test',
        cookies: { kb_access_token: 'before-logout', kb_refresh_token: 'refresh-before' },
      });

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const { runLogout } = await import('../../cli/dist/commands/logout.js');
        await runLogout();
      } finally {
        console.log = originalLog;
      }

      const output = logs.join('\n');
      assert.ok(output.includes('Logged out') || output.includes('logged out') || output.includes('session'),
        `expected logout message, got: ${output}`);

      const config = loadConfig();
      assert.deepEqual(config.cookies, {}, 'cookies should be cleared');
      assert.equal(config.workspaceSlug, 'logout-test', 'non-auth config should be preserved');
    } finally {
      await server.close();
    }
  });
});
