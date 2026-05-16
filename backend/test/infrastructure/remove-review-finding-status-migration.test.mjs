import test from 'node:test';
import assert from 'node:assert/strict';

import { up } from '../../dist/infrastructure/persistence/migrations/1778400000000_remove_review_finding_status.js';

test('remove review finding status migration strips nested finding status only', async () => {
  let capturedSql = '';
  const pgm = {
    sql(input) {
      capturedSql = input;
    },
  };

  await up(pgm);

  assert.match(capturedSql, /finding - 'status'/);
  assert.match(capturedSql, /jsonb_array_elements\(metadata->'reviewFindings'\)/);
  assert.doesNotMatch(capturedSql, /set status =/i);
});
