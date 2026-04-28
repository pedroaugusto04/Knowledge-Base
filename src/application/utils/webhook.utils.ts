export function normalizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(',') : String(value || '')]));
}

const sensitiveKeys = new Set([
  'authorization',
  'cookie',
  'x-hub-signature-256',
  'x-kb-webhook-token',
  'apikey',
  'api-key',
  'api_key',
  'token',
  'secret',
]);

function isSensitiveKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  return sensitiveKeys.has(normalized) || normalized.includes('token') || normalized.includes('secret') || normalized.includes('apikey');
}

export function sanitizeWebhookValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => sanitizeWebhookValue(entry));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, isSensitiveKey(key) ? '[redacted]' : sanitizeWebhookValue(entry)]),
  );
}

export function sanitizeWebhookHeaders(headers: Record<string, unknown> = {}): Record<string, unknown> {
  return sanitizeWebhookValue(headers) as Record<string, unknown>;
}

export function extractWhatsappExternalId(body: Record<string, unknown>): string {
  const data = body.data as Record<string, unknown> | undefined;
  const key = data?.key as Record<string, unknown> | undefined;
  return String(
    body.jid ||
      body.remoteJid ||
      body.chatId ||
      body.from ||
      key?.remoteJid ||
      data?.remoteJid ||
      data?.chatId ||
      '',
  ).trim();
}
