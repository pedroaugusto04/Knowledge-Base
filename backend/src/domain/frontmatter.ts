export function toFrontmatterValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value == null) return 'null';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(String(value));
}

export function renderFrontmatter(values: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(values)) {
    lines.push(`${key}: ${toFrontmatterValue(value)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}
