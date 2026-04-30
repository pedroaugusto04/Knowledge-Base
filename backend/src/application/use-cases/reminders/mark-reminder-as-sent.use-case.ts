import { Injectable } from '@nestjs/common';

import { ReminderDispatchMode } from '../../../contracts/enums.js';
import { slugify } from '../../../domain/strings.js';
import { currentDateTimeInTimeZone } from '../../../domain/time.js';
import { ReminderDispatchRepository } from '../../ports/workflow-state.repository.js';

@Injectable()
export class MarkReminderAsSentUseCase {
  constructor(private readonly reminderDispatchRepository: ReminderDispatchRepository) {}

  async execute(ids: string[], userId: string, workspaceSlug = 'default', mode: ReminderDispatchMode = ReminderDispatchMode.Exact, dispatchKey = currentDateTimeInTimeZone('UTC').date) {
    const workspace = slugify(workspaceSlug) || 'default';
    const uniqueIds = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
    await Promise.all(uniqueIds.map((id) => this.reminderDispatchRepository.markSent(userId, workspace, mode, dispatchKey, id)));
    return { ok: true, marked: uniqueIds.length };
  }
}
