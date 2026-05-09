import { describe, expect, it } from 'vitest';

import { formatUsDate } from '../../src/entities/format';

describe('formatUsDate', () => {
  it('formats plain ISO dates as MM/DD/YYYY', () => {
    expect(formatUsDate('2026-04-29')).toBe('04/29/2026');
  });

  it('formats ISO timestamps without timezone drift', () => {
    const parsed = new Date('2026-04-29T23:25:09.013Z');
    const expected = `${String(parsed.getMonth() + 1).padStart(2, '0')}/${String(parsed.getDate()).padStart(2, '0')}/${parsed.getFullYear()}`;
    expect(formatUsDate('2026-04-29T23:25:09.013Z')).toBe(expected);
  });

  it('preserves non-date values when parsing fails', () => {
    expect(formatUsDate('sem-data')).toBe('sem-data');
  });
});
