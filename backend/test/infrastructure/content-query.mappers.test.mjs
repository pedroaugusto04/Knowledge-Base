import test from 'node:test';
import assert from 'node:assert/strict';

import { noteAttachment } from '../../dist/infrastructure/mappers/content-query.mappers.js';

test('noteAttachment uses public base url and preserves nested api base path', (t) => {
  const previousPublicBaseUrl = process.env.KB_PUBLIC_BASE_URL;
  process.env.KB_PUBLIC_BASE_URL = 'https://kb.example.com/knowledge-base/api';
  t.after(() => {
    if (previousPublicBaseUrl === undefined) delete process.env.KB_PUBLIC_BASE_URL;
    else process.env.KB_PUBLIC_BASE_URL = previousPublicBaseUrl;
  });

  const attachment = noteAttachment('note-1', {
    id: 'attachment-1',
    noteId: 'note-1',
    fileName: 'doc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 123,
    storageKey: 'users/u/workspaces/default/attachments/note-1/doc.pdf',
    checksumSha256: '',
    metadata: {},
    createdAt: '',
  });

  assert.equal(
    attachment.url,
    'https://kb.example.com/knowledge-base/api/notes/note-1/attachments/attachment-1/content',
  );
});

test('noteAttachment appends api segment when public base url points to frontend base path', (t) => {
  const previousPublicBaseUrl = process.env.KB_PUBLIC_BASE_URL;
  process.env.KB_PUBLIC_BASE_URL = 'https://kb.example.com/knowledge-base';
  t.after(() => {
    if (previousPublicBaseUrl === undefined) delete process.env.KB_PUBLIC_BASE_URL;
    else process.env.KB_PUBLIC_BASE_URL = previousPublicBaseUrl;
  });

  const attachment = noteAttachment('note-1', {
    id: 'attachment-1',
    noteId: 'note-1',
    fileName: 'doc.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 123,
    storageKey: 'users/u/workspaces/default/attachments/note-1/doc.pdf',
    checksumSha256: '',
    metadata: {},
    createdAt: '',
  });

  assert.equal(
    attachment.url,
    'https://kb.example.com/knowledge-base/api/notes/note-1/attachments/attachment-1/content',
  );
});
