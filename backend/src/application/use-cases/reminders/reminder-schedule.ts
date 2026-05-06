import { buildReminderAt, normalizeDate, normalizeTime } from '../../../domain/time.js';

export const DEFAULT_REMINDER_TIME = '09:00';

export function resolveReminderScheduledAt(input: { reminderDate?: unknown; reminderTime?: unknown; reminderAt?: unknown }): string {
  const reminderAt = String(input.reminderAt || '').trim();
  if (reminderAt) return reminderAt;

  const reminderDate = normalizeDate(String(input.reminderDate || ''), 'UTC');
  if (!reminderDate) return '';

  const reminderTime = normalizeTime(String(input.reminderTime || '')) || DEFAULT_REMINDER_TIME;
  return buildReminderAt(reminderDate, reminderTime, 'UTC');
}

export function reminderDispatchKey(scheduledAt: string): string {
  return String(scheduledAt || '').slice(0, 16);
}

export function formatReminderScheduledAtLabel(scheduledAt: string): string {
  const value = String(scheduledAt || '').trim();
  if (!value) return '';
  return `${value.slice(0, 10)} ${value.slice(11, 16)} UTC`;
}
