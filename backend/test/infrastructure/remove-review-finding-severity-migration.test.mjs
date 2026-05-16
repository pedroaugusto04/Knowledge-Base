import test from 'node:test';
import assert from 'node:assert/strict';

import { up } from '../../dist/infrastructure/persistence/migrations/1778500000000_remove_review_finding_severity.js';

test('remove review finding severity migration strips nested finding severity only', async () => {
  let capturedSql = '';
  const pgm = {
    sql(input) {
      capturedSql = input;
    },
  };

  await up(pgm);

  assert.match(capturedSql, /finding - 'severity'/);
  assert.match(capturedSql, /jsonb_array_elements\(metadata->'reviewFindings'\)/);
  assert.doesNotMatch(capturedSql, /set severity =/i);
});
